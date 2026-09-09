import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import imageio
import imageio_ffmpeg

BASE_DIR = r"c:\Users\FALCON JNB\.gemini\antigravity-ide\scratch\drishtix"
FRONTEND_PUBLIC = os.path.join(BASE_DIR, "frontend", "public")
VIDEOS_DIR = os.path.join(FRONTEND_PUBLIC, "videos")
CAMERAS_DIR = os.path.join(FRONTEND_PUBLIC, "cameras")
ENTITIES_DIR = os.path.join(FRONTEND_PUBLIC, "entities")

os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(CAMERAS_DIR, exist_ok=True)

# Precomputed High-Performance Vignette Mask (1280x720)
_H, _W = 720, 1280
_Y, _X = np.ogrid[:_H, :_W]
_center_y, _center_x = _H / 2.0, _W / 2.0
_dist_from_center = np.sqrt((_X - _center_x)**2 + (_Y - _center_y)**2)
_max_dist = np.sqrt(_center_x**2 + _center_y**2)
PRECOMPUTED_VIGNETTE = np.clip(1.0 - (_dist_from_center / _max_dist) * 0.20, 0.78, 1.0)[:, :, np.newaxis].astype(np.float32)

# Precomputed Noise Pool (8 pre-allocated frames)
NOISE_POOL = [
    (np.random.normal(0, 3.5, (_H, _W, 3))).astype(np.float32)
    for _ in range(8)
]

def apply_cctv_effects(img, frame_idx=0):
    arr = np.array(img, dtype=np.float32)
    arr = arr * PRECOMPUTED_VIGNETTE + NOISE_POOL[frame_idx % 8]
    return np.clip(arr, 0, 255).astype(np.uint8)

# Helper to overlay RGBA sprite onto RGB canvas with alpha blending & color tint
def overlay_sprite(canvas_img, sprite_img, x, y, w, h, angle=0, alpha_mult=1.0, color_tint=None):
    if w <= 0 or h <= 0:
        return
    sprite_resized = sprite_img.resize((int(w), int(h)), Image.Resampling.LANCZOS)
    if angle != 0:
        sprite_resized = sprite_resized.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    
    # Optional Color Tint (for matching night vision or thermal)
    if color_tint is not None:
        r, g, b, a = sprite_resized.split()
        r = r.point(lambda p: int(p * color_tint[0]))
        g = g.point(lambda p: int(p * color_tint[1]))
        b = b.point(lambda p: int(p * color_tint[2]))
        sprite_resized = Image.merge('RGBA', (r, g, b, a))
        
    sw, sh = sprite_resized.size
    px = int(x - sw / 2)
    py = int(y - sh / 2)
    
    if alpha_mult < 1.0:
        r, g, b, a = sprite_resized.split()
        a = a.point(lambda p: int(p * alpha_mult))
        sprite_resized = Image.merge('RGBA', (r, g, b, a))
    
    canvas_img.paste(sprite_resized, (px, py), sprite_resized)

# Draw realistic rolling wheel
def draw_rolling_wheel(draw, cx, cy, radius, width, angle, is_thermal=False):
    r = int(radius)
    w = int(width)
    fill_c = (230, 60, 80) if is_thermal else (18, 22, 28)
    outline_c = (255, 210, 60) if is_thermal else (70, 85, 105)
    draw.rectangle([cx - w//2, cy - r, cx + w//2, cy + r], fill=fill_c, outline=outline_c, width=1)
    
    spoke_c = (255, 255, 220) if is_thermal else (210, 225, 240)
    rad_rad = math.radians(angle)
    dx = math.cos(rad_rad) * (r * 0.7)
    dy = math.sin(rad_rad) * (r * 0.7)
    draw.line([cx - dx, cy - dy, cx + dx, cy + dy], fill=spoke_c, width=2)
    
    dx2 = math.cos(rad_rad + math.pi/2) * (r * 0.7)
    dy2 = math.sin(rad_rad + math.pi/2) * (r * 0.7)
    draw.line([cx - dx2, cy - dy2, cx + dx2, cy + dy2], fill=spoke_c, width=2)

# =========================================================================
# 1. CAM-01: BORDER PATROL ALPHA (North Sector Ridge)
# =========================================================================
def generate_cam1_video(num_frames=600, fps=30):
    print("Generating CAM-01 Photorealistic Video (Alpha Ridge)...")
    bg_path = os.path.join(CAMERAS_DIR, "cam1.jpg")
    bg = Image.open(bg_path).convert("RGB").resize((1280, 720))
    
    intruder_sprite = Image.open(os.path.join(ENTITIES_DIR, "intruder.png")).convert("RGBA")
    drone_sprite = Image.open(os.path.join(ENTITIES_DIR, "drone.png")).convert("RGBA")
    officer_sprite = Image.open(os.path.join(ENTITIES_DIR, "patrol_officer.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam1_live.mp4")
    writer = imageio.get_writer(
        out_path,
        fps=fps,
        codec='libx264',
        quality=9,
        pixelformat='yuv420p',
        ffmpeg_params=['-movflags', 'faststart', '-pix_fmt', 'yuv420p']
    )
    
    for f in range(num_frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # 1. Pedestrian / Tracker traversing dirt patrol road
        if phase < 0.45:
            t = phase / 0.45
            px = 1280 * 0.64 - t * (1280 * 0.12)
            py = 720 * 0.52 + t * (720 * 0.26)
            pscale = 0.45 + t * 0.45
            is_walking = True
        elif phase < 0.70:
            px = 1280 * 0.52 + math.sin(f * 0.05) * 6
            py = 720 * 0.78
            pscale = 0.90
            is_walking = False
        else:
            t = (phase - 0.70) / 0.30
            px = 1280 * 0.52 + t * (1280 * 0.20)
            py = 720 * 0.78 - t * (720 * 0.06)
            pscale = 0.90 - t * 0.15
            is_walking = True
            
        walk_cadence = f * 0.22 if is_walking else f * 0.05
        bob = abs(math.sin(walk_cadence)) * 5 if is_walking else 0
        step_tilt = math.sin(walk_cadence) * 2.5 if is_walking else 0
        
        pw = 110 * pscale
        ph = 185 * pscale
        
        # Realistic Contact Ground Shadow (Cast down-right matching sunlight)
        draw.ellipse([px - pw*0.35 + 8, py + ph*0.42, px + pw*0.45 + 16, py + ph*0.48], fill=(20, 15, 10, 135))
        overlay_sprite(frame_img, intruder_sprite, px, py - bob, pw, ph, angle=step_tilt)
        
        # 2. Border Sentry Guard standing near command outpost
        ox = 1280 * 0.76
        oy = 720 * 0.65
        ow = 80
        oh = 135
        draw.ellipse([ox - ow*0.35 + 6, oy + oh*0.42, ox + ow*0.42 + 14, oy + oh*0.47], fill=(20, 15, 10, 130))
        overlay_sprite(frame_img, officer_sprite, ox, oy, ow, oh)
        
        # 3. High-Tech Tactical Drone Hovering in Sky
        dx = 1280 * 0.26 + math.sin(f * 0.03) * 50
        dy = 720 * 0.18 + math.cos(f * 0.035) * 12
        dw = 125
        dh = 125
        
        # Drone Searchlight Cone on Terrain
        light_poly = [
            (dx, dy + 18),
            (dx - 80 + math.sin(f*0.05)*50, dy + 250),
            (dx + 80 + math.sin(f*0.05)*50, dy + 250)
        ]
        draw.polygon(light_poly, fill=(0, 212, 255, 45))
        
        # Shadow of drone on ground
        draw.ellipse([dx - 18, dy + 250, dx + 18, dy + 260], fill=(10, 10, 10, 60))
        
        overlay_sprite(frame_img, drone_sprite, dx, dy, dw, dh)
        
        # Rotor wash spinning discs
        for rx_off, ry_off in [(-40, -25), (40, -25), (-40, 25), (40, 25)]:
            draw.ellipse([dx + rx_off - 18, dy + ry_off - 5, dx + rx_off + 18, dy + ry_off + 5], outline=(255, 255, 255, 160), width=1)
            
        # Strobe LEDs (Cyan + Red blinking)
        if (f % 16) < 3:
            draw.ellipse([dx - 42, dy - 2, dx - 35, dy + 5], fill=(0, 255, 255, 255))
            draw.ellipse([dx + 35, dy - 2, dx + 42, dy + 5], fill=(255, 40, 40, 255))
            
        # Apply CCTV Sensor Grain & Lens Vignette
        final_frame = apply_cctv_effects(frame_img, f)
        writer.append_data(final_frame)
        
    writer.close()
    print("CAM-01 video completed ->", out_path)

# =========================================================================
# 2. CAM-02: CHECKPOINT BRAVO (Entry Gate Outpost)
# =========================================================================
def generate_cam2_video(num_frames=600, fps=30):
    print("Generating CAM-02 Photorealistic Video (Checkpoint Bravo)...")
    bg_path = os.path.join(CAMERAS_DIR, "cam2.jpg")
    bg = Image.open(bg_path).convert("RGB").resize((1280, 720))
    
    humvee_sprite = Image.open(os.path.join(ENTITIES_DIR, "humvee.png")).convert("RGBA")
    officer_sprite = Image.open(os.path.join(ENTITIES_DIR, "patrol_officer.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam2_live.mp4")
    writer = imageio.get_writer(
        out_path,
        fps=fps,
        codec='libx264',
        quality=9,
        pixelformat='yuv420p',
        ffmpeg_params=['-movflags', 'faststart', '-pix_fmt', 'yuv420p']
    )
    
    for f in range(num_frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # 1. Military Humvee traversing checkpoint roadway
        if phase < 0.38:
            t = phase / 0.38
            cx = 1280 * 0.65 - t * (1280 * 0.12)
            cy = 720 * 0.44 + t * (720 * 0.18)
            cscale = 0.55 + t * 0.35
            speed_kmh = int(35 * (1 - t * 0.9))
        elif phase < 0.62:
            cx = 1280 * 0.53
            cy = 720 * 0.62
            cscale = 0.90
            speed_kmh = 0
        elif phase < 0.92:
            t = (phase - 0.62) / 0.30
            cx = 1280 * 0.53 - t * (1280 * 0.15)
            cy = 720 * 0.62 + t * (720 * 0.28)
            cscale = 0.90 + t * 0.55
            speed_kmh = int(8 + t * 28)
        else:
            cx, cy, cscale, speed_kmh = -400, -400, 1.0, 0
            
        if cx > -200:
            hw = 240 * cscale
            hh = 210 * cscale
            suspension = math.sin(f * 0.4) * (1.5 if speed_kmh > 0 else 0.3)
            
            # Headlight volumetric beam on asphalt
            light_poly = [
                (cx - 20*cscale, cy + 10*cscale),
                (cx - 120*cscale, cy + 200*cscale),
                (cx + 120*cscale, cy + 200*cscale)
            ]
            draw.polygon(light_poly, fill=(210, 255, 230, 65))
            
            # Ground Contact Shadow
            draw.ellipse([cx - hw*0.45, cy + hh*0.38, cx + hw*0.45, cy + hh*0.45], fill=(5, 12, 10, 160))
            
            # Humvee with night vision color tint
            overlay_sprite(frame_img, humvee_sprite, cx, cy + suspension, hw, hh, color_tint=(0.85, 1.15, 0.95))
            
            # Rolling Tyres
            tyre_ang = f * (speed_kmh * 0.12)
            tyre_r = 26 * cscale
            tyre_w = 22 * cscale
            draw_rolling_wheel(draw, cx - hw*0.28, cy + hh*0.26 + suspension, tyre_r, tyre_w, tyre_ang)
            draw_rolling_wheel(draw, cx + hw*0.26, cy + hh*0.22 + suspension, tyre_r, tyre_w, tyre_ang)
            
        # 2. Sentry Officer standing at guard outpost with scanning flashlight
        ox = 1280 * 0.30
        oy = 720 * 0.52
        ow = 72
        oh = 130
        
        flash_ang = math.sin(f * 0.05) * 0.3 + 0.2
        f_len = 220
        fx_end = ox + math.cos(flash_ang) * f_len
        fy_end = oy + math.sin(flash_ang) * f_len
        flash_poly = [(ox, oy - 10), (fx_end - 30, fy_end), (fx_end + 30, fy_end)]
        draw.polygon(flash_poly, fill=(220, 255, 240, 75))
        
        draw.ellipse([ox - ow*0.35, oy + oh*0.42, ox + ow*0.35, oy + oh*0.46], fill=(5, 12, 10, 140))
        overlay_sprite(frame_img, officer_sprite, ox, oy, ow, oh, color_tint=(0.85, 1.15, 0.95))
        
        # 3. Articulated Barrier Gate Arm
        is_gate_open = phase >= 0.60 and phase < 0.90
        gx = 1280 * 0.58
        gy = 720 * 0.65
        g_angle = -math.pi / 3.0 if is_gate_open else 0
        g_len = 1280 * 0.22
        g_end_x = gx - math.cos(g_angle) * g_len
        g_end_y = gy + math.sin(g_angle) * g_len
        
        gate_c = (50, 255, 120) if is_gate_open else (255, 50, 50)
        draw.line([gx, gy, g_end_x, g_end_y], fill=gate_c, width=6)
        
        # Gate LED strip
        if (f % 12) < 6:
            draw.ellipse([gx - 5, gy - 16, gx + 5, gy - 6], fill=gate_c)
            
        # Apply CCTV Sensor Grain & Night Vision Phosphor Look
        final_frame = apply_cctv_effects(frame_img, f)
        writer.append_data(final_frame)
        
    writer.close()
    print("CAM-02 video completed ->", out_path)

# =========================================================================
# 3. CAM-03: ENTRY LANE 01 (ANPR Optical Inspection Gantry)
# =========================================================================
def generate_cam3_video(num_frames=600, fps=30):
    print("Generating CAM-03 Photorealistic Video (ANPR Optical Lane)...")
    bg_path = os.path.join(CAMERAS_DIR, "cam3.jpg")
    bg = Image.open(bg_path).convert("RGB").resize((1280, 720))
    
    sedan_sprite = Image.open(os.path.join(ENTITIES_DIR, "sedan.png")).convert("RGBA")
    officer_sprite = Image.open(os.path.join(ENTITIES_DIR, "patrol_officer.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam3_live.mp4")
    writer = imageio.get_writer(
        out_path,
        fps=fps,
        codec='libx264',
        quality=9,
        pixelformat='yuv420p',
        ffmpeg_params=['-movflags', 'faststart', '-pix_fmt', 'yuv420p']
    )
    
    for f in range(num_frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # 1. Transport Sedan cruising through inspection lane
        if phase < 0.50:
            t = phase / 0.50
            cx = 1280 * 0.44 - t * (1280 * 0.06)
            cy = 720 * 0.46 + t * (720 * 0.22)
            cscale = 0.45 + t * 0.50
            speed_kmh = int(32 - t * 18)
        elif phase < 0.75:
            t = (phase - 0.50) / 0.25
            cx = 1280 * 0.38 - t * (1280 * 0.08)
            cy = 720 * 0.68 + t * (720 * 0.30)
            cscale = 0.95 + t * 0.60
            speed_kmh = int(14 + t * 28)
        else:
            t = (phase - 0.75) / 0.25
            cx = 1280 * 0.44 - t * (1280 * 0.03)
            cy = 720 * 0.42 + t * (720 * 0.14)
            cscale = 0.40 + t * 0.35
            speed_kmh = 30
            
        cw = 260 * cscale
        ch = 220 * cscale
        bounce = math.sin(f * 0.4) * (1.5 if speed_kmh > 0 else 0)
        
        # Asphalt Ground Contact Shadow
        draw.ellipse([cx - cw*0.44, cy + ch*0.35, cx + cw*0.44, cy + ch*0.42], fill=(15, 18, 22, 160))
        overlay_sprite(frame_img, sedan_sprite, cx, cy + bounce, cw, ch)
        
        # Rolling wheels
        tyre_ang = f * (speed_kmh * 0.14)
        tyre_r = 26 * cscale
        tyre_w = 22 * cscale
        draw_rolling_wheel(draw, cx - cw*0.28, cy + ch*0.22 + bounce, tyre_r, tyre_w, tyre_ang)
        draw_rolling_wheel(draw, cx + cw*0.26, cy + ch*0.18 + bounce, tyre_r, tyre_w, tyre_ang)
        
        # 2. Highway Inspection Officer walking near lane divider
        wphase = (phase * 1.5) % 1.0
        if wphase < 0.5:
            t = wphase / 0.5
            ox = 1280 * 0.56 + t * (1280 * 0.06)
            oy = 720 * 0.58 + t * (720 * 0.12)
        else:
            t = (wphase - 0.5) / 0.5
            ox = 1280 * 0.62 - t * (1280 * 0.06)
            oy = 720 * 0.70 - t * (720 * 0.12)
            
        ocadence = f * 0.20
        obob = abs(math.sin(ocadence)) * 5
        otilt = math.sin(ocadence) * 2.5
        ow = 78
        oh = 135
        
        draw.ellipse([ox - ow*0.35, oy + oh*0.42, ox + ow*0.35, oy + oh*0.46], fill=(15, 18, 22, 130))
        overlay_sprite(frame_img, officer_sprite, ox, oy - obob, ow, oh, angle=otilt)
        
        # 3. Dynamic Laser Scan Sweep Line across license plate area
        if phase >= 0.40 and phase <= 0.68:
            scan_y = cy - ch*0.08 + math.sin(f * 0.3) * (ch * 0.20)
            draw.line([cx - cw*0.35, scan_y, cx + cw*0.35, scan_y], fill=(0, 255, 200, 180), width=2)
            
        final_frame = apply_cctv_effects(frame_img, f)
        writer.append_data(final_frame)
        
    writer.close()
    print("CAM-03 video completed ->", out_path)

# =========================================================================
# 4. CAM-04: RESTRICTED DELTA (FLIR Ironbow Thermal Fence)
# =========================================================================
def generate_cam4_video(num_frames=600, fps=30):
    print("Generating CAM-04 Photorealistic Video (FLIR Thermal Fence)...")
    bg_path = os.path.join(CAMERAS_DIR, "cam4.jpg")
    bg = Image.open(bg_path).convert("RGB").resize((1280, 720))
    
    thermal_human_sprite = Image.open(os.path.join(ENTITIES_DIR, "thermal_human.png")).convert("RGBA")
    thermal_vehicle_sprite = Image.open(os.path.join(ENTITIES_DIR, "thermal_vehicle.png")).convert("RGBA")
    
    out_path = os.path.join(VIDEOS_DIR, "cam4_live.mp4")
    writer = imageio.get_writer(
        out_path,
        fps=fps,
        codec='libx264',
        quality=9,
        pixelformat='yuv420p',
        ffmpeg_params=['-movflags', 'faststart', '-pix_fmt', 'yuv420p']
    )
    
    for f in range(num_frames):
        phase = (f % 450) / 450.0
        frame_img = bg.copy()
        draw = ImageDraw.Draw(frame_img, 'RGBA')
        
        # 1. Thermal Human Intruders moving along restricted razor-wire fence
        t1prog = (phase * 1.1) % 1.0
        t1x = 1280 * 0.48 + t1prog * (1280 * 0.24)
        t1y = 720 * 0.58 + t1prog * (720 * 0.26)
        scale = 0.55 + t1prog * 0.50
        
        wcadence = f * 0.22
        bob = abs(math.sin(wcadence)) * 5
        stilt = math.sin(wcadence) * 2.5
        tw = 135 * scale
        th = 195 * scale
        
        # Thermal ground heat trace
        draw.ellipse([t1x - tw*0.4, t1y + th*0.35, t1x + tw*0.4, t1y + th*0.45], fill=(255, 120, 0, 80))
        overlay_sprite(frame_img, thermal_human_sprite, t1x, t1y - bob, tw, th, angle=stilt)
        
        # Trailing Thermal Human
        t2x = t1x - 95 * scale
        t2y = t1y - 35 * scale
        t2bob = abs(math.sin(wcadence + 0.8)) * 4
        overlay_sprite(frame_img, thermal_human_sprite, t2x, t2y - t2bob, tw * 0.82, th * 0.82, angle=-stilt)
        
        # 2. Rapid-Response Thermal Interceptor Vehicle
        vprog = (phase * 1.6) % 1.0
        if vprog < 0.6:
            vt = vprog / 0.6
            vx = 1280 * 0.92 - vt * (1280 * 0.60)
            vy = 720 * 0.42 + vt * (720 * 0.25)
            vscale = 0.35 + vt * 0.40
            vspeed = 55
        else:
            vt = (vprog - 0.6) / 0.4
            vx = 1280 * 0.32 - vt * (1280 * 0.30)
            vy = 720 * 0.67 + vt * (720 * 0.22)
            vscale = 0.75 + vt * 0.30
            vspeed = 46
            
        if vx > -150 and vx < 1280 + 150:
            vw = 240 * vscale
            vh = 200 * vscale
            vbounce = math.sin(f * 0.5) * 2.0
            
            # Thermal engine heat bloom underneath vehicle
            draw.ellipse([vx - vw*0.45, vy + vh*0.22, vx + vw*0.45, vy + vh*0.34], fill=(255, 90, 0, 100))
            overlay_sprite(frame_img, thermal_vehicle_sprite, vx, vy + vbounce, vw, vh)
            
            # Thermal rolling tyres with friction heat
            tyre_ang = f * (vspeed * 0.15)
            tyre_r = 28 * vscale
            tyre_w = 24 * vscale
            draw_rolling_wheel(draw, vx - vw*0.28, vy + vh*0.22 + vbounce, tyre_r, tyre_w, tyre_ang, is_thermal=True)
            draw_rolling_wheel(draw, vx + vw*0.26, vy + vh*0.18 + vbounce, tyre_r, tyre_w, tyre_ang, is_thermal=True)
            
        # 3. Virtual Fence Laser Tripwire Infrared Pulse
        wire_pulse = abs(math.sin(f * 0.12))
        wire_alpha = int(140 + wire_pulse * 115)
        draw.line([1280 * 0.05, 720 * 0.68, 1280 * 0.95, 720 * 0.42], fill=(255, 60, 60, wire_alpha), width=2)
        
        final_frame = apply_cctv_effects(frame_img, f)
        writer.append_data(final_frame)
        
    writer.close()
    print("CAM-04 video completed ->", out_path)

if __name__ == "__main__":
    print("=" * 65)
    print("DRISHTIX PHOTOREALISTIC H.264 MP4 SURVEILLANCE GENERATOR")
    print("=" * 65)
    generate_cam1_video()
    generate_cam2_video()
    generate_cam3_video()
    generate_cam4_video()
    print("\nSUCCESS: All 4 Photorealistic Camera Feeds Generated in MP4 Format!")
