Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene5.wav")
$synth.Speak("The Tactical Sensor Map fuses GPS telemetry, continuous three-sixty radar sweeps, and live camera field-of-view cones to provide real-time situational awareness and track hostile movement across border sectors.")
$synth.Dispose()
