# ============================================================
# Analyze-LinkDownFlapping.ps1
# Auditoria READ-ONLY de triggers Link Down
# Zabbix 7.x
# ============================================================

$Days = 7
$TopN = 20

$RawPath    = "C:\Zabbix-Audit\raw"
$ReportPath = "C:\Zabbix-Audit\reports"

if (-not (Test-Path $ReportPath)) {
    New-Item -ItemType Directory -Path $ReportPath | Out-Null
}

$TimeFrom = [DateTimeOffset]::UtcNow.AddDays(-$Days).ToUnixTimeSeconds()

Write-Host ""
Write-Host "=== ANALISIS LINK DOWN ===" -ForegroundColor Cyan
Write-Host "Periodo: ultimos $Days dias"
Write-Host ""

# ------------------------------------------------------------
# 1. Obtener eventos PROBLEM Link Down
# ------------------------------------------------------------

Write-Host "[1/5] Consultando eventos Link Down..." -ForegroundColor Yellow

$Events = Invoke-ZabbixApi `
    -Method "event.get" `
    -Params @{
        source = 0
        object = 0
        value = 1
        time_from = $TimeFrom

        output = @(
            "eventid",
            "objectid",
            "clock",
            "name",
            "r_eventid"
        )

        selectHosts = @(
            "hostid",
            "host",
            "name"
        )

        sortfield = "clock"
        sortorder = "DESC"
    }

$LinkProblems = @(
    $Events |
    Where-Object {
        $_.name -match '(?i)link down'
    }
)

Write-Host "Eventos PROBLEM Link Down: $($LinkProblems.Count)"

# ------------------------------------------------------------
# 2. Top triggers
# ------------------------------------------------------------

$TopTriggers = @(
    $LinkProblems |
    Group-Object objectid |
    Sort-Object Count -Descending |
    Select-Object -First $TopN
)

Write-Host "Triggers a analizar: $($TopTriggers.Count)"

# ------------------------------------------------------------
# 3. Analizar cada trigger
# ------------------------------------------------------------

Write-Host "[2/5] Analizando duraciones..." -ForegroundColor Yellow

$Results = foreach ($Group in $TopTriggers) {

    $TriggerId = [string]$Group.Name
    $ProblemEvents = @($Group.Group)

    $FirstEvent = $ProblemEvents | Select-Object -First 1

    $HostName = @($FirstEvent.hosts)[0].name
    $ProblemName = $FirstEvent.name

    # --------------------------------------------------------
    # Necesitamos también los eventos OK para calcular duración
    # --------------------------------------------------------

    $AllTriggerEvents = @(
        Invoke-ZabbixApi `
            -Method "event.get" `
            -Params @{
                source = 0
                object = 0
                objectids = @($TriggerId)
                time_from = $TimeFrom

                output = @(
                    "eventid",
                    "clock",
                    "value",
                    "r_eventid",
                    "name"
                )

                sortfield = "clock"
                sortorder = "ASC"
            }
    )

    $Outages = @()

    foreach ($Problem in @(
        $AllTriggerEvents |
        Where-Object { $_.value -eq "1" }
    )) {

        if ([string]::IsNullOrWhiteSpace(
            [string]$Problem.r_eventid
        )) {
            continue
        }

        if ($Problem.r_eventid -eq "0") {
            continue
        }

        $Recovery = $AllTriggerEvents |
            Where-Object {
                $_.eventid -eq $Problem.r_eventid
            } |
            Select-Object -First 1

        if ($null -eq $Recovery) {
            continue
        }

        $Start = [DateTimeOffset]::FromUnixTimeSeconds(
            [int64]$Problem.clock
        )

        $End = [DateTimeOffset]::FromUnixTimeSeconds(
            [int64]$Recovery.clock
        )

        $Duration = ($End - $Start).TotalMinutes

        $Outages += [PSCustomObject]@{
            Start           = $Start.ToLocalTime().DateTime
            End             = $End.ToLocalTime().DateTime
            DurationMinutes = [math]::Round($Duration, 2)
        }
    }

    $Total = @($Outages).Count

    $Under2 = @(
        $Outages |
        Where-Object {
            $_.DurationMinutes -lt 2
        }
    ).Count

    $Under5 = @(
        $Outages |
        Where-Object {
            $_.DurationMinutes -lt 5
        }
    ).Count

    $Over30 = @(
        $Outages |
        Where-Object {
            $_.DurationMinutes -ge 30
        }
    ).Count

    $Over8h = @(
        $Outages |
        Where-Object {
            $_.DurationMinutes -ge 480
        }
    ).Count

    $Average = 0
    $Median  = 0

    if ($Total -gt 0) {

        $Average = [math]::Round(
            (
                $Outages |
                Measure-Object DurationMinutes -Average
            ).Average,
            2
        )

        $Sorted = @(
            $Outages.DurationMinutes |
            Sort-Object
        )

        if ($Total % 2 -eq 1) {
            $Median = $Sorted[
                [math]::Floor($Total / 2)
            ]
        }
        else {
            $Middle = $Total / 2

            $Median = (
                $Sorted[$Middle - 1] +
                $Sorted[$Middle]
            ) / 2
        }

        $Median = [math]::Round($Median, 2)
    }

    $PctUnder2 = 0
    $PctUnder5 = 0

    if ($Total -gt 0) {
        $PctUnder2 = [math]::Round(
            ($Under2 / $Total) * 100,
            1
        )

        $PctUnder5 = [math]::Round(
            ($Under5 / $Total) * 100,
            1
        )
    }

    # --------------------------------------------------------
    # Clasificacion automatica inicial
    # No es decision operativa final
    # --------------------------------------------------------

    $Classification = "Review"

    if (
        $Total -ge 10 -and
        $PctUnder5 -ge 80
    ) {
        $Classification = "Microflapping"
    }
    elseif (
        $Over8h -gt 0 -and
        $PctUnder5 -lt 50
    ) {
        $Classification = "Long outages / schedule candidate"
    }
    elseif ($Total -le 3) {
        $Classification = "Low frequency"
    }

    [PSCustomObject]@{
        TriggerID       = $TriggerId
        Host            = $HostName
        Problem         = $ProblemName

        Problems7d      = @(
            $AllTriggerEvents |
            Where-Object {
                $_.value -eq "1"
            }
        ).Count

        Completed       = $Total

        Under2Min       = $Under2
        PctUnder2Min    = $PctUnder2

        Under5Min       = $Under5
        PctUnder5Min    = $PctUnder5

        Over30Min       = $Over30
        Over8Hours      = $Over8h

        AverageMinutes  = $Average
        MedianMinutes   = $Median

        Classification  = $Classification
    }
}

# ------------------------------------------------------------
# 4. Mostrar resumen
# ------------------------------------------------------------

Write-Host ""
Write-Host "[3/5] Resultados" -ForegroundColor Yellow
Write-Host ""

$Results |
Sort-Object Problems7d -Descending |
Format-Table `
    TriggerID,
    Host,
    Problems7d,
    PctUnder2Min,
    PctUnder5Min,
    MedianMinutes,
    Over8Hours,
    Classification `
    -Wrap -AutoSize

# ------------------------------------------------------------
# 5. Exportar
# ------------------------------------------------------------

$CsvFile = Join-Path `
    $ReportPath `
    "20_linkdown_flapping_7d.csv"

$Results |
Sort-Object Problems7d -Descending |
Export-Csv `
    -Path $CsvFile `
    -NoTypeInformation `
    -Encoding UTF8

Write-Host ""
Write-Host "[4/5] CSV generado:" -ForegroundColor Green
Write-Host $CsvFile

# ------------------------------------------------------------
# Resumen global
# ------------------------------------------------------------

$TotalAnalyzedProblems = (
    $Results |
    Measure-Object Problems7d -Sum
).Sum

$MicroFlappingTriggers = @(
    $Results |
    Where-Object {
        $_.Classification -eq "Microflapping"
    }
).Count

Write-Host ""
Write-Host "[5/5] RESUMEN" -ForegroundColor Cyan

Write-Host "Triggers analizados : $($Results.Count)"
Write-Host "PROBLEM analizados  : $TotalAnalyzedProblems"
Write-Host "Microflapping       : $MicroFlappingTriggers"
Write-Host ""