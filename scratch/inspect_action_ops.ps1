$backup = Get-Content 'c:\zabbix_anti\backups\telegram_alert_migration_backup_20260926.json' -Raw | ConvertFrom-Json

foreach ($a in $backup.actions) {
    Write-Output "========================================"
    Write-Output "Action ID: $($a.actionid) | Name: $($a.name)"
    Write-Output "Operations:"
    foreach ($op in $a.operations) {
        Write-Output "  Op ID: $($op.operationid) | type: $($op.operationtype) | step_from: $($op.esc_step_from) | step_to: $($op.esc_step_to) | mediatypeid: $($op.opmessage.mediatypeid) | users: $(($op.opmessage_usr.userid) -join ',') | groups: $(($op.opmessage_grp.usrgrpid) -join ',')"
    }
    Write-Output "Recovery Operations:"
    foreach ($rop in $a.recovery_operations) {
        Write-Output "  RecOp ID: $($rop.operationid) | type: $($rop.operationtype) | mediatypeid: $($rop.opmessage.mediatypeid) | users: $(($rop.opmessage_usr.userid) -join ',') | groups: $(($rop.opmessage_grp.usrgrpid) -join ',')"
    }
    Write-Output "Update Operations:"
    foreach ($uop in $a.update_operations) {
        Write-Output "  UpdOp ID: $($uop.operationid) | type: $($uop.operationtype) | mediatypeid: $($uop.opmessage.mediatypeid) | users: $(($uop.opmessage_usr.userid) -join ',') | groups: $(($uop.opmessage_grp.usrgrpid) -join ',')"
    }
}
