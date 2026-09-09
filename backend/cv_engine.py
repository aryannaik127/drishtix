import asyncio
import time
import random
import json
import datetime
from database import SessionLocal, Event, Camera, VirtualFence, WatchlistPlate

# ─────────────────────────────────────────────
# DRISHTIX Demo Engine v2.0
# Simulates an advanced edge AI computer vision pipeline
# including YOLOv8 Object Detection, Virtual Fence Intrusion,
# ANPR Optical Character Recognition, and GPS Telemetry.
# ─────────────────────────────────────────────

CAMERA_CONFIGS = {
    "CAM-01": {
        "name": "Border Patrol Alpha",
        "type": "PTZ IP Camera",
        "location": "Border Zone A - North Sector",
        "zone": "Sector 7",
        "ip": "192.168.1.101",
        "lat": 32.7285,
        "lng": 74.8562,
        "fov_angle": 70.0,
        "fov_heading": 35.0,
        "vision_mode": "OPTICAL"
    },
    "CAM-02": {
        "name": "Checkpoint Bravo",
        "type": "Fixed IP Camera",
        "location": "Border Zone B - Entry Gate",
        "zone": "Sector 7",
        "ip": "192.168.1.102",
        "lat": 32.7262,
        "lng": 74.8580,
        "fov_angle": 60.0,
        "fov_heading": 110.0,
        "vision_mode": "NIGHT_VISION"
    },
    "CAM-03": {
        "name": "Gate ANPR Scanner",
        "type": "ANPR Camera",
        "location": "Main Gate - Vehicle Lane",
        "zone": "Gate Area",
        "ip": "192.168.1.103",
        "lat": 32.7245,
        "lng": 74.8550,
        "fov_angle": 50.0,
        "fov_heading": 180.0,
        "vision_mode": "OPTICAL"
    },
    "CAM-04": {
        "name": "Restricted Zone Delta",
        "type": "Thermal IP Camera",
        "location": "Restricted Zone - Perimeter Fence",
        "zone": "Restricted Zone",
        "ip": "192.168.1.104",
        "lat": 32.7298,
        "lng": 74.8595,
        "fov_angle": 85.0,
        "fov_heading": 290.0,
        "vision_mode": "THERMAL"
    },
}

INITIAL_WATCHLIST = [
    {"plate": "MH01AB1234", "type": "SUV (Black Scorpio)", "owner": "Suspect Target 09", "reason": "Flagged by Border Intelligence for perimeter reconnaissance", "risk": "HIGH"},
    {"plate": "DL05XY9876", "type": "Pickup Truck (White)", "owner": "Unregistered Commercial", "reason": "No valid border passage permit", "risk": "CRITICAL"},
    {"plate": "JK02C5544",  "type": "Sedan (Silver)", "owner": "Courier Transit", "reason": "Route deviation in restricted buffer zone", "risk": "MEDIUM"},
]

DEFAULT_FENCES = [
    {
        "id": "VF-CAM04-01",
        "camera_id": "CAM-04",
        "name": "Delta Northern Perimeter Buffer",
        "zone_type": "RESTRICTED",
        "points_json": json.dumps([{"x": 6, "y": 62}, {"x": 94, "y": 58}, {"x": 97, "y": 96}, {"x": 3, "y": 98}]),
        "trigger_rule": "person_entry",
        "alert_level": "CRITICAL"
    },
    {
        "id": "VF-CAM01-01",
        "camera_id": "CAM-01",
        "name": "Alpha North Scrubland Line",
        "zone_type": "BUFFER",
        "points_json": json.dumps([{"x": 10, "y": 50}, {"x": 90, "y": 50}, {"x": 95, "y": 90}, {"x": 5, "y": 90}]),
        "trigger_rule": "line_cross",
        "alert_level": "HIGH"
    }
]

DEMO_EVENTS = [
    # (delay, cam_id, evt_type, obj_type, conf, risk, plate, speed, bbox, details)
    (2,  "CAM-01", "Person Detection",            "Person",       0.96, "LOW",      None, 3.2, "[120, 80, 70, 160]", "Lone target walking in outer buffer zone"),
    (5,  "CAM-01", "Person Detection",            "Person",       0.91, "LOW",      None, 4.1, "[180, 90, 65, 155]", "Target walking towards checkpoint perimeter"),
    (8,  "CAM-02", "Vehicle Detection",           "Vehicle",      0.93, "LOW",      None, 24.5, "[210, 130, 140, 90]", "Vehicle approaching checkpoint from south lane"),
    (11, "CAM-02", "Vehicle Speed Alert",         "Vehicle",      0.88, "MEDIUM",   None, 48.2, "[220, 125, 145, 95]", "Speed limit exceeded near gate barrier"),
    (14, "CAM-03", "Vehicle Approaching Gate",    "Vehicle",      0.95, "MEDIUM",   "MH01AB1234", 18.0, "[150, 110, 180, 110]", "Vehicle entered ANPR optical OCR trap"),
    (17, "CAM-03", "ANPR - Watchlist Hit",        "Vehicle",      0.94, "HIGH",     "MH01AB1234", 12.0, "[150, 110, 180, 110]", "MATCH: Flagged by Border Intelligence"),
    (20, "CAM-04", "Movement in Restricted Area", "Person",       0.86, "MEDIUM",   None, 2.5, "[280, 160, 60, 140]", "Thermal signature detected near wire fence"),
    (23, "CAM-01", "Night Movement Detected",     "Person",       0.89, "MEDIUM",   None, 3.8, "[130, 95, 68, 150]", "Infrared tracking acquired candidate subject"),
    (26, "CAM-04", "Suspicious Loitering",        "Person",       0.91, "HIGH",     None, 0.4, "[275, 165, 62, 145]", "Target stationary at fence for >45 seconds"),
    (29, "CAM-04", "Virtual Fence Intrusion",     "Person",       0.97, "CRITICAL", None, 5.8, "[270, 170, 65, 150]", "BREACH: Virtual fence crossed into Restricted Zone Delta!"),
    (33, "CAM-03", "ANPR - Unregistered Vehicle", "Vehicle",      0.90, "HIGH",     "DL05XY9876", 32.0, "[160, 115, 185, 115]", "Blacklisted commercial vehicle without entry pass"),
    (37, "CAM-01", "Drone Patrol Track Acquired", "UAV",          0.94, "LOW",      None, 42.0, "[50, 30, 80, 50]", "Scheduled Border Patrol UAV Unit B-1 online"),
    (41, "CAM-04", "Virtual Fence Intrusion",     "Person",       0.95, "CRITICAL", None, 6.2, "[310, 180, 70, 160]", "CRITICAL BREACH: Second intruder confirmed moving past wire!"),
]


class DemoEngine:
    def __init__(self, db_session):
        self.db = db_session
        self.running = False
        self.event_counter = 0

    def seed_initial_data(self):
        """Seed cameras, default virtual fences, and initial watchlist plates."""
        # 1. Cameras
        for cam_id, config in CAMERA_CONFIGS.items():
            existing = self.db.query(Camera).filter(Camera.id == cam_id).first()
            if not existing:
                cam = Camera(
                    id=cam_id,
                    name=config["name"],
                    status="ONLINE",
                    type=config["type"],
                    location=config["location"],
                    zone=config["zone"],
                    ip=config["ip"],
                    lat=config["lat"],
                    lng=config["lng"],
                    fov_angle=config["fov_angle"],
                    fov_heading=config["fov_heading"],
                    vision_mode=config["vision_mode"]
                )
                self.db.add(cam)
            else:
                existing.lat = config["lat"]
                existing.lng = config["lng"]
                existing.fov_angle = config["fov_angle"]
                existing.fov_heading = config["fov_heading"]
                existing.vision_mode = config["vision_mode"]

        # 2. Watchlist
        for item in INITIAL_WATCHLIST:
            existing = self.db.query(WatchlistPlate).filter(WatchlistPlate.plate_number == item["plate"]).first()
            if not existing:
                wp = WatchlistPlate(
                    id=f"WP-{random.randint(1000, 9999)}",
                    plate_number=item["plate"],
                    vehicle_type=item["type"],
                    owner_name=item["owner"],
                    flag_reason=item["reason"],
                    risk_level=item["risk"]
                )
                self.db.add(wp)

        # 3. Virtual Fences
        for f in DEFAULT_FENCES:
            existing = self.db.query(VirtualFence).filter(VirtualFence.id == f["id"]).first()
            if not existing:
                vf = VirtualFence(
                    id=f["id"],
                    camera_id=f["camera_id"],
                    name=f["name"],
                    zone_type=f["zone_type"],
                    points_json=f["points_json"],
                    trigger_rule=f["trigger_rule"],
                    alert_level=f["alert_level"],
                    is_active=True
                )
                self.db.add(vf)

        self.db.commit()

    async def start_demo(self):
        """Seed tables and start the progressive simulation loop."""
        if self.running:
            return
        
        self.running = True
        self.seed_initial_data()
        
        # Count existing events
        self.event_counter = self.db.query(Event).count()

        # Fire progressive events
        await self._simulate_events()

    async def _simulate_events(self):
        prev_delay = 0
        for delay, cam_id, evt_type, obj_type, conf, risk, plate, speed, bbox, details in DEMO_EVENTS:
            wait = delay - prev_delay
            prev_delay = delay
            await asyncio.sleep(wait)
            if not self.running:
                break
            
            cam_conf = CAMERA_CONFIGS.get(cam_id, {})
            lat = cam_conf.get("lat", 32.7266) + (random.uniform(-0.0005, 0.0005))
            lng = cam_conf.get("lng", 74.8570) + (random.uniform(-0.0005, 0.0005))

            self._create_event(
                cam_id=cam_id,
                evt_type=evt_type,
                obj_type=obj_type,
                conf=conf,
                risk=risk,
                plate=plate,
                speed=speed,
                lat=lat,
                lng=lng,
                bbox=bbox,
                details=details
            )

    def _create_event(self, cam_id, evt_type, obj_type, conf, risk, plate=None, speed=0.0, lat=None, lng=None, bbox="[50, 40, 120, 200]", details=""):
        self.event_counter += 1
        evt = Event(
            id=f"EVT-{self.event_counter:04d}",
            timestamp=datetime.datetime.utcnow(),
            camera_id=cam_id,
            event_type=evt_type,
            object_type=obj_type,
            confidence=conf,
            risk_level=risk,
            status="NEW",
            plate_number=plate,
            speed_kmh=speed,
            lat=lat,
            lng=lng,
            bbox=bbox,
            details=details
        )
        self.db.add(evt)
        self.db.commit()

    def stop(self):
        self.running = False


# Singleton pattern
_engine_instance = None

def get_engine():
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = DemoEngine(SessionLocal())
        _engine_instance.seed_initial_data()
    return _engine_instance

