$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plain = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plain)

$payload = @{
    jsonrpc = '2.0'
    method = 'item.get'
    params = @{
        itemids = @('96716', '96718', '96742', '96743', '96762')
        output = @('itemid', 'name', 'key_', 'lastvalue', 'value_type', 'units')
        selectHosts = @('hostid', 'host')
    }
    id = 1
} | ConvertTo-Json -Depth 5 -Compress

$r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))

$r.result | ForEach-Object {
    [PSCustomObject]@{
        Host = $_.hosts[0].host
        ItemID = $_.itemid
        Name = $_.name
        Key = $_.key_
        LastValue = $_.lastvalue
        ValueType = $_.value_type
    }
} | Format-Table -AutoSize
