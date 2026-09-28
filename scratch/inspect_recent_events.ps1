Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

function Call-Zbx($method, $params) {
    $body = @{jsonrpc='2.0'; method=$method; params=$params; id=1} | ConvertTo-Json -Depth 30 -Compress
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
    if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
    return $r.result
}

Write-Output "=== PROBLEMAS RECIENTES EN ZABBIX PROD ==="
$probs = Call-Zbx 'problem.get' @{
    output = @('eventid', 'name', 'severity', 'clock')
    recent = $true
    limit = 10
}
foreach ($p in $probs) {
    $d = [DateTimeOffset]::FromUnixTimeSeconds([int64]$p.clock).ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss')
    Write-Output "EventID: $($p.eventid) | $d | Sev: $($p.severity) | $($p.name)"
}
