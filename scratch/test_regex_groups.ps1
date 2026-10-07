$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plain = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plain)

$payload = @{
    jsonrpc = '2.0'
    method = 'history.get'
    params = @{
        itemids = @('96736', '96737')
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
    $dc = if ($_.itemid -eq '96736') { 'SRO-DCO01' } else { 'SRO-DCO02' }
    
    $act = if ($text -match 'A member was added') { '➕ Miembro Añadido' } elseif ($text -match 'A member was removed') { '➖ Miembro Removido' } else { 'Modificación de Grupo' }
    
    $op = if ($text -match 'Subject:[\s\S]*?Account Name:\s+([^\r\n]+)') { $matches[1].Trim() } else { '-' }
    
    $member = if ($text -match 'Member:[\s\S]*?Account Name:\s+([^\r\n]+)') {
        $mRaw = $matches[1].Trim()
        if ($mRaw -match '^CN=([^,]+)') { $matches[1] } else { $mRaw }
    } else { '-' }
    
    $grp = if ($text -match 'Group:[\s\S]*?Group Name:\s+([^\r\n]+)') { $matches[1].Trim() } else { '-' }

    [PSCustomObject]@{
        FechaHora = $dt.ToString("yyyy-MM-dd HH:mm:ss")
        Controlador = $dc
        Accion = $act
        Grupo = $grp
        Miembro = $member
        Operador = $op
    }
} | Format-Table -AutoSize
