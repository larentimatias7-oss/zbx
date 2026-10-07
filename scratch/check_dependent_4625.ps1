Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$body = @{
    jsonrpc = '2.0'; method = 'item.get'; id = 1
    params = @{
        output = @('itemid', 'name', 'key_', 'type', 'master_itemid')
        filter = @{ master_itemid = @('83715', '96713', '101380') }
    }
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))
Write-Host "Dependent items count for 4625: $($res.result.Count)"
$res.result | Format-Table -AutoSize
