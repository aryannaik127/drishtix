Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("test_voice.wav")
$synth.Speak("Welcome to Project Drishtix Tactical Border Surveillance System.")
$synth.Dispose()
Write-Output "Voice generated successfully!"
