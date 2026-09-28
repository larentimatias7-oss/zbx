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

Write-Output "=== ITEMS EVENTLOG EN CONTROLADORES DE DOMINIO ==="
$dcHosts = Call-Zbx 'host.get' @{
    filter = @{ host = @('SRO-DCO01', 'SRO-DCO02', 'SSJ-DCO01') }
    output = @('hostid', 'host', 'name')
}

foreach ($h in $dcHosts) {
    Write-Output "`n--- Host: $($h.name) ($($h.host), ID: $($h.hostid)) ---"
    $items = Call-Zbx 'item.get' @{
        hostids = $h.hostid
        search = @{ key_ = 'eventlog' }
        output = @('itemid', 'name', 'key_', 'status', 'state', 'value_type', 'lastvalue', 'lastclock', 'error')
    }
    foreach ($i in $items) {
        $d = if ($i.lastclock -and $i.lastclock -ne "0") { [DateTimeOffset]::FromUnixTimeSeconds([int64]$i.lastclock).ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss') } else { "nunca" }
        Write-Output "Item ID: $($i.itemid) | Status: $($i.status) | State: $($i.state) | Name: $($i.name)"
        Write-Output "  Key: $($i.key_)"
        Write-Output "  LastClock: $d | LastValue: $($i.lastvalue)"
        if ($i.error) { Write-Output "  ERROR: $($i.error)" }
    }
}
