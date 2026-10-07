Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$body = @{
    jsonrpc = '2.0'
    method = 'history.get'
    params = @{
        output = 'extend'
        history = 2  # log
        itemids = @('83715')
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 3
    }
    id = 1
} | ConvertTo-Json -Depth 10

$res = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))
foreach ($item in $res.result) {
    Write-Host "================== CLOCK: $([DateTimeOffset]::FromUnixTimeSeconds($item.clock).LocalDateTime) =================="
    Write-Host $item.value
}
