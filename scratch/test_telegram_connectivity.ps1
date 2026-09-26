Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"mediatype.get","params":{"mediatypeids":["71"],"output":"extend","selectParameters":"extend"},"id":1}'))

$botToken = ($r.result[0].parameters | Where-Object { $_.name -eq 'api_token' }).value

$testUrl = "https://api.telegram.org/bot$botToken/sendMessage"
$bodyP2P3 = @{
    chat_id = '-1004396424523'
    text = "Prueba de Conectividad Zabbix - Grupo General`nCanal: Alertas General P1 P2 P3`nBot: @inframilicic_bot`nEstado: Conectado OK"
}
try {
    $res = Invoke-RestMethod -Uri $testUrl -Method Post -ContentType 'application/json' -Body ($bodyP2P3 | ConvertTo-Json)
    Write-Output "Envio a General OK: $($res.ok)"
} catch {
    Write-Output "Error enviando a General: $($_.Exception.Message)"
}
