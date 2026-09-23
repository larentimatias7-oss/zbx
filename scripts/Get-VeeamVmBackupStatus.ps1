<#
.SYNOPSIS
    Reads Veeam backup task and restore-point status for one VM.
.DESCRIPTION
    Run locally on a Veeam Backup & Replication server with its PowerShell
    module available. This script only invokes Get-* commands and prints a
    compact JSON result. It does not connect with supplied credentials,
    modify jobs, or write a file.
.EXAMPLE
    pwsh -File scripts/Get-VeeamVmBackupStatus.ps1 -VmName SSJ-HPV01
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$VmName,

    [ValidateRange(1, 365)]
    [int]$LookbackDays = 30
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command Get-VBRBackupSession -ErrorAction SilentlyContinue)) {
    Import-Module Veeam.Backup.PowerShell -ErrorAction Stop
}

foreach ($commandName in @('Get-VBRBackupSession', 'Get-VBRTaskSession', 'Get-VBRRestorePoint')) {
    if (-not (Get-Command $commandName -ErrorAction SilentlyContinue)) {
        throw "Required Veeam command is unavailable: $commandName"
    }
}

$cutoffUtc = (Get-Date).ToUniversalTime().AddDays(-$LookbackDays)
$taskRows = [System.Collections.Generic.List[object]]::new()
$sessionErrors = 0

foreach ($session in @(Get-VBRBackupSession)) {
    if (-not $session.EndTimeUTC -or $session.EndTimeUTC -lt $cutoffUtc) {
        continue
    }

    try {
        $tasks = @(Get-VBRTaskSession -Session $session -Name $VmName -ErrorAction Stop)
    }
    catch {
        $sessionErrors++
        continue
    }

    foreach ($task in $tasks) {
        if ($task.Name -ine $VmName) {
            continue
        }

        $taskRows.Add([pscustomobject]@{
            jobName = [string]$session.Name
            sessionEndUtc = $session.EndTimeUTC.ToUniversalTime().ToString('o')
            sessionResult = [string]$session.Result
            vmName = [string]$task.Name
            taskResult = [string]$task.Result
            taskStatus = [string]$task.Status
        })
    }
}

$taskRows = @($taskRows | Sort-Object sessionEndUtc -Descending)
$lastAttempt = $taskRows | Select-Object -First 1
$lastSuccess = $taskRows | Where-Object taskResult -EQ 'Success' | Select-Object -First 1

$restorePoints = @()
$restorePointQueryError = $null
try {
    $restorePoints = @(Get-VBRRestorePoint -Name $VmName -ErrorAction Stop)
}
catch {
    $restorePointQueryError = $_.Exception.Message
}
$lastRestorePoint = $restorePoints |
    Sort-Object CreationTime -Descending |
    Select-Object -First 1

$restorePointUtc = $null
if ($lastRestorePoint -and $lastRestorePoint.CreationTime) {
    $restorePointUtc = $lastRestorePoint.CreationTime.ToUniversalTime().ToString('o')
}

[pscustomobject]@{
    collectedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
    vmName = $VmName
    lookbackDays = $LookbackDays
    matchedTaskCount = $taskRows.Count
    matchedJobNames = @($taskRows | ForEach-Object jobName | Sort-Object -Unique)
    recentAttempts = @($taskRows | Select-Object -First 10)
    skippedSessionCount = $sessionErrors
    lastAttempt = $lastAttempt
    lastSuccessfulTask = $lastSuccess
    latestRestorePointUtc = $restorePointUtc
    restorePointQueryError = $restorePointQueryError
} | ConvertTo-Json -Depth 5

