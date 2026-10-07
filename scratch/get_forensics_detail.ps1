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

    Write-Output "=== 1. WIDGET ITEMS DETAILS ==="
    $items = Call-Zabbix 'item.get' @{
        itemids = @('83820', '83821', '96736', '96737')
        output = @('itemid', 'hostid', 'name', 'key_', 'value_type', 'lastvalue', 'type', 'master_itemid')
        selectPreprocessing = 'extend'
        selectHosts = @('hostid', 'host', 'name')
    }
    foreach ($i in $items) {
        [PSCustomObject]@{
            Host = $i.hosts[0].host
            ItemID = $i.itemid
            Name = $i.name
            Key = $i.key_
            Type = $i.type
            MasterItem = $i.master_itemid
            LastValue = if ($i.lastvalue.Length -gt 80) { $i.lastvalue.Substring(0, 80) + '...' } else { $i.lastvalue }
            Preprocessing = ($i.preprocessing | ForEach-Object { "$($_.type): $($_.params)" }) -join ' | '
        } | Format-List
    }

    Write-Output "`n=== 2. MASTER ITEMS FOR 83820 / 83821 & 96736 / 96737 ==="
    $masterIds = ($items | Where-Object { $_.master_itemid -ne '0' -and $_.master_itemid } | ForEach-Object { $_.master_itemid }) | Select-Object -Unique
    if ($masterIds) {
        $mItems = Call-Zabbix 'item.get' @{
            itemids = $masterIds
            output = @('itemid', 'hostid', 'name', 'key_', 'lastvalue', 'type')
            selectHosts = @('hostid', 'host')
        }
        foreach ($m in $mItems) {
            Write-Output "Master Item [$($m.itemid)] on $($m.hosts[0].host): $($m.name) -> Key: $($m.key_)"
        }
    }

    Write-Output "`n=== 3. SEARCH SIMILAR ITEMS ON SRO-DCO02 (10701) & SSJ-DCO01 (10715) ==="
    $similar = Call-Zabbix 'item.get' @{
        hostids = @('10699', '10701', '10715')
        filter = @{
            key_ = @('locked.user', 'locked.pc', 'eventlog[Security,,,"4740"]', 'eventlog[Security,,,"4728|4732|4756"]')
        }
        output = @('itemid', 'hostid', 'name', 'key_', 'lastvalue')
        selectHosts = @('hostid', 'host')
    }
    foreach ($s in $similar) {
        Write-Output "Host: $($s.hosts[0].host) (ID: $($s.hostid)) | Item: $($s.itemid) | Key: $($s.key_) | Name: $($s.name)"
    }

    Write-Output "`n=== 4. RECENT HISTORY OF LOCKOUTS (83820, 83821, 96714, 96715) ==="
    $lockHistory = Call-Zabbix 'history.get' @{
        itemids = @('83820', '83821', '96714', '96715')
        history = 4 # Text
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 10
    }
    foreach ($h in $lockHistory) {
        $dt = (Get-Date "1970-01-01 00:00:00Z").AddSeconds([long]$h.clock).ToLocalTime()
        Write-Output "[$dt] Item: $($h.itemid) -> Value: $($h.value)"
    }

    Write-Output "`n=== 5. RECENT HISTORY OF PRIVILEGED GROUPS (96736, 96737) ==="
    $grpHistory = Call-Zabbix 'history.get' @{
        itemids = @('96736', '96737')
        history = 2 # Log or 4 Text
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 10
    }
    if ($grpHistory.Count -eq 0) {
        # try history = 4 (text) or 0/1/etc
        $grpHistory = Call-Zabbix 'history.get' @{
            itemids = @('96736', '96737')
            history = 4
            sortfield = 'clock'
            sortorder = 'DESC'
            limit = 10
        }
    }
    foreach ($g in $grpHistory) {
        $dt = (Get-Date "1970-01-01 00:00:00Z").AddSeconds([long]$g.clock).ToLocalTime()
        Write-Output "[$dt] Item: $($g.itemid) -> Value: $($g.value)"
    }
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
