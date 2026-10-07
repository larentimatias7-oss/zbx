<#
.SYNOPSIS
    Crea los ítems dependientes logon.dc en los Domain Controllers para identificar el DC en telemetría forense 4625.
.DESCRIPTION
    Extrae o asigna el DC de autenticación correspondiente (SRO-DCO01, SRO-DCO02, SSJ-DCO01)
    a partir del evento de auditoría 4625 (Eventlog Security).
#>

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security

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

    Write-Host "=== 1. VERIFICANDO ITEMS logon.dc ===" -ForegroundColor Cyan
    $existing = Call-Zabbix 'item.get' @{
        filter = @{ key_ = 'logon.dc' }
        selectHosts = @('hostid', 'host')
    }

    $dcs = @(
        @{ hostid = '10699'; host = 'SRO-DCO01'; master = '83715' },
        @{ hostid = '10701'; host = 'SRO-DCO02'; master = '96713' },
        @{ hostid = '10715'; host = 'SSJ-DCO01'; master = '101380' }
    )

    foreach ($dc in $dcs) {
        $found = $existing | Where-Object { $_.hosts[0].hostid -eq $dc.hostid }
        if (-not $found) {
            Write-Host "Creando logon.dc en $($dc.host)..." -ForegroundColor Yellow
            $created = Call-Zabbix 'item.create' @{
                hostid        = $dc.hostid
                name          = 'Controlador de Dominio Fallo Logon'
                key_          = 'logon.dc'
                type          = 18 # Dependent item
                master_itemid = $dc.master
                value_type    = 4 # Text
                history       = '14d'
                preprocessing = @(
                    @{
                        type                 = '21' # JavaScript
                        params               = "return '$($dc.host)';"
                        error_handler        = '0'
                        error_handler_params = ''
                    }
                )
            }
            Write-Host "Creado exitosamente en $($dc.host): $($created.itemids -join ',')" -ForegroundColor Green
        } else {
            Write-Host "Item logon.dc ya existe en $($dc.host) (ID: $($found.itemid))" -ForegroundColor Green
        }
    }
}
catch {
    Write-Error "Fallo en ejecución: $_"
}
