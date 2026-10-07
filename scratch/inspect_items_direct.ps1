$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$plainBytes = $null
try {
    $cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
    $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
    $token = [Text.Encoding]::UTF8.GetString($plainBytes)
    
    function Call-Zabbix($method, $params) {
        $payload = @{
            jsonrpc = '2.0'
            method  = $method
            params  = $params
            id      = 1
        } | ConvertTo-Json -Depth 15 -Compress
        
        $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))
        if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
        return $r.result
    }

    Write-Output "=== 1. DETAIL OF ITEMS 83820, 83821, 96736, 96737 ==="
    $items = Call-Zabbix 'item.get' @{
        itemids = @('83820', '83821', '96736', '96737')
        output = @('itemid', 'hostid', 'name', 'key_', 'value_type', 'lastvalue', 'lastclock', 'status', 'type', 'master_itemid')
        selectPreprocessing = 'extend'
        selectHosts = @('hostid', 'host', 'name')
    }
    $items | ForEach-Object {
        $hostName = $_.hosts[0].host
        Write-Output "Host: $hostName (ID: $($_.hostid)) | Item: $($_.itemid) | Name: $($_.name)"
        Write-Output "  Key: $($_.key_) | ValueType: $($_.value_type) | MasterItem: $($_.master_itemid)"
        Write-Output "  LastValue: $($_.lastvalue)"
        Write-Output "  Preprocessing: $(ConvertTo-Json $_.preprocessing -Compress)"
        Write-Output "----------------------------------------------------"
    }

    Write-Output "`n=== 2. ALL SECURITY & FORENSIC ITEMS ON ALL 3 DCS (10699, 10701, 10715) ==="
    $dcItems = Call-Zabbix 'item.get' @{
        hostids = @('10699', '10701', '10715')
        search = @{
            key_ = 'eventlog'
        }
        output = @('itemid', 'hostid', 'name', 'key_', 'lastvalue', 'value_type', 'status')
        selectHosts = @('hostid', 'host')
    }
    $dcItems | ForEach-Object {
        Write-Output "Host: $($_.hosts[0].host) | ItemID: $($_.itemid) | Name: $($_.name)"
        Write-Output "  Key: $($_.key_)"
        Write-Output "  LastValue: $($_.lastvalue)"
        Write-Output "----------------------------------------------------"
    }

    Write-Output "`n=== 3. DEPENDENT ITEMS ON 10699, 10701, 10715 ==="
    $depItems = Call-Zabbix 'item.get' @{
        hostids = @('10699', '10701', '10715')
        filter = @{
            type = '18'
        }
        output = @('itemid', 'hostid', 'name', 'key_', 'master_itemid', 'lastvalue')
        selectPreprocessing = 'extend'
        selectHosts = @('hostid', 'host')
    }
    $depItems | ForEach-Object {
        Write-Output "Host: $($_.hosts[0].host) | ItemID: $($_.itemid) | Name: $($_.name) (Master: $($_.master_itemid))"
        Write-Output "  Key: $($_.key_)"
        Write-Output "  LastValue: $($_.lastvalue)"
        Write-Output "  Preprocessing: $(ConvertTo-Json $_.preprocessing -Compress)"
        Write-Output "----------------------------------------------------"
    }
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
