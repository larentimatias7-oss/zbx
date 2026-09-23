$ErrorActionPreference='Stop'
function F($type,$name,$value){@{type=$type;name=$name;value=[string]$value}}
function W($title,$item,$reference,$y=0){
 @{type='itemhistory';name=$title;x=0;y=$y;width=72;height=9;view_mode=0;fields=@(
 (F 1 'reference' $reference), (F 0 'layout' 1), (F 0 'rf_rate' 60),
 (F 1 'columns.0.name' 'Registro Windows original — SRO-DCO01'),(F 4 'columns.0.itemid' $item),
 (F 0 'columns.0.display' 1),(F 0 'columns.0.monospace_font' 1),
 (F 0 'show_timestamp' 1),(F 0 'show_column_header' 1),(F 0 'show_lines' 100),
 (F 0 'sortorder' 0),(F 1 'time_period.from' 'now-7d'),(F 1 'time_period.to' 'now'))}
}
$before=(Get-Content "$PSScriptRoot/../raw/ad-dashboard-403-ready.json" -Raw|ConvertFrom-Json).result
$pages=@($before.pages)+@(
 @{name='Bloqueos de cuentas';display_period=0;widgets=@((W 'Bloqueos · 4740 · últimos 7 días · hasta 100 registros' '83274' 'ADBLQ'))},
 @{name='Accesos fallidos';display_period=0;widgets=@((W 'Accesos fallidos · 4625 · últimos 7 días · últimos 100 registros' '83715' 'ADLOG'))},
 @{name='Cambios de cuentas';display_period=0;widgets=@(
 (W 'Cuentas creadas · 4720 · últimos 7 días' '83716' 'ADNEW' 0),
 (W 'Cuentas habilitadas · 4722 · últimos 7 días' '83275' 'ADENA' 9),
 (W 'Cuentas deshabilitadas · 4725 · últimos 7 días' '83714' 'ADDIS' 18))}
)
@{dashboardid='403';pages=$pages}|ConvertTo-Json -Depth 40|Set-Content "$PSScriptRoot/../raw/ad-dashboard-403-update-payload.json" -Encoding utf8
Write-Output 'Preparadas 3 páginas con 5 widgets; página existente conservada.'
