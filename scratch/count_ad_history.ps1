Add-Type -AssemblyName System.Security
$cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
$plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
$token = [Text.Encoding]::UTF8.GetString($plainBytes)

function Call-Zbx($method, $params) {
    $body = @{jsonrpc='2.0'; method=$method; params=$params; id=1} | ConvertTo-Json -Depth 30 -Compress
    $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
    if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
    return $r.result
}

Write-Output "=== CONTEO DE LOGS EN HISTORIAL DE ZABBIX ==="
$itemIds = @(
    @{ name = "User locked (4740)"; id = "83274" },
    @{ name = "User locked DCO02 (4740)"; id = "96712" },
    @{ name = "Failed Login (4625)"; id = "83715" },
    @{ name = "Failed Login DCO02 (4625)"; id = "96713" },
    @{ name = "Kerberos 4771"; id = "96738" },
    @{ name = "Kerberos 4771 DCO02"; id = "96739" },
    @{ name = "Group Mod 4728"; id = "96736" },
    @{ name = "Group Mod 4728 DCO02"; id = "96737" }
)

foreach ($it in $itemIds) {
    $h = Call-Zbx 'history.get' @{
        history = 2 # log
        itemids = @($it.id)
        output = 'extend'
        limit = 100
    }
    Write-Output "$($it.name) (ID $($it.id)): $($h.Count) eventos en histórico"
    if ($h.Count -gt 0) {
        $last = $h[0]
        $d = [DateTimeOffset]::FromUnixTimeSeconds([int64]$last.clock).ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss')
        Write-Output "   Ultimo: $d | $($last.value.Substring(0, [Math]::Min(100, $last.value.Length)))"
    }
}
