Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene4.wav")
$synth.Speak("The Automated Number Plate Recognition Hub scans vehicle registration plates in real time. It achieves over ninety-eight percent OCR confidence and immediately cross-references detected plates against the National Stolen Vehicle and Wanted Watchlist.")
$synth.Dispose()
