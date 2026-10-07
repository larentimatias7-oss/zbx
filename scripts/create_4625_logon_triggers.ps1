$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$plainBytes = $null

try {
    $cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
    $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
    $token = [Text.Encoding]::UTF8.GetString($plainBytes)
    
    function Call-Zabbix($method, $params) {
        $payload = @{
            jsonrpc = '2.0'
            method  = $method
            params  = $params
            id      = 1
        } | ConvertTo-Json -Depth 15 -Compress
        
        $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))
        if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
        return $r.result
    }

    Write-Output "=== 1. PRE-FLIGHT VERIFICATION FOR 4625 TRIGGERS ==="
    $dcConfigs = @(
        @{ hostid = '10699'; host = 'SRO-DCO01' },
        @{ hostid = '10701'; host = 'SRO-DCO02' },
        @{ hostid = '10715'; host = 'SSJ-DCO01' }
    )

    # Verify sec.failed_logons.rate_1h on all 3 DCs
    foreach ($dc in $dcConfigs) {
        $rateItem = Call-Zabbix 'item.get' @{
            hostids = @($dc.hostid)
            filter = @{ key_ = 'sec.failed_logons.rate_1h' }
            output = @('itemid', 'key_', 'name')
        }
        if ($rateItem.Count -eq 0) {
            Write-Output "Creating calculated item 'sec.failed_logons.rate_1h' on $($dc.host)..."
            $cRes = Call-Zabbix 'item.create' @{
                hostid = $dc.hostid
                name = "Tasa de Fallos de Autenticación (1h) · $($dc.host)"
                key_ = 'sec.failed_logons.rate_1h'
                type = 15 # Calculated
                params = "count(/$($dc.host)/eventlog[Security,,,,4625,,skip],1h)"
                value_type = 3
                delay = '1m'
                history = '14d'
                trends = '365d'
            }
            Write-Output "  -> Created with ItemID: $($cRes.itemids[0])"
        } else {
            Write-Output "Item 'sec.failed_logons.rate_1h' exists on $($dc.host) (ItemID: $($rateItem[0].itemid))."
        }
    }

    Write-Output "`n=== 2. CREATING / VERIFYING LOGON BURST TRIGGERS ==="
    $triggerName = 'Active Directory: Ráfaga de fallos de inicio de sesión / Fuerza bruta (Event 4625)'
    $createdTriggers = @()

    foreach ($dc in $dcConfigs) {
        $existing = Call-Zabbix 'trigger.get' @{
            hostids = @($dc.hostid)
            filter = @{ description = $triggerName }
            output = @('triggerid', 'description', 'expression', 'priority', 'status')
        }

        if ($existing.Count -gt 0) {
            Write-Output "Trigger already exists on $($dc.host) (TriggerID: $($existing[0].triggerid))."
        } else {
            Write-Output "Creating alert trigger on $($dc.host)..."
            $triggerPayload = @{
                description = $triggerName
                expression = "last(/$($dc.host)/sec.failed_logons.rate_1h) > 40 and length(last(/$($dc.host)/logon.user)) >= 0 and length(last(/$($dc.host)/logon.ip)) >= 0 and length(last(/$($dc.host)/logon.status)) >= 0"
                recovery_mode = 1
                recovery_expression = "last(/$($dc.host)/sec.failed_logons.rate_1h) < 15"
                priority = 3 # Average (P2 Plataforma)
                opdata = "Usuario: {ITEM.LASTVALUE2} | IP: {ITEM.LASTVALUE3} | SubStatus: {ITEM.LASTVALUE4} | Tasa: {ITEM.LASTVALUE1}"
                comments = "Detección automática de ráfaga anómala o intento de fuerza bruta de inicio de sesión (Event 4625). Indica múltiples intentos fallidos por contraseña errónea o usuario inexistente desde una IP o endpoint específico. Puede ocasionar bloqueos de cuenta."
                tags = @(
                    @{ tag = 'team'; value = 'plataforma' },
                    @{ tag = 'tier'; value = 'core' },
                    @{ tag = 'component'; value = 'server' },
                    @{ tag = 'scope'; value = 'availability' }
                )
            }
            $tRes = Call-Zabbix 'trigger.create' $triggerPayload
            $newTId = $tRes.triggerids[0]
            Write-Output "  -> Created trigger on $($dc.host) with TriggerID: $newTId"
            $createdTriggers += @{ triggerid = $newTId; host = $dc.host; hostid = $dc.hostid; description = $triggerName }
        }
    }

    # Save Rollback file
    $rollbackPath = 'c:\zabbix_anti\.zabbix_context\rollback_logon_4625_triggers.json'
    @{
        created_at_utc = [DateTime]::UtcNow.ToString('o')
        description = 'Rollback manifest for AD Failed Logon 4625 Burst Triggers'
        created_triggers = $createdTriggers
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $rollbackPath -Encoding UTF8

    Write-Output "`n=== 3. POST-CREATION VERIFICATION ==="
    $allTriggers = Call-Zabbix 'trigger.get' @{
        hostids = @('10699', '10701', '10715')
        filter = @{ description = $triggerName }
        output = @('triggerid', 'description', 'expression', 'priority', 'status', 'value', 'opdata')
        selectHosts = @('host')
    }
    foreach ($tr in $allTriggers) {
        $statusStr = if ($tr.value -eq '1') { 'PROBLEM (ALERTA DISPARADA)' } else { 'OK (NORMAL)' }
        Write-Output "Trigger [$($tr.triggerid)] on $($tr.hosts[0].host): Priority $($tr.priority) | State: $statusStr"
        Write-Output "  Expr: $($tr.expression)"
        Write-Output "  OpData: $($tr.opdata)"
    }

    Write-Output "`nRollback manifest successfully written to: $rollbackPath"
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
