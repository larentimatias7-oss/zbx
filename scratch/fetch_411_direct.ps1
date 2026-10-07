$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$plainBytes = $null
try {
    $cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
    $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
    $token = [Text.Encoding]::UTF8.GetString($plainBytes)
    
    $payload = @{
        jsonrpc = '2.0'
        method  = 'dashboard.get'
        params  = @{
            dashboardids = @('411')
            output       = 'extend'
            selectPages  = 'extend'
        }
        id      = 1
    } | ConvertTo-Json -Depth 10 -Compress

    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))
    if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }

    $dest = 'raw/dashboard-411.json'
    @{ generated_at_utc = [DateTime]::UtcNow.ToString('o'); method = 'dashboard.get'; result = $r.result } | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $dest -Encoding UTF8
    Write-Output "Successfully saved dashboard 411 to $dest (Pages: $($r.result[0].pages.Count))"
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
