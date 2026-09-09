Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene2.wav")
$synth.Speak("The Live Grid module processes four simultaneous camera feeds at thirty frames per second. Powered by YOLOv8 and ByteTrack edge AI, it classifies persons, vehicles, and drones with real-time confidence scores and track identification.")
$synth.Dispose()
