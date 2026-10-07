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

    Write-Output "=== 1. PRE-FLIGHT VERIFICATION ==="
    $hosts = Call-Zabbix 'host.get' @{
        hostids = @('10699', '10701', '10715')
        output = @('hostid', 'host', 'name')
    }
    Write-Output "Hosts verified: $(($hosts | ForEach-Object { "$($_.host) (ID: $($_.hostid))" }) -join ', ')"

    # Check calculated item on SSJ-DCO01
    $ssjRateItem = Call-Zabbix 'item.get' @{
        hostids = @('10715')
        filter = @{ key_ = 'sec.kerberos_preauth.rate_1h' }
        output = @('itemid', 'key_', 'name')
    }

    $createdItems = @()
    if ($ssjRateItem.Count -eq 0) {
        Write-Output "Creating calculated rate item 'sec.kerberos_preauth.rate_1h' on SSJ-DCO01..."
        $createRes = Call-Zabbix 'item.create' @{
            hostid = '10715'
            name = 'Tasa Fallos Preauth Kerberos (1h)'
            key_ = 'sec.kerberos_preauth.rate_1h'
            type = 15 # Calculated
            params = 'count(/SSJ-DCO01/eventlog[Security,,,,4771,,skip],1h)'
            value_type = 3 # Numeric unsigned
            delay = '1m'
            history = '14d'
            trends = '365d'
        }
        $newItemId = $createRes.itemids[0]
        Write-Output "  -> Created item on SSJ-DCO01 with ItemID: $newItemId"
        $createdItems += @{ itemid = $newItemId; hostid = '10715'; key_ = 'sec.kerberos_preauth.rate_1h' }
    } else {
        Write-Output "Item 'sec.kerberos_preauth.rate_1h' already exists on SSJ-DCO01 (ItemID: $($ssjRateItem[0].itemid))."
    }

    Write-Output "`n=== 2. CREATING / VERIFYING KERBEROS LOOP TRIGGERS ==="
    $dcConfigs = @(
        @{ hostid = '10699'; host = 'SRO-DCO01' },
        @{ hostid = '10701'; host = 'SRO-DCO02' },
        @{ hostid = '10715'; host = 'SSJ-DCO01' }
    )

    $triggerName = 'Active Directory: Detección de bucle de autenticación Kerberos (Event 4771)'
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
                expression = "last(/$($dc.host)/sec.kerberos_preauth.rate_1h) > 100"
                recovery_mode = 1
                recovery_expression = "last(/$($dc.host)/sec.kerberos_preauth.rate_1h) < 30"
                priority = 3 # Average (P2 Plataforma)
                opdata = "Usuario: {?last(/$($dc.host)/kerberos.user)} | IP: {?last(/$($dc.host)/kerberos.ip)} | Código: {?last(/$($dc.host)/kerberos.code)} | Tasa: {ITEM.LASTVALUE1}/h"
                comments = "Detección forense automática de ráfagas continuas de preautenticación Kerberos (Event ID 4771 con código 0x18). Indica que una estación de trabajo reintenta autenticación continuamente por credenciales cacheadas viejas o tickets expirados. Verifique klist purge y limpie el Administrador de Credenciales en el puesto afectado."
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
    $rollbackPath = 'c:\zabbix_anti\.zabbix_context\rollback_kerberos_triggers.json'
    @{
        created_at_utc = [DateTime]::UtcNow.ToString('o')
        description = 'Rollback manifest for AD Kerberos Pre-Auth Loop Triggers and Items'
        created_items = $createdItems
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
