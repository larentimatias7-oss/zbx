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

# Update Action 10: TG-P2-Plataforma
$act10 = Call-Zbx 'action.get' @{actionids=@("10"); selectOperations='extend'}
$act10_ops = @($act10[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" } | ForEach-Object { Sanitize-Op $_ })
Call-Zbx 'action.update' @{
    actionid = "10"
    operations = $act10_ops
} | Out-Null
Write-Output "Action 10 updated successfully"

# Update Action 11: TG-P3-Preventivo
$act11 = Call-Zbx 'action.get' @{actionids=@("11"); selectOperations='extend'}
$act11_ops = @($act11[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" } | ForEach-Object { Sanitize-Op $_ })
Call-Zbx 'action.update' @{
    actionid = "11"
    operations = $act11_ops
} | Out-Null
Write-Output "Action 11 updated successfully"

# Update Action 12: TG-P1-Recordatorios sin reconocimiento
$act12 = Call-Zbx 'action.get' @{actionids=@("12"); selectOperations='extend'}
$act12_ops = @($act12[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" } | ForEach-Object { Sanitize-Op $_ })
Call-Zbx 'action.update' @{
    actionid = "12"
    operations = $act12_ops
} | Out-Null
Write-Output "Action 12 updated successfully"

# Update Action 14: TG-P2-Plataforma-Recordatorios sin reconocimiento
$act14 = Call-Zbx 'action.get' @{actionids=@("14"); selectOperations='extend'}
$act14_ops = @($act14[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" } | ForEach-Object { Sanitize-Op $_ })
Call-Zbx 'action.update' @{
    actionid = "14"
    operations = $act14_ops
} | Out-Null
Write-Output "Action 14 updated successfully"

# Update Action 15: TG-P3-MemoryPages-10m-SSJ-HPV01
$act15 = Call-Zbx 'action.get' @{actionids=@("15"); selectOperations='extend'}
$act15_ops = @($act15[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" } | ForEach-Object { Sanitize-Op $_ })
Call-Zbx 'action.update' @{
    actionid = "15"
    operations = $act15_ops
} | Out-Null
Write-Output "Action 15 updated successfully"

Write-Output "=== TODAS LAS ACCIONES HAN SIDO ACTUALIZADAS ==="
