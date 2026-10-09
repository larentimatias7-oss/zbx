Add-Type -AssemblyName System.Security
if (Test-Path 'C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin') {
    $cipher = [IO.File]::ReadAllBytes('C:\ProgramData\Milicic\Zabbix\codex_audit_token.bin')
    $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
    $token = [Text.Encoding]::UTF8.GetString($plainBytes)
    Write-Output "Token found, length: $($token.Length)"
} else {
    Write-Output "File not found"
}
