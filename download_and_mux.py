import urllib.request
import zipfile
import os
import subprocess
import sys

def get_ffmpeg():
    if os.path.exists("ffmpeg.exe"):
        return os.path.abspath("ffmpeg.exe")
        
    url = "https://github.com/eugeneware/ffmpeg-static/releases/download/b4.4.0/win32-x64"
    # Alternative: github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
    # Let's check eugeneware ffmpeg-static (it's a direct gzipped ffmpeg binary, only ~25MB!)
    print("Downloading standalone ffmpeg binary...")
    zip_url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    
    # Or let's download the small 25MB ffmpeg-static zip:
    dl_url = "https://github.com/GyanD/codexffmpeg/releases/download/7.1/ffmpeg-7.1-essentials_build.zip"
    
    zip_dest = "ffmpeg.zip"
    req = urllib.request.Request(
        dl_url,
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    with urllib.request.urlopen(req) as response, open(zip_dest, 'wb') as out_file:
        length = int(response.headers.get('content-length', 0))
        downloaded = 0
        block_size = 1024 * 1024
        while True:
            chunk = response.read(block_size)
            if not chunk:
                break
            out_file.write(chunk)
            downloaded += len(chunk)
            if length > 0:
                percent = (downloaded / length) * 100
                print(f"Downloading FFmpeg: {percent:.1f}% ({downloaded//(1024*1024)}MB / {length//(1024*1024)}MB)", flush=True)

    print("Extracting ffmpeg.exe...")
    with zipfile.ZipFile(zip_dest, 'r') as z:
        for filename in z.namelist():
            if filename.endswith("ffmpeg.exe"):
                with z.open(filename) as src, open("ffmpeg.exe", "wb") as dst:
                    dst.write(src.read())
                break
                
    if os.path.exists(zip_dest):
        os.remove(zip_dest)
        
    print("FFmpeg ready at ffmpeg.exe!")
    return os.path.abspath("ffmpeg.exe")

def mux():
    ffmpeg_exe = get_ffmpeg()
    
    video_path = "raw_demo_visuals.mp4"
    audio_path = "master_narration.wav"
    output_path = "drishtix_narrated_demo.mp4"
    
    if not os.path.exists(video_path):
        print("Error: raw_demo_visuals.mp4 not found!")
        return
    if not os.path.exists(audio_path):
        print("Error: master_narration.wav not found!")
        return
        
    cmd = [
        ffmpeg_exe, "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path
    ]
    
    print("Running FFmpeg audio-video muxing...")
    subprocess.run(cmd, check=True)
    print(f"SUCCESS! Narrated MP4 Demo Video created at: {os.path.abspath(output_path)}")
    print(f"File size: {os.path.getsize(output_path) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    mux()
