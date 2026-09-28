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

$items = Call-Zbx 'item.get' @{
    hostids = @('10699', '10701')
    search = @{ key_ = 'eventlog' }
    output = @('itemid', 'name', 'key_', 'hostid')
}
foreach ($i in $items) {
    $bytes = [Text.Encoding]::UTF8.GetBytes($i.name)
    $hex = ($bytes | ForEach-Object { $_.ToString("X2") }) -join ' '
    Write-Output "Host: $($i.hostid) | ItemID: $($i.itemid) | Name: $($i.name) | Hex: $hex"
}
