Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene9.wav")
$synth.Speak("DRISHTIX delivers zero-latency tactical surveillance, intelligent automation, and complete perimeter defense. Experience the live interactive dashboard now at localhost port 5173.")
$synth.Dispose()
