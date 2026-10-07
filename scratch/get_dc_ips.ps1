Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$body = @{
    jsonrpc = '2.0'; method = 'host.get'; id = 1
    params = @{
        hostids = @('10699', '10701', '10715')
        output = @('host', 'name')
        selectInterfaces = @('ip', 'dns', 'port')
    }
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))
foreach ($h in $res.result) {
    Write-Host "$($h.host) -> $($h.interfaces[0].ip)"
}
