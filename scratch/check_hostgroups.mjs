import { execSync } from 'child_process';

const output = execSync(`powershell -NoProfile -Command "
Add-Type -AssemblyName System.Security
\\$cipher = [IO.File]::ReadAllBytes('C:\\ProgramData\\Milicic\\Zabbix\\codex_audit_token.bin')
\\$plain = [Security.Cryptography.ProtectedData]::Unprotect(\\$cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
\\$token = [Text.Encoding]::UTF8.GetString(\\$plain)
\\$payload = @{
    jsonrpc = '2.0'
    method = 'host.get'
    params = @{
        filter = @{ host = @('SRO-DCO01', 'SRO-DCO02', 'SSJ-DCO01') }
        selectGroups = @('groupid', 'name')
    }
    id = 1
} | ConvertTo-Json -Depth 5 -Compress
\\$r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = \\"Bearer \\$token\\" } -Body ([Text.Encoding]::UTF8.GetBytes(\\$payload))
\\$r.result | ForEach-Object {
    Write-Output (\\$_.host + ': ' + ((\\$_.groups | ForEach-Object { \\$_.name }) -join ', '))
}
"`, { encoding: 'utf8' });

console.log(output);
