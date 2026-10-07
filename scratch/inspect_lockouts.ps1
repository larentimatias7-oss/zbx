Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

$body = @{
    jsonrpc = '2.0'; method = 'history.get'; id = 1
    params = @{
        itemids = @('83820', '83821')
        history = 4
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 20
    }
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))

$grouped = @{}
foreach ($row in $res.result) {
    $c = $row.clock
    if (-not $grouped.ContainsKey($c)) {
        $grouped[$c] = @{
            clock = $c
            time = [DateTimeOffset]::FromUnixTimeSeconds([int64]$c).ToOffset([TimeSpan]::FromHours(-3)).ToString('yyyy-MM-dd HH:mm:ss')
        }
    }
    if ($row.itemid -eq '83820') { $grouped[$c]['user'] = $row.value }
    if ($row.itemid -eq '83821') { $grouped[$c]['pc'] = $row.value }
}

$grouped.Values | Sort-Object clock -Descending | Format-Table clock, time, user, pc -AutoSize
