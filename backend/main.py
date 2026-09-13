from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import json
import datetime

from database import get_db, Camera, Event, VirtualFence, WatchlistPlate, IncidentDispatch, SystemConfig
from cv_engine import get_engine

app = FastAPI(
    title="DRISHTIX Tactical API",
    description="Intelligent Border Surveillance & Tactical Command Center — SIH 2026",
    version="2.0.0"
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup hook to initialize demo engine and seed database
@app.on_event("startup")
def startup_event():
    get_engine()

# ─── HEALTH ──────────────────────────────
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "DRISHTIX v2.0 Tactical",
        "mode": "ACTIVE_SURVEILLANCE",
        "edge_nodes": 4,
        "ai_engine": "YOLOv8 + ByteTrack + ANPR"
    }

# ─── DEMO CONTROLS ───────────────────────
@app.post("/api/start-demo")
async def start_demo(background_tasks: BackgroundTasks):
    engine = get_engine()
    background_tasks.add_task(engine.start_demo)
    return {"status": "Tactical demo sequence initiated", "cameras": 4, "events_planned": 13}

@app.post("/api/stop-demo")
def stop_demo():
    engine = get_engine()
    engine.stop()
    return {"status": "Demo stopped"}

@app.post("/api/reset-demo")
def reset_demo(db: Session = Depends(get_db)):
    db.query(Event).delete()
    db.query(IncidentDispatch).delete()
    db.commit()
    engine = get_engine()
    engine.seed_initial_data()
    return {"status": "Demo state reset and seeded"}

# ─── CAMERAS ─────────────────────────────
class CameraCreate(BaseModel):
    id: str
    name: str
    type: str = "PTZ IP Camera"
    location: str = ""
    zone: str = "Sector 7"
    ip: str = "192.168.1.100"
    lat: float = 32.7266
    lng: float = 74.8570
    fov_angle: float = 65.0
    fov_heading: float = 45.0
    vision_mode: str = "OPTICAL"

class PTZControl(BaseModel):
    pan: float
    tilt: float
    zoom: float

@app.get("/api/cameras")
def get_cameras(db: Session = Depends(get_db)):
    cameras = db.query(Camera).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "type": c.type,
            "location": c.location,
            "zone": c.zone,
            "ip": c.ip,
            "lat": c.lat,
            "lng": c.lng,
            "fov_angle": c.fov_angle,
            "fov_heading": c.fov_heading,
            "ptz_pan": c.ptz_pan,
            "ptz_tilt": c.ptz_tilt,
            "ptz_zoom": c.ptz_zoom,
            "vision_mode": c.vision_mode,
        }
        for c in cameras
    ]

@app.post("/api/cameras")
def add_camera(cam: CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(Camera).filter(Camera.id == cam.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Camera ID already exists")
    new_cam = Camera(
        id=cam.id,
        name=cam.name,
        type=cam.type,
        location=cam.location,
        zone=cam.zone,
        ip=cam.ip,
        lat=cam.lat,
        lng=cam.lng,
        fov_angle=cam.fov_angle,
        fov_heading=cam.fov_heading,
        vision_mode=cam.vision_mode
    )
    db.add(new_cam)
    db.commit()
    return {"status": "Camera added", "id": cam.id}

@app.post("/api/cameras/{cam_id}/ptz")
def control_ptz(cam_id: str, ptz: PTZControl, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam.ptz_pan = ptz.pan
    cam.ptz_tilt = ptz.tilt
    cam.ptz_zoom = ptz.zoom
    db.commit()
    return {"status": "PTZ updated", "camera_id": cam_id, "pan": ptz.pan, "tilt": ptz.tilt, "zoom": ptz.zoom}

@app.post("/api/cameras/{cam_id}/vision-mode")
def set_vision_mode(cam_id: str, mode: str, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == cam_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    cam.vision_mode = mode
    db.commit()
    return {"status": "Vision mode updated", "camera_id": cam_id, "mode": mode}

# ─── EVENTS & ALERTS ─────────────────────
@app.get("/api/events")
def get_events(
    db: Session = Depends(get_db),
    limit: int = 100,
    camera: Optional[str] = None,
    risk: Optional[str] = None,
    event_type: Optional[str] = None
):
    q = db.query(Event)
    if camera and camera != "all":
        q = q.filter(Event.camera_id == camera)
    if risk and risk != "all":
        q = q.filter(Event.risk_level == risk)
    if event_type:
        q = q.filter(Event.event_type.like(f"%{event_type}%"))
    events = q.order_by(Event.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "camera_id": e.camera_id,
            "event_type": e.event_type,
            "object_type": e.object_type,
            "confidence": e.confidence,
            "risk_level": e.risk_level,
            "status": e.status,
            "snapshot_path": e.snapshot_path,
            "details": e.details,
            "plate_number": e.plate_number,
            "speed_kmh": e.speed_kmh,
            "lat": e.lat,
            "lng": e.lng,
            "bbox": e.bbox,
        }
        for e in events
    ]

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = (
        db.query(Event)
        .filter(Event.risk_level.in_(["MEDIUM", "HIGH", "CRITICAL"]))
        .order_by(Event.timestamp.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "camera_id": e.camera_id,
            "event_type": e.event_type,
            "object_type": e.object_type,
            "confidence": e.confidence,
            "risk_level": e.risk_level,
            "status": e.status,
            "plate_number": e.plate_number,
            "details": e.details,
            "lat": e.lat,
            "lng": e.lng
        }
        for e in alerts
    ]

class EventStatusUpdate(BaseModel):
    status: str # NEW, ACKNOWLEDGED, DISPATCHED, RESOLVED

@app.post("/api/events/{event_id}/status")
def update_event_status(event_id: str, update: EventStatusUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = update.status
    db.commit()
    return {"status": "Event status updated", "event_id": event_id, "new_status": update.status}

# ─── VIRTUAL FENCE ───────────────────────
class VirtualFenceCreate(BaseModel):
    camera_id: str
    name: str = "Perimeter Zone"
    zone_type: str = "RESTRICTED"
    points_json: str
    trigger_rule: str = "person_entry"
    alert_level: str = "CRITICAL"

@app.get("/api/virtual-fences")
def get_virtual_fences(camera_id: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(VirtualFence)
    if camera_id:
        q = q.filter(VirtualFence.camera_id == camera_id)
    fences = q.all()
    return [
        {
            "id": f.id,
            "camera_id": f.camera_id,
            "name": f.name,
            "zone_type": f.zone_type,
            "points_json": f.points_json,
            "trigger_rule": f.trigger_rule,
            "alert_level": f.alert_level,
            "is_active": f.is_active,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in fences
    ]

@app.post("/api/virtual-fences")
def save_virtual_fence(fence: VirtualFenceCreate, db: Session = Depends(get_db)):
    new_id = f"VF-{fence.camera_id}-{datetime.datetime.utcnow().strftime('%M%S')}"
    new_fence = VirtualFence(
        id=new_id,
        camera_id=fence.camera_id,
        name=fence.name,
        zone_type=fence.zone_type,
        points_json=fence.points_json,
        trigger_rule=fence.trigger_rule,
        alert_level=fence.alert_level,
        is_active=True
    )
    db.add(new_fence)
    db.commit()
    return {"status": "Virtual fence saved", "id": new_id}

@app.delete("/api/virtual-fences/{fence_id}")
def delete_virtual_fence(fence_id: str, db: Session = Depends(get_db)):
    vf = db.query(VirtualFence).filter(VirtualFence.id == fence_id).first()
    if not vf:
        raise HTTPException(status_code=404, detail="Virtual fence not found")
    db.delete(vf)
    db.commit()
    return {"status": "Virtual fence deleted", "id": fence_id}

# ─── ANPR & WATCHLIST ─────────────────────
class WatchlistCreate(BaseModel):
    plate_number: str
    vehicle_type: str = "SUV"
    owner_name: str = "Unknown"
    flag_reason: str = "Flagged by Security"
    risk_level: str = "HIGH"

@app.get("/api/watchlist")
def get_watchlist(db: Session = Depends(get_db)):
    items = db.query(WatchlistPlate).order_by(WatchlistPlate.date_added.desc()).all()
    return [
        {
            "id": w.id,
            "plate_number": w.plate_number,
            "vehicle_type": w.vehicle_type,
            "owner_name": w.owner_name,
            "flag_reason": w.flag_reason,
            "risk_level": w.risk_level,
            "date_added": w.date_added.isoformat() if w.date_added else None,
        }
        for w in items
    ]

@app.post("/api/watchlist")
def add_watchlist(item: WatchlistCreate, db: Session = Depends(get_db)):
    existing = db.query(WatchlistPlate).filter(WatchlistPlate.plate_number == item.plate_number.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plate already on watchlist")
    new_wp = WatchlistPlate(
        id=f"WP-{datetime.datetime.utcnow().strftime('%M%S')}",
        plate_number=item.plate_number.upper().strip(),
        vehicle_type=item.vehicle_type,
        owner_name=item.owner_name,
        flag_reason=item.flag_reason,
        risk_level=item.risk_level
    )
    db.add(new_wp)
    db.commit()
    return {"status": "Plate added to watchlist", "plate": item.plate_number}

@app.delete("/api/watchlist/{wp_id}")
def delete_watchlist(wp_id: str, db: Session = Depends(get_db)):
    wp = db.query(WatchlistPlate).filter(WatchlistPlate.id == wp_id).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Watchlist entry not found")
    db.delete(wp)
    db.commit()
    return {"status": "Watchlist entry removed", "id": wp_id}

# ─── INCIDENT DISPATCH & SOP ─────────────
class DispatchCreate(BaseModel):
    event_id: str
    camera_id: str
    unit_name: str = "QRT-Alpha (Quick Reaction Team)"
    notes: str = ""
    sop_steps: List[str] = ["Verified Threat", "Sounded Siren", "Dispatched QRT Unit"]

@app.get("/api/dispatches")
def get_dispatches(db: Session = Depends(get_db)):
    dispatches = db.query(IncidentDispatch).order_by(IncidentDispatch.dispatched_at.desc()).all()
    return [
        {
            "id": d.id,
            "event_id": d.event_id,
            "camera_id": d.camera_id,
            "unit_name": d.unit_name,
            "status": d.status,
            "dispatched_at": d.dispatched_at.isoformat() if d.dispatched_at else None,
            "notes": d.notes,
            "sop_steps": json.loads(d.sop_steps) if d.sop_steps else []
        }
        for d in dispatches
    ]

@app.post("/api/dispatches")
def create_dispatch(disp: DispatchCreate, db: Session = Depends(get_db)):
    new_disp = IncidentDispatch(
        id=f"DISP-{datetime.datetime.utcnow().strftime('%H%M%S')}",
        event_id=disp.event_id,
        camera_id=disp.camera_id,
        unit_name=disp.unit_name,
        status="DISPATCHED",
        notes=disp.notes,
        sop_steps=json.dumps(disp.sop_steps)
    )
    db.add(new_disp)
    
    # Also update event status
    event = db.query(Event).filter(Event.id == disp.event_id).first()
    if event:
        event.status = "DISPATCHED"
    
    db.commit()
    return {"status": "QRT Dispatched successfully", "id": new_disp.id, "unit": disp.unit_name}

# ─── ANALYTICS ───────────────────────────
@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_events = db.query(Event).count()
    critical = db.query(Event).filter(Event.risk_level == "CRITICAL").count()
    high = db.query(Event).filter(Event.risk_level == "HIGH").count()
    medium = db.query(Event).filter(Event.risk_level == "MEDIUM").count()
    low = db.query(Event).filter(Event.risk_level == "LOW").count()
    people = db.query(Event).filter(Event.object_type == "Person").count()
    vehicles = db.query(Event).filter(Event.object_type.like("Vehicle%")).count()
    intrusions = db.query(Event).filter(Event.event_type.like("%Intrusion%")).count()
    anpr_scans = db.query(Event).filter(Event.event_type.like("%ANPR%")).count()

    return {
        "total_events": total_events,
        "critical_alerts": critical,
        "high_alerts": high,
        "medium_alerts": medium,
        "low_alerts": low,
        "people_detected": people,
        "vehicles_detected": vehicles,
        "intrusions": intrusions,
        "anpr_scans": anpr_scans,
        "system_status": "OPTIMAL",
        "active_cameras": db.query(Camera).count()
    }

# ─── SETTINGS ────────────────────────────
@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    configs = db.query(SystemConfig).all()
    settings_dict = {c.key: c.value for c in configs}
    defaults = {
        "person_confidence": "75",
        "vehicle_confidence": "70",
        "anpr_confidence": "85",
        "alert_cooldown": "30",
        "fence_sensitivity": "80",
        "sound_alerts_enabled": "true",
        "auto_dispatch": "false"
    }
    defaults.update(settings_dict)
    return defaults

@app.post("/api/settings")
def save_settings(new_settings: dict, db: Session = Depends(get_db)):
    for k, v in new_settings.items():
        cfg = db.query(SystemConfig).filter(SystemConfig.key == k).first()
        if cfg:
            cfg.value = str(v)
        else:
            db.add(SystemConfig(key=k, value=str(v)))
    db.commit()
    return {"status": "Settings saved successfully"}

# ─── STORAGE & CONNECTED DRIVE ───────────
import storage_manager

class StorageConfigUpdate(BaseModel):
    drive_path: str
    auto_archive: Optional[bool] = True

class StorageTestRequest(BaseModel):
    target_path: str

@app.get("/api/storage/drives")
def get_system_drives_api():
    """Detect available local, external, and cloud-synced storage drives."""
    return storage_manager.detect_system_drives()

@app.get("/api/storage/config")
def get_storage_config_api(db: Session = Depends(get_db)):
    """Get active storage drive configuration and telemetry."""
    return storage_manager.get_storage_stats(db)

@app.post("/api/storage/config")
def update_storage_config_api(cfg: StorageConfigUpdate, db: Session = Depends(get_db)):
    """Update active storage drive path and archiving options."""
    # Test path first
    test_res = storage_manager.test_drive_path(cfg.drive_path)
    if not test_res["success"]:
        raise HTTPException(status_code=400, detail=test_res["message"])

    # Update DB
    path_cfg = db.query(SystemConfig).filter(SystemConfig.key == "storage_drive_path").first()
    if path_cfg:
        path_cfg.value = test_res["path"]
    else:
        db.add(SystemConfig(key="storage_drive_path", value=test_res["path"]))

    auto_cfg = db.query(SystemConfig).filter(SystemConfig.key == "storage_auto_archive").first()
    if auto_cfg:
        auto_cfg.value = "true" if cfg.auto_archive else "false"
    else:
        db.add(SystemConfig(key="storage_auto_archive", value="true" if cfg.auto_archive else "false"))

    db.commit()
    return {
        "status": "Storage drive configured successfully",
        "active_path": test_res["path"],
        "free_gb": test_res["free_gb"],
        "total_gb": test_res["total_gb"]
    }

@app.post("/api/storage/test")
def test_storage_api(req: StorageTestRequest):
    """Test read/write permissions for a specific drive folder path."""
    return storage_manager.test_drive_path(req.target_path)

@app.post("/api/storage/sync")
def sync_drive_api(db: Session = Depends(get_db)):
    """Export and synchronize all incident evidence, ANPR logs, and reports to active drive."""
    return storage_manager.sync_all_to_drive(db)

@app.post("/api/storage/export-event/{event_id}")
def export_event_api(event_id: str, db: Session = Depends(get_db)):
    """Export single incident dossier directly to connected drive."""
    try:
        return storage_manager.export_single_incident_to_drive(db, event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/storage/files")
def get_drive_files_api(limit: int = 40, db: Session = Depends(get_db)):
    """List recent evidence files stored on the active drive."""
    return storage_manager.list_drive_files(db, limit=limit)

@app.post("/api/storage/open-folder")
def open_drive_folder_api(db: Session = Depends(get_db)):
    """Open active storage folder in Windows File Explorer."""
    path = storage_manager.get_active_storage_path(db)
    success = storage_manager.open_folder_in_explorer(path)
    return {"status": "SUCCESS" if success else "FAILED", "path": path}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

