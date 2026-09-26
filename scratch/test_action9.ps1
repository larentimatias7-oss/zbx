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

function Sanitize-Op($op) {
    $cleanOp = @{
        operationtype = [int]$op.operationtype
        esc_step_from = [int]$op.esc_step_from
        esc_step_to = [int]$op.esc_step_to
        esc_period = [string]$op.esc_period
        opmessage = @{
            default_msg = [int]$op.opmessage.default_msg
            mediatypeid = [string]$op.opmessage.mediatypeid
        }
        opmessage_usr = @($op.opmessage_usr | ForEach-Object { @{ userid = [string]$_.userid } })
    }
    if ($op.opmessage_grp -and $op.opmessage_grp.Count -gt 0) {
        $cleanOp.opmessage_grp = @($op.opmessage_grp | ForEach-Object { @{ usrgrpid = [string]$_.usrgrpid } })
    }
    return $cleanOp
}

# Update Action 9: TG-P2-Redes (operations only)
$act9 = Call-Zbx 'action.get' @{actionids=@("9"); selectOperations='extend'}
$act9_ops = @($act9[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" } | ForEach-Object { Sanitize-Op $_ })
Call-Zbx 'action.update' @{
    actionid = "9"
    operations = $act9_ops
} | Out-Null
Write-Output "Action 9 updated successfully"

$check9 = Call-Zbx 'action.get' @{actionids=@("9"); selectOperations='extend'; selectRecoveryOperations='extend'}
Write-Output "Action 9 verification:"
Write-Output "  Remaining Ops: $($check9[0].operations.Count)"
Write-Output "  Recovery Ops: $($check9[0].recovery_operations.Count)"
