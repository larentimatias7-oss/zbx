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
$medias = Call-Zbx 'mediatype.get' @{output='extend'}
$medias | Select-Object mediatypeid, name, type, status | Format-Table -AutoSize

Write-Output "=== USER GROUPS ==="
$usrgrps = Call-Zbx 'usergroup.get' @{output=@('usrgrpid','name','users_status')}
$usrgrps | Select-Object usrgrpid, name, users_status | Format-Table -AutoSize

Write-Output "=== USERS & MEDIAS ==="
$users = Call-Zbx 'user.get' @{output=@('userid','username','name','surname'); selectMedias='extend'; selectUsrgrps='extend'}
foreach ($u in $users) {
    [PSCustomObject]@{
        userid = $u.userid
        username = $u.username
        groups = ($u.usrgrps.name -join ', ')
        medias = (($u.medias | ForEach-Object { "mediaid:$($_.mediaid) mediatypeid:$($_.mediatypeid) sendto:$($_.sendto) active:$($_.active) severity:$($_.severity)" }) -join " ; ")
    } | Format-List
}

Write-Output "=== ACTIONS (TRIGGER ACTIONS) ==="
$actions = Call-Zbx 'action.get' @{
    output = @('actionid', 'name', 'status', 'esc_period', 'eventsource')
    selectOperations = 'extend'
    selectRecoveryOperations = 'extend'
    selectFilter = 'extend'
    filter = @{eventsource = 0}
}
foreach ($a in $actions) {
    Write-Output "--- Action ID $($a.actionid): $($a.name) (Status: $($a.status), EscPeriod: $($a.esc_period)) ---"
    Write-Output "Filter EvalType: $($a.filter.evaltype)"
    foreach ($c in $a.filter.conditions) {
        Write-Output "  Condition: type=$($c.conditiontype), operator=$($c.operator), value=$($c.value), value2=$($c.value2)"
    }
    Write-Output "Operations:"
    foreach ($op in $a.operations) {
        Write-Output "  Op ID: $($op.operationid), Type: $($op.operationtype), esc_step_from: $($op.esc_step_from), esc_step_to: $($op.esc_step_to), esc_period: $($op.esc_period)"
        if ($op.opmessage_grp) {
            Write-Output "    Message to Groups: $(($op.opmessage_grp.usrgrpid) -join ', ')"
        }
        if ($op.opmessage_usr) {
            Write-Output "    Message to Users: $(($op.opmessage_usr.userid) -join ', ')"
        }
        if ($op.opmessage) {
            Write-Output "    Mediatypeid: $($op.opmessage.mediatypeid), default_msg: $($op.opmessage.default_msg)"
        }
    }
}
