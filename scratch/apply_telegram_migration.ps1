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

Write-Output "=== 1. ACTUALIZANDO USUARIO ADMIN (ID: 1) ==="
# Severities:
# 48 = High (16) + Disaster (32)
# 60 = Warning (4) + Average (8) + High (16) + Disaster (32)
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
    user_medias = $adminMedias
}
Write-Output "Admin user medias updated: $($uRes.userids -join ',')"

Write-Output "=== 2. ACTUALIZANDO USUARIO ML点RENTI (ID: 8) ==="
$matiasMedias = @(
    @{
        mediatypeid = "71"
        sendto = "-1004396424523"
        active = 0
        severity = 60
        period = "1-7,00:00-24:00"
    }
)
$mRes = Call-Zbx 'user.update' @{
    userid = "8"
    user_medias = $matiasMedias
}
Write-Output "mlarenti user medias updated: $($mRes.userids -join ',')"

Write-Output "=== 3. SANEANDO USUARIO SVC_ZABBIX_AUDIT (ID: 7) ==="
# Eliminar media invalido de auditoria
$aRes = Call-Zbx 'user.update' @{
    userid = "7"
    user_medias = @()
}
Write-Output "svc_zabbix_audit medias cleaned: $($aRes.userids -join ',')"

Write-Output "=== 4. ACTUALIZANDO ACCIONES (REMOVIENDO MEDIATYPE 72 OBSOLETO) ==="

# Action 8: TG-P1-Crítico
$act8 = Call-Zbx 'action.get' @{actionids=@("8"); selectOperations='extend'; selectRecoveryOperations='extend'}
$act8_ops = @($act8[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
$act8_rec = @($act8[0].recovery_operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "8"
    operations = $act8_ops
    recovery_operations = $act8_rec
} | Out-Null
Write-Output "Action 8 updated successfully"

# Action 9: TG-P2-Redes
$act9 = Call-Zbx 'action.get' @{actionids=@("9"); selectOperations='extend'}
$act9_ops = @($act9[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "9"
    operations = $act9_ops
} | Out-Null
Write-Output "Action 9 updated successfully"

# Action 10: TG-P2-Plataforma
$act10 = Call-Zbx 'action.get' @{actionids=@("10"); selectOperations='extend'}
$act10_ops = @($act10[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "10"
    operations = $act10_ops
} | Out-Null
Write-Output "Action 10 updated successfully"

# Action 11: TG-P3-Preventivo
$act11 = Call-Zbx 'action.get' @{actionids=@("11"); selectOperations='extend'}
$act11_ops = @($act11[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "11"
    operations = $act11_ops
} | Out-Null
Write-Output "Action 11 updated successfully"

# Action 12: TG-P1-Recordatorios sin reconocimiento
$act12 = Call-Zbx 'action.get' @{actionids=@("12"); selectOperations='extend'}
$act12_ops = @($act12[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "12"
    operations = $act12_ops
} | Out-Null
Write-Output "Action 12 updated successfully"

# Action 14: TG-P2-Plataforma-Recordatorios sin reconocimiento
$act14 = Call-Zbx 'action.get' @{actionids=@("14"); selectOperations='extend'}
$act14_ops = @($act14[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "14"
    operations = $act14_ops
} | Out-Null
Write-Output "Action 14 updated successfully"

# Action 15: TG-P3-MemoryPages-10m-SSJ-HPV01
$act15 = Call-Zbx 'action.get' @{actionids=@("15"); selectOperations='extend'}
$act15_ops = @($act15[0].operations | Where-Object { $_.opmessage.mediatypeid -ne "72" -and $_.opmessage_usr.userid -ne "4" })
Call-Zbx 'action.update' @{
    actionid = "15"
    operations = $act15_ops
} | Out-Null
Write-Output "Action 15 updated successfully"

Write-Output "=== MIGRACION FINALIZADA EXITOSAMENTE ==="
