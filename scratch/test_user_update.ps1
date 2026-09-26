Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

function Call-Zbx($method, $params) {
    $body = @{jsonrpc='2.0'; method=$method; params=$params; id=1} | ConvertTo-Json -Depth 30 -Compress
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
    if ($r.error) {
        throw ($r.error | ConvertTo-Json -Compress)
    }
    return $r.result
}

$adminMedias = @(
    @{
        mediatypeid = "71"
        sendto = "-1004383937012"
        active = 0
        severity = 48
        period = "1-7,00:00-24:00"
    },
    @{
        mediatypeid = "71"
        sendto = "-1004396424523"
        active = 0
        severity = 60
        period = "1-7,00:00-24:00"
    }
)
$uRes = Call-Zbx 'user.update' @{
    userid = "1"
    medias = $adminMedias
}
Write-Output "Admin user medias updated: $($uRes.userids -join ',')"
