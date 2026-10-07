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

    Write-Output "=== SSJ-DCO01 (10715) EVENTLOG ITEMS ==="
    $ssjItems = Call-Zabbix 'item.get' @{
        hostids = @('10715')
        search = @{ key_ = 'eventlog' }
        output = @('itemid', 'name', 'key_', 'status')
    }
    $ssjItems | Format-Table -AutoSize
    
    Write-Output "=== SSJ-DCO01 DEPENDENT ITEMS ==="
    $ssjDep = Call-Zabbix 'item.get' @{
        hostids = @('10715')
        filter = @{ type = '18' }
        output = @('itemid', 'name', 'key_', 'master_itemid')
    }
    $ssjDep | Format-Table -AutoSize
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
