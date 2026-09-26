Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

function Call-Zbx($method, $params) {
    $body = @{jsonrpc='2.0'; method=$method; params=$params; id=1} | ConvertTo-Json -Depth 20 -Compress
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
    return $r.result
}

Write-Output "=== MEDIATYPES ==="
Call-Zbx 'mediatype.get' @{output=@('mediatypeid','name','type','status')} | Format-Table -AutoSize

Write-Output "=== USERS & MEDIAS ==="
$users = Call-Zbx 'user.get' @{output=@('userid','username','name','surname'); selectMedias='extend'; selectUsrgrps='extend'}
foreach ($u in $users) {
    Write-Output "User: $($u.userid) | $($u.username) ($($u.name) $($u.surname))"
    Write-Output "  Groups: $(($u.usrgrps.name) -join ', ')"
    foreach ($m in $u.medias) {
        Write-Output "  Media: mediaid=$($m.mediaid), mediatypeid=$($m.mediatypeid), sendto=$($m.sendto), active=$($m.active), severity=$($m.severity)"
    }
}
