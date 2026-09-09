Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile("C:/Users/FALCON JNB/.gemini/antigravity-ide/scratch/drishtix/audio_clips/scene3.wav")
$synth.Speak("Our Virtual Fence subsystem allows tactical operators to define customizable polygon tripwires. When an unauthorized vector crosses the virtual perimeter, the system instantly triggers high-priority audio-visual strobe alarms and logs the intrusion.")
$synth.Dispose()
