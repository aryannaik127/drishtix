Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene8.wav")
$synth.Speak("The Analytics dashboard visualizes hourly threat distributions, classification accuracy, and security metrics, eliminating false alarms and operator fatigue.")
$synth.Dispose()
