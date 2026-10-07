$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plain = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plain)

$payload = @{
    jsonrpc = '2.0'
    method = 'history.get'
    params = @{
        itemids = @('83274', '96712', '101379') # Master items for Event 4740 on DCO01, DCO02, SSJ-DCO01
        history = 2
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 20
    }
    id = 1
} | ConvertTo-Json -Depth 5 -Compress

$r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))

$r.result | ForEach-Object {
    $text = $_.value
    $dt = (Get-Date "1970-01-01 00:00:00Z").AddSeconds([long]$_.clock).ToLocalTime()
    $dc = switch ($_.itemid) {
        '83274' { 'SRO-DCO01' }
        '96712' { 'SRO-DCO02' }
        '101379' { 'SSJ-DCO01' }
        default { $_.itemid }
    }
    
    $user = if ($text -match 'Account That Was Locked Out:[\s\S]*?Account Name:\s+([^\r\n]+)') { $matches[1].Trim() } else { '-' }
    $pc = if ($text -match 'Caller Computer Name:\s+([^\r\n]+)') { $matches[1].Trim() } else { '-' }

    [PSCustomObject]@{
        FechaHora = $dt.ToString("yyyy-MM-dd HH:mm:ss")
        Controlador = $dc
        UsuarioBloqueado = $user
        EquipoOrigen = $pc
        Estado = "Cuenta Bloqueada (AD 4740)"
    }
} | Format-Table -AutoSize
