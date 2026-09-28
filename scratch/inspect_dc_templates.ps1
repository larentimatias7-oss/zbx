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

Write-Output "=== TEMPLATES DE DOMAIN CONTROLLERS ==="
$dcHosts = Call-Zbx 'host.get' @{
    filter = @{ host = @('SRO-DCO01', 'SRO-DCO02', 'SSJ-DCO01') }
    output = @('hostid', 'host', 'name')
    selectParentTemplates = @('templateid', 'name')
}

foreach ($h in $dcHosts) {
    Write-Output "`nHost: $($h.name) ($($h.host))"
    foreach ($t in $h.parentTemplates) {
        Write-Output "  -> Template: [$($t.templateid)] $($t.name)"
    }
}
