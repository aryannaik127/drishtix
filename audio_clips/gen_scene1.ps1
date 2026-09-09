Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene1.wav")
$synth.Speak("Welcome to Project DRISHTIX, an intelligent border surveillance and tactical command center platform. DRISHTIX converts passive CCTV streams into an automated, event-driven detection pipeline.")
$synth.Dispose()
