from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./drishtix.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="ONLINE")
    type = Column(String, default="PTZ IP Camera")
    location = Column(String, default="")
    zone = Column(String, default="Sector 7")
    ip = Column(String, default="192.168.1.101")
    lat = Column(Float, default=32.7266)
    lng = Column(Float, default=74.8570)
    fov_angle = Column(Float, default=65.0)  # Field of view coverage angle
    fov_heading = Column(Float, default=45.0) # Direction facing in degrees
    ptz_pan = Column(Float, default=0.0)
    ptz_tilt = Column(Float, default=0.0)
    ptz_zoom = Column(Float, default=1.0)
    vision_mode = Column(String, default="OPTICAL") # OPTICAL, THERMAL, NIGHT_VISION

class Event(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    camera_id = Column(String, index=True)
    event_type = Column(String) # Person Detection, Virtual Fence Intrusion, ANPR, Loitering, etc.
    object_type = Column(String)
    confidence = Column(Float)
    risk_level = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="NEW") # NEW, ACKNOWLEDGED, DISPATCHED, RESOLVED
    snapshot_path = Column(String, nullable=True)
    details = Column(Text, default="")
    plate_number = Column(String, nullable=True)
    speed_kmh = Column(Float, default=0.0)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    bbox = Column(String, default="[50, 40, 120, 200]") # JSON array string

class VirtualFence(Base):
    __tablename__ = "virtual_fences"
    id = Column(String, primary_key=True, index=True)
    camera_id = Column(String, index=True)
    name = Column(String, default="Perimeter Zone")
    zone_type = Column(String, default="RESTRICTED") # RESTRICTED, BUFFER, SAFE, VEHICLE_ONLY
    points_json = Column(Text) # JSON array of {x, y} relative percentages
    trigger_rule = Column(String, default="person_entry") # person_entry, vehicle_entry, loitering, line_cross
    alert_level = Column(String, default="CRITICAL")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class WatchlistPlate(Base):
    __tablename__ = "watchlist_plates"
    id = Column(String, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True)
    vehicle_type = Column(String, default="SUV")
    owner_name = Column(String, default="Unknown")
    flag_reason = Column(String, default="Suspicious border loitering")
    risk_level = Column(String, default="HIGH")
    date_added = Column(DateTime, default=datetime.datetime.utcnow)

class IncidentDispatch(Base):
    __tablename__ = "incident_dispatches"
    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, index=True)
    camera_id = Column(String)
    unit_name = Column(String, default="QRT-Alpha (Quick Reaction Team)")
    status = Column(String, default="DISPATCHED") # DISPATCHED, EN_ROUTE, ON_SCENE, RESOLVED
    dispatched_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, default="")
    sop_steps = Column(Text, default='["Verified Threat", "Sounded Siren", "Dispatched QRT Unit"]')

class SystemConfig(Base):
    __tablename__ = "system_configs"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

