Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$body = @{
    jsonrpc = '2.0'
    method = 'item.get'
    params = @{
        output = @('itemid', 'name', 'key_', 'lastvalue', 'lastclock', 'value_type', 'type')
        hostids = @('10699', '10701', '10715')
        filter = @{}
    }
    id = 1
} | ConvertTo-Json -Depth 10

$res = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))
$items = $res.result | Where-Object { 
    $_.name -match 'lock|logon|login|user|grupo|group|preauth|ntlm|kerberos|4625|4740|4728|operador|miembro|accion|fallo' 
}
$items | Select-Object itemid, name, key_, type, lastvalue | Format-Table -AutoSize
