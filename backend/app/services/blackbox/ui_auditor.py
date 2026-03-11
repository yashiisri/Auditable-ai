



# app/services/blackbox/ui_auditor.py

from playwright.async_api import async_playwright
import asyncio
from app.services.blackbox.orchestrator import (
    _analyse_response, 
    _compute_scores,
    PROBE_PROMPTS
)

# ── Selectors to try for finding the chat input ──────────────────────────
# Covers ChatGPT, Claude, Gemini, custom Vercel/Streamlit deployments
INPUT_SELECTORS = [
    "textarea",
    "input[type='text']",
    "[contenteditable='true']",
    "[placeholder*='message' i]",
    "[placeholder*='chat' i]",
    "[placeholder*='ask' i]",
    "[placeholder*='type' i]",
    "[aria-label*='message' i]",
    "[data-testid*='input' i]",
    "[class*='chat-input' i]",
    "[class*='message-input' i]",
    "[id*='chat' i]",
    "[id*='input' i]",
]

# ── Selectors to find the AI response ────────────────────────────────────
RESPONSE_SELECTORS = [
    "[data-testid*='response' i]",
    "[data-testid*='message' i]",
    "[class*='response' i]",
    "[class*='assistant' i]",
    "[class*='bot-message' i]",
    "[class*='ai-message' i]",
    "[class*='message-content' i]",
    "[class*='chat-message' i]",
    "[role='article']",
    "[role='log'] > div:last-child",
    ".prose",                          # common in custom UIs
    "main [class*='message']:last-child",
]

# ── Submit button selectors ───────────────────────────────────────────────
SUBMIT_SELECTORS = [
    "button[type='submit']",
    "button[aria-label*='send' i]",
    "button[aria-label*='submit' i]",
    "[data-testid*='send' i]",
    "[class*='send-button' i]",
    "[class*='submit' i]",
]


async def _find_input(page) -> object | None:
    """Try all known selectors to find the chat input."""
    for selector in INPUT_SELECTORS:
        try:
            el = page.locator(selector).first
            if await el.is_visible(timeout=1000):
                return el
        except Exception:
            continue
    return None


async def _find_response(page, previous_count: int) -> str:
    """
    Wait for a NEW response to appear after sending a message.
    Tries multiple selectors and waits up to 30s.
    """
    for _ in range(60):  # 60 × 0.5s = 30s max wait
        await asyncio.sleep(0.5)
        for selector in RESPONSE_SELECTORS:
            try:
                elements = page.locator(selector)
                count = await elements.count()
                if count > previous_count:
                    # New message appeared — get its text
                    last = elements.last
                    text = await last.inner_text()
                    if text and len(text.strip()) > 5:
                        return text.strip()
            except Exception:
                continue
    return "[TIMEOUT] No response detected within 30 seconds."


async def _count_messages(page) -> int:
    """Count current messages on page to detect new ones."""
    for selector in RESPONSE_SELECTORS:
        try:
            count = await page.locator(selector).count()
            if count > 0:
                return count
        except Exception:
            continue
    return 0


async def run_ui_probe(page, probe_text: str) -> str:
    """Send one probe and capture the response."""
    try:
        # Count existing messages before sending
        before_count = await _count_messages(page)

        # Find input
        input_el = await _find_input(page)
        if not input_el:
            return "[ERROR] Could not find chat input on this page."

        # Clear and type the probe
        await input_el.click()
        await input_el.fill("")
        await input_el.type(probe_text, delay=30)  # human-like typing
        await asyncio.sleep(0.3)

        # Try to submit — first look for send button
        submitted = False
        for selector in SUBMIT_SELECTORS:
            try:
                btn = page.locator(selector).first
                if await btn.is_visible(timeout=800):
                    await btn.click()
                    submitted = True
                    break
            except Exception:
                continue

        # Fallback — press Enter
        if not submitted:
            await input_el.press("Enter")

        # Wait for response
        response = await _find_response(page, before_count)
        await asyncio.sleep(1)  # brief pause between probes
        return response

    except Exception as e:
        return f"[ERROR] {str(e)[:200]}"


async def run_ui_blackbox_pipeline(
    ai_name: str,
    ui_url: str,
) -> dict:
    """
    Full UI-based black box audit using Playwright.
    Opens a real browser, navigates to the chat UI,
    fires all 14 probes, captures responses.
    """
    import uuid
    from datetime import datetime

    audit_id   = str(uuid.uuid4())
    started_at = datetime.utcnow().isoformat()
    probe_results = []

    async with async_playwright() as p:
        # Launch headless Chromium
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ]
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )

        page = await context.new_page()

        try:
            # Navigate to the chat UI
            await page.goto(ui_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(2)  # let JS render fully

            # Check page loaded
            title = await page.title()
            if not title:
                raise Exception("Page did not load properly.")

            # Check input exists at all
            input_el = await _find_input(page)
            if not input_el:
                raise Exception(
                    "Could not find a chat input on this page. "
                    "Make sure the URL points directly to the chat interface, not a landing page."
                )

            # Fire all 14 probes sequentially
            # (sequential for UI — parallel would confuse the chat thread)
            for probe in PROBE_PROMPTS:
                response_text = await run_ui_probe(page, probe["prompt"])
                analysis = _analyse_response(response_text, probe["category"])
                probe_results.append({
                    "probe_id": probe["id"],
                    "category": probe["category"],
                    "prompt":   probe["prompt"],
                    "response": response_text,
                    "passed":   analysis["passed"],
                    "severity": analysis["severity"],
                    "note":     analysis["note"],
                })

        except Exception as e:
            await browser.close()
            raise Exception(f"UI audit failed: {str(e)}")

        finally:
            await browser.close()

    scores = _compute_scores(probe_results)

    return {
        "audit_id":        audit_id,
        "ai_name":         ai_name,
        "mode":            "ui",
        "status":          "completed",
        "started_at":      started_at,
        "completed_at":    datetime.utcnow().isoformat(),
        "probes_run":      len(probe_results),
        "overall_score":   scores["overall_score"],
        "risk_level":      scores["risk_level"],
        "category_scores": scores["category_scores"],
        "findings":        scores["findings"],
        "probe_results":   probe_results,
        "ui_url_tested":   ui_url,
    }
















