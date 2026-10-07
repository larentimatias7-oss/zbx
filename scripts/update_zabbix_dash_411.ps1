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
        } | ConvertTo-Json -Depth 20 -Compress
        
        $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))
        if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
        return $r.result
    }

    Write-Output "1. Fetching live dashboard 411 from Zabbix..."
    $dashRes = Call-Zabbix 'dashboard.get' @{
        dashboardids = @('411')
        output = 'extend'
        selectPages = 'extend'
    }
    $d = $dashRes[0]

    # Backup
    $backupPath = "c:\zabbix_anti\.zabbix_context\dashboards\backups\dashboard_411_backup_pre_soc_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    $d | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $backupPath -Encoding UTF8
    Write-Output "Backup saved to: $backupPath"

    # Find Widget 87114 on Page 1
    $p1 = $d.pages[0]
    $w87114 = $p1.widgets | Where-Object { $_.widgetid -eq '87114' }

    if ($w87114) {
        Write-Output "Updating Widget 87114 (Auditoría Forense: Modificación de Grupos Privilegiados)..."
        
        # New fields for widget 87114:
        # layout: 1, show_timestamp: 1, show_column_header: 1, show_lines: 15, rf_rate: 60, time_period: now-7d to now
        # Column 0: Acción (104287)
        # Column 1: Grupo Modificado (104285)
        # Column 2: Miembro Afectado (104286)
        # Column 3: Operador Responsable (104284)
        # Column 4: Log Crudo SRO-DCO01 (96736)
        # Column 5: Log Crudo SRO-DCO02 (96737)
        # override_hostid._reference: DCNAV._hostid
        
        $newFields = @(
            @{ type = 1; name = 'reference'; value = 'GRPAU' },
            @{ type = 1; name = 'override_hostid._reference'; value = 'DCNAV._hostid' },
            @{ type = 0; name = 'layout'; value = '1' },
            @{ type = 0; name = 'show_timestamp'; value = '1' },
            @{ type = 0; name = 'show_column_header'; value = '1' },
            @{ type = 0; name = 'show_lines'; value = '15' },
            @{ type = 0; name = 'rf_rate'; value = '60' },
            @{ type = 1; name = 'time_period.from'; value = 'now-7d' },
            @{ type = 1; name = 'time_period.to'; value = 'now' },

            # Col 0: Acción
            @{ type = 1; name = 'columns.0.name'; value = 'Acción' },
            @{ type = 4; name = 'columns.0.itemid'; value = '104287' },
            @{ type = 0; name = 'columns.0.display'; value = '5' },
            @{ type = 0; name = 'columns.0.max_length'; value = '45' },

            # Col 1: Grupo Modificado
            @{ type = 1; name = 'columns.1.name'; value = 'Grupo Modificado' },
            @{ type = 4; name = 'columns.1.itemid'; value = '104285' },
            @{ type = 0; name = 'columns.1.display'; value = '5' },
            @{ type = 0; name = 'columns.1.max_length'; value = '40' },

            # Col 2: Miembro Afectado
            @{ type = 1; name = 'columns.2.name'; value = 'Miembro Afectado' },
            @{ type = 4; name = 'columns.2.itemid'; value = '104286' },
            @{ type = 0; name = 'columns.2.display'; value = '5' },
            @{ type = 0; name = 'columns.2.max_length'; value = '40' },

            # Col 3: Operador Responsable
            @{ type = 1; name = 'columns.3.name'; value = 'Operador Responsable' },
            @{ type = 4; name = 'columns.3.itemid'; value = '104284' },
            @{ type = 0; name = 'columns.3.display'; value = '5' },
            @{ type = 0; name = 'columns.3.max_length'; value = '35' },

            # Col 4: Log Crudo SRO-DCO01
            @{ type = 1; name = 'columns.4.name'; value = 'Log Crudo DCO01' },
            @{ type = 4; name = 'columns.4.itemid'; value = '96736' },
            @{ type = 0; name = 'columns.4.display'; value = '5' },
            @{ type = 0; name = 'columns.4.max_length'; value = '80' },

            # Col 5: Log Crudo SRO-DCO02
            @{ type = 1; name = 'columns.5.name'; value = 'Log Crudo DCO02' },
            @{ type = 4; name = 'columns.5.itemid'; value = '96737' },
            @{ type = 0; name = 'columns.5.display'; value = '5' },
            @{ type = 0; name = 'columns.5.max_length'; value = '80' }
        )

        $w87114.fields = $newFields
    }

    Write-Output "2. Updating Dashboard 411 in Zabbix production..."
    $updateParams = @{
        dashboardid = $d.dashboardid
        name = $d.name
        display_period = $d.display_period
        auto_start = $d.auto_start
        pages = $d.pages
    }

    $updateRes = Call-Zabbix 'dashboard.update' $updateParams
    Write-Output "SUCCESS: Dashboard 411 updated! Returned IDs: $(($updateRes.dashboardids) -join ', ')"
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
