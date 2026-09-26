Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

function Call-Zbx($method, $params) {
    $body = @{jsonrpc='2.0'; method=$method; params=$params; id=1} | ConvertTo-Json -Depth 30 -Compress
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
    return $r.result
}

New-Item -ItemType Directory -Force -Path 'c:\zabbix_anti\backups' | Out-Null

$backupData = @{
    timestamp = (Get-Date).ToString("o")
    users = Call-Zbx 'user.get' @{output='extend'; selectMedias='extend'; selectUsrgrps='extend'}
    actions = Call-Zbx 'action.get' @{
        actionids = @("8", "9", "10", "11", "12", "14", "15")
        output = 'extend'
        selectOperations = 'extend'
        selectRecoveryOperations = 'extend'
        selectUpdateOperations = 'extend'
        selectFilter = 'extend'
    }
}

$backupPath = 'c:\zabbix_anti\backups\telegram_alert_migration_backup_20260926.json'
$backupData | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $backupPath -Encoding UTF8
Write-Output "Backup saved successfully to $backupPath"
