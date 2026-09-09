Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene6.wav")
$synth.Speak("Every detected breach, snapshot, and video clip is cryptographically hashed with SHA-256 in the Evidence Vault. This guarantees a tamper-proof chain of custody suitable for forensic investigation and official audit.")
$synth.Dispose()
