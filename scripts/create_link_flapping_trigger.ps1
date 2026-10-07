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

    Write-Output "=== CREATING LINK FLAPPING TRIGGER ON SRO-G01-P100-ACC01 ==="
    $triggerName = 'TP-LINK: Interface gigabitEthernet 1/0/4(): Link Flapping recurrente (>6 cambios/hora)'
    
    $existing = Call-Zabbix 'trigger.get' @{
        hostids = @('10798')
        filter = @{ description = $triggerName }
        output = @('triggerid', 'description', 'status')
    }

    $createdTriggers = @()
    if ($existing.Count -gt 0) {
        Write-Output "Trigger already exists with TriggerID: $($existing[0].triggerid)"
    } else {
        $tPayload = @{
            description = $triggerName
            expression = 'count(/SRO-G01-P100-ACC01/net.if.status[ifOperStatus.49156], 1h, "eq", 2) > 4'
            recovery_mode = 1
            recovery_expression = 'count(/SRO-G01-P100-ACC01/net.if.status[ifOperStatus.49156], 1h, "eq", 2) <= 1'
            priority = 2 # Warning (P3 Preventivo)
            opdata = 'Cambios de estado (1h): {ITEM.LASTVALUE1}'
            comments = "Detección automática de puerto intermitente / Link Flapping. El enlace subió y bajó más de 6 veces en la última hora. Provoca tormentas de Spanning Tree (TCN) y pérdida de conectividad. Inspeccionar cable UTP, conector RJ45, roseta o suspensión del equipo final."
            tags = @(
                @{ tag = 'team'; value = 'redes' },
                @{ tag = 'tier'; value = 'access' },
                @{ tag = 'component'; value = 'switch' },
                @{ tag = 'scope'; value = 'availability' }
            )
        }
        $cRes = Call-Zabbix 'trigger.create' $tPayload
        $newTId = $cRes.triggerids[0]
        Write-Output "  -> Created trigger with TriggerID: $newTId"
        $createdTriggers += @{ triggerid = $newTId; host = 'SRO-G01-P100-ACC01'; description = $triggerName }
    }

    # Save Rollback file
    $rollbackPath = 'c:\zabbix_anti\.zabbix_context\rollback_link_flapping_triggers.json'
    @{
        created_at_utc = [DateTime]::UtcNow.ToString('o')
        description = 'Rollback manifest for Switch Link Flapping trigger'
        created_triggers = $createdTriggers
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $rollbackPath -Encoding UTF8

    Write-Output "Rollback manifest written to: $rollbackPath"
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
