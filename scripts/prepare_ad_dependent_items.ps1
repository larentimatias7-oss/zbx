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

    # Masters:
    # 4740 (Lockouts):
    #   DCO01: 83274 (already has 83820, 83821)
    #   DCO02: 96712 (already has 96714, 96715)
    #   SSJ:   101379 (needs locked.user, locked.pc)
    # 4728/4732/4756 (Groups):
    #   DCO01: 96736 (needs group.operator, group.name, group.member, group.action)
    #   DCO02: 96737 (needs group.operator, group.name, group.member, group.action)
    #   SSJ:   101382 (needs group.operator, group.name, group.member, group.action)

    $itemsToCreate = @(
        # SSJ-DCO01 - Lockout items
        @{
            hostid = '10715'
            name = 'User locked Name'
            key_ = 'locked.user'
            type = 18
            master_itemid = '101379'
            value_type = 4 # Text
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Account That Was Locked Out:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10715'
            name = 'User Locked PC'
            key_ = 'locked.pc'
            type = 18
            master_itemid = '101379'
            value_type = 4 # Text
            history = '14d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Caller Computer Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },

        # SRO-DCO01 - Group modification items
        @{
            hostid = '10699'
            name = 'Operador de Modificación de Grupo'
            key_ = 'group.operator'
            type = 18
            master_itemid = '96736'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Subject:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10699'
            name = 'Nombre de Grupo Modificado'
            key_ = 'group.name'
            type = 18
            master_itemid = '96736'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Group:[\s\S]*?Group Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10699'
            name = 'Miembro Afectado de Grupo'
            key_ = 'group.member'
            type = 18
            master_itemid = '96736'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Member:[\s\S]*?Account Name:\s+(?:CN=)?([^,\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10699'
            name = 'Acción de Modificación de Grupo'
            key_ = 'group.action'
            type = 18
            master_itemid = '96736'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "^([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },

        # SRO-DCO02 - Group modification items
        @{
            hostid = '10701'
            name = 'Operador de Modificación de Grupo'
            key_ = 'group.operator'
            type = 18
            master_itemid = '96737'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Subject:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10701'
            name = 'Nombre de Grupo Modificado'
            key_ = 'group.name'
            type = 18
            master_itemid = '96737'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Group:[\s\S]*?Group Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10701'
            name = 'Miembro Afectado de Grupo'
            key_ = 'group.member'
            type = 18
            master_itemid = '96737'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Member:[\s\S]*?Account Name:\s+(?:CN=)?([^,\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10701'
            name = 'Acción de Modificación de Grupo'
            key_ = 'group.action'
            type = 18
            master_itemid = '96737'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "^([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },

        # SSJ-DCO01 - Group modification items
        @{
            hostid = '10715'
            name = 'Operador de Modificación de Grupo'
            key_ = 'group.operator'
            type = 18
            master_itemid = '101382'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Subject:[\s\S]*?Account Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10715'
            name = 'Nombre de Grupo Modificado'
            key_ = 'group.name'
            type = 18
            master_itemid = '101382'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Group:[\s\S]*?Group Name:\s+([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10715'
            name = 'Miembro Afectado de Grupo'
            key_ = 'group.member'
            type = 18
            master_itemid = '101382'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "Member:[\s\S]*?Account Name:\s+(?:CN=)?([^,\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        },
        @{
            hostid = '10715'
            name = 'Acción de Modificación de Grupo'
            key_ = 'group.action'
            type = 18
            master_itemid = '101382'
            value_type = 4
            history = '30d'
            preprocessing = @(
                @{
                    type = '5'
                    params = "^([^\r\n]+)`n\1"
                    error_handler = '0'
                    error_handler_params = ''
                }
            )
        }
    )

    Write-Output "`n=== 2. CHECKING FOR EXISTING KEYS (CONCURRENCY CHECK) ==="
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
    $rollbackPath = 'c:\zabbix_anti\.zabbix_context\rollback_ad_items.json'
    @{
        created_at_utc = [DateTime]::UtcNow.ToString('o')
        description = 'Rollback manifest for AD Cyber SOC dependent items'
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
