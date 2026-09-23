param([string]$Method='dashboard.get',[string]$Parameters='{"dashboardids":["403"],"output":"extend","selectPages":"extend"}',[string]$OutputName='ad-dashboard-403')
$ErrorActionPreference='Stop'
if ($Method -ne 'dashboard.update') { throw 'Only dashboard.update allowed' }; if (($Parameters|ConvertFrom-Json).dashboardid -ne '403') { throw 'Only dashboard 403 allowed' }
Add-Type -AssemblyName System.Security
$plainBytes=$null
try {
 $cipher=[IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
 $plainBytes=[Security.Cryptography.ProtectedData]::Unprotect($cipher,[Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'),[Security.Cryptography.DataProtectionScope]::LocalMachine)
 $token=[Text.Encoding]::UTF8.GetString($plainBytes)
 $body=@{jsonrpc='2.0';method=$Method;params=($Parameters|ConvertFrom-Json);id=1}|ConvertTo-Json -Depth 40 -Compress
 $r=Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{Authorization="Bearer $token"} -Body ([Text.Encoding]::UTF8.GetBytes($body))
 if($r.error){throw ($r.error|ConvertTo-Json -Compress)}
 $out=Join-Path $PSScriptRoot "../raw/$OutputName.json"
 @{generated_at_utc=[DateTime]::UtcNow.ToString('o');method=$Method;result=$r.result}|ConvertTo-Json -Depth 60|Set-Content -LiteralPath $out -Encoding UTF8
 $r.result|ConvertTo-Json -Depth 50
} finally {if($plainBytes){[Array]::Clear($plainBytes,0,$plainBytes.Length)};Remove-Variable token -ErrorAction SilentlyContinue}

