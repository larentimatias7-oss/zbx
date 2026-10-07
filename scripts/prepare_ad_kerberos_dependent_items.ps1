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
        } | ConvertTo-Json -Depth 15 -Compress
        
        $r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = "Bearer $token" } -Body ([Text.Encoding]::UTF8.GetBytes($payload))
        if ($r.error) { throw ($r.error | ConvertTo-Json -Compress) }
        return $r.result
    }

    Write-Output "=== 1. PRE-FLIGHT VERIFICATION ==="
    $hosts = Call-Zabbix 'host.get' @{
        hostids = @('10699', '10701', '10715')
        output = @('hostid', 'host', 'name')
    }
    Write-Output "Hosts verified: $(($hosts | ForEach-Object { "$($_.host) (ID: $($_.hostid))" }) -join ', ')"

    # Masters 4771:
    # DCO01: 96738
    # DCO02: 96739
    # SSJ:   101381

    $itemsToCreate = @(
        # SRO-DCO01
        @{
            hostid = '10699'
            name = 'Usuario Fallo Preauth Kerberos'
            key_ = 'kerberos.user'
            type = 18 # Dependent item
            master_itemid = '96738'
            value_type = 4 # Text
            history = '14d'
            preprocessing = @(
                @{
                    type = '5' # Regex
                    params = "Account Information:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10699'
            name = 'IP Origen Fallo Preauth Kerberos'
            key_ = 'kerberos.ip'
            type = 18
            master_itemid = '96738'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Client Address:\s*(?:::ffff:)?([0-9\.]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10699'
            name = 'Código Fallo Preauth Kerberos'
            key_ = 'kerberos.code'
            type = 18
            master_itemid = '96738'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Failure Code:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },

        # SRO-DCO02
        @{
            hostid = '10701'
            name = 'Usuario Fallo Preauth Kerberos'
            key_ = 'kerberos.user'
            type = 18
            master_itemid = '96739'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Account Information:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10701'
            name = 'IP Origen Fallo Preauth Kerberos'
            key_ = 'kerberos.ip'
            type = 18
            master_itemid = '96739'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Client Address:\s*(?:::ffff:)?([0-9\.]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10701'
            name = 'Código Fallo Preauth Kerberos'
            key_ = 'kerberos.code'
            type = 18
            master_itemid = '96739'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Failure Code:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },

        # SSJ-DCO01
        @{
            hostid = '10715'
            name = 'Usuario Fallo Preauth Kerberos'
            key_ = 'kerberos.user'
            type = 18
            master_itemid = '101381'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Account Information:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10715'
            name = 'IP Origen Fallo Preauth Kerberos'
            key_ = 'kerberos.ip'
            type = 18
            master_itemid = '101381'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Client Address:\s*(?:::ffff:)?([0-9\.]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10715'
            name = 'Código Fallo Preauth Kerberos'
            key_ = 'kerberos.code'
            type = 18
            master_itemid = '101381'
            value_type = 4
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Failure Code:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        }
    )

    Write-Output "`n=== 2. CHECKING FOR EXISTING KEYS ==="
    $keysToCheck = $itemsToCreate | ForEach-Object { $_.key_ } | Select-Object -Unique
    $existing = Call-Zabbix 'item.get' @{
        hostids = @('10699', '10701', '10715')
        filter = @{ key_ = $keysToCheck }
        output = @('itemid', 'hostid', 'key_', 'name')
    }
    
    $itemsToExecute = @()
    foreach ($item in $itemsToCreate) {
        $alreadyExists = $existing | Where-Object { $_.hostid -eq $item.hostid -and $_.key_ -eq $item.key_ }
        if ($alreadyExists) {
            Write-Output "SKIPPING: Host $($item.hostid) already has key '$($item.key_)' (ItemID: $($alreadyExists.itemid))"
        } else {
            $itemsToExecute += $item
        }
    }

    Write-Output "Items to create: $($itemsToExecute.Count)"
    if ($itemsToExecute.Count -eq 0) {
        Write-Output "All items already exist! Nothing to create."
        exit 0
    }

    Write-Output "`n=== 3. CREATING DEPENDENT ITEMS IN ZABBIX ==="
    $createdItemIds = @()
    $createdDetails = @()

    foreach ($it in $itemsToExecute) {
        Write-Output "Creating '$($it.name)' ($($it.key_)) on host $($it.hostid) (Master: $($it.master_itemid))..."
        $createRes = Call-Zabbix 'item.create' $it
        $newId = $createRes.itemids[0]
        $createdItemIds += $newId
        $createdDetails += [PSCustomObject]@{
            itemid = $newId
            hostid = $it.hostid
            name = $it.name
            key_ = $it.key_
            master_itemid = $it.master_itemid
        }
        Write-Output "  -> Created successfully with ItemID: $newId"
    }

    # Save Rollback file
    $rollbackPath = 'c:\zabbix_anti\.zabbix_context\rollback_kerberos_4771_items.json'
    @{
        created_at_utc = [DateTime]::UtcNow.ToString('o')
        description = 'Rollback manifest for AD Kerberos Pre-Auth (Event 4771) dependent items'
        itemids = $createdItemIds
        details = $createdDetails
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $rollbackPath -Encoding UTF8

    Write-Output "`n=== 4. POST-CREATION VERIFICATION ==="
    $verify = Call-Zabbix 'item.get' @{
        itemids = $createdItemIds
        output = @('itemid', 'hostid', 'name', 'key_', 'status', 'state')
        selectHosts = @('host')
    }
    $verify | ForEach-Object {
        Write-Output "Verified: [$($_.itemid)] on $($_.hosts[0].host) -> '$($_.name)' ($($_.key_)) | Status: $($_.status)"
    }
    Write-Output "`nRollback manifest successfully written to: $rollbackPath"
}
finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    Remove-Variable token -ErrorAction SilentlyContinue
}
