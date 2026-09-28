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

Write-Output "=== ITEM HOUSEKEEPER BUSY ==="
$item = Call-Zbx 'item.get' @{
    hostids = '10084' # Zabbix server
    search = @{ key_ = 'housekeeper' }
    output = @('itemid', 'name', 'key_', 'lastvalue', 'lastclock', 'units')
}
$item | Format-Table -AutoSize

Write-Output "=== HISTORIAL RECIENTE HOUSEKEEPER (ULTIMAS 10 MEDICIONES) ==="
if ($item) {
    $hist = Call-Zbx 'history.get' @{
        itemids = $item[0].itemid
        history = 0 # numeric float
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 10
    }
    foreach ($h in $hist) {
        $d = [DateTimeOffset]::FromUnixTimeSeconds([int64]$h.clock).ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss')
        Write-Output "$d -> $($h.value) %"
    }
}

Write-Output "=== HOUSEKEEPING SETTINGS EN ZABBIX UI ==="
$hk = Call-Zbx 'housekeeping.get' @{}
$hk | Format-List
