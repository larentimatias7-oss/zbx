Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$body = @{
    jsonrpc = '2.0'; method = 'item.get'; id = 1
    params = @{
        output = @('itemid', 'name', 'key_', 'lastvalue', 'params')
        itemids = @('96718', '96719', '96720', '96743')
    }
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))
$res.result | Format-Table itemid, name, key_, lastvalue, params -AutoSize
