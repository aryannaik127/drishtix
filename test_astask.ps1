[System.Reflection.Assembly]::LoadWithPartialName("System.Runtime.WindowsRuntime") | Out-Null

function Await-WinRT($asyncOp) {
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | 
        Where-Object { $_.Name -eq "AsTask" -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } | 
        Select-Object -First 1

    # Find the return type of the asyncOp (TResult)
    $ifaces = $asyncOp.GetType().GetInterfaces()
    $asyncIf = $ifaces | Where-Object { $_.Name.StartsWith("IAsyncOperation``1") } | Select-Object -First 1
    
    if ($asyncIf) {
        $tResult = $asyncIf.GetGenericArguments()[0]
        $asTask = $asTaskGeneric.MakeGenericMethod($tResult)
        $task = $asTask.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    } else {
        # Non-generic IAsyncAction or IAsyncOperationWithProgress
        $asTaskNonGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | 
            Where-Object { $_.Name -eq "AsTask" -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } | 
            Select-Object -First 1
        $task = $asTaskNonGeneric.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task
    }
}

Write-Host "Testing WinRT StorageFile loading..."
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
$vPath = (Resolve-Path "raw_demo_visuals.mp4").Path
$op = [Windows.Storage.StorageFile]::GetFileFromPathAsync($vPath)
$vFile = Await-WinRT $op
Write-Host "Loaded StorageFile: " $vFile.Path " Size: " $vFile.Name
