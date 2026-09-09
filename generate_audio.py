import os
import subprocess

scenes = [
    ("scene1", "Welcome to Project DRISHTIX, an intelligent border surveillance and tactical command center platform. DRISHTIX converts passive CCTV streams into an automated, event-driven detection pipeline."),
    ("scene2", "The Live Grid module processes four simultaneous camera feeds at thirty frames per second. Powered by YOLOv8 and ByteTrack edge AI, it classifies persons, vehicles, and drones with real-time confidence scores and track identification."),
    ("scene3", "Our Virtual Fence subsystem allows tactical operators to define customizable polygon tripwires. When an unauthorized vector crosses the virtual perimeter, the system instantly triggers high-priority audio-visual strobe alarms and logs the intrusion."),
    ("scene4", "The Automated Number Plate Recognition Hub scans vehicle registration plates in real time. It achieves over ninety-eight percent OCR confidence and immediately cross-references detected plates against the National Stolen Vehicle and Wanted Watchlist."),
    ("scene5", "The Tactical Sensor Map fuses GPS telemetry, continuous three-sixty radar sweeps, and live camera field-of-view cones to provide real-time situational awareness and track hostile movement across border sectors."),
    ("scene6", "Every detected breach, snapshot, and video clip is cryptographically hashed with SHA-256 in the Evidence Vault. This guarantees a tamper-proof chain of custody suitable for forensic investigation and official audit."),
    ("scene7", "When an emergency is validated, commanders can dispatch Quick Reaction Teams with a single click. The platform automatically tracks and enforces Standard Operating Procedure checklists in real time."),
    ("scene8", "The Analytics dashboard visualizes hourly threat distributions, classification accuracy, and security metrics, eliminating false alarms and operator fatigue."),
    ("scene9", "DRISHTIX delivers zero-latency tactical surveillance, intelligent automation, and complete perimeter defense. Experience the live interactive dashboard now at localhost port 5173.")
]

os.makedirs("audio_clips", exist_ok=True)

for sid, stext in scenes:
    wav_path = os.path.abspath(f"audio_clips/{sid}.wav").replace("\\", "/")
    ps_content = f'''Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("{wav_path}")
$synth.Speak("{stext}")
$synth.Dispose()
'''
    script_path = f"audio_clips/gen_{sid}.ps1"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(ps_content)
    print(f"Generating audio for {sid}...")
    subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", script_path], check=True)
    print(f"Created {wav_path}")

print("All scene audio clips generated successfully!")
