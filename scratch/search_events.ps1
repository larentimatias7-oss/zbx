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

Write-Output "=== BUSQUEDA GENERAL DE PROXMOX O JUMPSERVER ==="
$p = Call-Zbx 'host.get' @{
    search = @{ host = 'proxmox' }
    output = @('hostid', 'host', 'name', 'status')
}
$p | Format-Table -AutoSize

$j = Call-Zbx 'host.get' @{
    search = @{ name = 'Jump' }
    output = @('hostid', 'host', 'name', 'status')
}
$j | Format-Table -AutoSize

# Buscar evento 1659812 mencionado en el mensaje
$ev = Call-Zbx 'event.get' @{
    eventids = @('1659812', '1657990', '1655217', '1654423')
    output = 'extend'
    selectHosts = @('hostid', 'host', 'name')
}
Write-Output "=== EVENTOS HISTORICOS ==="
foreach ($e in $ev) {
    $d = [DateTimeOffset]::FromUnixTimeSeconds([int64]$e.clock).ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss')
    Write-Output "Event ID: $($e.eventid) | Clock: $d | Host: $($e.hosts[0].name) ($($e.hosts[0].host)) | Name: $($e.name) | Value: $($e.value) | Severity: $($e.severity)"
}
