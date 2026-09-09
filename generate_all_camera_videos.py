import os
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw

BASE_DIR = r"c:\Users\FALCON JNB\.gemini\antigravity-ide\scratch\drishtix"
FRONTEND_PUBLIC = os.path.join(BASE_DIR, "frontend", "public")
VIDEOS_DIR = os.path.join(FRONTEND_PUBLIC, "videos")
CAMERAS_DIR = os.path.join(FRONTEND_PUBLIC, "cameras")
ENTITIES_DIR = os.path.join(FRONTEND_PUBLIC, "entities")

os.makedirs(VIDEOS_DIR, exist_ok=True)

def overlay_sprite(canvas_img, sprite_img, x, y, w, h, angle=0):
    if w <= 0 or h <= 0:
        return
    sprite_resized = sprite_img.resize((int(w), int(h)), Image.Resampling.LANCZOS)
    if angle != 0:
        sprite_resized = sprite_resized.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    
    sw, sh = sprite_resized.size
    px = int(x - sw / 2)
    py = int(y - sh / 2)
    canvas_img.paste(sprite_resized, (px, py), sprite_resized)

def draw_rolling_wheel(draw, cx, cy, radius, width, angle, is_thermal=False):
    r = int(radius)
    w = int(width)
    fill_c = (220, 30, 70) if is_thermal else (10, 15, 22)
    outline_c = (250, 190, 40) if is_thermal else (60, 80, 100)
    draw.rectangle([cx - w//2, cy - r, cx + w//2, cy + r], fill=fill_c, outline=outline_c, width=1)
    
    spoke_c = (255, 255, 200) if is_thermal else (240, 245, 255)
    rad_rad = math.radians(angle)
    dx = math.cos(rad_rad) * (r * 0.7)
    dy = math.sin(rad_rad) * (r * 0.7)
    draw.line([cx - dx, cy - dy, cx + dx, cy + dy], fill=spoke_c, width=2)
    
    dx2 = math.cos(rad_rad + math.pi/2) * (r * 0.7)
    dy2 = math.sin(rad_rad + math.pi/2) * (r * 0.7)
    draw.line([cx - dx2, cy - dy2, cx + dx2, cy + dy2], fill=spoke_c, width=2)

# ==========================================
# 1. CAM-01: BORDER PATROL ALPHA (Ridge)
# ==========================================
def generate_cam1(frames=600, fps=30):
    print("Generating CAM-01 (Zero Bouncing)...")
    bg = Image.open(os.path.join(CAMERAS_DIR, "cam1.jpg")).convert("RGB").resize((1280, 720))
    intruder_sprite = Image.open(os.path.join(ENTITIES_DIR, "intruder.png")).convert("RGBA")
    drone_sprite = Image.open(os.path.join(ENTITIES_DIR, "drone.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam1_live.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (1280, 720))
    
    for f in range(frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # Smooth grounded walking trajectory (No vertical bobbing/bouncing)
        if phase < 0.45:
            t = phase / 0.45
            px = 1280 * 0.66 - t * (1280 * 0.14)
            py = 720 * 0.50 + t * (720 * 0.30)
            pscale = 0.45 + t * 0.45
        elif phase < 0.70:
            px = 1280 * 0.52
            py = 720 * 0.80
            pscale = 0.90
        else:
            t = (phase - 0.70) / 0.30
            px = 1280 * 0.52 + t * (1280 * 0.22)
            py = 720 * 0.80 - t * (720 * 0.06)
            pscale = 0.90 - t * 0.15
            
        pw = 120 * pscale
        ph = 200 * pscale
        
        # Stable ground shadow
        draw.ellipse([px - pw*0.35, py + ph*0.44, px + pw*0.35, py + ph*0.48], fill=(0, 0, 0, 140))
        overlay_sprite(frame_img, intruder_sprite, px, py, pw, ph, angle=0)
        
        # Smooth hovering Drone
        dx = 1280 * 0.28 + math.sin(f * 0.015) * 20
        dy = 720 * 0.20 + math.cos(f * 0.018) * 6
        dw, dh = 140, 140
        light_poly = [(dx, dy + 20), (dx - 90, dy + 280), (dx + 90, dy + 280)]
        draw.polygon(light_poly, fill=(0, 212, 255, 55))
        overlay_sprite(frame_img, drone_sprite, dx, dy, dw, dh)
        
        # Rotating rotor discs
        for rx_off, ry_off in [(-45, -28), (45, -28), (-45, 28), (45, 28)]:
            draw.ellipse([dx + rx_off - 20, dy + ry_off - 6, dx + rx_off + 20, dy + ry_off + 6], outline=(255, 255, 255, 180), width=2)
            
        cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        writer.write(cv_frame)
        
    writer.release()
    print("CAM-01 Done:", out_path)

# ==========================================
# 2. CAM-02: BRAVO CHECKPOINT MAIN GATE
# ==========================================
def generate_cam2(frames=600, fps=30):
    print("Generating CAM-02 (Zero Bouncing)...")
    bg = Image.open(os.path.join(CAMERAS_DIR, "cam2.jpg")).convert("RGB").resize((1280, 720))
    humvee_sprite = Image.open(os.path.join(ENTITIES_DIR, "humvee.png")).convert("RGBA")
    officer_sprite = Image.open(os.path.join(ENTITIES_DIR, "patrol_officer.png")).convert("RGBA")
    sentry_sprite = Image.open(os.path.join(ENTITIES_DIR, "intruder.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam2_live.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (1280, 720))
    
    for f in range(frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # Humvee smooth perspective driving (No bouncing/suspension hop)
        if phase < 0.38:
            t = phase / 0.38
            cx = 1280 * 0.28 + t * (1280 * 0.16)
            cy = 720 * 0.40 + t * (720 * 0.28)
            cscale = 0.32 + t * 0.58
            speed_kmh = int(45 * (1 - t * 0.9))
        elif phase < 0.62:
            cx = 1280 * 0.44
            cy = 720 * 0.68
            cscale = 0.90
            speed_kmh = 0
        elif phase < 0.92:
            t = (phase - 0.62) / 0.30
            cx = 1280 * 0.44 + t * (1280 * 0.12)
            cy = 720 * 0.68 + t * (720 * 0.36)
            cscale = 0.90 + t * 0.60
            speed_kmh = int(10 + t * 35)
        else:
            cx, cy, cscale, speed_kmh = -400, -400, 1.0, 0
            
        if cx > -200:
            hw = 270 * cscale
            hh = 240 * cscale
            
            # Headlight cone on road
            light_poly = [(cx - 30*cscale, cy + 10*cscale), (cx - 140*cscale, cy + 240*cscale), (cx + 140*cscale, cy + 240*cscale)]
            draw.polygon(light_poly, fill=(255, 255, 210, 80))
            
            # Steady ground shadow
            draw.ellipse([cx - hw*0.45, cy + hh*0.40, cx + hw*0.45, cy + hh*0.46], fill=(0, 0, 0, 160))
            
            # Smooth Humvee body
            overlay_sprite(frame_img, humvee_sprite, cx, cy, hw, hh)
            
            # Smooth rolling tyres
            tyre_ang = f * (speed_kmh * 0.12)
            tyre_r = 30 * cscale
            tyre_w = 26 * cscale
            draw_rolling_wheel(draw, cx - hw*0.30, cy + hh*0.28, tyre_r, tyre_w, tyre_ang)
            draw_rolling_wheel(draw, cx + hw*0.28, cy + hh*0.24, tyre_r, tyre_w, tyre_ang)
            
        # Sentry with flashlight
        sx, sy, sw, sh = 1280 * 0.68, 720 * 0.62, 80, 145
        flash_ang = math.sin(f * 0.04) * 0.3 + 3.4
        flash_len = 240
        f_end_x = sx + math.cos(flash_ang) * flash_len
        f_end_y = sy + math.sin(flash_ang) * flash_len
        draw.polygon([(sx - 15, sy - 15), (f_end_x - 40, f_end_y), (f_end_x + 40, f_end_y)], fill=(255, 255, 220, 85))
        draw.ellipse([sx - sw*0.35, sy + sh*0.44, sx + sw*0.35, sy + sh*0.48], fill=(0, 0, 0, 130))
        overlay_sprite(frame_img, sentry_sprite, sx, sy, sw, sh)
        
        # Officer inspecting (Smooth walking without bouncing)
        if phase >= 0.36 and phase < 0.48:
            ot = (phase - 0.36) / 0.12
            ox = 1280 * 0.68 - ot * (1280 * 0.16)
            oy = 720 * 0.65 + ot * (720 * 0.04)
        elif phase >= 0.48 and phase < 0.58:
            ox, oy = 1280 * 0.52, 720 * 0.69
        elif phase >= 0.58 and phase < 0.70:
            ot = (phase - 0.58) / 0.12
            ox = 1280 * 0.52 + ot * (1280 * 0.16)
            oy = 720 * 0.69 - ot * (720 * 0.04)
        else:
            ox, oy = 1280 * 0.72, 720 * 0.65
            
        ow, oh = 84, 148
        draw.ellipse([ox - ow*0.35, oy + oh*0.44, ox + ow*0.35, oy + oh*0.48], fill=(0, 0, 0, 130))
        overlay_sprite(frame_img, officer_sprite, ox, oy, ow, oh, angle=0)
        
        # Barrier Gate
        is_gate_open = phase >= 0.60 and phase < 0.90
        gx, gy = 1280 * 0.48, 720 * 0.65
        gate_angle = -math.pi / 3.2 if is_gate_open else 0
        g_len = 1280 * 0.18
        g_end_x = gx - math.cos(gate_angle) * g_len
        g_end_y = gy + math.sin(gate_angle) * g_len
        gate_c = (30, 220, 100) if is_gate_open else (230, 50, 50)
        draw.line([gx, gy, g_end_x, g_end_y], fill=gate_c, width=7)
        
        cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        writer.write(cv_frame)
        
    writer.release()
    print("CAM-02 Done:", out_path)

# ==========================================
# 3. CAM-03: ENTRY LANE 01 (ANPR & Patrol)
# ==========================================
def generate_cam3(frames=600, fps=30):
    print("Generating CAM-03 (Zero Bouncing)...")
    bg = Image.open(os.path.join(CAMERAS_DIR, "cam3.jpg")).convert("RGB").resize((1280, 720))
    sedan_sprite = Image.open(os.path.join(ENTITIES_DIR, "sedan.png")).convert("RGBA")
    officer_sprite = Image.open(os.path.join(ENTITIES_DIR, "patrol_officer.png")).convert("RGBA")
    intruder_sprite = Image.open(os.path.join(ENTITIES_DIR, "intruder.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam3_live.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (1280, 720))
    
    for f in range(frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # Sedan smooth driving along marked lane (Zero vertical bounce)
        if phase < 0.50:
            t = phase / 0.50
            cx = 1280 * 0.38 - t * (1280 * 0.04)
            cy = 720 * 0.38 + t * (720 * 0.28)
            cscale = 0.40 + t * 0.55
            speed_kmh = int(38 - t * 20)
        elif phase < 0.75:
            t = (phase - 0.50) / 0.25
            cx = 1280 * 0.34 - t * (1280 * 0.08)
            cy = 720 * 0.66 + t * (720 * 0.32)
            cscale = 0.95 + t * 0.65
            speed_kmh = int(18 + t * 32)
        else:
            t = (phase - 0.75) / 0.25
            cx = 1280 * 0.38 - t * (1280 * 0.02)
            cy = 720 * 0.36 + t * (720 * 0.16)
            cscale = 0.35 + t * 0.35
            speed_kmh = 34
            
        cw = 290 * cscale
        ch = 250 * cscale
        
        # Ground shadow
        draw.ellipse([cx - cw*0.45, cy + ch*0.36, cx + cw*0.45, cy + ch*0.42], fill=(0, 0, 0, 150))
        overlay_sprite(frame_img, sedan_sprite, cx, cy, cw, ch)
        
        # Smooth rolling wheels
        tyre_ang = f * (speed_kmh * 0.14)
        tyre_r = 30 * cscale
        tyre_w = 25 * cscale
        draw_rolling_wheel(draw, cx - cw*0.30, cy + ch*0.24, tyre_r, tyre_w, tyre_ang)
        draw_rolling_wheel(draw, cx + cw*0.28, cy + ch*0.20, tyre_r, tyre_w, tyre_ang)
        
        # Smooth walkway officer walking (Zero bobbing)
        wphase = (phase * 1.5) % 1.0
        if wphase < 0.5:
            t = wphase / 0.5
            p1x = 1280 * 0.78 + t * (1280 * 0.08)
            p1y = 720 * 0.55 + t * (720 * 0.20)
        else:
            t = (wphase - 0.5) / 0.5
            p1x = 1280 * 0.86 - t * (1280 * 0.08)
            p1y = 720 * 0.75 - t * (720 * 0.20)
            
        p1w, p1h = 88, 150
        draw.ellipse([p1x - p1w*0.35, p1y + p1h*0.44, p1x + p1w*0.35, p1y + p1h*0.48], fill=(0, 0, 0, 130))
        overlay_sprite(frame_img, officer_sprite, p1x, p1y, p1w, p1h, angle=0)
        
        # Perimeter agent
        p2x = 1280 * 0.15
        p2y = 720 * 0.62
        p2w, p2h = 76, 132
        draw.ellipse([p2x - p2w*0.35, p2y + p2h*0.44, p2x + p2w*0.35, p2y + p2h*0.48], fill=(0, 0, 0, 130))
        overlay_sprite(frame_img, intruder_sprite, p2x, p2y, p2w, p2h)
        
        cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        writer.write(cv_frame)
        
    writer.release()
    print("CAM-03 Done:", out_path)

# ==========================================
# 4. CAM-04: RESTRICTED ZONE DELTA (FLIR)
# ==========================================
def generate_cam4(frames=600, fps=30):
    print("Generating CAM-04 (Zero Bouncing)...")
    bg = Image.open(os.path.join(CAMERAS_DIR, "cam4.jpg")).convert("RGB").resize((1280, 720))
    thermal_human_sprite = Image.open(os.path.join(ENTITIES_DIR, "thermal_human.png")).convert("RGBA")
    thermal_vehicle_sprite = Image.open(os.path.join(ENTITIES_DIR, "thermal_vehicle.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam4_live.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    writer = cv2.VideoWriter(out_path, fourcc, fps, (1280, 720))
    
    for f in range(frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # Smooth thermal humans walking along fence
        t1prog = (phase * 1.1) % 1.0
        t1x = 1280 * 0.38 + t1prog * (1280 * 0.28)
        t1y = 720 * 0.52 + t1prog * (720 * 0.30)
        scale = 0.55 + t1prog * 0.55
        
        tw, th = 150 * scale, 220 * scale
        overlay_sprite(frame_img, thermal_human_sprite, t1x, t1y, tw, th, angle=0)
        
        t2x = t1x - 110 * scale
        t2y = t1y - 40 * scale
        overlay_sprite(frame_img, thermal_human_sprite, t2x, t2y, tw * 0.85, th * 0.85, angle=0)
        
        # Smooth rapid-response vehicle (Zero hopping)
        vprog = (phase * 1.6) % 1.0
        if vprog < 0.6:
            vt = vprog / 0.6
            vx = 1280 * 0.95 - vt * (1280 * 0.65)
            vy = 720 * 0.32 + vt * (720 * 0.28)
            vscale = 0.35 + vt * 0.45
            vspeed = 56
        else:
            vt = (vprog - 0.6) / 0.4
            vx = 1280 * 0.30 - vt * (1280 * 0.35)
            vy = 720 * 0.60 + vt * (720 * 0.25)
            vscale = 0.80 + vt * 0.30
            vspeed = 48
            
        if vx > -150 and vx < 1280 + 150:
            vw = 260 * vscale
            vh = 220 * vscale
            draw.ellipse([vx - vw*0.5, vy + vh*0.25, vx + vw*0.5, vy + vh*0.35], fill=(255, 90, 0, 90))
            overlay_sprite(frame_img, thermal_vehicle_sprite, vx, vy, vw, vh)
            
            tyre_ang = f * (vspeed * 0.15)
            tyre_r = 30 * vscale
            tyre_w = 26 * vscale
            draw_rolling_wheel(draw, vx - vw*0.30, vy + vh*0.24, tyre_r, tyre_w, tyre_ang, is_thermal=True)
            draw_rolling_wheel(draw, vx + vw*0.28, vy + vh*0.20, tyre_r, tyre_w, tyre_ang, is_thermal=True)
            
        cv_frame = cv2.cvtColor(np.array(frame_img), cv2.COLOR_RGB2BGR)
        writer.write(cv_frame)
        
    writer.release()
    print("CAM-04 Done:", out_path)

if __name__ == "__main__":
    generate_cam1(300, 30)
    generate_cam2(300, 30)
    generate_cam3(300, 30)
    generate_cam4(300, 30)
    print("All 4 camera H.264 MP4 videos regenerated with SMOOTH, ZERO-BOUNCE motion!")
