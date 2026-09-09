import os
import subprocess
import wave
import math
import cv2
import numpy as np

SCENES = [
    {
        "id": "scene1",
        "title_tab": "PROJECT OVERVIEW",
        "subtext": "AI-POWERED BORDER SURVEILLANCE",
        "footer": "Project DRISHTIX converts passive CCTV streams into an automated, event-driven detection pipeline.",
        "text": "Welcome to Project DRISHTIX, an intelligent border surveillance and tactical command center platform. DRISHTIX converts passive CCTV streams into an automated, event-driven detection pipeline."
    },
    {
        "id": "scene2",
        "title_tab": "LIVE MULTI-CAM GRID",
        "subtext": "REAL-TIME EDGE AI INFERENCE",
        "footer": "Simultaneous 4-camera inference at 30 FPS with YOLOv8 object classification and ByteTrack IDs.",
        "text": "The Live Grid module processes four simultaneous camera feeds at thirty frames per second. Powered by YOLOv8 and ByteTrack edge AI, it classifies persons, vehicles, and drones with real-time confidence scores and track identification."
    },
    {
        "id": "scene3",
        "title_tab": "VIRTUAL FENCE PERIMETER",
        "subtext": "TRIPWIRE BREACH DETECTION",
        "footer": "Polygon geofences trigger instant alerts when vectors cross restricted coordinates without false positives.",
        "text": "Our Virtual Fence subsystem allows tactical operators to define customizable polygon tripwires. When an unauthorized vector crosses the virtual perimeter, the system instantly triggers high-priority audio-visual strobe alarms and logs the intrusion."
    },
    {
        "id": "scene4",
        "title_tab": "ANPR INTELLIGENCE HUB",
        "subtext": "AUTOMATED NUMBER PLATE RECOGNITION",
        "footer": "High-accuracy OCR reads license plates and instantly cross-checks with National Hotlist / Stolen DB.",
        "text": "The Automated Number Plate Recognition Hub scans vehicle registration plates in real time. It achieves over ninety-eight percent OCR confidence and immediately cross-references detected plates against the National Stolen Vehicle and Wanted Watchlist."
    },
    {
        "id": "scene5",
        "title_tab": "TACTICAL GIS SENSOR MAP",
        "subtext": "GEOSPATIAL ASSET TRACKING",
        "footer": "Interactive GIS radar map overlays live camera FOV cones, drone tracks, and intruder coordinates.",
        "text": "The Tactical Sensor Map fuses GPS telemetry, continuous three-sixty radar sweeps, and live camera field-of-view cones to provide real-time situational awareness and track hostile movement across border sectors."
    },
    {
        "id": "scene6",
        "title_tab": "FORENSIC EVIDENCE VAULT",
        "subtext": "CRYPTOGRAPHIC AUDIT TRAIL",
        "footer": "All incident video clips and bounding logs are cryptographically sealed with SHA-256 hashes.",
        "text": "Every detected breach, snapshot, and video clip is cryptographically hashed with SHA-256 in the Evidence Vault. This guarantees a tamper-proof chain of custody suitable for forensic investigation and official audit."
    },
    {
        "id": "scene7",
        "title_tab": "INCIDENT DISPATCH & SOP",
        "subtext": "QUICK REACTION TEAM WORKFLOW",
        "footer": "Instant one-click QRT deployment with automated Standard Operating Procedure tracking.",
        "text": "When an emergency is validated, commanders can dispatch Quick Reaction Teams with a single click. The platform automatically tracks and enforces Standard Operating Procedure checklists in real time."
    },
    {
        "id": "scene8",
        "title_tab": "TACTICAL THREAT ANALYTICS",
        "subtext": "DETECTION METRICS & HEATMAPS",
        "footer": "Real-time analytics monitor threat levels, sensor uptime, and hourly breach patterns.",
        "text": "The Analytics dashboard visualizes hourly threat distributions, classification accuracy, and security metrics, eliminating false alarms and operator fatigue."
    },
    {
        "id": "scene9",
        "title_tab": "COMMAND CENTER DEPLOYMENT",
        "subtext": "SYSTEM ARCHITECTURE READY",
        "footer": "Zero-latency tactical surveillance, intelligent automation, and complete perimeter defense.",
        "text": "DRISHTIX delivers zero-latency tactical surveillance, intelligent automation, and complete perimeter defense. Experience the live interactive dashboard now at localhost port 5173."
    }
]

def get_audio_duration_seconds(wav_path):
    with wave.open(wav_path, 'rb') as w:
        frames = w.getnframes()
        rate = w.getframerate()
        return frames / float(rate)

def concatenate_wavs(wav_paths, output_wav="master_narration.wav"):
    data = []
    params = None
    for p in wav_paths:
        with wave.open(p, 'rb') as w:
            if params is None:
                params = w.getparams()
            data.append(w.readframes(w.getnframes()))
            # 0.5s pause between scenes
            silence_frames = int(w.getframerate() * 0.5)
            data.append(b'\x00' * (silence_frames * w.getnchannels() * w.getsampwidth()))
            
    with wave.open(output_wav, 'wb') as out_w:
        out_w.setparams(params)
        for chunk in data:
            out_w.writeframes(chunk)
            
    print(f"Master audio track compiled at: {output_wav}")
    return output_wav

def main():
    print("Step 1: Checking and compiling Master Audio Narration...")
    wav_files = [f"audio_clips/{s['id']}.wav" for s in SCENES]
    master_wav = concatenate_wavs(wav_files, "master_narration.wav")
    
    fps = 30
    scene_durations = []
    for p in wav_files:
        dur = get_audio_duration_seconds(p) + 0.5
        scene_durations.append(dur)
        
    total_dur = sum(scene_durations)
    print("Scene Durations (seconds):", [round(d, 2) for d in scene_durations])
    print(f"Total Video & Audio Duration: {total_dur:.1f}s")
    
    width, height = 1920, 1080
    raw_video_path = "raw_demo_visuals.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(raw_video_path, fourcc, fps, (width, height))
    
    # Tactical color palette
    C_BG = (13, 17, 23)
    C_CARD = (22, 27, 34)
    C_BORDER = (48, 54, 61)
    C_CYAN = (235, 206, 56)
    C_GREEN = (90, 215, 63)
    C_RED = (70, 70, 235)
    C_AMBER = (40, 165, 245)
    C_WHITE = (240, 246, 252)
    C_GRAY = (139, 148, 158)
    C_BLUE = (225, 140, 50)
    
    def draw_tactical_header(frame, title_tab="COMMAND DASHBOARD", subtext="AI-POWERED MULTI-CAM PIPELINE"):
        cv2.rectangle(frame, (0, 0), (width, 70), (18, 22, 28), -1)
        cv2.line(frame, (0, 70), (width, 70), (56, 189, 248), 2)
        cv2.putText(frame, "DRISHTIX", (30, 46), cv2.FONT_HERSHEY_DUPLEX, 1.1, C_CYAN, 2, cv2.LINE_AA)
        cv2.putText(frame, "v2.0 TACTICAL", (190, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.45, C_GREEN, 1, cv2.LINE_AA)
        cv2.putText(frame, "BORDER COMMAND SYSTEM", (190, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.4, C_GRAY, 1, cv2.LINE_AA)
        tab_box_w = 420
        tab_x = (width - tab_box_w) // 2
        cv2.rectangle(frame, (tab_x, 15), (tab_x + tab_box_w, 55), (28, 35, 45), -1)
        cv2.rectangle(frame, (tab_x, 15), (tab_x + tab_box_w, 55), C_CYAN, 1)
        cv2.putText(frame, f"MODULE: {title_tab}", (tab_x + 20, 42), cv2.FONT_HERSHEY_DUPLEX, 0.65, C_WHITE, 1, cv2.LINE_AA)
        cv2.circle(frame, (width - 320, 40), 6, C_GREEN, -1)
        cv2.putText(frame, "EDGE NODES: 4/4 ACTIVE", (width - 305, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_WHITE, 1, cv2.LINE_AA)
        cv2.putText(frame, "VOICE NARRATION: ON", (width - 160, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.45, C_GREEN, 1, cv2.LINE_AA)

    def draw_footer_banner(frame, explanation_text):
        cv2.rectangle(frame, (0, height - 60), (width, height), (15, 18, 24), -1)
        cv2.line(frame, (0, height - 60), (width, height - 60), C_BORDER, 1)
        cv2.rectangle(frame, (30, height - 48), (140, height - 16), (40, 50, 65), -1)
        cv2.putText(frame, "FEATURE", (45, height - 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, explanation_text, (160, height - 26), cv2.FONT_HERSHEY_DUPLEX, 0.65, C_WHITE, 1, cv2.LINE_AA)

    def add_scanlines(frame):
        for y in range(0, height, 4):
            frame[y:y+1, :, :] = (frame[y:y+1, :, :].astype(np.float32) * 0.92).astype(np.uint8)

    print("Step 2: Rendering High-Definition Synchronized Video...")

    # Scene 1: Intro
    f_count = int(scene_durations[0] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        for x in range(0, width, 60):
            cv2.line(frame, (x, 0), (x, height), (18, 24, 32), 1)
        for y in range(0, height, 60):
            cv2.line(frame, (0, y), (width, y), (18, 24, 32), 1)
        progress = f / float(f_count)
        center_x, center_y = width // 2, height // 2 - 40
        radius = int(140 + 10 * math.sin(f * 0.1))
        cv2.circle(frame, (center_x, center_y), radius, (30, 40, 55), 2)
        cv2.circle(frame, (center_x, center_y), radius - 20, (20, 30, 45), 1)
        angle = f * 0.08
        end_x = int(center_x + radius * math.cos(angle))
        end_y = int(center_y + radius * math.sin(angle))
        cv2.line(frame, (center_x, center_y), (end_x, end_y), C_CYAN, 2)
        cv2.putText(frame, "PROJECT DRISHTIX", (center_x - 340, center_y - 180), cv2.FONT_HERSHEY_DUPLEX, 1.8, C_CYAN, 3, cv2.LINE_AA)
        cv2.putText(frame, "AI-Powered Border Surveillance & Tactical Command Center", (center_x - 490, center_y - 130), cv2.FONT_HERSHEY_DUPLEX, 0.9, C_WHITE, 1, cv2.LINE_AA)
        pills = ["⚡ 4-Cam YOLOv8 Tracking", "🛡️ Virtual Fence Geobreach", "🚗 ANPR Hotlist Radar", "🔒 SHA-256 Evidence Vault", "🚨 Automated QRT SOP"]
        pill_y = center_y + 160
        total_w = len(pills) * 260
        start_x = (width - total_w) // 2
        for i, p in enumerate(pills):
            px = start_x + i * 260
            cv2.rectangle(frame, (px, pill_y), (px + 240, pill_y + 45), C_CARD, -1)
            cv2.rectangle(frame, (px, pill_y), (px + 240, pill_y + 45), C_CYAN if (f // 20) % len(pills) == i else C_BORDER, 1)
            cv2.putText(frame, p, (px + 12, pill_y + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.48, C_WHITE, 1, cv2.LINE_AA)
        cv2.putText(frame, "PROTOTYPE DEMONSTRATION & SYSTEM CAPABILITIES", (center_x - 300, height - 120), cv2.FONT_HERSHEY_DUPLEX, 0.7, C_AMBER, 1, cv2.LINE_AA)
        bar_w = 600
        bar_x = (width - bar_w) // 2
        cv2.rectangle(frame, (bar_x, height - 80), (bar_x + bar_w, height - 70), (30, 35, 45), -1)
        cv2.rectangle(frame, (bar_x, height - 80), (bar_x + int(bar_w * progress), height - 70), C_CYAN, -1)
        add_scanlines(frame)
        out.write(frame)

    # Scene 2: Live Multi-Cam
    cams = [
        {"name": "CAM-01: NORTH PERIMETER (THERMAL)", "box": (120, 100, 320, 240), "label": "PERSON [94.2%]", "id": "#TRK-104", "color": C_CYAN},
        {"name": "CAM-02: EAST CHECKPOINT ROAD", "box": (160, 140, 480, 260), "label": "VEHICLE: SUV [91.8%]", "id": "#TRK-88", "color": C_GREEN},
        {"name": "CAM-03: WEST RAVINE PATROL", "box": (200, 80, 360, 220), "label": "UNMANNED DRONE [88.5%]", "id": "#TRK-112", "color": C_AMBER},
        {"name": "CAM-04: MAIN BUNKER ACCESS", "box": (140, 120, 380, 280), "label": "PERSON [96.1%]", "id": "#TRK-109", "color": C_CYAN}
    ]
    f_count = int(scene_durations[1] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "LIVE MULTI-CAM GRID", "REAL-TIME EDGE AI INFERENCE")
        draw_footer_banner(frame, SCENES[1]["footer"])
        grid_w = (width - 80) // 2
        grid_h = (height - 180) // 2
        for idx, cam in enumerate(cams):
            row, col = idx // 2, idx % 2
            gx = 30 + col * (grid_w + 20)
            gy = 90 + row * (grid_h + 15)
            cv2.rectangle(frame, (gx, gy), (gx + grid_w, gy + grid_h), (18, 24, 30), -1)
            cv2.rectangle(frame, (gx, gy), (gx + grid_w, gy + grid_h), C_BORDER, 1)
            cv2.rectangle(frame, (gx + 10, gy + 35), (gx + grid_w - 10, gy + grid_h - 10), (10, 14, 18), -1)
            shift_x = int(30 * math.sin((f + idx * 40) * 0.05))
            shift_y = int(15 * math.cos((f + idx * 40) * 0.05))
            bx1, by1 = gx + cam["box"][0] + shift_x, gy + cam["box"][1] + shift_y
            bx2, by2 = gx + cam["box"][2] + shift_x, gy + cam["box"][3] + shift_y
            cv2.rectangle(frame, (bx1, by1), (bx2, by2), cam["color"], 2)
            cl = 15
            cv2.line(frame, (bx1, by1), (bx1 + cl, by1), cam["color"], 3)
            cv2.line(frame, (bx1, by1), (bx1, by1 + cl), cam["color"], 3)
            cv2.line(frame, (bx2, by2), (bx2 - cl, by2), cam["color"], 3)
            cv2.line(frame, (bx2, by2), (bx2, by2 - cl), cam["color"], 3)
            cv2.rectangle(frame, (bx1, by1 - 25), (bx1 + 220, by1), cam["color"], -1)
            cv2.putText(frame, f"{cam['label']} {cam['id']}", (bx1 + 6, by1 - 7), cv2.FONT_HERSHEY_DUPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)
            cv2.putText(frame, cam["name"], (gx + 15, gy + 24), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_WHITE, 1, cv2.LINE_AA)
            cv2.circle(frame, (gx + grid_w - 90, gy + 20), 5, (0, 0, 255) if (f // 15) % 2 == 0 else (0, 0, 100), -1)
            cv2.putText(frame, "REC", (gx + grid_w - 75, gy + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.45, C_RED, 1, cv2.LINE_AA)
            cv2.putText(frame, "30 FPS", (gx + grid_w - 35, gy + 24), cv2.FONT_HERSHEY_SIMPLEX, 0.4, C_GRAY, 1, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    # Scene 3: Virtual Fence
    f_count = int(scene_durations[2] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "VIRTUAL FENCE PERIMETER", "TRIPWIRE BREACH DETECTION")
        draw_footer_banner(frame, SCENES[2]["footer"])
        left_w = 1180
        cv2.rectangle(frame, (30, 90), (30 + left_w, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (30, 90), (30 + left_w, height - 80), C_BORDER, 1)
        cv2.rectangle(frame, (45, 110), (30 + left_w - 15, height - 95), (10, 14, 18), -1)
        is_alarm = f > 25
        line_color = C_RED if is_alarm and (f // 8) % 2 == 0 else C_AMBER
        pts = np.array([[120, 480], [450, 360], [800, 400], [1120, 680]], np.int32)
        cv2.polylines(frame, [pts], False, line_color, 4, cv2.LINE_AA)
        for pt in pts:
            cv2.circle(frame, tuple(pt), 7, line_color, -1)
            cv2.circle(frame, tuple(pt), 14, line_color, 1)
        progress_x = min(600, 200 + f * 2)
        progress_y = min(420, 260 + int(f * 0.8))
        cv2.rectangle(frame, (progress_x, progress_y), (progress_x + 90, progress_y + 200), C_RED if is_alarm else C_CYAN, 2)
        cv2.putText(frame, "INTRUDER #TRK-104", (progress_x, progress_y - 10), cv2.FONT_HERSHEY_DUPLEX, 0.5, C_RED if is_alarm else C_CYAN, 1)
        rx = 30 + left_w + 20
        rw = width - rx - 30
        cv2.rectangle(frame, (rx, 90), (rx + rw, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (rx, 90), (rx + rw, height - 80), C_BORDER, 1)
        cv2.putText(frame, "PERIMETER ZONES", (rx + 20, 130), cv2.FONT_HERSHEY_DUPLEX, 0.7, C_WHITE, 1, cv2.LINE_AA)
        zones = [
            ("ZONE-A1 (NORTH RIDGE)", "ACTIVE - SECURE", C_GREEN),
            ("ZONE-B2 (PERIMETER FENCE)", "CRITICAL BREACH" if is_alarm else "ACTIVE - SECURE", C_RED if is_alarm else C_GREEN),
            ("ZONE-C3 (BUNKER ROAD)", "ACTIVE - SECURE", C_GREEN),
            ("ZONE-D4 (RIVERBED SENSOR)", "ACTIVE - SECURE", C_GREEN),
        ]
        for i, (zn, zst, zcol) in enumerate(zones):
            zy = 160 + i * 85
            cv2.rectangle(frame, (rx + 15, zy), (rx + rw - 15, zy + 70), (16, 20, 26), -1)
            cv2.rectangle(frame, (rx + 15, zy), (rx + rw - 15, zy + 70), zcol, 1)
            cv2.putText(frame, zn, (rx + 25, zy + 30), cv2.FONT_HERSHEY_DUPLEX, 0.52, C_WHITE, 1, cv2.LINE_AA)
            cv2.putText(frame, zst, (rx + 25, zy + 54), cv2.FONT_HERSHEY_SIMPLEX, 0.48, zcol, 1, cv2.LINE_AA)
        if is_alarm:
            banner_col = (0, 0, 180) if (f // 10) % 2 == 0 else (0, 0, 240)
            cv2.rectangle(frame, (width // 2 - 350, 15), (width // 2 + 350, 65), banner_col, -1)
            cv2.rectangle(frame, (width // 2 - 350, 15), (width // 2 + 350, 65), C_WHITE, 2)
            cv2.putText(frame, "⚠️ CRITICAL: VIRTUAL FENCE INTRUSION DETECTED", (width // 2 - 320, 48), cv2.FONT_HERSHEY_DUPLEX, 0.68, C_WHITE, 2, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    # Scene 4: ANPR
    f_count = int(scene_durations[3] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "ANPR INTELLIGENCE HUB", "AUTOMATED NUMBER PLATE RECOGNITION")
        draw_footer_banner(frame, SCENES[3]["footer"])
        cv2.rectangle(frame, (30, 90), (960, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (30, 90), (960, height - 80), C_BORDER, 1)
        cv2.putText(frame, "CAM-02: CHECKPOINT ANPR SCANNER", (50, 130), cv2.FONT_HERSHEY_DUPLEX, 0.65, C_WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (60, 160), (930, 680), (12, 16, 22), -1)
        cv2.rectangle(frame, (200, 260), (800, 620), C_AMBER, 2)
        cv2.putText(frame, "VEHICLE: MAHINDRA SCORPIO (BLACK)", (200, 245), cv2.FONT_HERSHEY_DUPLEX, 0.5, C_AMBER, 1)
        cv2.rectangle(frame, (360, 480), (640, 560), (255, 255, 255), -1)
        cv2.rectangle(frame, (360, 480), (640, 560), C_RED, 3)
        cv2.putText(frame, "DL 01 AB 9921", (385, 535), cv2.FONT_HERSHEY_DUPLEX, 0.95, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.rectangle(frame, (60, 710), (450, 770), (20, 26, 35), -1)
        cv2.putText(frame, "OCR CONFIDENCE: 98.4%", (80, 745), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_GREEN, 1, cv2.LINE_AA)
        rx = 990
        rw = width - rx - 30
        cv2.rectangle(frame, (rx, 90), (rx + rw, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (rx, 90), (rx + rw, height - 80), C_BORDER, 1)
        cv2.rectangle(frame, (rx + 20, 120), (rx + rw - 20, 230), (20, 20, 60), -1)
        cv2.rectangle(frame, (rx + 20, 120), (rx + rw - 20, 230), C_RED, 2)
        cv2.putText(frame, "🚨 HOTLIST WATCHLIST MATCH!", (rx + 40, 160), cv2.FONT_HERSHEY_DUPLEX, 0.8, C_RED, 2, cv2.LINE_AA)
        cv2.putText(frame, "FLAG: STOLEN / SUSPECT ARMED ESCAPE", (rx + 40, 195), cv2.FONT_HERSHEY_SIMPLEX, 0.55, C_WHITE, 1, cv2.LINE_AA)
        meta = [
            ("PLATE NUMBER", "DL 01 AB 9921"),
            ("OWNER REGISTRATION", "SUSPECT - R. SHARMA"),
            ("FIR STATUS", "WANTED - FIR #2026/881"),
            ("FIRST DETECTED", "11:20:14 IST"),
            ("ACTION REQUIRED", "INTERCEPT & LOCK CHECKPOINT")
        ]
        for i, (k, v) in enumerate(meta):
            my = 260 + i * 55
            cv2.line(frame, (rx + 20, my + 45), (rx + rw - 20, my + 45), C_BORDER, 1)
            cv2.putText(frame, k, (rx + 30, my + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_GRAY, 1, cv2.LINE_AA)
            cv2.putText(frame, v, (rx + 260, my + 30), cv2.FONT_HERSHEY_DUPLEX, 0.52, C_WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (rx + 30, 580), (rx + 380, 640), (140, 20, 20), -1)
        cv2.putText(frame, "LOCKDOWN GATE-2", (rx + 80, 618), cv2.FONT_HERSHEY_DUPLEX, 0.6, C_WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (rx + 410, 580), (rx + rw - 30, 640), (20, 80, 140), -1)
        cv2.putText(frame, "DISPATCH QRT", (rx + 470, 618), cv2.FONT_HERSHEY_DUPLEX, 0.6, C_WHITE, 1, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    # Scene 5: Tactical Map
    f_count = int(scene_durations[4] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "TACTICAL GIS SENSOR MAP", "GEOSPATIAL ASSET TRACKING")
        draw_footer_banner(frame, SCENES[4]["footer"])
        cv2.rectangle(frame, (30, 90), (width - 30, height - 80), (12, 17, 24), -1)
        cv2.rectangle(frame, (30, 90), (width - 30, height - 80), C_BORDER, 1)
        for x in range(30, width - 30, 120):
            cv2.line(frame, (x, 90), (x, height - 80), (22, 30, 42), 1)
        for y in range(90, height - 80, 120):
            cv2.line(frame, (30, y), (width - 30, y), (22, 30, 42), 1)
        radar_cx, radar_cy = width // 2 - 100, height // 2
        for r in [120, 240, 360, 480]:
            cv2.circle(frame, (radar_cx, radar_cy), r, (30, 45, 60), 1)
        sweep_angle = f * 0.06
        rx_end = int(radar_cx + 480 * math.cos(sweep_angle))
        ry_end = int(radar_cy + 480 * math.sin(sweep_angle))
        cv2.line(frame, (radar_cx, radar_cy), (rx_end, ry_end), C_CYAN, 2)
        nodes = [
            ("CAM-01 (NORTH)", radar_cx - 220, radar_cy - 180, 45),
            ("CAM-02 (EAST GATE)", radar_cx + 260, radar_cy - 60, 120),
            ("CAM-03 (WEST RIDGE)", radar_cx - 280, radar_cy + 140, -30),
            ("CAM-04 (HQ BUNKER)", radar_cx + 100, radar_cy + 220, 210),
        ]
        for name, nx, ny, cone_angle in nodes:
            cone_rad = math.radians(cone_angle)
            p1 = (nx, ny)
            p2 = (int(nx + 130 * math.cos(cone_rad - 0.35)), int(ny + 130 * math.sin(cone_rad - 0.35)))
            p3 = (int(nx + 130 * math.cos(cone_rad + 0.35)), int(ny + 130 * math.sin(cone_rad + 0.35)))
            cone_pts = np.array([p1, p2, p3], np.int32)
            cv2.fillPoly(frame, [cone_pts], (20, 35, 45))
            cv2.polylines(frame, [cone_pts], True, C_CYAN, 1)
            cv2.circle(frame, (nx, ny), 10, C_CYAN, -1)
            cv2.circle(frame, (nx, ny), 16, C_WHITE, 1)
            cv2.putText(frame, name, (nx - 60, ny - 22), cv2.FONT_HERSHEY_DUPLEX, 0.45, C_WHITE, 1, cv2.LINE_AA)
        ix = int(radar_cx - 140 + 20 * math.sin(f * 0.1))
        iy = int(radar_cy - 110 + 20 * math.cos(f * 0.1))
        cv2.circle(frame, (ix, iy), 8, C_RED, -1)
        cv2.circle(frame, (ix, iy), 18 + int(8 * math.sin(f * 0.2)), C_RED, 2)
        cv2.putText(frame, "⚠️ INTRUDER #104 [THREAT LEVEL 5]", (ix + 24, iy + 5), cv2.FONT_HERSHEY_DUPLEX, 0.5, C_RED, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (width - 380, 110), (width - 50, 450), C_CARD, -1)
        cv2.rectangle(frame, (width - 380, 110), (width - 50, 450), C_BORDER, 1)
        cv2.putText(frame, "DEPLOYED ASSETS", (width - 360, 145), cv2.FONT_HERSHEY_DUPLEX, 0.65, C_WHITE, 1, cv2.LINE_AA)
        assets = [
            ("QRT-ALPHA (PATROL JEEP)", "EN ROUTE (2.1 km)", C_AMBER),
            ("QRT-BRAVO (STANDBY)", "STATIONED AT HQ", C_GREEN),
            ("SURVEILLANCE DRONE-1", "AIRBORNE - PATROL", C_CYAN),
            ("RADAR ARRAY 3D", "ONLINE - 360 DEG", C_GREEN)
        ]
        for idx, (an, ast, acol) in enumerate(assets):
            ay = 175 + idx * 65
            cv2.rectangle(frame, (width - 365, ay), (width - 65, ay + 55), (16, 22, 28), -1)
            cv2.putText(frame, an, (width - 355, ay + 22), cv2.FONT_HERSHEY_DUPLEX, 0.45, C_WHITE, 1, cv2.LINE_AA)
            cv2.putText(frame, ast, (width - 355, ay + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.42, acol, 1, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    # Scene 6: Evidence Vault
    f_count = int(scene_durations[5] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "FORENSIC EVIDENCE VAULT", "CRYPTOGRAPHIC AUDIT TRAIL")
        draw_footer_banner(frame, SCENES[5]["footer"])
        cv2.rectangle(frame, (30, 90), (width - 30, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (30, 90), (width - 30, height - 80), C_BORDER, 1)
        cv2.rectangle(frame, (45, 110), (width - 45, 160), (30, 38, 50), -1)
        cv2.putText(frame, "INCIDENT ID", (65, 142), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, "TIMESTAMP", (240, 142), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, "SECTOR / CAMERA", (440, 142), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, "EVENT TYPE", (720, 142), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, "SHA-256 INTEGRITY HASH", (1020, 142), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)
        cv2.putText(frame, "STATUS", (1620, 142), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_CYAN, 1, cv2.LINE_AA)
        records = [
            ("EV-2026-0891", "11:20:14 IST", "CAM-01 / NORTH RIDGE", "VIRTUAL FENCE BREACH", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4...", "SEALED", C_RED),
            ("EV-2026-0890", "11:18:50 IST", "CAM-02 / GATE-2", "HOTLIST ANPR MATCH", "8f434346648f6b96df89dda901c5176b10a6d839...", "VERIFIED", C_AMBER),
            ("EV-2026-0889", "11:12:05 IST", "CAM-03 / WEST RAVINE", "UNAUTHORIZED DRONE", "ca978112ca1bbdcaf0643eefaee3a074ac428a4e...", "ARCHIVED", C_CYAN),
            ("EV-2026-0888", "11:05:32 IST", "CAM-04 / HQ BUNKER", "PERSON DETECTED", "4b227777d4dd1fc61c6f884f48641d02b4d121d3...", "ARCHIVED", C_GREEN),
            ("EV-2026-0887", "10:52:19 IST", "CAM-01 / NORTH RIDGE", "NIGHT-VISION MOTION", "ef2d127de37b942baad06145e54b0c619a1f2232...", "ARCHIVED", C_GREEN),
        ]
        for i, (eid, tstamp, cam_sec, etype, shash, status, col) in enumerate(records):
            ry = 180 + i * 85
            cv2.rectangle(frame, (45, ry), (width - 45, ry + 70), (18, 23, 30), -1)
            cv2.rectangle(frame, (45, ry), (width - 45, ry + 70), C_BORDER, 1)
            cv2.putText(frame, eid, (65, ry + 42), cv2.FONT_HERSHEY_DUPLEX, 0.55, C_WHITE, 1, cv2.LINE_AA)
            cv2.putText(frame, tstamp, (240, ry + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_GRAY, 1, cv2.LINE_AA)
            cv2.putText(frame, cam_sec, (440, ry + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_WHITE, 1, cv2.LINE_AA)
            cv2.putText(frame, etype, (720, ry + 42), cv2.FONT_HERSHEY_DUPLEX, 0.5, col, 1, cv2.LINE_AA)
            cv2.putText(frame, shash, (1020, ry + 42), cv2.FONT_HERSHEY_PLAIN, 1.1, C_CYAN, 1, cv2.LINE_AA)
            cv2.rectangle(frame, (1610, ry + 20), (1750, ry + 52), (20, 35, 45), -1)
            cv2.rectangle(frame, (1610, ry + 20), (1750, ry + 52), col, 1)
            cv2.putText(frame, status, (1630, ry + 42), cv2.FONT_HERSHEY_DUPLEX, 0.45, col, 1, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    # Scene 7: Dispatch & SOP
    f_count = int(scene_durations[6] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "INCIDENT DISPATCH & SOP AUTOMATION", "QUICK REACTION TEAM WORKFLOW")
        draw_footer_banner(frame, SCENES[6]["footer"])
        cv2.rectangle(frame, (30, 90), (880, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (30, 90), (880, height - 80), C_BORDER, 1)
        cv2.putText(frame, "ACTIVE DISPATCH: DISP-112014", (55, 135), cv2.FONT_HERSHEY_DUPLEX, 0.75, C_WHITE, 1, cv2.LINE_AA)
        d_details = [
            ("TACTICAL UNIT", "QRT-Alpha (Quick Reaction Team 1)"),
            ("LINKED EVENT", "EV-2026-0891 (North Ridge Breach)"),
            ("COMMANDER", "Major V. Rawat (Command Center)"),
            ("DISPATCH TIME", "11:20:22 IST (Elapsed: 00:01:14)"),
            ("GPS LOCATION", "34.2189 N, 74.8821 E (Sector-4)"),
            ("RADIO CHANNEL", "TAC-NET FREQ 412.500 MHz")
        ]
        for idx, (k, v) in enumerate(d_details):
            dy = 170 + idx * 55
            cv2.putText(frame, k, (55, dy + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, C_GRAY, 1, cv2.LINE_AA)
            cv2.putText(frame, v, (260, dy + 25), cv2.FONT_HERSHEY_DUPLEX, 0.52, C_WHITE, 1, cv2.LINE_AA)
            cv2.line(frame, (55, dy + 40), (850, dy + 40), (28, 35, 45), 1)
        rx = 910
        rw = width - rx - 30
        cv2.rectangle(frame, (rx, 90), (rx + rw, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (rx, 90), (rx + rw, height - 80), C_BORDER, 1)
        cv2.putText(frame, "STANDARD OPERATING PROCEDURE (SOP)", (rx + 25, 135), cv2.FONT_HERSHEY_DUPLEX, 0.7, C_CYAN, 1, cv2.LINE_AA)
        sop_steps = [
            ("1. Visual AI Threat Confirmation", "COMPLETED", True),
            ("2. Perimeter Alarm & Strobe Siren Triggered", "COMPLETED", True),
            ("3. QRT Unit Dispatched to Coordinates", "COMPLETED", True),
            ("4. Local Base Commander Alerted via SMS/Email", "COMPLETED", True),
            ("5. Perimeter Lockdown & Checkpoint Barrier", "IN PROGRESS" if f > 60 else "PENDING", f > 60),
            ("6. Forensic Video Sealed & Logged", "COMPLETED", True)
        ]
        for idx, (step_text, s_status, is_done) in enumerate(sop_steps):
            sy = 175 + idx * 75
            cv2.rectangle(frame, (rx + 20, sy), (rx + rw - 20, sy + 60), (18, 24, 32), -1)
            scol = C_GREEN if is_done else C_AMBER
            cv2.rectangle(frame, (rx + 20, sy), (rx + rw - 20, sy + 60), scol, 1)
            cv2.circle(frame, (rx + 50, sy + 30), 12, scol, -1 if is_done else 1)
            if is_done:
                cv2.putText(frame, "V", (rx + 44, sy + 36), cv2.FONT_HERSHEY_DUPLEX, 0.5, (0, 0, 0), 2, cv2.LINE_AA)
            cv2.putText(frame, step_text, (rx + 80, sy + 35), cv2.FONT_HERSHEY_DUPLEX, 0.52, C_WHITE, 1, cv2.LINE_AA)
            cv2.putText(frame, s_status, (rx + rw - 160, sy + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.45, scol, 1, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    # Scene 8: Threat Analytics
    f_count = int(scene_durations[7] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        draw_tactical_header(frame, "TACTICAL THREAT ANALYTICS", "DETECTION METRICS & HEATMAPS")
        draw_footer_banner(frame, SCENES[7]["footer"])
        stats = [
            ("TOTAL SCANNED TARGETS", "14,892", "+12.4%", C_CYAN),
            ("AUTHENTIC THREAT DETECTIONS", "38", "100% Verified", C_RED),
            ("FALSE ALARMS FILTERED", "1,420", "99.2% Accuracy", C_GREEN),
            ("AVG RESPONSE TIME", "28.4 sec", "-42% Faster", C_AMBER),
        ]
        card_w = (width - 120) // 4
        for idx, (st_t, st_v, st_sub, st_c) in enumerate(stats):
            cx = 30 + idx * (card_w + 20)
            cv2.rectangle(frame, (cx, 90), (cx + card_w, 200), C_CARD, -1)
            cv2.rectangle(frame, (cx, 90), (cx + card_w, 200), C_BORDER, 1)
            cv2.putText(frame, st_t, (cx + 15, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.42, C_GRAY, 1, cv2.LINE_AA)
            cv2.putText(frame, st_v, (cx + 15, 165), cv2.FONT_HERSHEY_DUPLEX, 1.1, st_c, 2, cv2.LINE_AA)
            cv2.putText(frame, st_sub, (cx + 15, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.42, C_WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (30, 220), (960, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (30, 220), (960, height - 80), C_BORDER, 1)
        cv2.putText(frame, "HOURLY INCIDENT DISTRIBUTION (24-HR TIMELINE)", (50, 255), cv2.FONT_HERSHEY_DUPLEX, 0.6, C_WHITE, 1, cv2.LINE_AA)
        hours = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
        values = [25, 40, 15, 8, 12, 18, 55, 75]
        chart_base_y = height - 140
        for i, (hr, val) in enumerate(zip(hours, values)):
            bx = 80 + i * 105
            bar_height = int(val * 4 * min(1.0, f / 40.0))
            col = C_RED if val > 50 else (C_AMBER if val > 20 else C_CYAN)
            cv2.rectangle(frame, (bx, chart_base_y - bar_height), (bx + 60, chart_base_y), col, -1)
            cv2.putText(frame, hr, (bx + 8, chart_base_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.4, C_GRAY, 1, cv2.LINE_AA)
            cv2.putText(frame, str(val), (bx + 18, chart_base_y - bar_height - 10), cv2.FONT_HERSHEY_DUPLEX, 0.45, C_WHITE, 1, cv2.LINE_AA)
        rx = 990
        rw = width - rx - 30
        cv2.rectangle(frame, (rx, 220), (rx + rw, height - 80), C_CARD, -1)
        cv2.rectangle(frame, (rx, 220), (rx + rw, height - 80), C_BORDER, 1)
        cv2.putText(frame, "CLASSIFICATION ACCURACY BREAKDOWN", (rx + 25, 255), cv2.FONT_HERSHEY_DUPLEX, 0.6, C_WHITE, 1, cv2.LINE_AA)
        breakdowns = [
            ("Human Intrusion (YOLOv8)", "96.8%", 96, C_CYAN),
            ("Vehicle & Convoy Tracking", "94.2%", 94, C_GREEN),
            ("ANPR License Plate OCR", "98.4%", 98, C_BLUE),
            ("Airborne Drone Detection", "89.1%", 89, C_AMBER),
            ("Virtual Fence Breach Precision", "99.5%", 99, C_RED),
        ]
        for idx, (b_title, b_pct, b_val, b_c) in enumerate(breakdowns):
            by = 295 + idx * 75
            cv2.putText(frame, b_title, (rx + 25, by + 20), cv2.FONT_HERSHEY_DUPLEX, 0.5, C_WHITE, 1, cv2.LINE_AA)
            cv2.putText(frame, b_pct, (rx + rw - 90, by + 20), cv2.FONT_HERSHEY_DUPLEX, 0.5, b_c, 1, cv2.LINE_AA)
            pw = rw - 50
            cv2.rectangle(frame, (rx + 25, by + 35), (rx + 25 + pw, by + 50), (28, 35, 45), -1)
            cv2.rectangle(frame, (rx + 25, by + 35), (rx + 25 + int(pw * (b_val / 100.0) * min(1.0, f / 40.0)), by + 50), b_c, -1)
        add_scanlines(frame)
        out.write(frame)

    # Scene 9: Summary
    f_count = int(scene_durations[8] * fps)
    for f in range(f_count):
        frame = np.full((height, width, 3), C_BG, dtype=np.uint8)
        for x in range(0, width, 60):
            cv2.line(frame, (x, 0), (x, height), (18, 24, 32), 1)
        for y in range(0, height, 60):
            cv2.line(frame, (0, y), (width, y), (18, 24, 32), 1)
        center_x, center_y = width // 2, height // 2 - 40
        cv2.putText(frame, "DRISHTIX v2.0 READY FOR DEPLOYMENT", (center_x - 390, center_y - 120), cv2.FONT_HERSHEY_DUPLEX, 1.4, C_CYAN, 2, cv2.LINE_AA)
        cv2.putText(frame, "Smart India Hackathon (SIH) 2026 - Problem Statement #1748", (center_x - 420, center_y - 65), cv2.FONT_HERSHEY_DUPLEX, 0.75, C_WHITE, 1, cv2.LINE_AA)
        cv2.rectangle(frame, (center_x - 450, center_y - 20), (center_x + 450, center_y + 200), C_CARD, -1)
        cv2.rectangle(frame, (center_x - 450, center_y - 20), (center_x + 450, center_y + 200), C_CYAN, 1)
        summary_points = [
            "✔ 100% Event-Driven Architecture (Zero Operator Fatigue)",
            "✔ Multi-Camera Live AI Inference (YOLOv8 + ByteTrack)",
            "✔ Sub-Second Critical Perimeter Breach & ANPR Hotlist Alerting",
            "✔ Tamper-Proof Cryptographic Forensic Chain of Custody",
            "✔ Standard Operating Procedure (SOP) & Fast QRT Unit Dispatch"
        ]
        for idx, sp in enumerate(summary_points):
            sy = center_y + 20 + idx * 34
            cv2.putText(frame, sp, (center_x - 420, sy), cv2.FONT_HERSHEY_DUPLEX, 0.58, C_GREEN, 1, cv2.LINE_AA)
        cv2.putText(frame, "Web Application Live at: http://localhost:5173", (center_x - 240, height - 90), cv2.FONT_HERSHEY_DUPLEX, 0.65, C_AMBER, 1, cv2.LINE_AA)
        add_scanlines(frame)
        out.write(frame)

    out.release()
    print("Visual track rendered:", raw_video_path)
    
    # Step 3: Combine Video + Audio using Windows MediaComposition
    final_output = "drishtix_narrated_demo.mp4"
    print("Step 3: Muxing Video and Voice Narration using Windows MediaComposition...")
    ps_mux = [
        "powershell", "-ExecutionPolicy", "Bypass",
        "-File", "mux_video_audio.ps1",
        "-VideoPath", raw_video_path,
        "-AudioPath", master_wav,
        "-OutputPath", final_output
    ]
    subprocess.run(ps_mux, check=True)
    print(f"Demo video with voice narration completed: {final_output}")

if __name__ == "__main__":
    main()
