Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene7.wav")
$synth.Speak("When an emergency is validated, commanders can dispatch Quick Reaction Teams with a single click. The platform automatically tracks and enforces Standard Operating Procedure checklists in real time.")
$synth.Dispose()
