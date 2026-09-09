param(
    [string]$VideoPath = "raw_demo_visuals.mp4",
    [string]$AudioPath = "master_narration.wav",
    [string]$OutputPath = "drishtix_narrated_demo.mp4"
)

[Windows.Media.Editing.MediaComposition, Windows.Media.Editing, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Editing.MediaClip, Windows.Media.Editing, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Editing.BackgroundAudioTrack, Windows.Media.Editing, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$vFull = (Resolve-Path $VideoPath).Path
$aFull = (Resolve-Path $AudioPath).Path
$oFull = (Join-Path (Get-Location) $OutputPath)

if (Test-Path $oFull) { Remove-Item $oFull -Force }

$vFile = [Windows.Storage.StorageFile]::GetFileFromPathAsync($vFull).GetAwaiter().GetResult()
$aFile = [Windows.Storage.StorageFile]::GetFileFromPathAsync($aFull).GetAwaiter().GetResult()

$clip = [Windows.Media.Editing.MediaClip]::CreateFromFileAsync($vFile).GetAwaiter().GetResult()
$audioTrack = [Windows.Media.Editing.BackgroundAudioTrack]::CreateFromFileAsync($aFile).GetAwaiter().GetResult()

$composition = New-Object Windows.Media.Editing.MediaComposition
$composition.Clips.Add($clip)
$composition.BackgroundAudioTracks.Add($audioTrack)

$outFile = [Windows.Storage.StorageFolder]::GetFolderFromPathAsync((Get-Location).Path).GetAwaiter().GetResult().CreateFileAsync($OutputPath, [Windows.Storage.CreationCollisionOption]::ReplaceExisting).GetAwaiter().GetResult()

$profile = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp4([Windows.Media.MediaProperties.VideoEncodingQuality]::HD1080p)
$asyncOp = $composition.RenderToFileAsync($outFile, [Windows.Media.Editing.MediaTrimmingPreference]::Precise, $profile)

Write-Host "Rendering final MP4 with WinRT MediaComposition..."
$asyncOp.GetAwaiter().GetResult() | Out-Null
Write-Host "Completed! Output saved to: $OutputPath"
