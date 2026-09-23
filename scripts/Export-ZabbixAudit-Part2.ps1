param(
    [string]$ZabbixUrl = "https://zabbix.mlccnet.local/api_jsonrpc.php",
    [int]$HistoryDays = 30
)

$ErrorActionPreference = "Stop"

$Root = "C:\Zabbix-Audit"
$Raw  = Join-Path $Root "raw"

$SecureToken = Read-Host "Ingrese API Token de Zabbix" -AsSecureString

$BSTR = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)

try {
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

$script:RequestId = 1000

function Invoke-ZabbixApi {

    param(
        [string]$Method,
        [hashtable]$Params = @{}
    )

    $body = @{
        jsonrpc = "2.0"
        method  = $Method
        params  = $Params
        auth    = $Token
        id      = $script:RequestId
    }

    $script:RequestId++

    $response = Invoke-RestMethod `
        -Uri $ZabbixUrl `
        -Method Post `
        -ContentType "application/json-rpc" `
        -Body ($body | ConvertTo-Json -Depth 50)

    if ($response.error) {
        throw "$Method : $($response.error.message) - $($response.error.data)"
    }

    return $response.result
}

function Save-Json {

    param(
        [string]$Name,
        $Data
    )

    $Path = Join-Path $Raw "$Name.json"

    ConvertTo-Json `
        -InputObject $Data `
        -Depth 100 |
        Out-File $Path -Encoding utf8

    Write-Host "[OK] $Name" -ForegroundColor Green
}

# ============================================================
# TIMESTAMP CORRECTO
# ============================================================

$TimeFrom = [DateTimeOffset]::UtcNow.AddDays(-$HistoryDays).ToUnixTimeSeconds()

Write-Host ""
Write-Host "Extrayendo eventos desde:" `
    ([DateTimeOffset]::FromUnixTimeSeconds($TimeFrom).LocalDateTime)
Write-Host ""

# ============================================================
# EVENTOS PROBLEM - ULTIMOS 30 DIAS
# ============================================================

Write-Host "Extrayendo eventos históricos..." -ForegroundColor Cyan

$Events = Invoke-ZabbixApi `
    -Method "event.get" `
    -Params @{
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

Save-Json "16_problem_events_${HistoryDays}d" $Events

Write-Host "Eventos: $(@($Events).Count)"

# ============================================================
# MAPS
# ============================================================

Write-Host "Extrayendo maps..." -ForegroundColor Cyan

$Maps = Invoke-ZabbixApi `
    -Method "map.get" `
    -Params @{
        output = "extend"
        selectSelements = "extend"
        selectLinks = "extend"
    }

Save-Json "17_maps" $Maps

Write-Host "Maps: $(@($Maps).Count)"

# ============================================================
# DASHBOARDS
# ============================================================

Write-Host "Extrayendo dashboards..." -ForegroundColor Cyan

$Dashboards = Invoke-ZabbixApi `
    -Method "dashboard.get" `
    -Params @{
        output = "extend"
        selectPages = "extend"
    }

Save-Json "18_dashboards" $Dashboards

Write-Host "Dashboards: $(@($Dashboards).Count)"

# ============================================================
# TRIGGER ACTIONS SOLAMENTE
# ============================================================

Write-Host "Extrayendo Trigger Actions..." -ForegroundColor Cyan

$TriggerActions = Invoke-ZabbixApi `
    -Method "action.get" `
    -Params @{
        output = "extend"
        eventsource = 0

        selectFilter = "extend"
        selectOperations = "extend"
        selectRecoveryOperations = "extend"
        selectUpdateOperations = "extend"
    }

Save-Json "19_trigger_actions" $TriggerActions

Write-Host "Trigger Actions: $(@($TriggerActions).Count)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SEGUNDA EXTRACCION FINALIZADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green