param(
    [string]$ZabbixUrl = "https://zabbix.mlccnet.local/api_jsonrpc.php",
    [int]$HistoryDays = 30
)

$ErrorActionPreference = "Stop"

$Root = "C:\Zabbix-Audit"
$Raw  = Join-Path $Root "raw"

New-Item -ItemType Directory -Force -Path $Raw | Out-Null

# ============================================================
# TOKEN
# ============================================================

$SecureToken = Read-Host "Ingrese API Token de Zabbix" -AsSecureString

$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)

try {
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

# ============================================================
# FUNCION API
# ============================================================

$script:RequestId = 1

function Invoke-ZabbixApi {

    param(
        [Parameter(Mandatory)]
        [string]$Method,

        [hashtable]$Params = @{},

        [switch]$NoAuth
    )

    $body = @{
        jsonrpc = "2.0"
        method  = $Method
        params  = $Params
        id      = $script:RequestId
    }

    if (-not $NoAuth) {
        $body.auth = $Token
    }

    $script:RequestId++

    $json = $body | ConvertTo-Json -Depth 50

    $response = Invoke-RestMethod `
        -Uri $ZabbixUrl `
        -Method Post `
        -ContentType "application/json-rpc" `
        -Body $json

    if ($response.error) {

        throw "API ERROR [$Method]: $($response.error.message) - $($response.error.data)"

    }

    return $response.result
}

function Save-Json {

    param(
        [string]$Name,
        $Data
    )

    $Path = Join-Path $Raw "$Name.json"

    $Data |
        ConvertTo-Json -Depth 100 |
        Out-File $Path -Encoding utf8

    Write-Host "[OK] $Name" -ForegroundColor Green
}

function Try-Export {

    param(
        [string]$Name,
        [string]$Method,
        [hashtable]$Params
    )

    try {

        Write-Host "Extrayendo $Name..." -ForegroundColor Cyan

        $result = Invoke-ZabbixApi `
            -Method $Method `
            -Params $Params

        Save-Json $Name $result

        Write-Host "     Objetos: $($result.Count)"

    }
    catch {

        Write-Warning "$Name NO pudo extraerse."
        Write-Warning $_.Exception.Message

    }
}

# ============================================================
# VERSION
# ============================================================

$Version = Invoke-ZabbixApi `
    -Method "apiinfo.version" `
    -NoAuth

Save-Json "00_api_version" @{
    version = $Version
    date    = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

Write-Host ""
Write-Host "Zabbix API: $Version" -ForegroundColor Yellow
Write-Host ""

# ============================================================
# HOST GROUPS
# ============================================================

Try-Export `
    "01_hostgroups" `
    "hostgroup.get" `
    @{
        output = "extend"
    }

# ============================================================
# HOSTS
# ============================================================

Try-Export `
    "02_hosts" `
    "host.get" `
    @{
        output = "extend"

        selectHostGroups = @(
            "groupid",
            "name"
        )

        selectInterfaces = "extend"

        selectParentTemplates = @(
            "templateid",
            "name"
        )

        selectTags = "extend"
    }

# ============================================================
# TEMPLATES
# ============================================================

Try-Export `
    "03_templates" `
    "template.get" `
    @{
        output = "extend"

        selectHostGroups = @(
            "groupid",
            "name"
        )

        selectParentTemplates = @(
            "templateid",
            "name"
        )

        selectTags = "extend"
    }

# ============================================================
# ITEMS
# ============================================================

Try-Export `
    "04_items" `
    "item.get" `
    @{
        output = @(
            "itemid",
            "hostid",
            "name",
            "key_",
            "type",
            "value_type",
            "delay",
            "history",
            "trends",
            "status",
            "state",
            "error",
            "templateid",
            "flags"
        )

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )

        selectTags = "extend"
    }

# ============================================================
# TRIGGERS
# ============================================================

Try-Export `
    "05_triggers" `
    "trigger.get" `
    @{
        output = @(
            "triggerid",
            "description",
            "expression",
            "recovery_expression",
            "priority",
            "status",
            "value",
            "state",
            "lastchange",
            "templateid",
            "type",
            "recovery_mode",
            "correlation_mode",
            "manual_close",
            "opdata",
            "event_name",
            "comments"
        )

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )

        selectDependencies = @(
            "triggerid",
            "description"
        )

        selectTags = "extend"
    }

# ============================================================
# DISCOVERY / LLD
# ============================================================

Try-Export `
    "06_discovery_rules" `
    "discoveryrule.get" `
    @{
        output = "extend"

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )
    }

Try-Export `
    "07_item_prototypes" `
    "itemprototype.get" `
    @{
        output = @(
            "itemid",
            "hostid",
            "name",
            "key_",
            "type",
            "status",
            "templateid"
        )

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )
    }

Try-Export `
    "08_trigger_prototypes" `
    "triggerprototype.get" `
    @{
        output = @(
            "triggerid",
            "description",
            "expression",
            "recovery_expression",
            "priority",
            "status",
            "templateid",
            "recovery_mode",
            "manual_close"
        )

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )

        selectDependencies = @(
            "triggerid",
            "description"
        )

        selectTags = "extend"
    }

# ============================================================
# ACTIONS
# ============================================================

Try-Export `
    "09_actions" `
    "action.get" `
    @{
        output = "extend"

        selectFilter = "extend"

        selectOperations = "extend"

        selectRecoveryOperations = "extend"

        selectUpdateOperations = "extend"
    }

# ============================================================
# MEDIA TYPES
# ============================================================

Try-Export `
    "10_mediatypes" `
    "mediatype.get" `
    @{
        output = @(
            "mediatypeid",
            "name",
            "type",
            "status"
        )
    }

# ============================================================
# USERS
# Sin emails/telefonos/sendto
# ============================================================

Try-Export `
    "11_users" `
    "user.get" `
    @{
        output = @(
            "userid",
            "username",
            "name",
            "surname",
            "roleid"
        )

        selectUsrgrps = @(
            "usrgrpid",
            "name"
        )

        selectMedias = @(
            "mediaid",
            "mediatypeid",
            "active",
            "severity",
            "period"
        )
    }

# ============================================================
# USER GROUPS
# ============================================================

Try-Export `
    "12_usergroups" `
    "usergroup.get" `
    @{
        output = @(
            "usrgrpid",
            "name",
            "users_status",
            "gui_access"
        )

        selectUsers = @(
            "userid",
            "username",
            "name",
            "surname"
        )
    }

# ============================================================
# MAINTENANCES
# ============================================================

Try-Export `
    "13_maintenances" `
    "maintenance.get" `
    @{
        output = "extend"

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )

        selectHostGroups = @(
            "groupid",
            "name"
        )

        selectTags = "extend"
    }

# ============================================================
# PROXIES
# ============================================================

Try-Export `
    "14_proxies" `
    "proxy.get" `
    @{
        output = "extend"
    }

# ============================================================
# CURRENT PROBLEMS
# ============================================================

Try-Export `
    "15_current_problems" `
    "problem.get" `
    @{
        output = "extend"

        selectTags = "extend"

        selectAcknowledges = "extend"

        recent = $true

        sortfield = @(
            "eventid"
        )

        sortorder = "DESC"
    }

# ============================================================
# HISTORICAL EVENTS
# ============================================================

$TimeFrom = [DateTimeOffset]::UtcNow.AddDays(-$HistoryDays).ToUnixTimeSeconds()
    (
        Get-Date
    ).AddDays(
        -$HistoryDays
    ).ToUniversalTime().Subtract(
        [datetime]'1970-01-01'
    ).TotalSeconds
)

Try-Export `
    "16_problem_events_${HistoryDays}d" `
    "event.get" `
    @{
        output = @(
            "eventid",
            "source",
            "object",
            "objectid",
            "clock",
            "value",
            "acknowledged",
            "name",
            "severity",
            "r_eventid"
        )

        source = 0
        object = 0
        value  = 1

        time_from = $TimeFrom

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )

        selectTags = "extend"

        sortfield = @(
            "clock"
        )

        sortorder = "DESC"
    }

# ============================================================
# MAPS
# ============================================================

Try-Export `
    "17_maps" `
    "map.get" `
    @{
        output = "extend"
    }

# ============================================================
# DASHBOARDS
# ============================================================

Try-Export `
    "18_dashboards" `
    "dashboard.get" `
    @{
        output = "extend"
    }

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "EXTRACCION FINALIZADA" -ForegroundColor Green
Write-Host "Ruta: $Raw"
Write-Host "===============================================" -ForegroundColor Green