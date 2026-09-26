$backup = Get-Content 'c:\zabbix_anti\backups\telegram_alert_migration_backup_20260926.json' -Raw | ConvertFrom-Json
$act9 = $backup.actions | Where-Object { $_.actionid -eq "9" }
$act9.recovery_operations | ConvertTo-Json -Depth 10
