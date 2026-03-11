from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    b = p.chromium.launch(headless=False)
    pg = b.new_page()
    pg.goto('https://test-chatbot-vqj75e3khzc3gv2tpeecjz.streamlit.app/')
    time.sleep(15)
    
    # Check iframes
    frames = pg.frames
    print(f"Total frames: {len(frames)}")
    for i, frame in enumerate(frames):
        print(f"\nFrame {i}: {frame.url}")
        try:
            count = frame.locator('textarea').count()
            print(f"  textareas: {count}")
            count2 = frame.locator('input').count()
            print(f"  inputs: {count2}")
            ids = [frame.locator('[data-testid]').nth(j).get_attribute('data-testid') 
                   for j in range(min(frame.locator('[data-testid]').count(), 20))]
            print(f"  testids: {ids}")
        except Exception as e:
            print(f"  error: {e}")
    
    b.close()