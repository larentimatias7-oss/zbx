$Root = "C:\Zabbix-Audit"

$Raw     = Join-Path $Root "raw"
$Reports = Join-Path $Root "reports"

New-Item -ItemType Directory -Force $Reports | Out-Null

Write-Host "Cargando hosts e items..." -ForegroundColor Cyan

$Hosts = Get-Content `
    "$Raw\02_hosts.json" `
    -Raw |
    ConvertFrom-Json

$Items = Get-Content `
    "$Raw\04_items.json" `
    -Raw |
    ConvertFrom-Json

$RealHostIds = @{}

foreach ($HostEntry in $Hosts) {
    $RealHostIds[[string]$HostEntry.hostid] = $HostEntry
}

$HostItems = $Items |
    Where-Object {
        $RealHostIds.ContainsKey([string]$_.hostid)
    }

$Unsupported = $HostItems |
    Where-Object {
        $_.state -eq "1"
    }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "RESUMEN ITEMS" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Items totales API:       $($Items.Count)"
Write-Host "Items efectivos hosts:   $($HostItems.Count)"
Write-Host "Unsupported efectivos:   $($Unsupported.Count)"
Write-Host ""

$Unsupported |
    ForEach-Object {

        $HostEntry = $RealHostIds[[string]$_.hostid]

        [PSCustomObject]@{
            Host       = $HostEntry.name
            HostID     = $_.hostid
            ItemID     = $_.itemid
            Item       = $_.name
            Key        = $_.key_
            Error      = $_.error
            TemplateID = $_.templateid
            Type       = $_.type
            Status     = $_.status
        }

    } |
    Export-Csv `
        "$Reports\10_unsupported_items.csv" `
        -NoTypeInformation `
        -Encoding UTF8

$Unsupported |
    ForEach-Object {

        $HostEntry = $RealHostIds[[string]$_.hostid]

        [PSCustomObject]@{
            Host = $HostEntry.name
        }

    } |
    Group-Object Host |
    ForEach-Object {

        [PSCustomObject]@{
            Host             = $_.Name
            UnsupportedItems = $_.Count
        }

    } |
    Sort-Object UnsupportedItems -Descending |
    Export-Csv `
        "$Reports\11_unsupported_by_host.csv" `
        -NoTypeInformation `
        -Encoding UTF8

$Unsupported |
    Where-Object {
        -not [string]::IsNullOrWhiteSpace($_.error)
    } |
    Group-Object error |
    ForEach-Object {

        [PSCustomObject]@{
            Count = $_.Count
            Error = $_.Name
        }

    } |
    Sort-Object Count -Descending |
    Export-Csv `
        "$Reports\12_unsupported_errors.csv" `
        -NoTypeInformation `
        -Encoding UTF8

Write-Host "TOP 20 HOSTS CON ITEMS UNSUPPORTED" -ForegroundColor Yellow

Import-Csv "$Reports\11_unsupported_by_host.csv" |
    Select-Object -First 20 |
    Format-Table -AutoSize

Write-Host ""
Write-Host "TOP 15 ERRORES UNSUPPORTED" -ForegroundColor Yellow

Import-Csv "$Reports\12_unsupported_errors.csv" |
    Select-Object -First 15 |
    Format-Table Count, Error -Wrap -AutoSize