import os
import shutil
import string
import json
import hashlib
import datetime
import subprocess
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database import Event, WatchlistPlate, IncidentDispatch, SystemConfig, Camera

DEFAULT_STORAGE_ROOT = os.path.join(os.path.expanduser("~"), "DrishtiX_Drive_Storage")

def calculate_sha256(filepath: str) -> str:
    """Calculate SHA-256 hash of a file for cryptographic chain of custody."""
    if not os.path.exists(filepath):
        return ""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def detect_system_drives() -> List[Dict[str, Any]]:
    """Detect available Windows storage drives, external drives, and cloud-synced folders."""
    drives = []
    user_home = os.path.expanduser("~")

    # 1. Check Windows Drive letters (A-Z)
    for letter in string.ascii_uppercase:
        drive_path = f"{letter}:\\"
        if os.path.exists(drive_path):
            try:
                usage = shutil.disk_usage(drive_path)
                total_gb = round(usage.total / (1024 ** 3), 1)
                free_gb = round(usage.free / (1024 ** 3), 1)
                used_gb = round(usage.used / (1024 ** 3), 1)
                used_percent = round((usage.used / usage.total) * 100, 1)

                is_system = (letter == 'C')
                is_google_drive = (letter == 'G') or os.path.exists(os.path.join(drive_path, "My Drive"))
                
                label = f"Local Disk ({letter}:)"
                drive_type = "LOCAL_DISK"
                
                if is_google_drive:
                    label = f"Google Drive ({letter}:)"
                    drive_type = "GOOGLE_DRIVE"
                elif is_system:
                    label = f"System OS Drive ({letter}:)"
                    drive_type = "SYSTEM_DRIVE"
                elif total_gb > 0:
                    label = f"Removable / External Storage ({letter}:)"
                    drive_type = "EXTERNAL_DRIVE"

                drives.append({
                    "id": f"drive_{letter.lower()}",
                    "name": label,
                    "letter": f"{letter}:",
                    "path": drive_path,
                    "type": drive_type,
                    "total_gb": total_gb,
                    "free_gb": free_gb,
                    "used_gb": used_gb,
                    "used_percent": used_percent,
                    "is_mounted": True,
                    "is_cloud_sync": is_google_drive
                })
            except Exception:
                pass

    # 2. Check for Cloud storage folders in User profile (e.g. OneDrive, Google Drive sync)
    cloud_candidates = [
        ("OneDrive", os.path.join(user_home, "OneDrive"), "ONEDRIVE", "Microsoft OneDrive (Cloud Sync)"),
        ("Google Drive", os.path.join(user_home, "Google Drive"), "GOOGLE_DRIVE", "Google Drive Desktop (Local Folder)"),
        ("Google Drive My Drive", "G:\\My Drive", "GOOGLE_DRIVE", "Google Drive (Virtual Volume G:\\My Drive)"),
        ("DrishtiX Dedicated Vault", DEFAULT_STORAGE_ROOT, "DEDICATED_VAULT", "DrishtiX Primary Storage Vault"),
    ]

    for name, path, dtype, label in cloud_candidates:
        exists = os.path.exists(path)
        try:
            # If path doesn't exist yet (like default vault), check parent directory for free space
            check_path = path if exists else user_home
            usage = shutil.disk_usage(check_path)
            total_gb = round(usage.total / (1024 ** 3), 1)
            free_gb = round(usage.free / (1024 ** 3), 1)
            used_percent = round((usage.used / usage.total) * 100, 1)

            drives.append({
                "id": f"cloud_{name.lower().replace(' ', '_')}",
                "name": label,
                "letter": path[:2] if len(path) >= 2 and path[1] == ':' else "C:",
                "path": path,
                "type": dtype,
                "total_gb": total_gb,
                "free_gb": free_gb,
                "used_gb": round(total_gb - free_gb, 1),
                "used_percent": used_percent,
                "is_mounted": exists or (dtype == "DEDICATED_VAULT"),
                "is_cloud_sync": dtype in ["GOOGLE_DRIVE", "ONEDRIVE"]
            })
        except Exception:
            pass

    return drives

def get_active_storage_path(db: Session) -> str:
    """Retrieve the configured drive path or return default."""
    cfg = db.query(SystemConfig).filter(SystemConfig.key == "storage_drive_path").first()
    if cfg and cfg.value and cfg.value.strip():
        return cfg.value.strip()
    return DEFAULT_STORAGE_ROOT

def test_drive_path(target_path: str) -> Dict[str, Any]:
    """Test folder accessibility and write permission on target drive."""
    target_path = os.path.abspath(os.path.expanduser(target_path))
    try:
        os.makedirs(target_path, exist_ok=True)
        test_file = os.path.join(target_path, ".drishtix_access_test.tmp")
        with open(test_file, "w") as f:
            f.write(f"DRISHTIX_STORAGE_VERIFIED_{datetime.datetime.utcnow().isoformat()}")
        
        # Read back & delete
        if os.path.exists(test_file):
            os.remove(test_file)

        usage = shutil.disk_usage(target_path)
        free_gb = round(usage.free / (1024 ** 3), 2)
        total_gb = round(usage.total / (1024 ** 3), 2)

        return {
            "success": True,
            "path": target_path,
            "free_gb": free_gb,
            "total_gb": total_gb,
            "writable": True,
            "message": f"Storage path verified. {free_gb} GB free space available."
        }
    except Exception as e:
        return {
            "success": False,
            "path": target_path,
            "writable": False,
            "message": f"Failed to access storage path: {str(e)}"
        }

def get_storage_stats(db: Session) -> Dict[str, Any]:
    """Get full drive status, capacity, and archive statistics."""
    drive_path = get_active_storage_path(db)
    auto_archive_cfg = db.query(SystemConfig).filter(SystemConfig.key == "storage_auto_archive").first()
    auto_archive = (auto_archive_cfg.value == "true") if auto_archive_cfg else True
    
    last_sync_cfg = db.query(SystemConfig).filter(SystemConfig.key == "storage_last_sync").first()
    last_sync = last_sync_cfg.value if last_sync_cfg else None

    # Disk usage
    total_gb = 0.0
    free_gb = 0.0
    used_gb = 0.0
    used_percent = 0.0
    is_accessible = False

    if os.path.exists(drive_path) or os.path.exists(os.path.dirname(drive_path)):
        try:
            check_p = drive_path if os.path.exists(drive_path) else os.path.dirname(drive_path)
            usage = shutil.disk_usage(check_p)
            total_gb = round(usage.total / (1024 ** 3), 2)
            free_gb = round(usage.free / (1024 ** 3), 2)
            used_gb = round((usage.total - usage.free) / (1024 ** 3), 2)
            used_percent = round((used_gb / total_gb) * 100, 1) if total_gb > 0 else 0.0
            is_accessible = True
        except Exception:
            pass

    # Count archived files and size
    archived_files_count = 0
    archived_size_mb = 0.0
    if os.path.exists(drive_path):
        for root, _, files in os.walk(drive_path):
            for file in files:
                archived_files_count += 1
                try:
                    archived_size_mb += os.path.getsize(os.path.join(root, file)) / (1024 * 1024)
                except Exception:
                    pass

    # Is Cloud sync (e.g. Google Drive, OneDrive)
    is_cloud_synced = "Google Drive" in drive_path or "OneDrive" in drive_path or drive_path.upper().startswith("G:")

    return {
        "active_path": drive_path,
        "is_accessible": is_accessible,
        "is_cloud_synced": is_cloud_synced,
        "auto_archive": auto_archive,
        "last_sync": last_sync,
        "total_gb": total_gb,
        "free_gb": free_gb,
        "used_gb": used_gb,
        "used_percent": used_percent,
        "archived_files_count": archived_files_count,
        "archived_size_mb": round(archived_size_mb, 2),
        "status": "ONLINE" if is_accessible else "DISCONNECTED"
    }

def list_drive_files(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """List recently archived files in the drive directory."""
    drive_path = get_active_storage_path(db)
    if not os.path.exists(drive_path):
        return []

    file_list = []
    for root, _, files in os.walk(drive_path):
        for file in files:
            if file.startswith("."):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, drive_path)
            try:
                stat = os.stat(full_path)
                size_kb = round(stat.st_size / 1024, 1)
                modified = datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
                category = "EVIDENCE_DOSSIER"
                if "ANPR" in rel_path:
                    category = "ANPR_CAPTURE"
                elif "Report" in rel_path or file.endswith(".pdf") or file.endswith(".pptx"):
                    category = "TACTICAL_REPORT"
                elif "video" in rel_path or file.endswith(".mp4"):
                    category = "SURVEILLANCE_VIDEO"
                elif "manifest" in file.lower():
                    category = "AUDIT_MANIFEST"

                file_list.append({
                    "name": file,
                    "relative_path": rel_path,
                    "full_path": full_path,
                    "size_kb": size_kb,
                    "modified": modified,
                    "category": category
                })
            except Exception:
                pass

    file_list.sort(key=lambda x: x["modified"], reverse=True)
    return file_list[:limit]

def sync_all_to_drive(db: Session) -> Dict[str, Any]:
    """Export all events, dispatches, ANPR captures, reports, and SHA-256 manifests into the connected drive."""
    drive_path = get_active_storage_path(db)
    os.makedirs(drive_path, exist_ok=True)

    # Subdirectories
    evidence_dir = os.path.join(drive_path, "Evidence_Vault")
    anpr_dir = os.path.join(drive_path, "ANPR_Captures")
    reports_dir = os.path.join(drive_path, "Reports_and_Briefings")
    logs_dir = os.path.join(drive_path, "Tactical_Logs")

    for d in [evidence_dir, anpr_dir, reports_dir, logs_dir]:
        os.makedirs(d, exist_ok=True)

    synced_items = 0
    manifest_records = []

    # 1. Export All Events / Incident Dossiers
    events = db.query(Event).all()
    for ev in events:
        dossier = {
            "incident_id": ev.id,
            "timestamp": ev.timestamp.isoformat() if ev.timestamp else datetime.datetime.utcnow().isoformat(),
            "camera_id": ev.camera_id,
            "event_type": ev.event_type,
            "object_type": ev.object_type,
            "confidence": ev.confidence,
            "risk_level": ev.risk_level,
            "status": ev.status,
            "plate_number": ev.plate_number,
            "speed_kmh": ev.speed_kmh,
            "lat": ev.lat,
            "lng": ev.lng,
            "details": ev.details,
            "cryptographic_stamp": hashlib.sha256(f"{ev.id}_{ev.timestamp}_{ev.risk_level}".encode()).hexdigest(),
            "chain_of_custody": "DRISHTIX_FORENSIC_EDGE_VAULT_v2.0"
        }
        
        # Save JSON dossier
        filename = f"{ev.id}_{ev.risk_level}_{ev.camera_id}.json"
        filepath = os.path.join(evidence_dir, filename)
        with open(filepath, "w") as f:
            json.dump(dossier, f, indent=2)
        synced_items += 1

        # Also save formatted Markdown incident brief
        md_filename = f"{ev.id}_INCIDENT_BRIEF.md"
        md_path = os.path.join(evidence_dir, md_filename)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(f"# DRISHTIX INCIDENT FORENSIC DOSSIER\n\n")
            f.write(f"- **Incident ID**: `{ev.id}`\n")
            f.write(f"- **Timestamp**: `{ev.timestamp}`\n")
            f.write(f"- **Risk Level**: **{ev.risk_level}**\n")
            f.write(f"- **Sensor / Camera**: `{ev.camera_id}`\n")
            f.write(f"- **Detection**: {ev.event_type} ({ev.object_type}) with {round((ev.confidence or 0.9)*100, 1)}% confidence\n")
            if ev.plate_number:
                f.write(f"- **License Plate**: `{ev.plate_number}`\n")
            if ev.speed_kmh:
                f.write(f"- **Speed Velocity**: {ev.speed_kmh} km/h\n")
            f.write(f"- **SHA-256 Stamp**: `{dossier['cryptographic_stamp']}`\n\n")
            f.write(f"### Tactical Narrative\n{ev.details or 'Automated perimeter tripwire breach logged by Edge AI.'}\n")
        synced_items += 1

        manifest_records.append({
            "file": filename,
            "type": "INCIDENT_DOSSIER",
            "sha256": calculate_sha256(filepath),
            "synced_at": datetime.datetime.utcnow().isoformat()
        })

    # 2. Export Watchlist & ANPR logs
    watchlist = db.query(WatchlistPlate).all()
    anpr_summary = {
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "total_watchlist_records": len(watchlist),
        "records": [
            {
                "id": w.id,
                "plate_number": w.plate_number,
                "vehicle_type": w.vehicle_type,
                "owner_name": w.owner_name,
                "flag_reason": w.flag_reason,
                "risk_level": w.risk_level,
                "date_added": w.date_added.isoformat() if w.date_added else None
            }
            for w in watchlist
        ]
    }
    anpr_filepath = os.path.join(anpr_dir, "national_watchlist_registry.json")
    with open(anpr_filepath, "w") as f:
        json.dump(anpr_summary, f, indent=2)
    synced_items += 1
    manifest_records.append({
        "file": "national_watchlist_registry.json",
        "type": "ANPR_WATCHLIST",
        "sha256": calculate_sha256(anpr_filepath),
        "synced_at": datetime.datetime.utcnow().isoformat()
    })

    # 3. Export Dispatches & Tactical Logs
    dispatches = db.query(IncidentDispatch).all()
    logs_summary = {
        "system": "DRISHTIX Tactical Command",
        "exported_at": datetime.datetime.utcnow().isoformat(),
        "dispatches": [
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
    }
    log_filepath = os.path.join(logs_dir, "tactical_dispatch_audit.json")
    with open(log_filepath, "w") as f:
        json.dump(logs_summary, f, indent=2)
    synced_items += 1
    manifest_records.append({
        "file": "tactical_dispatch_audit.json",
        "type": "TACTICAL_DISPATCH_LOG",
        "sha256": calculate_sha256(log_filepath),
        "synced_at": datetime.datetime.utcnow().isoformat()
    })

    # 4. Copy existing project deliverables (PPTX, PDFs, Video) if available in workspace
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    deliverables = [
        "DRISHTIX_SIH2026_Fully_Editable_Presentation.pptx",
        "DRISHTIX_Tab_Wise_Technical_Report.pdf",
        "DRISHTIX_Jury_Defense_and_Deployment_Guide.pdf",
        "drishtix_prototype_demo.mp4"
    ]
    for d_file in deliverables:
        src = os.path.join(workspace_root, d_file)
        if os.path.exists(src):
            dst = os.path.join(reports_dir, d_file)
            shutil.copy2(src, dst)
            synced_items += 1
            manifest_records.append({
                "file": d_file,
                "type": "PROJECT_DELIVERABLE",
                "sha256": calculate_sha256(dst),
                "synced_at": datetime.datetime.utcnow().isoformat()
            })

    # 5. Write Cryptographic Audit Manifest
    manifest_filepath = os.path.join(drive_path, "audit_manifest.json")
    manifest_data = {
        "manifest_version": "2.0.0",
        "organization": "Smart India Hackathon 2026 - DrishtiX Command",
        "storage_root": drive_path,
        "last_sync_timestamp": datetime.datetime.utcnow().isoformat(),
        "total_files_indexed": len(manifest_records),
        "records": manifest_records
    }
    with open(manifest_filepath, "w") as f:
        json.dump(manifest_data, f, indent=2)
    synced_items += 1

    # Update last sync timestamp in database
    sync_time_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    cfg = db.query(SystemConfig).filter(SystemConfig.key == "storage_last_sync").first()
    if cfg:
        cfg.value = sync_time_str
    else:
        db.add(SystemConfig(key="storage_last_sync", value=sync_time_str))
    db.commit()

    return {
        "status": "SUCCESS",
        "synced_files": synced_items,
        "destination_path": drive_path,
        "timestamp": sync_time_str,
        "manifest_path": manifest_filepath
    }

def export_single_incident_to_drive(db: Session, event_id: str) -> Dict[str, Any]:
    """Export a single incident record to the connected drive folder."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise ValueError(f"Event {event_id} not found")

    drive_path = get_active_storage_path(db)
    evidence_dir = os.path.join(drive_path, "Evidence_Vault")
    os.makedirs(evidence_dir, exist_ok=True)

    dossier = {
        "incident_id": event.id,
        "timestamp": event.timestamp.isoformat() if event.timestamp else datetime.datetime.utcnow().isoformat(),
        "camera_id": event.camera_id,
        "event_type": event.event_type,
        "object_type": event.object_type,
        "confidence": event.confidence,
        "risk_level": event.risk_level,
        "status": event.status,
        "plate_number": event.plate_number,
        "speed_kmh": event.speed_kmh,
        "lat": event.lat,
        "lng": event.lng,
        "details": event.details,
        "exported_at": datetime.datetime.utcnow().isoformat(),
        "sha256_hash": hashlib.sha256(f"{event.id}_{event.timestamp}_{event.risk_level}".encode()).hexdigest(),
    }

    json_filename = f"{event.id}_FORENSIC_DOSSIER.json"
    json_path = os.path.join(evidence_dir, json_filename)
    with open(json_path, "w") as f:
        json.dump(dossier, f, indent=2)

    return {
        "status": "SUCCESS",
        "event_id": event.id,
        "saved_path": json_path,
        "sha256": dossier["sha256_hash"]
    }

def open_folder_in_explorer(path: str) -> bool:
    """Launch Windows File Explorer at the target folder."""
    try:
        abs_path = os.path.abspath(os.path.expanduser(path))
        if not os.path.exists(abs_path):
            os.makedirs(abs_path, exist_ok=True)
        subprocess.Popen(["explorer.exe", abs_path])
        return True
    except Exception:
        return False
