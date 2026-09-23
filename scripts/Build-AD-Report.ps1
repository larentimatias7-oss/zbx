$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$snapshot=Get-Content "$root/raw/ad-history-7d.json" -Raw|ConvertFrom-Json
$types=@{'4740'='Bloqueo';'4625'='Inicio fallido';'4722'='Habilitación';'4725'='Deshabilitación';'4720'='Creación'}
function Field($value,$pattern){$m=[regex]::Match($value,$pattern);if($m.Success){$m.Groups[1].Value.Trim()}else{'No informado'}}
$rows=@($snapshot.result|ForEach-Object {
 $v=$_.value
 $user=Field $v '(?s)(?:Account That Was Locked Out:|Account For Which Logon Failed:|Target Account:|New Account:).*?Account Name:\s*([^\r\n]+)'
 [pscustomobject]@{Fecha=[DateTimeOffset]::FromUnixTimeSeconds([long]$_.timestamp).ToOffset([TimeSpan]::FromHours(-3)).ToString('yyyy-MM-dd HH:mm:ss');Recepcion=[DateTimeOffset]::FromUnixTimeSeconds([long]$_.clock).ToOffset([TimeSpan]::FromHours(-3)).ToString('yyyy-MM-dd HH:mm:ss');Evento=$_.logeventid;Tipo=$types[$_.logeventid];Usuario=$user;Origen=Field $v '(?:Caller Computer Name:|Workstation Name:)\s*([^\r\n]+)';IP=Field $v 'Source Network Address:\s*([^\r\n]+)';Motivo=Field $v 'Failure Reason:\s*([^\r\n]+)';Subestado=Field $v 'Sub Status:\s*([^\r\n]+)'}
})
$fail=@($rows|Where-Object Evento -eq '4625');$locks=@($rows|Where-Object Evento -eq '4740')
$lines=[Collections.Generic.List[string]]::new()
$lines.Add('# Reporte de eventos de usuarios de Active Directory')
$lines.Add('')
$lines.Add("Consulta: $(([datetime]$snapshot.generated_at_utc).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss")) UTC. Ventana: siete días anteriores a la extracción del 07/09/2026. Horarios del detalle en Argentina (UTC−3). Selección por fecha de recepción en Zabbix; fecha del evento Windows conservada por separado.")
$lines.Add('')
$lines.Add('## Alcance y limitaciones')
$lines.Add('Consulta de solo lectura. El dashboard 403 devolvió una lista vacía: no es visible para la cuenta utilizada o no existe. Solo se ven los dashboards 1 y 400. Por eso este reporte utiliza los ítems disponibles del grupo AD, sin confirmar equivalencia con los filtros del dashboard solicitado.')
$lines.Add('El grupo AD contiene SRO-DCO01, SRO-DCO02 y SSJ-DCO01. Los cinco ítems eventlog de usuarios encontrados pertenecen únicamente a SRO-DCO01. No representa todos los eventos del dominio. No se alcanzó el límite de extracción de 100.000 registros. Las cuentas se agrupan según el nombre registrado; no se consultó su estado actual en AD.')
$lines.Add('')
$lines.Add('## Resumen')
$lines.Add('| Evento | Registros |');$lines.Add('|---|---:|')
foreach($g in $rows|Group-Object Tipo|Sort-Object Count -Descending){$lines.Add("| $($g.Name) | $($g.Count) |")}
$lines.Add('')
$lines.Add("Se registraron $($fail.Count) inicios fallidos en $(@($fail.Usuario|Sort-Object -Unique).Count) nombres de cuenta y $($locks.Count) bloqueos en $(@($locks.Usuario|Sort-Object -Unique).Count) cuentas. Son eventos registrados, no cantidad de cuentas actualmente bloqueadas. Altas, habilitaciones y deshabilitaciones son cambios administrativos y requieren contexto antes de clasificarse como problemas.")
$lines.Add('')
$lines.Add('## Usuarios con más inicios fallidos')
$lines.Add('| Usuario | Registros |');$lines.Add('|---|---:|')
foreach($g in $fail|Group-Object Usuario|Sort-Object Count -Descending|Select-Object -First 15){$lines.Add("| $($g.Name) | $($g.Count) |")}
$lines.Add('')
$lines.Add('## Bloqueos por usuario')
$lines.Add('| Usuario | Registros |');$lines.Add('|---|---:|')
foreach($g in $locks|Group-Object Usuario|Sort-Object Count -Descending){$lines.Add("| $($g.Name) | $($g.Count) |")}
$lines.Add('')
$lines.Add('## IP informada en inicios fallidos')
$lines.Add('| IP | Registros |');$lines.Add('|---|---:|')
foreach($g in $fail|Group-Object IP|Sort-Object Count -Descending){$lines.Add("| $($g.Name) | $($g.Count) |")}
$lines.Add('')
$lines.Add('## Motivos registrados')
$lines.Add('| Motivo / subestado | Registros |');$lines.Add('|---|---:|')
foreach($g in $fail|Group-Object Motivo,Subestado|Sort-Object Count -Descending){$lines.Add("| $($g.Name) | $($g.Count) |")}
$lines.Add('')
$lines.Add('## Acciones propuestas')
$lines.Add('- Revisar primero las cuentas con repetición de fallos y bloqueos; correlacionar horarios, IP y aplicaciones que usan esas credenciales antes de atribuir una causa.')
$lines.Add('- Identificar el equipo o servicio correspondiente a las IP de origen. Una IP registrada no demuestra por sí sola el dispositivo final del usuario.')
$lines.Add('- Compartir el dashboard 403 con la cuenta o grupo de auditoría en modo lectura para validar sus widgets y filtros.')
$lines.Add('- Revisar la cobertura de los otros controladores si se necesita un reporte de todo el dominio.')
$lines.Add('- El grupo AD también devuelve dos problemas abiertos de diferencia horaria superior a 60 segundos respecto de Zabbix; validar los relojes al correlacionar eventos. No se atribuyó a estos problemas la causa de los fallos de acceso.')
$lines.Add('')
$lines.Add('## Detalle de eventos')
$lines.Add('| Fecha Windows (UTC−3) | Evento | Usuario | Equipo informado | IP |');$lines.Add('|---|---|---|---|---|')
foreach($r in $rows){$lines.Add("| $($r.Fecha) | $($r.Evento) — $($r.Tipo) | $($r.Usuario) | $($r.Origen) | $($r.IP) |")}
$out="$root/reports/AD-usuarios-2026-09-07.md"
$lines|Set-Content -LiteralPath $out -Encoding utf8
$rows|ConvertTo-Json -Depth 5|Set-Content "$root/reports/AD-usuarios-2026-09-07-detalle.json" -Encoding utf8
Get-Content $out -TotalCount 90

