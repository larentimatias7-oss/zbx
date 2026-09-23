$Root = "C:\Zabbix-Audit"

$Raw     = Join-Path $Root "raw"
$Reports = Join-Path $Root "reports"

New-Item -ItemType Directory -Force $Reports | Out-Null

Write-Host "Cargando eventos..." -ForegroundColor Cyan

$Events = Get-Content `
    "$Raw\16_problem_events_30d.json" `
    -Raw |
    ConvertFrom-Json

Write-Host "Eventos cargados: $($Events.Count)" -ForegroundColor Green

# ============================================================
# SEVERIDADES
# ============================================================

$SeverityNames = @{
    "0" = "Not classified"
    "1" = "Information"
    "2" = "Warning"
    "3" = "Average"
    "4" = "High"
    "5" = "Disaster"
}

$Events |
    Group-Object severity |
    ForEach-Object {

        [PSCustomObject]@{
            Severity  = $SeverityNames[[string]$_.Name]
            Events30d = $_.Count
            Percent   = [math]::Round(
                ($_.Count / $Events.Count) * 100,
                2
            )
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\01_events_by_severity.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# TOP TRIGGERS
# ============================================================

$Events |
    Group-Object objectid |
    ForEach-Object {

        $First = $_.Group | Select-Object -First 1

        [PSCustomObject]@{
            TriggerID = $_.Name
            Events30d = $_.Count
            Severity  = $SeverityNames[[string]$First.severity]
            Problem   = $First.name
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\02_noisy_triggers_30d.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# TOP HOSTS
# ============================================================

$HostEvents = foreach ($Event in $Events) {

    foreach ($HostEntry in @($Event.hosts)) {

        [PSCustomObject]@{
            Host      = $HostEntry.name
            HostID    = $HostEntry.hostid
            TriggerID = $Event.objectid
            Problem   = $Event.name
            Severity  = $Event.severity
        }

    }

}

$HostEvents |
    Group-Object Host |
    ForEach-Object {

        [PSCustomObject]@{
            Host      = $_.Name
            Events30d = $_.Count
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\03_noisy_hosts_30d.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# LINK DOWN
# ============================================================

$LinkDown = $Events |
    Where-Object {
        $_.name -match "(?i)link down|interface.+down"
    }

$LinkDown |
    Group-Object objectid |
    ForEach-Object {

        $First = $_.Group | Select-Object -First 1

        [PSCustomObject]@{
            TriggerID = $_.Name
            Events30d = $_.Count
            Problem   = $First.name
            Host      = ($First.hosts.name -join ", ")
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\04_link_down_30d.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# WINDOWS SERVICES
# ============================================================

$WindowsServices = $Events |
    Where-Object {
        $_.name -match "(?i)Windows:.*not running"
    }

$WindowsServices |
    Group-Object objectid |
    ForEach-Object {

        $First = $_.Group | Select-Object -First 1

        [PSCustomObject]@{
            TriggerID = $_.Name
            Events30d = $_.Count
            Problem   = $First.name
            Host      = ($First.hosts.name -join ", ")
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\05_windows_services_30d.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# ICMP
# ============================================================

$Events |
    Where-Object {
        $_.name -match "(?i)ICMP|ping response|packet loss"
    } |
    Group-Object objectid |
    ForEach-Object {

        $First = $_.Group | Select-Object -First 1

        [PSCustomObject]@{
            TriggerID = $_.Name
            Events30d = $_.Count
            Problem   = $First.name
            Host      = ($First.hosts.name -join ", ")
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\06_icmp_30d.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# TEMPERATURA
# ============================================================

$Events |
    Where-Object {
        $_.name -match "(?i)temperature|temperatura"
    } |
    Group-Object objectid |
    ForEach-Object {

        $First = $_.Group | Select-Object -First 1

        [PSCustomObject]@{
            TriggerID = $_.Name
            Events30d = $_.Count
            Problem   = $First.name
            Host      = ($First.hosts.name -join ", ")
        }

    } |
    Sort-Object Events30d -Descending |
    Export-Csv `
        "$Reports\07_temperature_30d.csv" `
        -NoTypeInformation `
        -Encoding UTF8

# ============================================================
# RESUMEN
# ============================================================

$Summary = [PSCustomObject]@{

    PeriodDays             = 30

    TotalProblemEvents     = $Events.Count

    AverageEventsPerDay    = [math]::Round(
        $Events.Count / 30,
        2
    )

    LinkDownEvents         = $LinkDown.Count

    WindowsServiceEvents   = $WindowsServices.Count

    UniqueHostsWithEvents  = @(
        $HostEvents.Host |
        Sort-Object -Unique
    ).Count

    UniqueTriggersWithEvents = @(
        $Events.objectid |
        Sort-Object -Unique
    ).Count
}

$Summary |
    Export-Csv `
        "$Reports\00_summary.csv" `
        -NoTypeInformation `
        -Encoding UTF8

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "ANALISIS FINALIZADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$Summary | Format-List

Write-Host ""
Write-Host "TOP 15 TRIGGERS" -ForegroundColor Yellow

Import-Csv "$Reports\02_noisy_triggers_30d.csv" |
    Select-Object -First 15 |
    Format-Table Events30d, Severity, Problem -AutoSize

Write-Host ""
Write-Host "TOP 15 HOSTS" -ForegroundColor Yellow

Import-Csv "$Reports\03_noisy_hosts_30d.csv" |
    Select-Object -First 15 |
    Format-Table Events30d, Host -AutoSize