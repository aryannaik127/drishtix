import urllib.request
import zipfile
import os

url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
print("Connecting...")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        print("Connected! Content length:", resp.headers.get('content-length'))
except Exception as e:
    print("Error:", e)
