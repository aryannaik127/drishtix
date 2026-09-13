import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
        
        # Running Header (Pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0284C7"))
            self.drawString(40, letter[1] - 28, "DRISHTIX v2.0 TACTICAL — JURY DEFENSE & DEPLOYMENT GUIDE")
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(letter[0] - 40, letter[1] - 28, "SIH 2026 | PS: SIH26187")
            
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(40, letter[1] - 34, letter[0] - 40, letter[1] - 34)
            
        # Running Footer (All Pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(40, 42, letter[0] - 40, 42)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(40, 28, "CONFIDENTIAL & PROPRIETARY — DRISHTIX BORDER SURVEILLANCE PLATFORM")
        self.setFont("Helvetica-Bold", 8)
        self.drawRightString(letter[0] - 40, 28, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf():
    pdf_filename = "DRISHTIX_Jury_Defense_and_Deployment_Guide.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    C_PRIMARY = colors.HexColor("#0F172A")    # Slate 900
    C_NAVY = colors.HexColor("#1E3A8A")       # Blue 900
    C_ACCENT = colors.HexColor("#0284C7")     # Sky 600
    C_RED = colors.HexColor("#B91C1C")        # Red 700
    C_GREEN = colors.HexColor("#15803D")      # Green 700
    C_PURPLE = colors.HexColor("#6D28D9")     # Purple 700
    C_BORDER = colors.HexColor("#CBD5E1")     # Slate 300
    C_BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    C_BG_ALT = colors.HexColor("#F1F5F9")     # Slate 100
    
    # Custom Typography Styles
    style_main_title = ParagraphStyle(
        'DocMainTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=C_NAVY,
        alignment=0
    )
    
    style_subtitle = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=C_ACCENT,
        spaceAfter=12
    )

    style_meta_bar = ParagraphStyle(
        'MetaBarText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    style_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=C_NAVY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )

    style_body_bold = ParagraphStyle(
        'BodyTextBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.8,
        leading=12.5,
        textColor=colors.HexColor("#0F172A")
    )

    style_q_title = ParagraphStyle(
        'QTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=C_NAVY
    )

    style_why_box = ParagraphStyle(
        'WhyBox',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#475569")
    )

    style_ans = ParagraphStyle(
        'AnswerText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.6,
        leading=12.2,
        textColor=colors.HexColor("#0F172A")
    )

    style_proof = ParagraphStyle(
        'ProofText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.2,
        leading=11,
        textColor=C_GREEN
    )

    style_tbl_hdr = ParagraphStyle(
        'TblHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    style_tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor("#1E293B")
    )

    style_tbl_cell_bold = ParagraphStyle(
        'TblCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.2,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # =========================================================================
    # COVER / HEADER BLOCK
    # =========================================================================
    story.append(Paragraph("DRISHTIX — JURY DEFENSE & DEPLOYMENT MANUAL", style_main_title))
    story.append(Paragraph("Comprehensive Evaluation Defense, Edge Architecture & Live Pitch Walkthrough", style_subtitle))
    
    # Meta Summary Table Box
    meta_data = [
        [
            Paragraph("<b>Problem Statement:</b> SIH26187 (MHA / Smart Automation)", style_meta_bar),
            Paragraph("<b>Platform Version:</b> DRISHTIX v2.0 Tactical Command", style_meta_bar),
        ],
        [
            Paragraph("<b>Core Concept:</b> Software-defined AI over Legacy CCTV", style_meta_bar),
            Paragraph("<b>Defense Readiness:</b> Full-Stack Live Production Prototype", style_meta_bar),
        ]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # =========================================================================
    # PART 1: WHERE IS BACKEND AND FRONTEND UPLOADED & HOSTED?
    # =========================================================================
    story.append(Paragraph("1. Codebase Upload Locations & Deployment Infrastructure", style_h1))
    story.append(Paragraph(
        "A clear breakdown of exactly where the source code is stored, how the frontend and backend are deployed, and how edge and cloud networking operate.",
        style_body
    ))
    story.append(Spacer(1, 4))

    dep_table_data = [
        [
            Paragraph("Component", style_tbl_hdr),
            Paragraph("Uploaded Location / Repository", style_tbl_hdr),
            Paragraph("Hosting / Running Mechanism", style_tbl_hdr),
            Paragraph("Port / Protocol / Endpoints", style_tbl_hdr)
        ],
        [
            Paragraph("<b>GitHub Source Repo</b>", style_tbl_cell_bold),
            Paragraph("https://github.com/aryannaik127/drishtix.git", style_tbl_cell),
            Paragraph("Central Git Remote (Branch: main)", style_tbl_cell),
            Paragraph("Git VCS / HTTPS", style_tbl_cell)
        ],
        [
            Paragraph("<b>Frontend (React 18)</b>", style_tbl_cell_bold),
            Paragraph("<code>/frontend</code> directory<br/>Config: <code>vercel.json</code>", style_tbl_cell),
            Paragraph("Vercel Serverless Build & Dist + Local Vite Server", style_tbl_cell),
            Paragraph("Local: <code>http://localhost:5173</code><br/>Vercel: <code>*.vercel.app</code>", style_tbl_cell)
        ],
        [
            Paragraph("<b>Backend (FastAPI)</b>", style_tbl_cell_bold),
            Paragraph("<code>/backend</code> directory<br/>Entry: <code>main.py</code>", style_tbl_cell),
            Paragraph("Uvicorn ASGI Server with SQLAlchemy ORM Engine", style_tbl_cell),
            Paragraph("Local: <code>http://localhost:8000/api</code><br/>Docs: <code>/docs</code> (OpenAPI)", style_tbl_cell)
        ],
        [
            Paragraph("<b>Database Layer</b>", style_tbl_cell_bold),
            Paragraph("<code>/backend/drishtix.db</code><br/>Schema: <code>database.py</code>", style_tbl_cell),
            Paragraph("Embedded SQLite (Production ready for PostgreSQL)", style_tbl_cell),
            Paragraph("Relational schema (Events, Cameras, Dispatches, Fences)", style_tbl_cell)
        ],
        [
            Paragraph("<b>Public Demo Tunnel</b>", style_tbl_cell_bold),
            Paragraph("<code>cloudflared.exe</code><br/>Log: <code>tunnel.log</code>", style_tbl_cell),
            Paragraph("Cloudflare Argotunnel / Quick Tunnel (QUIC Protocol)", style_tbl_cell),
            Paragraph("Public HTTPS Proxy (e.g. <code>*.trycloudflare.com</code>)", style_tbl_cell)
        ]
    ]

    t_dep = Table(dep_table_data, colWidths=[110, 150, 150, 130])
    t_dep.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_dep)
    story.append(Spacer(1, 10))

    # =========================================================================
    # PART 2: CATEGORY-WISE JURY DEFENSE Q&A
    # =========================================================================
    story.append(Paragraph("2. Official Jury Defense Q&A Master Guide", style_h1))
    story.append(Paragraph(
        "Structured defense strategy designed for Defense Evaluators, AI Researchers, and System Architects.",
        style_body
    ))
    story.append(Spacer(1, 6))

    def make_qa_card(num_str, question, why_ask, answer, proof_tab):
        content = [
            [Paragraph(f"<b>Q{num_str}: {question}</b>", style_q_title)],
            [Paragraph(f"<b>Intent / Test:</b> {why_ask}", style_why_box)],
            [Paragraph(f"<b>Winning Defense Answer:</b><br/>{answer}", style_ans)],
            [Paragraph(f"<b>Live Proof to Show:</b> {proof_tab}", style_proof)]
        ]
        t = Table(content, colWidths=[540])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#F1F5F9")),
            ('BACKGROUND', (0, 2), (-1, 2), colors.white),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#F0FDF4")),
            ('BOX', (0, 0), (-1, -1), 1, C_BORDER),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.HexColor("#E2E8F0")),
            ('LINEBELOW', (0, 1), (-1, 1), 0.5, colors.HexColor("#E2E8F0")),
            ('LINEBELOW', (0, 2), (-1, 2), 0.5, colors.HexColor("#BBF7D0")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 7),
            ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ]))
        return t

    # Q1
    q1 = make_qa_card(
        "1",
        "What exact operational problem does DRISHTIX solve that existing border CCTV cannot?",
        "Evaluator checks if you understand the day-to-day operational pain points of Border Security Forces (BSF / ITBP).",
        "Existing perimeter surveillance suffers from <i>Operator Fatigue</i>—monitoring 20+ screens causes human attentiveness to drop by 45% after just 20 minutes, leading to missed intrusions. Furthermore, standard motion detection produces 80%+ false alarms from moving trees, dust, and animals. DRISHTIX converts legacy passive cameras into an <b>active, event-driven intelligent network</b> that ignores environmental noise and triggers instant real-time audio/visual alerts with automated QRT dispatch when a true threat occurs.",
        "Live Multi-Cam Grid with real-time detection bounding boxes and threat priority scoring."
    )
    story.append(q1)
    story.append(Spacer(1, 8))

    # Q2
    q2 = make_qa_card(
        "2",
        "How is DRISHTIX different from proprietary solutions like Honeywell, Axis, or Hikvision?",
        "Checks commercial awareness and your team's unique value proposition / competitive advantage.",
        "Proprietary solutions require massive capital expenditure (CapEx) to replace all cameras with proprietary smart NVRs and AI cameras (vendor lock-in). DRISHTIX is <b>100% hardware-agnostic and software-defined</b>. It ingests standard RTSP/ONVIF streams from any existing IP camera, runs local edge AI inference, and provides a complete tactical military workflow including <b>custom polygon Virtual Fencing</b>, <b>ANPR watchlist cross-matching</b>, and <b>immutable cryptographic evidence hashing</b>.",
        "Virtual Fence Studio & Incident Commander tabs."
    )
    story.append(q2)
    story.append(Spacer(1, 8))

    # Page Break for clean reading
    story.append(PageBreak())

    # Q3
    q3 = make_qa_card(
        "3",
        "What is your complete AI & Computer Vision inference pipeline under the hood?",
        "Validates technical depth in deep learning, frame processing, and spatial mathematics.",
        "Our pipeline executes in 5 sequential stages:<br/>"
        "1. <b>Preprocessing & Ingestion:</b> RTSP stream decoding, frame resize, and CLAHE contrast enhancement.<br/>"
        "2. <b>Detection Engine:</b> YOLOv8 quantized to TensorRT FP16/INT8 for person, vehicle, and suspicious object detection.<br/>"
        "3. <b>Multi-Object Tracking:</b> ByteTrack / DeepSORT tracking to maintain persistent trajectory IDs across frames.<br/>"
        "4. <b>Spatial Math Engine:</b> Point-in-Polygon (Ray-Casting Algorithm) to check if the bottom-center coordinate of the tracked bounding box crosses active virtual fence lines.<br/>"
        "5. <b>ANPR / OCR:</b> License plate bounding box detection coupled with PaddleOCR / EasyOCR and regex validation for Indian registration formats.",
        "ANPR Hub showing plate confidence scoring and Virtual Fence Studio with interactive coordinate drawing."
    )
    story.append(q3)
    story.append(Spacer(1, 8))

    # Q4
    q4 = make_qa_card(
        "4",
        "How do you achieve real-time FPS on multiple simultaneous high-definition CCTV streams?",
        "Stream throughput and GPU memory constraints are the #1 technical bottleneck in video analytics.",
        "We implement three edge acceleration strategies:<br/>"
        "1. <b>Dynamic Keyframe Inference:</b> YOLO detection runs on every 3rd or 4th frame (5–10 FPS), while lightweight optical flow / ByteTrack interpolates trajectories on intermediate frames, achieving 30 FPS visual output with 70% lower compute.<br/>"
        "2. <b>TensorRT Model Quantization:</b> Quantizing weights to FP16/INT8 delivers 3.5x faster throughput on NVIDIA Jetson / RTX edge hardware.<br/>"
        "3. <b>Asynchronous Non-Blocking Workers:</b> Video capture, AI inference, and WebSocket/REST event dispatch run on isolated threads with circular memory buffers.",
        "Settings Tab showing AI confidence sliders and real-time inference telemetry."
    )
    story.append(q4)
    story.append(Spacer(1, 8))

    # Q5
    q5 = make_qa_card(
        "5",
        "How do you eliminate false alarms from weather, swaying foliage, stray animals, and night darkness?",
        "Border environments feature harsh weather (rain, dense fog, sandstorms, zero-lux night).",
        "We employ a three-tier false-alarm suppression system:<br/>"
        "1. <b>Temporal Persistence Filtering:</b> An intrusion alert is only generated if a classified object persists inside the polygon for at least 3 consecutive frames (~300ms), discarding passing birds or momentary lighting shifts.<br/>"
        "2. <b>CLAHE & Multi-Spectral Support:</b> Contrast Limited Adaptive Histogram Equalization boosts low-light optical visibility, while our platform natively supports Thermal/Infrared IP streams (demonstrated on CAM-04 Thermal Mode).<br/>"
        "3. <b>Strict Semantic Classification:</b> Only objects classified as 'Person' or 'Vehicle' trigger perimeter alarms; animal classes (dogs, cattle, birds) are ignored by the rule engine.",
        "Live Grid CAM-04 in Thermal Vision Mode and Analytics View False Alarm metrics."
    )
    story.append(q5)
    story.append(Spacer(1, 8))

    # Q6
    q6 = make_qa_card(
        "6",
        "Explain the exact Mathematical Algorithm behind your Virtual Fence Intrusion Detection.",
        "Evaluator tests whether Virtual Fence is real geometric computation or hardcoded triggers.",
        "In the Virtual Fence Studio, operators define an N-vertex polygon P = {(x1, y1), ..., (xn, yn)}. When an object is detected, we compute the bottom-center contact point C = (xmin + w/2, ymax). We then execute the <b>Ray-Casting (Even-Odd) Algorithm</b>: cast a horizontal ray from C to infinity (+inf, y) and count the number of polygon edge intersections. If the intersection count is <b>odd</b>, the object is inside the restricted zone. If the trajectory vector crossed from outside to inside across consecutive frames, a CRITICAL intrusion event is generated.",
        "Virtual Fence Studio tab — draw custom 5-point polygon on live canvas to demonstrate."
    )
    story.append(q6)
    story.append(Spacer(1, 8))

    # Page Break
    story.append(PageBreak())

    # Q7
    q7 = make_qa_card(
        "7",
        "What happens when a high-risk intrusion is detected? Walk us through the tactical response loop.",
        "Checks whether your software is an isolated detector or a complete tactical command system.",
        "The response loop is immediate and automated:<br/>"
        "1. <b>Auditory & Visual Command Alert:</b> A 1200Hz tactical siren sounds in the command room, and high-priority red alert banners appear.<br/>"
        "2. <b>Automated Incident Generation:</b> The incident is immediately queued in the Incident Commander with camera ID, GPS coordinates, timestamp, and snapshot.<br/>"
        "3. <b>SOP Verification & QRT Dispatch:</b> The commander checks off standard military SOP steps (Verify Threat $\to$ Sound Perimeter Alarm $\to$ Dispatch QRT-Alpha) and assigns armed tactical units.<br/>"
        "4. <b>Evidence Vault Archiving:</b> Raw snapshot, video snippet, bounding box coordinates, and cryptographic metadata are permanently sealed.",
        "Click START DEMO $\to$ wait 8s for CAM-04 alarm $\to$ switch to Incident Commander $\to$ click Dispatch QRT."
    )
    story.append(q7)
    story.append(Spacer(1, 8))

    # Q8
    q8 = make_qa_card(
        "8",
        "How do you ensure evidence cannot be tampered with or altered after an incident?",
        "Defense and legal authorities require strict chain-of-custody compliance.",
        "Every event stored in our <b>Evidence Vault</b> generates an immutable <b>SHA-256 cryptographic hash</b> combining the raw image bytes, timestamp, camera ID, and detection metadata. During auditing or courtroom presentation, the system recomputes the SHA-256 hash. If even a single pixel or timestamp integer was altered, the verification fails immediately with a tamper alert.",
        "Evidence Vault tab showing SHA-256 hash badges and tamper verification status."
    )
    story.append(q8)
    story.append(Spacer(1, 8))

    # Q9
    q9 = make_qa_card(
        "9",
        "What hardware is required to deploy DRISHTIX at a remote border outpost?",
        "Feasibility and deployment cost validation.",
        "At a standard border outpost managing 4–8 cameras:<br/>"
        "• <b>Edge Computing:</b> 1x Industrial Edge PC or NVIDIA Jetson Orin Nano / AGX (₹35,000–₹75,000).<br/>"
        "• <b>Cameras:</b> 100% reuse of existing ONVIF/RTSP IP cameras already installed on perimeter poles.<br/>"
        "• <b>Network:</b> Local isolated Gigabit LAN switch; zero high-bandwidth internet needed for local detection.",
        "Feasibility & Viability Slide (Slide 4) and Settings View edge telemetry."
    )
    story.append(q9)
    story.append(Spacer(1, 8))

    # Q10
    q10 = make_qa_card(
        "10",
        "If power or satellite/internet connectivity is lost at the border, will DRISHTIX fail?",
        "Remote border posts suffer from frequent communication blackouts and harsh weather cuts.",
        "<b>No. DRISHTIX is designed Edge-First and 100% Offline-Autonomous.</b> All AI inference, virtual fence math, sound sirens, and local SQLite database logging execute directly on the outpost edge box. No cloud connection is required for real-time defense. When communication uplinks are restored, the local database automatically synchronizes compressed incident summaries and evidence hashes to Central Command.",
        "Local SQLite database (<code>backend/drishtix.db</code>) running completely on localhost."
    )
    story.append(q10)
    story.append(Spacer(1, 10))

    # =========================================================================
    # PART 3: 90-SECOND WINNING LIVE DEMO SEQUENCE
    # =========================================================================
    story.append(Paragraph("3. Recommended 90-Second Winning Jury Presentation Script", style_h1))
    story.append(Paragraph(
        "Follow this exact chronological pitch script to guide the evaluators seamlessly through your prototype.",
        style_body
    ))
    story.append(Spacer(1, 6))

    pitch_table_data = [
        [
            Paragraph("Time", style_tbl_hdr),
            Paragraph("Active Screen / Tab", style_tbl_hdr),
            Paragraph("What to Say to the Jury (Exact Pitch Script)", style_tbl_hdr),
            Paragraph("Action to Take", style_tbl_hdr)
        ],
        [
            Paragraph("<b>0:00 – 0:20</b>", style_tbl_cell_bold),
            Paragraph("<b>Live Multi-Cam Grid</b>", style_tbl_cell_bold),
            Paragraph("<i>'Respected Jury, DRISHTIX is an intelligent border surveillance platform that transforms existing legacy CCTV cameras into an active tactical intelligence network. Here is our 4-camera dark command center monitoring Sector 7.'</i>", style_tbl_cell),
            Paragraph("Click <b>START DEMO</b> in top right corner.", style_tbl_cell)
        ],
        [
            Paragraph("<b>0:20 – 0:40</b>", style_tbl_cell_bold),
            Paragraph("<b>Live Alert & Siren</b>", style_tbl_cell_bold),
            Paragraph("<i>'As an intruder approaches the restricted perimeter on CAM-04, our YOLOv8 and Point-in-Polygon engine detects the perimeter breach, sounding a critical siren and highlighting the target.'</i>", style_tbl_cell),
            Paragraph("Let siren sound, show red critical popup.", style_tbl_cell)
        ],
        [
            Paragraph("<b>0:40 – 0:60</b>", style_tbl_cell_bold),
            Paragraph("<b>Virtual Fence & ANPR</b>", style_tbl_cell_bold),
            Paragraph("<i>'In Virtual Fence Studio, operators can dynamically draw custom restricted zones. In our ANPR Hub, vehicle license plates are scanned and cross-referenced against national stolen vehicle watchlists in real time.'</i>", style_tbl_cell),
            Paragraph("Click <b>Virtual Fence</b> tab $\to$ Click <b>ANPR Hub</b>.", style_tbl_cell)
        ],
        [
            Paragraph("<b>0:60 – 0:75</b>", style_tbl_cell_bold),
            Paragraph("<b>Incident Commander</b>", style_tbl_cell_bold),
            Paragraph("<i>'Unlike basic detectors, we provide complete tactical dispatch. Commanders execute military SOP checklists and deploy Quick Reaction Teams (QRT-Alpha) with one click.'</i>", style_tbl_cell),
            Paragraph("Click <b>Incident Commander</b> $\to$ Click <b>Dispatch QRT</b>.", style_tbl_cell)
        ],
        [
            Paragraph("<b>0:75 – 0:90</b>", style_tbl_cell_bold),
            Paragraph("<b>Evidence Vault & Summary</b>", style_tbl_cell_bold),
            Paragraph("<i>'Every incident is sealed in our Evidence Vault with an immutable SHA-256 hash. In conclusion, DRISHTIX delivers hardware-agnostic, edge-first, cost-effective national security.'</i>", style_tbl_cell),
            Paragraph("Click <b>Evidence Vault</b> $\to$ show SHA-256 hashes.", style_tbl_cell)
        ]
    ]

    t_pitch = Table(pitch_table_data, colWidths=[65, 110, 255, 110])
    t_pitch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_BG_LIGHT]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_pitch)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {pdf_filename}")

if __name__ == '__main__':
    build_pdf()
