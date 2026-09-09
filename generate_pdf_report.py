import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Running Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0891B2"))
        self.drawString(40, letter[1] - 28, "DRISHTIX v2.0 TACTICAL")
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(letter[0] - 40, letter[1] - 28, "INTELLIGENT BORDER SURVEILLANCE PLATFORM")
        
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(40, letter[1] - 34, letter[0] - 40, letter[1] - 34)

        # Running Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.75)
        self.line(40, 36, letter[0] - 40, 36)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        self.drawString(40, 24, "SMART INDIA HACKATHON (SIH) 2026 — TECHNICAL DOSSIER")
        
        self.setFont("Helvetica-Bold", 8)
        self.drawRightString(letter[0] - 40, 24, f"Page {self._pageNumber} of {page_count}")
        
        self.restoreState()


def create_drishtix_report(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()
    
    C_NAVY_DARK = colors.HexColor("#0F172A")
    C_BLUE_HDR  = colors.HexColor("#0369A1")
    C_CYAN_TAG  = colors.HexColor("#0891B2")
    C_MUTED     = colors.HexColor("#334155")
    C_BORDER    = colors.HexColor("#CBD5E1")
    C_BG_LIGHT  = colors.HexColor("#F8FAFC")

    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=C_NAVY_DARK,
        spaceAfter=2
    )

    style_cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=C_CYAN_TAG,
        spaceAfter=8
    )

    style_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=C_NAVY_DARK,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=C_BLUE_HDR,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11,
        textColor=C_NAVY_DARK,
        spaceAfter=3
    )

    style_bullet = ParagraphStyle(
        'BulletItem',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.6,
        leading=10.6,
        textColor=C_NAVY_DARK,
        leftIndent=8,
        firstLineIndent=-5,
        spaceAfter=1.5
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.5,
        textColor=C_NAVY_DARK
    )

    style_table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.5,
        textColor=C_NAVY_DARK
    )

    story = []

    # ─────────────────────────────────────────────────────────────
    # HERO & METADATA
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("DRISHTIX v2.0 TACTICAL", style_cover_title))
    story.append(Paragraph("Intelligent Border Surveillance & Tactical Command Center Platform — Operations Dossier", style_cover_subtitle))
    
    meta_data = [
        [
            Paragraph("<b>Project:</b> DRISHTIX MVP", style_table_cell),
            Paragraph("<b>Hackathon:</b> SIH 2026", style_table_cell),
            Paragraph("<b>Security Class:</b> TACTICAL / SENSITIVE", style_table_cell),
        ],
        [
            Paragraph("<b>Architecture:</b> React 18 + FastAPI + SQLite", style_table_cell),
            Paragraph("<b>Vision Engine:</b> YOLOv8 + ByteTrack + ANPR", style_table_cell),
            Paragraph("<b>Date of Dossier:</b> September 2026", style_table_cell),
        ]
    ]
    t_meta = Table(meta_data, colWidths=[177, 177, 178])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 4))

    # Executive Overview
    story.append(Paragraph("1. Executive Summary & Problem Formulation", style_h1))
    story.append(Paragraph(
        "Modern border control and perimeter defense rely heavily on conventional closed-circuit television (CCTV) cameras. "
        "However, human-monitored feeds suffer from high operator fatigue, cognitive overload, lack of real-time situational context, "
        "and delayed incident response times. <b>DRISHTIX</b> transforms traditional camera infrastructure into an autonomous, "
        "event-driven tactical command center that unifies multi-spectrum video analytics, mathematical geofencing, automatic license plate recognition (ANPR), "
        "radar GIS tracking, and automated Quick Response Force (QRF) dispatching into a single glass cockpit.",
        style_body
    ))

    # Architecture Overview Table
    story.append(Paragraph("2. Full-Stack System Architecture", style_h1))
    arch_data = [
        [Paragraph("Layer", style_table_header), Paragraph("Technologies", style_table_header), Paragraph("Key Responsibilities & Architectural Role", style_table_header)],
        [
            Paragraph("<b>Frontend Console</b>", style_table_cell_bold),
            Paragraph("React 18, Vite, Tailwind CSS, Lucide Icons, Web Audio API", style_table_cell),
            Paragraph("Military HUD dark command center, real-time polling synchronizer, multi-tab switching, procedural 2D HTML5 Canvas rendering engine with optical/thermal/night-vision shaders.", style_table_cell)
        ],
        [
            Paragraph("<b>Backend API</b>", style_table_cell_bold),
            Paragraph("FastAPI (Python 3.11), Uvicorn ASGI Server, Pydantic v2", style_table_cell),
            Paragraph("High-concurrency asynchronous REST API, background worker threads, strict request/response validation, CORS middleware, and progressive tactical demo orchestrator.", style_table_cell)
        ],
        [
            Paragraph("<b>Data Storage</b>", style_table_cell_bold),
            Paragraph("SQLite 3, SQLAlchemy ORM", style_table_cell),
            Paragraph("Relational schema for persistent management of Cameras, Events, Security Alerts, Virtual Geofences, ANPR Hotlists, QRF Dispatches, and System Parameters.", style_table_cell)
        ],
        [
            Paragraph("<b>Edge CV AI Engine</b>", style_table_cell_bold),
            Paragraph("YOLOv8 + ByteTrack + ANPR OCR + Ray-Casting", style_table_cell),
            Paragraph("Real-time multi-class object detection (Pedestrians, Vehicles, Animals), trajectory tracking, polygon containment, directional tripwire intersection testing, and speed radar estimation.", style_table_cell)
        ]
    ]
    t_arch = Table(arch_data, colWidths=[90, 140, 302])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 4))

    # ─────────────────────────────────────────────────────────────
    # TAB-BY-TAB COMPREHENSIVE BREAKDOWN
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("3. Tab-by-Tab In-Depth Operational Breakdown", style_h1))
    story.append(Paragraph("The DRISHTIX command dashboard provides 8 specialized tactical modules accessible via the sidebar navigation:", style_body))

    # TAB 1
    t1 = [
        Paragraph("TAB 1: Live Surveillance Matrix (CameraFeedGrid)", style_h2),
        Paragraph("<b>Purpose:</b> Multi-channel synchronized tactical command matrix monitoring 4 live border surveillance nodes simultaneously.", style_body),
        Paragraph("• <b>Camera Nodes:</b> CAM-01 (Border Patrol Alpha - PTZ), CAM-02 (Checkpoint Bravo - Entry Gate), CAM-03 (Main Gate - ANPR Optical), CAM-04 (Restricted Zone Delta - Thermal FLIR).", style_bullet),
        Paragraph("• <b>Simulated Canvas Engine:</b> High-performance HTML5 2D Canvas procedurally rendering scanlines, optical noise, targeting reticles, and thermal false-color palettes.", style_bullet),
        Paragraph("• <b>Multi-Spectrum Modes:</b> One-click switching between <i>Optical RGB</i>, <i>Night Vision (Green Phosphor Amplification)</i>, and <i>Thermal FLIR (White/Ironbow Heatmap)</i>.", style_bullet),
        Paragraph("• <b>Live Telemetry & HUD:</b> Dynamic bounding boxes with confidence scores (e.g. <code>Person 97%</code>), PTZ angles, compass heading, and edge FPS counters.", style_bullet),
        Paragraph("• <b>Interactive PTZ Controls:</b> Directional jog controls (Pan, Tilt, Zoom In/Out, Center Reset) allowing operators to steer surveillance angles in real time.", style_bullet)
    ]
    story.append(KeepTogether(t1))

    # TAB 2
    t2 = [
        Paragraph("TAB 2: Tactical Radar GIS (TacticalMap)", style_h2),
        Paragraph("<b>Purpose:</b> 2D Cartesian & Geospatial radar command view mapping coordinate nodes, camera field-of-view (FOV) coverage, and live target movement vectors.", style_body),
        Paragraph("• <b>Tactical Grid:</b> Interactive radar coordinate system centered around Sector 7 (Lat: 32.7266° N, Lng: 74.8570° E).", style_bullet),
        Paragraph("• <b>Camera FOV Visual Cones:</b> Geometric radar cones rendered at each node's exact heading angle and spread beam (e.g. 65° FOV at 45° azimuth).", style_bullet),
        Paragraph("• <b>Dynamic Radar Blips & Tracks:</b> Displays real-time movement vectors for pedestrians, vehicles, and assigned QRF patrol units (Bravo-1, Alpha-2).", style_bullet),
        Paragraph("• <b>Perimeter Geofence Polygons:</b> Visualized perimeter boundaries that pulse red upon intrusion, alerting operators to the exact breach coordinates.", style_bullet)
    ]
    story.append(KeepTogether(t2))

    # TAB 3
    t3 = [
        Paragraph("TAB 3: Virtual Fence Studio (VirtualFenceStudio)", style_h2),
        Paragraph("<b>Purpose:</b> Visual geofence editor enabling commanders to draw custom restricted zones and tripwires directly on live video feeds.", style_body),
        Paragraph("• <b>Drawing Modes:</b> Supports multi-point closed Polygons (Restricted Areas / No-Go Zones) and linear Tripwires (Directional Entry/Exit Lines).", style_bullet),
        Paragraph("• <b>Mathematical Intrusion Detection:</b> Uses ray-casting point-in-polygon algorithms and vector line-intersection algorithms to detect when a ByteTrack trajectory crosses a boundary.", style_bullet),
        Paragraph("• <b>Directional & Risk Sensitivity:</b> Operators configure direction filters (<i>Inbound Only</i>, <i>Outbound Only</i>, or <i>Bidirectional</i>), sensitivity thresholds (1–100%), and severity levels (<code>CRITICAL</code>, <code>HIGH</code>, <code>MEDIUM</code>, <code>LOW</code>).", style_bullet),
        Paragraph("• <b>Active Alarm State:</b> Instant perimeter highlighting and audio siren trigger when an unauthorized entity penetrates the perimeter.", style_bullet)
    ]
    story.append(KeepTogether(t3))

    # TAB 4
    t4 = [
        Paragraph("TAB 4: ANPR Vehicle Hub (ANPRHub)", style_h2),
        Paragraph("<b>Purpose:</b> Automated vehicle surveillance, optical license plate extraction, speed estimation radar, and national hotlist watchlist matching.", style_body),
        Paragraph("• <b>Optical OCR & Plate Parsing:</b> Automatically extracts vehicle license plates (e.g. <code>MH01AB1234</code>, <code>DL08CX5678</code>), state codes, and vehicle types (SUV, Truck, Sedan, Motorcycle).", style_bullet),
        Paragraph("• <b>Automated Hotlist / Watchlist Matching:</b> Compares every detected plate in real time against an encrypted database of stolen vehicles, contraband flags, and wanted suspects.", style_bullet),
        Paragraph("• <b>Instant Tactical Alarm:</b> Immediate high-priority red alert banner and audible warning tone whenever a watchlist plate is recognized.", style_bullet),
        Paragraph("• <b>Radar Speed Calculation:</b> Analyzes multi-frame bounding box displacement to estimate vehicle velocity and flag speed violations at entry checkpoints.", style_bullet),
        Paragraph("• <b>Plate Search & Watchlist Management:</b> Allows operators to search historical plate logs and register new suspect plates directly into the database.", style_bullet)
    ]
    story.append(KeepTogether(t4))

    # TAB 5
    t5 = [
        Paragraph("TAB 5: Incident Command & Quick Response (IncidentCommander)", style_h2),
        Paragraph("<b>Purpose:</b> Central dispatch console for triaging active security breaches, assigning Quick Response Force (QRF) units, and managing tactical SOPs.", style_body),
        Paragraph("• <b>Incident Triage Queue:</b> Active incidents sorted by threat severity (CRITICAL, HIGH, MEDIUM, LOW) with confidence scores and timestamps.", style_bullet),
        Paragraph("• <b>Standard Operating Procedure (SOP) Checklist:</b> Guided interactive checklist for operators: <i>1. Verify Video Feed → 2. Trigger Sector Siren → 3. Dispatch QRF Unit → 4. Lock Checkpoint Gate → 5. Notify Border HQ</i>.", style_bullet),
        Paragraph("• <b>Patrol Unit Dispatch:</b> Assigns nearest response team (e.g. <code>QRF Patrol Bravo-1</code>), calculates estimated time of arrival (ETA), and tracks response status (<code>DISPATCHED</code>, <code>EN_ROUTE</code>, <code>ON_SCENE</code>, <code>RESOLVED</code>).", style_bullet),
        Paragraph("• <b>Incident Resolution Notes:</b> Records operator notes and formal debrief records into persistent database storage.", style_bullet)
    ]
    story.append(KeepTogether(t5))

    # TAB 6
    t6 = [
        Paragraph("TAB 6: Evidence Vault & Forensic Archive (EvidenceVault)", style_h2),
        Paragraph("<b>Purpose:</b> Tamper-evident digital forensic vault storing cryptographically verified incident snapshots and audit trails for legal and intelligence use.", style_body),
        Paragraph("• <b>Tamper-Evident SHA-256 Hashing:</b> Every captured visual snapshot and associated metadata string is hashed with SHA-256 to guarantee non-repudiation and chain of custody.", style_bullet),
        Paragraph("• <b>Metadata Stored:</b> Camera ID, Exact Timestamp, Detection Bounding Box Coordinates, Confidence %, Classification, Operator ID, and GPS Geo-tag.", style_bullet),
        Paragraph("• <b>Advanced Filtering:</b> Filter by Camera ID, Event Category, Risk Severity, Date Range, and Hash Verification.", style_bullet),
        Paragraph("• <b>Forensic Export Dossier:</b> Single-click export of structured forensic evidence packages suitable for intelligence reports and legal prosecution.", style_bullet)
    ]
    story.append(KeepTogether(t6))

    # TAB 7
    t7 = [
        Paragraph("TAB 7: Threat Intelligence & Analytics (AnalyticsView)", style_h2),
        Paragraph("<b>Purpose:</b> High-level situational analytics, risk heatmaps, temporal breach histograms, and Edge AI performance metrics.", style_body),
        Paragraph("• <b>Key Metric Indicators:</b> Total Events, Critical Incursions, Object Breakdown (Pedestrians vs Vehicles vs Animals), ANPR Scans, and False-Positive Rates.", style_bullet),
        Paragraph("• <b>Hourly Threat Distribution:</b> 24-hour histogram detailing peak intrusion hours and suspicious nocturnal movement clusters.", style_bullet),
        Paragraph("• <b>Sector Vulnerability Ranking:</b> Evaluates breach frequency by border sector to recommend patrol reallocations.", style_bullet),
        Paragraph("• <b>Edge AI Telemetry:</b> Monitors inference latency (average 14ms on GPU / 38ms on CPU), FPS throughput, and model memory footprint.", style_bullet)
    ]
    story.append(KeepTogether(t7))

    # TAB 8
    t8 = [
        Paragraph("TAB 8: System Settings & Edge Config (SettingsView)", style_h2),
        Paragraph("<b>Purpose:</b> System administration, camera RTSP stream configuration, AI model threshold tuning, integration webhooks, and storage retention.", style_body),
        Paragraph("• <b>Camera Node Management:</b> Configure RTSP/IP stream URIs, camera labels, frame rates, and GPS coordinates.", style_bullet),
        Paragraph("• <b>AI Hyperparameter Tuning:</b> Real-time sliders for YOLO confidence threshold (0.10–0.99), NMS IoU threshold, and ByteTrack track buffer length.", style_bullet),
        Paragraph("• <b>Notification Gateways:</b> Webhook triggers, MQTT broker integration for IoT sirens/gate locks, and SMS/Telegram emergency alerts.", style_bullet),
        Paragraph("• <b>Data Retention & Maintenance:</b> Automated log rollover policies, database backup/reset, and Role-Based Access Control (RBAC).", style_bullet)
    ]
    story.append(KeepTogether(t8))
    story.append(Spacer(1, 4))

    # ─────────────────────────────────────────────────────────────
    # DEMO PROGRESSION & REST API SPECIFICATION
    # ─────────────────────────────────────────────────────────────
    d_sec = [
        Paragraph("4. Tactical Progressive Demonstration Sequence", style_h1),
        Paragraph("Clicking <b>START DEMO</b> in the top navigation bar triggers a progressive tactical simulation across all 4 border nodes:", style_body)
    ]
    demo_steps = [
        [Paragraph("Timeline", style_table_header), Paragraph("Node / Camera", style_table_header), Paragraph("Tactical Event Triggered", style_table_header), Paragraph("System Action & Tactical Response", style_table_header)],
        [
            Paragraph("<b>T + 0s</b>", style_table_cell_bold),
            Paragraph("System Engine", style_table_cell),
            Paragraph("Demo Sequence Initiated", style_table_cell),
            Paragraph("Spins up background CV simulation engine; audio chime sounds; status set to ACTIVE.", style_table_cell)
        ],
        [
            Paragraph("<b>T + 2s</b>", style_table_cell_bold),
            Paragraph("CAM-01 (Alpha Patrol)", style_table_cell),
            Paragraph("Pedestrian Movement Detected", style_table_cell),
            Paragraph("YOLOv8 bounding box acquired (Confidence 96%); green blip appears on radar map.", style_table_cell)
        ],
        [
            Paragraph("<b>T + 7s</b>", style_table_cell_bold),
            Paragraph("CAM-02 (Checkpoint Bravo)", style_table_cell),
            Paragraph("Vehicle Inbound Detected", style_table_cell),
            Paragraph("Vehicle speed estimated at 42 km/h; logged into live surveillance event queue.", style_table_cell)
        ],
        [
            Paragraph("<b>T + 14s</b>", style_table_cell_bold),
            Paragraph("CAM-03 (Gate ANPR)", style_table_cell),
            Paragraph("ANPR Watchlist Match (Hit)", style_table_cell),
            Paragraph("Plate <b>MH01AB1234</b> matched against Hotlist; HIGH risk warning tone sounds.", style_table_cell)
        ],
        [
            Paragraph("<b>T + 22s</b>", style_table_cell_bold),
            Paragraph("CAM-04 (Restricted Delta)", style_table_cell),
            Paragraph("<b>Virtual Fence Intrusion (CRITICAL)</b>", style_table_cell),
            Paragraph("Ray-casting detects fence breach; <b>CRITICAL SIREN</b> sounds; automated QRF ticket dispatched.", style_table_cell)
        ]
    ]
    t_demo = Table(demo_steps, colWidths=[52, 118, 142, 220])
    t_demo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    d_sec.append(t_demo)
    story.append(KeepTogether(d_sec))
    story.append(Spacer(1, 4))

    # REST API REFERENCE TABLE
    api_sec = [
        Paragraph("5. Core REST API Endpoint Reference", style_h1)
    ]
    api_data = [
        [Paragraph("HTTP Method", style_table_header), Paragraph("Endpoint", style_table_header), Paragraph("Description & Return Payload", style_table_header)],
        [
            Paragraph("<b>GET</b>", style_table_cell_bold),
            Paragraph("<code>/api/health</code>", style_table_cell),
            Paragraph("System health check, online edge node count, AI engine status.", style_table_cell)
        ],
        [
            Paragraph("<b>GET / POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/cameras</code>", style_table_cell),
            Paragraph("Query active camera nodes, telemetry, PTZ presets, and stream URLs.", style_table_cell)
        ],
        [
            Paragraph("<b>POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/cameras/{id}/ptz</code>", style_table_cell),
            Paragraph("Issue PTZ jog commands (pan, tilt, zoom) to physical or simulated nodes.", style_table_cell)
        ],
        [
            Paragraph("<b>GET</b>", style_table_cell_bold),
            Paragraph("<code>/api/events</code>", style_table_cell),
            Paragraph("Fetch real-time event feed with risk ratings, bounding boxes, and metadata.", style_table_cell)
        ],
        [
            Paragraph("<b>GET / POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/virtual-fences</code>", style_table_cell),
            Paragraph("Manage drawn polygon coordinates, tripwires, sensitivity, and arming state.", style_table_cell)
        ],
        [
            Paragraph("<b>GET / POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/watchlist</code>", style_table_cell),
            Paragraph("Manage ANPR vehicle hotlist database for instant match triggering.", style_table_cell)
        ],
        [
            Paragraph("<b>GET / POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/dispatch</code>", style_table_cell),
            Paragraph("Create and track Quick Response Force (QRF) patrol deployments.", style_table_cell)
        ],
        [
            Paragraph("<b>GET</b>", style_table_cell_bold),
            Paragraph("<code>/api/analytics</code>", style_table_cell),
            Paragraph("Aggregate metrics, hourly distribution histograms, and risk breakdowns.", style_table_cell)
        ],
        [
            Paragraph("<b>POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/start-demo</code>", style_table_cell),
            Paragraph("Launch multi-stage progressive tactical demonstration sequence.", style_table_cell)
        ],
        [
            Paragraph("<b>POST</b>", style_table_cell_bold),
            Paragraph("<code>/api/reset-demo</code>", style_table_cell),
            Paragraph("Flush simulated events and reset state back to clean baseline.", style_table_cell)
        ]
    ]
    t_api = Table(api_data, colWidths=[70, 130, 332])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_NAVY_DARK),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, C_BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    api_sec.append(t_api)
    story.append(KeepTogether(api_sec))
    story.append(Spacer(1, 4))

    # Summary Callout Box
    concl_sec = [
        Paragraph("6. Operational Impact & Conclusion", style_h1),
        Paragraph(
            "<b>DRISHTIX</b> provides a transformative, force-multiplying paradigm shift for border security and critical infrastructure defense. "
            "By fusing autonomous computer vision detection, mathematical geofencing, automatic license plate recognition, 2D radar GIS tracking, "
            "and structured incident response workflows into a single glass cockpit, DRISHTIX drastically reduces threat reaction times "
            "from minutes to seconds while preserving an immutable cryptographic chain of evidence.",
            style_body
        )
    ]
    story.append(KeepTogether(concl_sec))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] High-fidelity PDF report successfully created at: {output_pdf_path}")

if __name__ == '__main__':
    pdf_path = os.path.abspath(r"c:\Users\FALCON JNB\.gemini\antigravity-ide\scratch\drishtix\DRISHTIX_Tab_Wise_Technical_Report.pdf")
    create_drishtix_report(pdf_path)
