$ErrorActionPreference = "Stop"

$currDir = (Get-Location).Path
$vPath = [System.IO.Path]::Combine($currDir, "raw_demo_visuals.mp4")
$aPath = [System.IO.Path]::Combine($currDir, "master_narration.wav")
$oPath = [System.IO.Path]::Combine($currDir, "drishtix_narrated_demo.mp4")

# Load WinRT assembly references
$winmdPath = "C:\Windows\System32\WinMetadata\Windows.Media.winmd"
$winmdStorage = "C:\Windows\System32\WinMetadata\Windows.Storage.winmd"
$winmdFoundation = "C:\Windows\System32\WinMetadata\Windows.Foundation.winmd"

$src = @"
using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Media.Editing;
using Windows.Storage;
using Windows.Media.MediaProperties;

public class VideoMuxer {
    public static void Run(string vPath, string aPath, string oPath) {
        Task.Run(async () => {
            var vFile = await StorageFile.GetFileFromPathAsync(vPath);
            var aFile = await StorageFile.GetFileFromPathAsync(aPath);
            
            var clip = await MediaClip.CreateFromFileAsync(vFile);
            var audio = await BackgroundAudioTrack.CreateFromFileAsync(aFile);
            
            var comp = new MediaComposition();
            comp.Clips.Add(clip);
            comp.BackgroundAudioTracks.Add(audio);
            
            var folder = await StorageFolder.GetFolderFromPathAsync(Path.GetDirectoryName(oPath));
            var outF = await folder.CreateFileAsync(Path.GetFileName(oPath), CreationCollisionOption.ReplaceExisting);
            
            var profile = MediaEncodingProfile.CreateMp4(VideoEncodingQuality.HD1080p);
            await comp.RenderToFileAsync(outF, MediaTrimmingPreference.Precise, profile);
        }).GetAwaiter().GetResult();
    }
}
"@

Add-Type -TypeDefinition $src -ReferencedAssemblies @(
    "System.Runtime.WindowsRuntime",
    $winmdPath,
    $winmdStorage,
    $winmdFoundation
)

Write-Host "Starting WinRT MediaComposition Video + Audio Muxing..."
[VideoMuxer]::Run($vPath, $aPath, $oPath)
Write-Host "Muxing finished successfully! Final file: $oPath"
