Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

function Call-Zbx($method, $params) {
    $body = @{jsonrpc='2.0'; method=$method; params=$params; id=1} | ConvertTo-Json -Depth 30 -Compress
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
    return $r.result
}

Write-Output "============================================================"
Write-Output "VERIFICACION POST-MIGRACION: USUARIOS Y MEDIAS"
Write-Output "============================================================"
$users = Call-Zbx 'user.get' @{userids=@("1", "8", "7"); output=@('userid','username','name'); selectMedias='extend'}
foreach ($u in $users) {
    Write-Output "Usuario: $($u.userid) - $($u.username) ($($u.name))"
    foreach ($m in $u.medias) {
        $sevName = switch ($m.severity) {
            48 { "High + Disaster (P1)" }
            60 { "Warning + Average + High + Disaster (P1+P2+P3)" }
            default { "Sev: $($m.severity)" }
        }
        Write-Output "  -> Media ID: $($m.mediaid) | Type: $($m.mediatypeid) | SendTo: $($m.sendto) | Filtro Severidad: $sevName | Activo: $($m.active)"
    }
    if (-not $u.medias -or $u.medias.Count -eq 0) {
        Write-Output "  -> Sin medias configurados (Limpio)"
    }
}

Write-Output "`n============================================================"
Write-Output "VERIFICACION POST-MIGRACION: ACCIONES (TRIGGER ACTIONS)"
Write-Output "============================================================"
$actions = Call-Zbx 'action.get' @{
    actionids = @("8", "9", "10", "11", "12", "14", "15")
    output = @('actionid', 'name', 'status', 'esc_period')
    selectOperations = 'extend'
    selectRecoveryOperations = 'extend'
}
foreach ($a in $actions) {
    Write-Output "Accion [$($a.actionid)] $($a.name) (Estado: $($a.status == 0 ? 'ENABLED' : 'DISABLED'), Periodo: $($a.esc_period))"
    Write-Output "  Operaciones ($($a.operations.Count)):"
    foreach ($op in $a.operations) {
        Write-Output "    Paso $($op.esc_step_from)-$($op.esc_step_to) | Mediatype: $($op.opmessage.mediatypeid) | Usuario Destino: $($op.opmessage_usr.userid)"
    }
    if ($a.recovery_operations) {
        Write-Output "  Operaciones de Recuperacion ($($a.recovery_operations.Count)):"
        foreach ($rop in $a.recovery_operations) {
            Write-Output "    Tipo: $($rop.operationtype) | Mediatype: $($rop.opmessage.mediatypeid) | Usuario Destino: $($rop.opmessage_usr.userid)"
        }
    }
}
