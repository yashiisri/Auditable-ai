from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.ai_routes import router as ai_router
from app.routes.blackbox_routes import router as blackbox_router
from app.routes.reports import router as reports_router
from app.routes.audit_extension_route import router as extension_router
from app.routes.chat_routes import router as chat_router
from app.routes.report_audit_routes import router as report_audit_router
from app.routes.admin_routes import router as admin_router

app = FastAPI(title="Auditable AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(ai_router)
app.include_router(blackbox_router)
app.include_router(extension_router)
app.include_router(chat_router)
app.include_router(report_audit_router)


@app.get("/")
def root():
    return {"message": "Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}