Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"mediatype.get","params":{"mediatypeids":["71"],"output":"extend","selectParameters":"extend"},"id":1}'))
$botToken = ($r.result[0].parameters | Where-Object { $_.name -eq 'api_token' }).value

$testUrl = "https://api.telegram.org/bot$botToken/sendMessage"

# Test P1
$bodyP1 = @{
    chat_id = '-1004383937012'
    text = "Prueba de Conectividad Zabbix - Grupo Critico`nCanal: Alertas P1 CRITICAS`nBot: @inframilicic_bot`nEstado: Conectado OK"
}
try {
    $res = Invoke-RestMethod -Uri $testUrl -Method Post -ContentType 'application/json' -Body ($bodyP1 | ConvertTo-Json)
    Write-Output "Envio a P1 OK: $($res.ok)"
} catch {
    Write-Output "Error enviando a P1: $($_.Exception.Message)"
}
