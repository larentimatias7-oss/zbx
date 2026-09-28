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

Write-Output "=== 1. BUSCAR HOSTS ==="
$hosts = Call-Zbx 'host.get' @{
    filter = @{ host = @('Zabbix server', 'ProxmoxHome') }
    output = @('hostid', 'host', 'name', 'status')
    selectInterfaces = 'extend'
}
$hosts | Format-Table -AutoSize

Write-Output "=== 2. TRIGGERS LOAD AVERAGE EN ZABBIX SERVER ==="
$zbxHost = $hosts | Where-Object { $_.host -eq 'Zabbix server' -or $_.name -eq 'Zabbix server' }
if ($zbxHost) {
    $triggers = Call-Zbx 'trigger.get' @{
        hostids = $zbxHost.hostid
        search = @{ description = 'Load average' }
        output = @('triggerid', 'description', 'expression', 'priority', 'status', 'value', 'lastchange')
    }
    $triggers | Format-Table -AutoSize

    # Ultimos valores de CPU e items de load
    $items = Call-Zbx 'item.get' @{
        hostids = $zbxHost.hostid
        search = @{ key_ = 'system.cpu' }
        output = @('itemid', 'name', 'key_', 'lastvalue', 'lastclock', 'units')
    }
    $items | Format-Table -AutoSize
}

Write-Output "=== 3. PROXMOX HOME & SWAP ==="
$proxHost = $hosts | Where-Object { $_.host -like '*proxmox*' -or $_.name -like '*proxmox*' }
if ($proxHost) {
    $pTriggers = Call-Zbx 'trigger.get' @{
        hostids = $proxHost.hostid
        search = @{ description = 'Swap' }
        output = @('triggerid', 'description', 'expression', 'priority', 'status', 'value', 'lastchange')
    }
    $pTriggers | Format-Table -AutoSize

    $pItems = Call-Zbx 'item.get' @{
        hostids = $proxHost.hostid
        search = @{ name = 'Swap' }
        output = @('itemid', 'name', 'key_', 'lastvalue', 'lastclock', 'units')
    }
    $pItems | Format-Table -AutoSize
}
