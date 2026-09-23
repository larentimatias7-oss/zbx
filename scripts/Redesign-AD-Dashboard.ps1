$ErrorActionPreference='Stop'
function F($t,$n,$v){@{type=$t;name=$n;value=[string]$v}}
function CountCard($title,$id,$from,$x,$width,$color){
 @{type='item';name=$title;x=$x;y=0;width=$width;height=2;view_mode=0;fields=@(
 (F 4 'itemid.0' $id),(F 0 'aggregate_function' 4),(F 1 'time_period.from' $from),(F 1 'time_period.to' 'now'),
 (F 0 'show.0' 2),(F 0 'decimal_places' 0),(F 0 'units_show' 0),(F 0 'value_size' 55),(F 1 'value_color' $color),
 (F 0 'rf_rate' 60))}
}
function HistoryTable($title,$cols,$ref,$x,$y,$width,$height,$lines){
 if($cols[0] -is [string]){$cols=,@($cols)}
 $fields=@((F 1 'reference' $ref),(F 0 'layout' 1),(F 0 'show_timestamp' 1),(F 0 'show_column_header' 1),(F 0 'show_lines' $lines),(F 0 'sortorder' 0),(F 0 'rf_rate' 60),(F 1 'time_period.from' 'now-7d'),(F 1 'time_period.to' 'now'))
 for($i=0;$i -lt $cols.Count;$i++){
  $fields+=@((F 1 "columns.$i.name" $cols[$i][0]),(F 4 "columns.$i.itemid" $cols[$i][1]),(F 0 "columns.$i.display" 5),(F 0 "columns.$i.max_length" 90),(F 0 "columns.$i.monospace_font" 0))
 }
 @{type='itemhistory';name=$title;x=$x;y=$y;width=$width;height=$height;view_mode=0;fields=$fields}
}
$before=(Get-Content "$PSScriptRoot/../raw/ad-dashboard-redesign-before.json" -Raw|ConvertFrom-Json).result
$legacy=$before.pages|Where-Object dashboard_pageid -eq '22778'
$legacy.name='Alertas · diagnóstico'
$legacy.widgets[0].name='Historial de alertas · RESOLVED no confirma desbloqueo'
$locks=$before.pages|Where-Object dashboard_pageid -eq '22785'
$fails=$before.pages|Where-Object dashboard_pageid -eq '22786'
$changes=$before.pages|Where-Object dashboard_pageid -eq '22787'
$lockCols=@(@('Usuario afectado','83820'),@('Equipo informado','83821'))
$overview=@{name='Resumen · SRO-DCO01';display_period=0;widgets=@(
 (CountCard 'Bloqueos · 24 h' '83274' 'now-24h' 0 18 'B45309'),
 (CountCard 'Accesos fallidos · 24 h' '83715' 'now-24h' 18 18 'B91C1C'),
 (CountCard 'Bloqueos · 7 días' '83274' 'now-7d' 36 18 'B45309'),
 (CountCard 'Accesos fallidos · 7 días' '83715' 'now-7d' 54 18 'B91C1C'),
 (HistoryTable 'Últimos bloqueos · cuentas y equipos · 7 días' $lockCols 'ADSUM' 0 2 72 5 15),
 (HistoryTable 'Últimos accesos fallidos · clic en el registro para ver usuario, IP y motivo' @(@('Registro original · abrir detalle','83715')) 'ADFAI' 0 7 72 4 10)
)}
$locks.name='Bloqueos'
$locks.widgets=@(
 (CountCard 'Eventos de bloqueo · 24 h' '83274' 'now-24h' 0 36 'B45309'),
 (CountCard 'Eventos de bloqueo · 7 días' '83274' 'now-7d' 36 36 'B45309'),
 (HistoryTable 'Cuentas y equipos · 7 días · hasta 1000 eventos' $lockCols 'ADUSR' 0 2 72 5 1000),
 (HistoryTable 'Evidencia original · clic para expandir · no indica estado actual de la cuenta' @(@('Registro Windows 4740','83274')) 'ADBLQ' 0 7 72 4 1000)
)
$fails.name='Accesos fallidos'
$fails.widgets=@(
 (CountCard 'Eventos de acceso fallido · 24 h' '83715' 'now-24h' 0 36 'B91C1C'),
 (CountCard 'Eventos de acceso fallido · 7 días' '83715' 'now-7d' 36 36 'B91C1C'),
 (HistoryTable 'Accesos fallidos · 7 días · hasta 1000 eventos · clic para ver cuenta, IP y motivo' @(@('Registro Windows 4625 · abrir detalle','83715')) 'ADLOG' 0 2 72 9 1000)
)
$changes.name='Cambios de cuentas'
$changes.widgets=@(
 (CountCard 'Creadas · 7 días' '83716' 'now-7d' 0 24 '1D4ED8'),
 (CountCard 'Habilitadas · 7 días' '83275' 'now-7d' 24 24 '047857'),
 (CountCard 'Deshabilitadas · 7 días' '83714' 'now-7d' 48 24 '7C3AED'),
 (HistoryTable 'Cuentas creadas · clic para ver cuenta y responsable' @(@('Registro Windows 4720','83716')) 'ADNEW' 0 2 72 3 1000),
 (HistoryTable 'Cuentas habilitadas · clic para ver cuenta y responsable' @(@('Registro Windows 4722','83275')) 'ADENA' 0 5 72 3 1000),
 (HistoryTable 'Cuentas deshabilitadas · clic para ver cuenta y responsable' @(@('Registro Windows 4725','83714')) 'ADDIS' 0 8 72 3 1000)
)
$payload=@{dashboardid='403';auto_start=0;pages=@($overview,$locks,$fails,$changes,$legacy)}
$payload|ConvertTo-Json -Depth 50|Set-Content "$PSScriptRoot/../raw/ad-dashboard-redesign-payload.json" -Encoding utf8
Write-Output 'Rediseño preparado: 5 páginas, contadores dinámicos, tablas compactas y navegación manual.'

