import urllib.request
import gzip
import shutil
import os
import subprocess

def download_ffmpeg():
    if os.path.exists("ffmpeg.exe") and os.path.getsize("ffmpeg.exe") > 10000000:
        print("ffmpeg.exe already exists!")
        return "ffmpeg.exe"
        
    url = "https://github.com/eugeneware/ffmpeg-static/releases/download/b4.4.0/win32-x64.gz"
    gz_file = "ffmpeg.gz"
    print(f"Downloading from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(gz_file, 'wb') as out_f:
        shutil.copyfileobj(resp, out_f)
    print("Download complete. Decompressing gzip...")
    with gzip.open(gz_file, 'rb') as f_in, open("ffmpeg.exe", 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)
    if os.path.exists(gz_file):
        os.remove(gz_file)
    print("ffmpeg.exe ready! Size:", os.path.getsize("ffmpeg.exe"))
    return "ffmpeg.exe"

if __name__ == "__main__":
    download_ffmpeg()
