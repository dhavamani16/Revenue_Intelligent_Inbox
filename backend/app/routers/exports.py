from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import Dict, Any, List, Optional
from app.services.export_service import generate_export_package
from app.config import EXPORTS_DIR

router = APIRouter(prefix="/api/exports", tags=["Exports & Reports"])

@router.post("")
def create_export():
    return generate_export_package()

@router.get("")
def list_exports():
    export_files = []
    if EXPORTS_DIR.exists():
        for f in EXPORTS_DIR.glob("*.zip"):
            export_files.append({
                "export_id": f.stem,
                "filename": f.name,
                "size_bytes": f.stat().st_size,
                "download_url": f"/api/exports/{f.stem}/download"
            })
    return {"exports": sorted(export_files, key=lambda x: x["export_id"], reverse=True)}

@router.get("/{export_id}/download")
def download_export(export_id: str):
    zip_path = EXPORTS_DIR / f"{export_id}.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Export ZIP archive not found")
    return FileResponse(
        path=str(zip_path),
        filename=f"{export_id}.zip",
        media_type="application/zip"
    )
