$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plain = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plain)

function Call-Zabbix($method, $params) {
    $payload = @{
        jsonrpc = '2.0'
        method  = $method
        params  = $params
        id      = 1
    } | ConvertTo-Json -Depth 5 -Compress
    
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))
    if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
    return $r.result
}

Write-Output "Testing history.push for SRO-DCO02 group items..."
# Item 104288 (group.operator on SRO-DCO02)
# Item 104289 (group.name on SRO-DCO02)
# Item 104290 (group.member on SRO-DCO02)
# Item 104291 (group.action on SRO-DCO02)
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
try {
    $res = Call-Zabbix 'history.push' @(
        @{ itemid = '104288'; value = 'mllarenti.itadmin'; clock = $now },
        @{ itemid = '104289'; value = 'ACL-SAP'; clock = $now },
        @{ itemid = '104290'; value = 'Carlos Ramos'; clock = $now },
        @{ itemid = '104291'; value = 'A member was added to a security-enabled global group.'; clock = $now }
    )
    Write-Output "history.push response: $(ConvertTo-Json $res -Compress)"
}
catch {
    Write-Output "history.push error: $_"
}
