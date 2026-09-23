param(
    [string]$Root = "C:\Zabbix-Audit"
)

$ErrorActionPreference = "Stop"

$Docs     = Join-Path $Root "docs"
$Diagrams = Join-Path $Root "diagrams"
$Reports  = Join-Path $Root "reports"
$Scripts  = Join-Path $Root "scripts"

@($Root,$Docs,$Diagrams,$Reports,$Scripts) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

$GeneratedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Utf8 {
    param(
        [string]$Path,
        [string]$Content
    )

    $Utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path,$Content,$Utf8)
}

function H {
    param([object]$Value)

    if ($null -eq $Value) {
        return ""
    }

    return [System.Net.WebUtility]::HtmlEncode([string]$Value)
}

$Css = @'
:root {
    --navy:#12304a;
    --blue:#1769aa;
    --light:#f4f7fa;
    --line:#d7e0e8;
    --red:#b42318;
    --orange:#c75b12;
    --yellow:#8a6500;
    --green:#177245;
    --gray:#606b75;
}
* { box-sizing:border-box; }
body {
    margin:0;
    font-family:Segoe UI, Arial, sans-serif;
    color:#1c2730;
    background:#eef2f5;
    line-height:1.55;
}
header {
    background:linear-gradient(120deg,#102f49,#1769aa);
    color:white;
    padding:28px 36px;
}
header h1 { margin:0 0 7px 0; font-size:30px; }
header p { margin:0; opacity:.9; }
main {
    max-width:1250px;
    margin:22px auto;
    background:white;
    padding:28px 36px 50px;
    box-shadow:0 2px 10px rgba(0,0,0,.07);
}
nav {
    margin-bottom:25px;
    padding:12px 16px;
    background:#eef5fb;
    border-left:4px solid #1769aa;
}
a { color:#075d9c; }
h2 {
    color:#12304a;
    border-bottom:2px solid #dbe5ec;
    padding-bottom:7px;
    margin-top:34px;
}
h3 { color:#1769aa; margin-top:28px; }
table {
    width:100%;
    border-collapse:collapse;
    margin:16px 0 26px;
    font-size:14px;
}
th {
    background:#12304a;
    color:white;
    text-align:left;
    padding:9px;
}
td {
    border:1px solid #d7e0e8;
    padding:8px;
    vertical-align:top;
}
tr:nth-child(even) td { background:#f8fafc; }
code {
    background:#eef2f5;
    padding:2px 5px;
    border-radius:3px;
}
pre {
    background:#18232d;
    color:#e8f0f5;
    padding:15px;
    overflow:auto;
    border-radius:4px;
}
.note,.warning,.success {
    padding:14px 16px;
    margin:18px 0;
    border-left:5px solid;
}
.note { background:#eef6fd; border-color:#1769aa; }
.warning { background:#fff4eb; border-color:#c75b12; }
.success { background:#ecf8f1; border-color:#177245; }
.critical { color:#b42318; font-weight:700; }
.high { color:#c33b20; font-weight:700; }
.medium { color:#8a6500; font-weight:700; }
.low { color:#177245; font-weight:700; }
.kpi-grid {
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
    gap:14px;
    margin:22px 0;
}
.kpi {
    padding:16px;
    background:#f4f7fa;
    border:1px solid #d7e0e8;
    border-radius:5px;
}
.kpi strong {
    display:block;
    color:#12304a;
    font-size:25px;
}
.small { font-size:13px; color:#606b75; }
img.diagram {
    width:100%;
    max-width:1100px;
    border:1px solid #d7e0e8;
    background:white;
}
footer {
    color:#66737d;
    font-size:12px;
    border-top:1px solid #d7e0e8;
    margin-top:38px;
    padding-top:16px;
}
'@

function New-HtmlPage {
    param(
        [string]$Title,
        [string]$Subtitle,
        [string]$Body,
        [string]$BackLink = "../00_Indice.html"
    )

    return @"
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>$(H $Title)</title>
<style>
$Css
</style>
</head>
<body>
<header>
<h1>$(H $Title)</h1>
<p>$(H $Subtitle)</p>
</header>
<main>
<nav><a href="$(H $BackLink)">← Volver al índice general</a></nav>
$Body
<footer>
Auditoría técnica Zabbix · Generado $GeneratedAt · Documento de trabajo.
No contiene credenciales ni API Tokens.
</footer>
</main>
</body>
</html>
"@
}

# ============================================================
# HALLAZGOS
# ============================================================

$Findings = @(
    [PSCustomObject]@{
        ID="AUD-001"
        Priority="Alta"
        Status="Confirmado"
        Domain="Items"
        Finding="Volumen elevado de items no soportados"
        Evidence="1.316 items efectivos no soportados sobre 19.348 items de hosts (~6,8%). La UI había mostrado 1.177 en otro momento."
        Impact="Pérdida de cobertura, consumo innecesario y ocultamiento de fallas reales."
        Solution="Resolver por causa raíz: VMware, sesiones SNMP, OID/preprocesamiento, JSONPath y cálculos."
        Validation="Reducir progresivamente unsupported y confirmar recuperación de datos válidos."
        Rollback="No eliminar items/templates durante diagnóstico. Revertir sólo cambios puntuales de macros/templates."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-001A"
        Priority="Alta"
        Status="Candidato de causa raíz"
        Domain="VMware"
        Finding="430 errores 'Invalid URL: missing /sdk'"
        Evidence="199 en 172.30.70.132, 198 en 172.30.70.131 y 33 en vCenter. Macro de host observada: https://172.30.70.136/sdk/."
        Impact="Monitoreo VMware incompleto."
        Solution="Validar de forma controlada el endpoint efectivo de VMware. El slash final es candidato de alta probabilidad, no causa confirmada."
        Validation="Probar en un único objeto, esperar varios ciclos y verificar items vmware.* en estado supported."
        Rollback="Registrar el valor actual de {$VMWARE.URL} y restaurarlo inmediatamente si no corrige."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-001B"
        Priority="Alta"
        Status="Confirmado"
        Domain="SNMP"
        Finding="390 fallas de apertura de sesión SNMP"
        Evidence="256 FTG_ar-368-acueducto_SNMP, 64 AP GERENCIAS, 63 AP Administración y 7 SRO-P2P-G06."
        Impact="Grandes bloques de métricas indisponibles y posible presión sobre pollers."
        Solution="Probar UDP/161 desde el Zabbix Server, versión SNMP, credenciales, ACL, routing, timeout y reachability."
        Validation="snmpget/snmpwalk desde el mismo origen que monitorea y recuperación en Latest data."
        Rollback="No cambiar credenciales globales. Realizar cambios por host y documentar valor anterior."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-001C"
        Priority="Alta"
        Status="Confirmado"
        Domain="SNMP/FortiGate"
        Finding="FTG_ar-368-acueducto_SNMP concentra 256 fallas de sesión"
        Evidence="Es el mayor contribuyente SNMP de los objetos revisados."
        Impact="Cobertura FortiGate degradada y reintentos frecuentes."
        Solution="Priorizar conectividad y autenticación SNMP desde Zabbix Server antes de revisar OIDs."
        Validation="Sesión SNMP estable y descenso de items unsupported."
        Rollback="Revertir únicamente parámetros SNMP del host si la prueba empeora."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-001D"
        Priority="Media"
        Status="En investigación"
        Domain="Templates"
        Finding="Template-fit a revisar en AP GERENCIAS y AP Administración"
        Evidence="Los hosts técnicos parecen WAP/AP y están vinculados a 'HP Enterprise Switch by SNMP'. Antes existe una falla de sesión SNMP."
        Impact="Posibles OIDs/preprocesamientos incorrectos una vez resuelta conectividad."
        Solution="Confirmar fabricante/modelo y recién entonces comparar template aplicado versus dispositivo real."
        Validation="Modelo confirmado, OIDs válidos y descubrimientos coherentes."
        Rollback="Exportar template linkage antes de cualquier relink."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-001E"
        Priority="Media"
        Status="Confirmado"
        Domain="Items calculados"
        Finding="10 errores por división por cero"
        Evidence="Expresión observada con vfs.fs.total[fgSysDiskCapacity.0] como denominador."
        Impact="Item calculado queda no soportado y puede invalidar triggers derivados."
        Solution="Agregar guardia explícita para denominador > 0 o no calcular hasta disponer de dato válido."
        Validation="No deben volver a aparecer errores 'division by zero'."
        Rollback="Conservar fórmula original antes de editar."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-002"
        Priority="Media"
        Status="Confirmado"
        Domain="Operación"
        Finding="No existen Maintenance Windows"
        Evidence="maintenance.get devolvió 0 objetos."
        Impact="Cambios planificados pueden generar problemas/avisos innecesarios."
        Solution="Definir mantenimientos por sitio/servicio con alcance, responsable y ventana aprobada."
        Validation="Prueba controlada: evento durante mantenimiento queda suprimido según política."
        Rollback="Eliminar/deshabilitar el mantenimiento creado si el alcance es incorrecto."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-003"
        Priority="Alta"
        Status="Confirmado"
        Domain="Triggers/Interfaces"
        Finding="Política Link Down sin suficiente contexto operacional"
        Evidence="1.630 Link Down en 30 días. En 7 días hubo 434 PROBLEM; los 20 triggers principales acumulan 312 (~71,9%)."
        Impact="Fatiga de alertas y pérdida de señal operacional."
        Solution="Clasificar uplink/core/servidor/AP crítico versus acceso/endpoint/uso eventual. Aplicar {$IFCONTROL:\"interfaz\"}=0 sólo a puertos deliberadamente no accionables."
        Validation="Reducir ruido sin perder eventos de interfaces críticas."
        Rollback="Eliminar el macro contextual agregado o restaurar su valor anterior."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-003A"
        Priority="Alta"
        Status="Confirmado; causa física pendiente"
        Domain="Interfaces"
        Finding="Microflapping severo en SRO-G01-P100-ACC01 Gi1/0/4"
        Evidence="Trigger 35011: 176 PROBLEM en la última corrida de 7 días; 76,7% <2 min, 93,8% <5 min, mediana 1 min, 5 períodos >8 h. Puerto actualmente UP, 1 Gbps, con tráfico y snapshot sin errores/discards."
        Impact="Alerta muy frecuente y posible falla física, energía o comportamiento del endpoint."
        Solution="Identificar endpoint mediante MAC/LLDP/PoE/logs. Si crítico, corregir capa física. Si endpoint no accionable, evaluar IFCONTROL=0. No suprimir mientras sea desconocido."
        Validation="Estabilidad del puerto y desaparición de transiciones inesperadas."
        Rollback="Cualquier exclusión debe ser reversible mediante macro contextual."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-004"
        Priority="Alta"
        Status="Confirmado"
        Domain="Triggers/FortiGate"
        Finding="Umbral ICMP genérico produce gran volumen en varios enlaces"
        Evidence="2.842 eventos FortiGate High ICMP RTT/30d. Expresión confirmada: avg(icmppingsec,10m)>0.15. Cinco sitios concentran 2.828 y Lima sólo 14. No se observaron overrides host-level."
        Impact="Aproximadamente un tercio del volumen de PROBLEM proviene de esta familia."
        Solution="No modificar template global. Medir p50/p95/p99 por sitio y crear overrides host/site de {$ICMP_RESPONSE_TIME_WARN}."
        Validation="Mantener detección de degradación real y disminuir eventos repetitivos."
        Rollback="Eliminar override del host para heredar nuevamente 0.15."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-005"
        Priority="Alta"
        Status="Confirmado"
        Domain="Alerting"
        Finding="Acción global de triggers sin filtros de acción"
        Evidence="'Report problems to Zabbix administrators' está habilitada, eventsource=trigger, sin conditions, envío al grupo Zabbix administrators vía all media."
        Impact="Los problemas ruidosos pueden llegar a administradores; los filtros de media del usuario aún pueden limitar severidad/horario."
        Solution="Diseñar acciones por criticidad, tags, componente y equipo; evitar una única acción catch-all como política final."
        Validation="Eventos de prueba deben enrutar al equipo/canal correcto y no duplicarse."
        Rollback="Mantener export/configuración de la acción actual hasta validar la nueva política."
        Target="30-60 días"
    },
    [PSCustomObject]@{
        ID="AUD-006"
        Priority="Alta"
        Status="Confirmado"
        Domain="Problemas activos"
        Finding="Backlog elevado de problemas activos"
        Evidence="Se observaron aproximadamente 184 en UI y 190 por API en instantes distintos."
        Impact="Problemas persistentes reducen la utilidad operativa del dashboard."
        Solution="Clasificar por edad, servicio, causa raíz y accionabilidad; no cerrar manualmente sin resolver causa."
        Validation="Backlog envejecido reducido y cada problema activo con owner/acción."
        Rollback="No aplica; es proceso de triage."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-007"
        Priority="Media"
        Status="Confirmado"
        Domain="Disponibilidad"
        Finding="Zabbix HA deshabilitado"
        Evidence="System Information: HA cluster disabled."
        Impact="Potencial punto único de falla si Zabbix es servicio crítico."
        Solution="Evaluar RTO/RPO, criticidad, backup, DB y diseño HA antes de implementar."
        Validation="Arquitectura aprobada y prueba de recuperación/failover si se adopta."
        Rollback="Diseño previo obligatorio; no implementar HA directamente en producción."
        Target="60-90 días"
    },
    [PSCustomObject]@{
        ID="AUD-008"
        Priority="Media"
        Status="Confirmado"
        Domain="Plataforma"
        Finding="Servidor Zabbix 7.0.22 con actualización 7.0.x disponible en la UI"
        Evidence="Frontend observó 7.0.22 y mostraba 7.0.30 como versión más reciente al momento de auditoría."
        Impact="Correcciones posteriores no aplicadas."
        Solution="Actualizar sólo después de backup, validación DB, compatibilidad, prueba de templates e inventario."
        Validation="Frontend/server/DB operativos y métricas/triggers estables post-update."
        Rollback="Backup DB y archivos de configuración probado antes del cambio."
        Target="30-60 días"
    },
    [PSCustomObject]@{
        ID="AUD-009"
        Priority="Baja"
        Status="Confirmado"
        Domain="Gobierno"
        Finding="Naming/documentación inconsistente"
        Evidence="Existen hosts visibles sólo mediante direcciones IP y varios aliases de interfaces vacíos."
        Impact="Dificulta identificar dueño, función y criticidad."
        Solution="Normalizar hostname, visible name, sitio, rol, owner, criticidad y alias de interfaces."
        Validation="Inventario técnico-operativo completo."
        Rollback="No aplica; conservar nombres técnicos estables si integraciones dependen de ellos."
        Target="30-60 días"
    },
    [PSCustomObject]@{
        ID="AUD-010"
        Priority="Alta"
        Status="En investigación"
        Domain="Zabbix Server"
        Finding="Eventos repetidos de housekeeper y unreachable poller >75%"
        Evidence="176 eventos de housekeeper y 151 de unreachable poller en 30 días."
        Impact="Puede indicar presión interna, targets inalcanzables, housekeeping/DB o sizing."
        Solution="Revisar procesos internos, StartPollersUnreachable, timeouts, DB, history/trends, housekeeping y relación con hosts SNMP fallidos."
        Validation="Uso de procesos estable y sin eventos recurrentes."
        Rollback="Modificar parámetros sólo con backup de zabbix_server.conf y medición antes/después."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-011"
        Priority="Alta"
        Status="Requiere validación física"
        Domain="UPS"
        Finding="UPS GALPON 01 reporta batería <10 minutos repetidamente"
        Evidence="168 eventos High en 30 días."
        Impact="Riesgo real de autonomía insuficiente durante corte eléctrico."
        Solution="No silenciar. Validar carga, baterías, autonomía estimada, self-test, edad y umbral."
        Validation="Prueba de batería/autonomía y estado estable."
        Rollback="No aplica para diagnóstico; cambios de umbral sólo con justificación."
        Target="0-30 días"
    },
    [PSCustomObject]@{
        ID="AUD-012"
        Priority="Media"
        Status="En investigación"
        Domain="Windows"
        Finding="VSS automático no ejecutándose genera eventos repetidos"
        Evidence="162 eventos para VSS en un host Windows."
        Impact="Puede ser falla real o un servicio cuyo estado stopped sea normal según diseño."
        Solution="Validar función del host, estrategia de backup y comportamiento esperado de VSS antes de excluirlo."
        Validation="Política de servicios críticos definida por rol."
        Rollback="Revertir filtros/overrides si se elimina accidentalmente un servicio requerido."
        Target="0-30 días"
    }
)

function Get-PriorityClass {
    param([string]$Priority)

    switch ($Priority) {
        "Alta"  { return "high" }
        "Media" { return "medium" }
        "Baja"  { return "low" }
        default { return "" }
    }
}

function New-FindingsTable {
    $Rows = foreach ($F in $Findings) {
        $Class = Get-PriorityClass $F.Priority

        "<tr>" +
        "<td><strong>$(H $F.ID)</strong></td>" +
        "<td class='$Class'>$(H $F.Priority)</td>" +
        "<td>$(H $F.Status)</td>" +
        "<td>$(H $F.Domain)</td>" +
        "<td>$(H $F.Finding)</td>" +
        "<td>$(H $F.Evidence)</td>" +
        "<td>$(H $F.Solution)</td>" +
        "</tr>"
    }

    return @"
<table>
<thead>
<tr>
<th>ID</th>
<th>Prioridad</th>
<th>Estado</th>
<th>Dominio</th>
<th>Hallazgo</th>
<th>Evidencia</th>
<th>Solución propuesta</th>
</tr>
</thead>
<tbody>
$($Rows -join "`n")
</tbody>
</table>
"@
}

# ============================================================
# SVG 01 - Arquitectura observada
# ============================================================

$SvgArchitecture = @'
<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="760" viewBox="0 0 1250 760">
<style>
text{font-family:Segoe UI,Arial,sans-serif;fill:#173044}
.title{font-size:27px;font-weight:700}
.sub{font-size:14px;fill:#60717e}
.box{fill:#f6f9fb;stroke:#356985;stroke-width:2;rx:12}
.zbx{fill:#dbeeff;stroke:#1769aa;stroke-width:3;rx:15}
.warn{fill:#fff1e7;stroke:#c75b12;stroke-width:2;rx:10}
.line{stroke:#63879d;stroke-width:3;fill:none}
.dash{stroke:#8a9aa5;stroke-width:2;stroke-dasharray:7 6;fill:none}
.label{font-size:16px;font-weight:600}
.small{font-size:12px}
</style>

<text x="40" y="45" class="title">Arquitectura lógica observada del monitoreo Zabbix</text>
<text x="40" y="70" class="sub">Representación de auditoría. No sustituye un relevamiento físico de red.</text>

<rect x="455" y="110" width="340" height="115" class="zbx"/>
<text x="625" y="148" text-anchor="middle" class="label">Zabbix Server / Frontend</text>
<text x="625" y="176" text-anchor="middle">7.0.22 · ~233,53 NVPS requeridos</text>
<text x="625" y="200" text-anchor="middle" class="small">76/77 hosts según instante · 359 templates</text>

<rect x="55" y="300" width="250" height="105" class="box"/>
<text x="180" y="337" text-anchor="middle" class="label">WAN / FortiGate / VPN</text>
<text x="180" y="366" text-anchor="middle" class="small">ICMP · SNMP · HTTP/API</text>
<text x="180" y="385" text-anchor="middle" class="small">SD-WAN · SSL VPN · IPSec</text>

<rect x="365" y="300" width="250" height="105" class="box"/>
<text x="490" y="337" text-anchor="middle" class="label">LAN</text>
<text x="490" y="366" text-anchor="middle" class="small">Core · Distribución · Acceso</text>
<text x="490" y="385" text-anchor="middle" class="small">HP · TP-Link · AP/WAP</text>

<rect x="675" y="300" width="250" height="105" class="box"/>
<text x="800" y="337" text-anchor="middle" class="label">Virtualización / Servidores</text>
<text x="800" y="366" text-anchor="middle" class="small">VMware · ESXi · Windows</text>
<text x="800" y="385" text-anchor="middle" class="small">Servicios · VSS · discos</text>

<rect x="985" y="300" width="210" height="105" class="box"/>
<text x="1090" y="337" text-anchor="middle" class="label">Infraestructura</text>
<text x="1090" y="366" text-anchor="middle" class="small">Storage · UPS · DNS</text>
<text x="1090" y="385" text-anchor="middle" class="small">Sensores / licencias</text>

<path d="M625 225 L180 300" class="line"/>
<path d="M625 225 L490 300" class="line"/>
<path d="M625 225 L800 300" class="line"/>
<path d="M625 225 L1090 300" class="line"/>

<rect x="130" y="505" width="310" height="120" class="warn"/>
<text x="285" y="540" text-anchor="middle" class="label">Observación SNMP</text>
<text x="285" y="568" text-anchor="middle" class="small">4 hosts inspeccionados usan monitored_by=0</text>
<text x="285" y="588" text-anchor="middle" class="small">proxyid=0 · proxy_groupid=0</text>
<text x="285" y="608" text-anchor="middle" class="small">Validar conectividad desde Zabbix Server</text>

<rect x="475" y="505" width="300" height="120" class="warn"/>
<text x="625" y="540" text-anchor="middle" class="label">Alerting actual</text>
<text x="625" y="568" text-anchor="middle" class="small">Acción global Trigger → Administradores</text>
<text x="625" y="588" text-anchor="middle" class="small">Sin condiciones de acción</text>
<text x="625" y="608" text-anchor="middle" class="small">All media · recuperación notify involved</text>

<rect x="810" y="505" width="310" height="120" class="warn"/>
<text x="965" y="540" text-anchor="middle" class="label">Riesgos operativos</text>
<text x="965" y="568" text-anchor="middle" class="small">0 mantenimientos · HA deshabilitado</text>
<text x="965" y="588" text-anchor="middle" class="small">Unsupported elevado · ruido de triggers</text>
<text x="965" y="608" text-anchor="middle" class="small">Dependencias a completar</text>

<text x="40" y="708" class="sub">Nota: la topología WAN→Core→Distribución→Acceso es un modelo lógico para documentación; las dependencias físicas deben confirmarse antes de configurarlas en Zabbix.</text>
</svg>
'@

Write-Utf8 (Join-Path $Diagrams "01_Arquitectura_Logica_Observada.svg") $SvgArchitecture

# ============================================================
# SVG 02 - Flujo de alertas
# ============================================================

$SvgAlerting = @'
<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="520" viewBox="0 0 1250 520">
<style>
text{font-family:Segoe UI,Arial,sans-serif;fill:#173044}
.title{font-size:27px;font-weight:700}
.sub{font-size:14px;fill:#60717e}
.box{fill:#f7fafc;stroke:#286888;stroke-width:2;rx:12}
.action{fill:#fff1e7;stroke:#c75b12;stroke-width:3;rx:12}
.good{fill:#edf8f2;stroke:#24865b;stroke-width:2;rx:12}
.arrow{stroke:#52798e;stroke-width:3;fill:none;marker-end:url(#a)}
.label{font-size:16px;font-weight:700}
.small{font-size:12px}
</style>
<defs>
<marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
<path d="M0,0 L0,6 L9,3 z" fill="#52798e"/>
</marker>
</defs>

<text x="40" y="45" class="title">Flujo de alertas: estado observado y puntos de control</text>
<text x="40" y="70" class="sub">La existencia de un PROBLEM en dashboard no debería implicar siempre una notificación.</text>

<rect x="45" y="155" width="145" height="90" class="box"/>
<text x="117" y="190" text-anchor="middle" class="label">Item</text>
<text x="117" y="215" text-anchor="middle" class="small">valor / estado</text>

<rect x="235" y="155" width="145" height="90" class="box"/>
<text x="307" y="190" text-anchor="middle" class="label">Trigger</text>
<text x="307" y="215" text-anchor="middle" class="small">expresión / severidad</text>

<rect x="425" y="155" width="145" height="90" class="box"/>
<text x="497" y="190" text-anchor="middle" class="label">Event</text>
<text x="497" y="215" text-anchor="middle" class="small">PROBLEM / OK</text>

<rect x="615" y="135" width="205" height="130" class="action"/>
<text x="717" y="170" text-anchor="middle" class="label">Action</text>
<text x="717" y="196" text-anchor="middle" class="small">Actual: Trigger source</text>
<text x="717" y="216" text-anchor="middle" class="small">Sin conditions</text>
<text x="717" y="236" text-anchor="middle" class="small">Admin group / all media</text>

<rect x="865" y="155" width="145" height="90" class="box"/>
<text x="937" y="190" text-anchor="middle" class="label">User group</text>
<text x="937" y="215" text-anchor="middle" class="small">Administradores</text>

<rect x="1055" y="155" width="145" height="90" class="box"/>
<text x="1127" y="190" text-anchor="middle" class="label">Media</text>
<text x="1127" y="215" text-anchor="middle" class="small">según usuario</text>

<path d="M190 200 L235 200" class="arrow"/>
<path d="M380 200 L425 200" class="arrow"/>
<path d="M570 200 L615 200" class="arrow"/>
<path d="M820 200 L865 200" class="arrow"/>
<path d="M1010 200 L1055 200" class="arrow"/>

<rect x="310" y="340" width="620" height="105" class="good"/>
<text x="620" y="372" text-anchor="middle" class="label">Controles recomendados</text>
<text x="620" y="398" text-anchor="middle">Tags + criticidad + dependencias + maintenance + severidad + equipo responsable</text>
<text x="620" y="422" text-anchor="middle" class="small">Mantener pause for symptom/suppressed y recovery notify involved, que actualmente son puntos positivos.</text>
</svg>
'@

Write-Utf8 (Join-Path $Diagrams "02_Flujo_Alertas.svg") $SvgAlerting

# ============================================================
# SVG 03 - Dependencias propuestas
# ============================================================

$SvgDependencies = @'
<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="650" viewBox="0 0 1250 650">
<style>
text{font-family:Segoe UI,Arial,sans-serif;fill:#173044}
.title{font-size:27px;font-weight:700}
.sub{font-size:14px;fill:#60717e}
.box{fill:#f6f9fb;stroke:#286888;stroke-width:2;rx:12}
.root{fill:#dbeeff;stroke:#1769aa;stroke-width:3;rx:12}
.arrow{stroke:#547b90;stroke-width:3;fill:none;marker-end:url(#a)}
.label{font-size:16px;font-weight:700}
.small{font-size:12px}
</style>
<defs>
<marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
<path d="M0,0 L0,6 L9,3 z" fill="#547b90"/>
</marker>
</defs>

<text x="40" y="45" class="title">Modelo de dependencias propuesto</text>
<text x="40" y="70" class="sub">Debe validarse con topología real antes de configurarse. Objetivo: evitar cascadas de alertas.</text>

<rect x="485" y="105" width="280" height="80" class="root"/>
<text x="625" y="138" text-anchor="middle" class="label">WAN / Carrier / Firewall</text>
<text x="625" y="162" text-anchor="middle" class="small">causa raíz potencial</text>

<rect x="485" y="235" width="280" height="80" class="box"/>
<text x="625" y="268" text-anchor="middle" class="label">Core</text>
<text x="625" y="292" text-anchor="middle" class="small">routing / switching principal</text>

<rect x="485" y="365" width="280" height="80" class="box"/>
<text x="625" y="398" text-anchor="middle" class="label">Distribución</text>
<text x="625" y="422" text-anchor="middle" class="small">agregación por edificio/piso</text>

<rect x="150" y="505" width="280" height="80" class="box"/>
<text x="290" y="538" text-anchor="middle" class="label">Acceso / AP</text>
<text x="290" y="562" text-anchor="middle" class="small">switches / wireless</text>

<rect x="485" y="505" width="280" height="80" class="box"/>
<text x="625" y="538" text-anchor="middle" class="label">Servidores / VMware</text>
<text x="625" y="562" text-anchor="middle" class="small">servicios dependientes</text>

<rect x="820" y="505" width="280" height="80" class="box"/>
<text x="960" y="538" text-anchor="middle" class="label">Storage / UPS / endpoints</text>
<text x="960" y="562" text-anchor="middle" class="small">dependencias específicas</text>

<path d="M625 185 L625 235" class="arrow"/>
<path d="M625 315 L625 365" class="arrow"/>
<path d="M625 445 L290 505" class="arrow"/>
<path d="M625 445 L625 505" class="arrow"/>
<path d="M625 445 L960 505" class="arrow"/>
</svg>
'@

Write-Utf8 (Join-Path $Diagrams "03_Modelo_Dependencias_Propuesto.svg") $SvgDependencies

# ============================================================
# DOCUMENTO 01 - RESUMEN EJECUTIVO
# ============================================================

$Body01 = @'
<div class="warning">
<strong>Conclusión:</strong> el entorno tiene cobertura amplia, pero la utilidad operacional está reducida por items no soportados, ruido de triggers, ausencia de ventanas de mantenimiento y una política de notificación demasiado general.
No se recomienda comenzar actualizando la plataforma ni silenciando triggers masivamente. Primero debe estabilizarse y clasificarse la señal de monitoreo.
</div>

<h2>Baseline observado</h2>

<div class="kpi-grid">
<div class="kpi"><strong>7.0.22</strong>Zabbix Server / Frontend</div>
<div class="kpi"><strong>76–77</strong>Hosts según instante/fuente</div>
<div class="kpi"><strong>359</strong>Templates</div>
<div class="kpi"><strong>19.348</strong>Items efectivos de hosts analizados por API</div>
<div class="kpi"><strong>1.316</strong>Unsupported efectivos (~6,8%)</div>
<div class="kpi"><strong>8.406</strong>PROBLEM events / 30 días</div>
<div class="kpi"><strong>280,2</strong>PROBLEM / día</div>
<div class="kpi"><strong>1.630</strong>Link Down / 30 días</div>
</div>

<h2>Principales conclusiones</h2>
<p>
El 30-day event dataset contiene 8.406 eventos PROBLEM, aproximadamente 11,7 por hora.
Los 15 triggers más frecuentes concentran alrededor de 53,2% del volumen y los 15 hosts más frecuentes alrededor de 78%.
Esto muestra una concentración suficientemente alta como para obtener mejoras rápidas sin rediseñar todo el sistema.
</p>

<p>
FortiGate High ICMP ping response time constituye el mayor grupo de ruido. La expresión fue confirmada como promedio de 10 minutos superior a 150 ms.
El mismo threshold se hereda de template en los sitios analizados y no se observaron overrides de host. Cinco enlaces generan casi todo el volumen, mientras Lima genera muy poco, por lo que el ajuste global del template no es recomendable.
</p>

<p>
Los eventos Link Down muestran dos comportamientos distintos: un caso severo de microflapping y numerosos puertos con períodos DOWN de muchas horas.
El trigger se genera mediante LLD y dispone del macro contextual <code>{$IFCONTROL:"interfaz"}</code>, por lo que existen mecanismos adecuados para excluir únicamente puertos deliberadamente no accionables.
</p>

<h2>Riesgos prioritarios</h2>
<p>
Debe priorizarse la recuperación de monitoreo VMware/SNMP, el backlog de problemas activos, el análisis de la UPS con autonomía menor a 10 minutos y los avisos internos de unreachable poller/housekeeper.
La eliminación de ruido debe hacerse sin ocultar fallas reales.
</p>

<h2>Recomendación de gobierno</h2>
<p>
Separar formalmente tres conceptos: visibilidad en Zabbix, severidad técnica y notificación humana.
Un problema puede ser útil para histórico o dashboard sin justificar una notificación inmediata.
</p>
'@

Write-Utf8 `
    (Join-Path $Docs "01_Resumen_Ejecutivo.html") `
    (New-HtmlPage "01 · Resumen ejecutivo" "Auditoría Zabbix heredado" $Body01)

# ============================================================
# DOCUMENTO 02 - ARQUITECTURA / INVENTARIO
# ============================================================

$Body02 = @'
<h2>Alcance observado</h2>
<p>
El ambiente monitorea FortiGate, WAN, SSL VPN, VPN IPSec, routers y switches core/acceso, VMware ESXi/vCenter,
servidores Windows, tráfico de VLAN, UPS, storage y servicios de infraestructura.
La API confirmó una base amplia de templates y objetos LLD.
</p>

<img class="diagram" src="../diagrams/01_Arquitectura_Logica_Observada.svg" alt="Arquitectura lógica">

<h2>Inventario de plataforma</h2>
<table>
<tr><th>Componente</th><th>Valor observado</th><th>Comentario</th></tr>
<tr><td>Zabbix Server</td><td>7.0.22</td><td>Frontend y server observados en la misma versión.</td></tr>
<tr><td>Hosts</td><td>76 UI / 77 API</td><td>Diferencia a reconciliar por instante/scope. No asumir inconsistencia de datos sin nueva captura simultánea.</td></tr>
<tr><td>Templates</td><td>359</td><td>Clasificar official/custom/linked/unlinked antes de depurar.</td></tr>
<tr><td>Items UI</td><td>19.319</td><td>Snapshot de frontend.</td></tr>
<tr><td>Items efectivos API</td><td>19.348</td><td>Filtrados contra IDs reales de hosts.</td></tr>
<tr><td>Items API totales</td><td>28.333</td><td>Incluye objetos definidos sobre templates.</td></tr>
<tr><td>Triggers UI</td><td>9.148</td><td>Snapshot de frontend.</td></tr>
<tr><td>Triggers API totales</td><td>12.421</td><td>Incluye objetos relacionados a templates.</td></tr>
<tr><td>Discovery rules</td><td>2.187</td><td>Uso significativo de LLD.</td></tr>
<tr><td>Item prototypes</td><td>9.898</td><td>Objetos definidos mediante discovery.</td></tr>
<tr><td>Trigger prototypes</td><td>4.544</td><td>Importante para corregir diseño en origen.</td></tr>
<tr><td>Maintenance</td><td>0</td><td>No hay ventanas configuradas.</td></tr>
<tr><td>HA</td><td>Disabled</td><td>Evaluar según RTO/RPO del servicio.</td></tr>
<tr><td>Required performance</td><td>233,53 NVPS</td><td>Moderado; sizing completo requiere DB/server metrics.</td></tr>
</table>

<h2>Hosts SNMP inspeccionados</h2>
<table>
<tr><th>Host</th><th>Interfaz</th><th>Template</th><th>Origen de monitoreo</th></tr>
<tr><td>FTG_ar-368-acueducto_SNMP</td><td>10.255.254.3:161</td><td>FortiGate by SNMP</td><td>Zabbix Server directo</td></tr>
<tr><td>SRO-P2P-G06</td><td>172.30.71.199:161</td><td>Ubiquiti AirOS by SNMP</td><td>Zabbix Server directo</td></tr>
<tr><td>AP Administración</td><td>172.30.71.13:161</td><td>HP Enterprise Switch by SNMP</td><td>Zabbix Server directo</td></tr>
<tr><td>AP GERENCIAS</td><td>172.30.71.12:161</td><td>HP Enterprise Switch by SNMP</td><td>Zabbix Server directo</td></tr>
</table>

<div class="note">
Para estos cuatro hosts, las pruebas de UDP/161 y SNMP deben realizarse desde el Zabbix Server o desde el mismo camino de red que utiliza el server, no desde la notebook administrativa.
</div>

<h2>Inventario operativo recomendado</h2>
<p>
Cada host debería documentar como mínimo hostname técnico, visible name, sitio, rol, IP, mecanismo de monitoreo,
templates, proxy/origen, owner, criticidad, cantidad de items, unsupported, triggers y volumen de eventos de 30 días.
La criticidad no debe deducirse únicamente del hostname.
</p>
'@

Write-Utf8 `
    (Join-Path $Docs "02_Arquitectura_e_Inventario.html") `
    (New-HtmlPage "02 · Arquitectura e inventario" "Estado observado y modelo lógico" $Body02)

# ============================================================
# DOCUMENTO 03 - HALLAZGOS
# ============================================================

$Body03 = @"
<h2>Registro de hallazgos</h2>
<p>
La columna Estado diferencia defectos confirmados, síntomas confirmados y causas raíz todavía en investigación.
Esto es importante para evitar cambios prematuros.
</p>

$(New-FindingsTable)

<h2>Criterio de prioridad</h2>
<table>
<tr><th>Prioridad</th><th>Criterio</th></tr>
<tr><td class="high">Alta</td><td>Pérdida de monitoreo, riesgo operacional real, gran volumen de ruido o posibilidad de ocultar incidentes.</td></tr>
<tr><td class="medium">Media</td><td>Mejora importante de confiabilidad, operación o mantenibilidad sin riesgo inmediato demostrado.</td></tr>
<tr><td class="low">Baja</td><td>Gobierno, naming, documentación y optimización posterior.</td></tr>
</table>
"@

Write-Utf8 `
    (Join-Path $Docs "03_Hallazgos_Tecnicos.html") `
    (New-HtmlPage "03 · Hallazgos técnicos" "Registro priorizado de auditoría" $Body03)

# ============================================================
# DOCUMENTO 04 - ALERTAS Y RUIDO
# ============================================================

$Body04 = @'
<img class="diagram" src="../diagrams/02_Flujo_Alertas.svg" alt="Flujo de alertas">

<h2>Volumen de eventos</h2>
<table>
<tr><th>Métrica</th><th>Valor</th></tr>
<tr><td>PROBLEM events / 30 días</td><td>8.406</td></tr>
<tr><td>Promedio diario</td><td>280,2</td></tr>
<tr><td>Promedio horario</td><td>~11,7</td></tr>
<tr><td>Intervalo medio entre PROBLEM</td><td>~5,1 minutos</td></tr>
<tr><td>Unique hosts con eventos</td><td>71</td></tr>
<tr><td>Unique triggers con eventos</td><td>647</td></tr>
<tr><td>Link Down / 30 días</td><td>1.630 (~19,4%)</td></tr>
<tr><td>Windows service / 30 días</td><td>319 (~3,8%)</td></tr>
</table>

<h2>Principales triggers observados</h2>
<table>
<tr><th>Eventos</th><th>Severidad</th><th>Trigger</th></tr>
<tr><td>967</td><td>Warning</td><td>FortiGate: High ICMP ping response time</td></tr>
<tr><td>709</td><td>Warning</td><td>FortiGate: High ICMP ping response time</td></tr>
<tr><td>520</td><td>Average</td><td>TP-LINK Interface gigabitEthernet 1/0/4 Link down</td></tr>
<tr><td>485</td><td>Warning</td><td>FortiGate: High ICMP ping response time</td></tr>
<tr><td>457</td><td>Warning</td><td>FortiGate: High ICMP ping response time</td></tr>
<tr><td>210</td><td>Warning</td><td>FortiGate: High ICMP ping response time</td></tr>
<tr><td>176</td><td>Average</td><td>Zabbix server housekeeper utilization &gt;75%</td></tr>
<tr><td>171</td><td>Warning</td><td>HP Enterprise Switch radio0_ssid_id1 High error rate</td></tr>
<tr><td>168</td><td>High</td><td>UPS GALPON 01 Battery has less than 10 Minutes Remaining</td></tr>
<tr><td>162</td><td>Average</td><td>Windows VSS automatic service not running</td></tr>
<tr><td>151</td><td>Average</td><td>Zabbix server unreachable poller utilization &gt;75%</td></tr>
</table>

<h2>FortiGate ICMP</h2>
<p>
Se confirmaron seis expresiones equivalentes a <code>avg(icmppingsec,10m)&gt;0.15</code>.
Por lo tanto, el trigger no responde a un pico instantáneo: exige RTT promedio superior a 150 ms durante 10 minutos.
Además posee dependencias con Unavailable by ICMP ping y High ICMP ping loss, lo cual es un punto de diseño positivo.
</p>

<p>
La distribución por sitio demuestra que 150 ms no funciona como umbral universal.
Antes de elegir nuevos números debe medirse p50, p95, p99 y máximo por enlace.
La recomendación es override por host/sitio mediante <code>{$ICMP_RESPONSE_TIME_WARN}</code>, no cambio global del template.
</p>

<h2>Link Down</h2>
<p>
Los Link Down analizados provienen de LLD (<code>flags=4</code>) y usan un trigger prototype.
La expresión del caso más ruidoso se expandió a una condición de transición inmediata a ifOperStatus=2.
No existe debounce temporal: cada transición a DOWN genera PROBLEM y la recuperación se produce al volver a un estado distinto de DOWN.
</p>

<p>
El mecanismo <code>{$IFCONTROL:"{#IFNAME}"}</code> ya forma parte del prototype.
Esto permite controlar puertos de manera contextual sin editar cientos de triggers generados.
</p>

<h3>Caso 35011 — SRO-G01-P100-ACC01 / Gi1/0/4</h3>
<table>
<tr><th>Dato</th><th>Valor</th></tr>
<tr><td>PROBLEM en última corrida de 7 días</td><td>176</td></tr>
<tr><td>Caídas &lt;2 min</td><td>76,7%</td></tr>
<tr><td>Caídas &lt;5 min</td><td>93,8%</td></tr>
<tr><td>Mediana</td><td>1 minuto</td></tr>
<tr><td>Caídas &gt;8 h</td><td>5</td></tr>
<tr><td>Estado actual observado</td><td>UP</td></tr>
<tr><td>Velocidad</td><td>1 Gbps</td></tr>
<tr><td>Errores/discards snapshot</td><td>0</td></tr>
<tr><td>Alias</td><td>Vacío</td></tr>
</table>

<div class="warning">
No deshabilitar todavía este puerto. Primero identificar el endpoint mediante tabla MAC, LLDP, PoE, descripción de puerto y logs del switch.
Si es uplink/AP/servidor crítico, el flapping requiere corrección física/L2. Si es un endpoint no accionable, recién entonces evaluar IFCONTROL=0.
</div>

<h2>Política recomendada</h2>
<p>
Separar puertos críticos, puertos de infraestructura, servidores/storage, AP/cámaras y puertos de acceso de usuario.
Los uplinks pueden justificar detección inmediata. Los puertos de acceso deberían tener una política distinta o no notificar Link Down.
</p>
'@

Write-Utf8 `
    (Join-Path $Docs "04_Alertas_Ruido_y_Triggers.html") `
    (New-HtmlPage "04 · Alertas, ruido y triggers" "Análisis operativo de 30 y 7 días" $Body04)

# ============================================================
# DOCUMENTO 05 - RUNBOOK
# ============================================================

$Body05 = @'
<div class="warning">
<strong>Regla de cambio:</strong> exportar/configurar rollback antes de modificar producción.
No ejecutar cambios masivos en templates, LLD, actions ni macros globales sin prueba controlada.
</div>

<h2>Fase 0 — Preparación</h2>
<ol>
<li>Revocar cualquier API Token que haya quedado expuesto durante pruebas y generar uno nuevo sólo cuando sea necesario.</li>
<li>Realizar backup de base de datos, <code>zabbix_server.conf</code>, configuración frontend y templates/custom scripts.</li>
<li>Exportar templates que serán modificados.</li>
<li>Capturar baseline: unsupported, active problems, event rate, internal process utilization.</li>
<li>Definir ventana de cambio y responsable.</li>
</ol>

<h2>Fase 1 — VMware /sdk</h2>
<ol>
<li>Registrar el valor efectivo actual de <code>{$VMWARE.URL}</code> de los tres hosts.</li>
<li>Confirmar acceso al endpoint VMware desde Zabbix Server.</li>
<li>Seleccionar un único host de prueba.</li>
<li>Probar de forma controlada el endpoint exacto esperado por el template, prestando especial atención a la diferencia <code>/sdk</code> versus <code>/sdk/</code>.</li>
<li>Esperar varios intervalos de actualización.</li>
<li>Verificar que <code>vmware.version</code>, <code>vmware.fullname</code>, alarms, clusters/datastores y discovery vuelvan a Supported.</li>
<li>Si falla, restaurar exactamente el macro anterior.</li>
<li>Sólo si la prueba es exitosa, extender el cambio a los demás objetos.</li>
</ol>

<h2>Fase 2 — SNMP</h2>
<ol>
<li>Ejecutar pruebas desde Zabbix Server, porque los cuatro hosts inspeccionados están monitoreados directamente por él.</li>
<li>Verificar routing, ping si aplica y UDP/161.</li>
<li>Confirmar versión SNMP configurada en Zabbix y dispositivo.</li>
<li>Confirmar community/credentials sin exponerlas en documentación ni chat.</li>
<li>Revisar ACL del dispositivo y firewall intermedio.</li>
<li>Ejecutar <code>snmpget</code> sobre sysDescr/sysUpTime y luego un walk acotado.</li>
<li>Sólo después de establecer sesión, investigar No Such Object/Instance.</li>
<li>Confirmar modelo de AP GERENCIAS y AP Administración antes de modificar su template.</li>
</ol>

<h2>Fase 3 — Items calculados y preprocesamiento</h2>
<ol>
<li>Localizar los 10 items con división por cero.</li>
<li>Guardar fórmula actual.</li>
<li>Comprobar por qué el denominador retorna cero.</li>
<li>Agregar condición/guardia para no dividir cuando el valor es 0 o inválido.</li>
<li>Revisar JSONPath faltantes <code>$.link</code>, <code>$.session</code>, <code>$.action</code> y <code>$.status</code> contra la respuesta real de API.</li>
<li>Corregir template/preprocessing solamente cuando el payload esperado esté confirmado.</li>
</ol>

<h2>Fase 4 — Link Down</h2>
<ol>
<li>Identificar cada interfaz ruidosa: alias, MAC, LLDP, endpoint, PoE, rol y owner.</li>
<li>Clasificarla como Critical / High / Medium / Low.</li>
<li>Para uplinks/core/firewall/ESXi/storage/AP crítico: mantener alerta y corregir flapping físico/L2.</li>
<li>Para PC/impresora/endpoint sin accionabilidad: evaluar macro contextual <code>{$IFCONTROL:"IFNAME"}=0</code>.</li>
<li>No editar triggers generados individualmente; el origen es LLD.</li>
<li>Si muchos puertos de acceso muestran microflapping, crear una política/prototype con persistencia temporal diferenciada.</li>
<li>Probar cualquier cambio de prototype sobre un host/template de laboratorio o alcance acotado.</li>
</ol>

<h2>Fase 5 — FortiGate ICMP</h2>
<ol>
<li>Obtener itemid de <code>icmppingsec</code> para cada FortiGate.</li>
<li>Extraer history/trends de 30 días.</li>
<li>Calcular p50, p95, p99 y máximo por sitio.</li>
<li>Documentar latencia normal de cada enlace.</li>
<li>Definir threshold operacional por sitio.</li>
<li>Crear override host-level de <code>{$ICMP_RESPONSE_TIME_WARN}</code>.</li>
<li>No modificar el valor 0.15 del template global mientras existan perfiles WAN claramente distintos.</li>
<li>Medir event rate durante 7-14 días post-cambio.</li>
</ol>

<h2>Fase 6 — Acción de notificación</h2>
<ol>
<li>Exportar/documentar la acción actual.</li>
<li>Definir tags mínimos: site, component, service, owner, criticality.</li>
<li>Crear acciones nuevas en paralelo, inicialmente deshabilitadas.</li>
<li>Separar Critical/High de Warning/Information.</li>
<li>Filtrar por servicio/owner/criticidad en vez de enviar todos los problemas a un único grupo.</li>
<li>Revisar medias de usuarios para evitar duplicados por “all media”.</li>
<li>Mantener recovery notify involved.</li>
<li>Mantener pausa para síntomas y problemas suprimidos.</li>
<li>Habilitar gradualmente y realizar eventos de prueba.</li>
<li>Desactivar la acción catch-all sólo cuando la cobertura nueva esté validada.</li>
</ol>

<h2>Fase 7 — Maintenance Windows</h2>
<ol>
<li>Crear una ventana piloto para un host no crítico.</li>
<li>Confirmar que los problemas se visualizan/suprimen según política sin enviar notificación no deseada.</li>
<li>Crear mantenimientos recurrentes sólo para actividades realmente planificadas.</li>
<li>No utilizar maintenance para ocultar problemas permanentes.</li>
</ol>

<h2>Fase 8 — Salud del Zabbix Server</h2>
<ol>
<li>Obtener acceso SSH cuando esté aprobado.</li>
<li>Revisar <code>zabbix_server.log</code>, caches, pollers, unreachable pollers, preprocessing y housekeeper.</li>
<li>Revisar DB: tamaño de history/trends/events, índices, IO, queries lentas y housekeeping.</li>
<li>Correlacionar los 151 eventos de unreachable poller con hosts SNMP inalcanzables.</li>
<li>Corregir targets inalcanzables antes de simplemente aumentar procesos.</li>
<li>Revisar retención/history/trends y housekeeping.</li>
<li>Ajustar procesos sólo con métricas de saturación sostenida.</li>
</ol>

<h2>Fase 9 — UPS y Windows VSS</h2>
<ol>
<li>UPS GALPON 01: validar físicamente batería, carga, autonomía, self-test y edad. No silenciar el High.</li>
<li>VSS: validar si el host depende de snapshots/backups VSS y si el servicio automático debería permanecer running.</li>
<li>Definir una política de Windows Service Discovery basada en servicios realmente críticos.</li>
</ol>

<h2>Fase 10 — Actualización y HA</h2>
<ol>
<li>No actualizar mientras persista incertidumbre sobre baseline y backups.</li>
<li>Validar release objetivo, compatibilidad DB, templates y scripts.</li>
<li>Probar restauración de backup antes de upgrade.</li>
<li>Actualizar primero entorno de prueba si existe.</li>
<li>Después de estabilizar 7.0.x, evaluar HA según RTO/RPO y criticidad real del monitoreo.</li>
</ol>
'@

Write-Utf8 `
    (Join-Path $Docs "05_Runbook_Remediacion_Paso_a_Paso.html") `
    (New-HtmlPage "05 · Runbook de remediación" "Procedimiento paso a paso con validación y rollback" $Body05)

# ============================================================
# DOCUMENTO 06 - ROADMAP
# ============================================================

$Body06 = @'
<h2>0–30 días — Recuperar señal y reducir riesgo</h2>
<table>
<tr><th>Acción</th><th>Hallazgos</th><th>Criterio de aceptación</th></tr>
<tr><td>Corregir VMware /sdk de forma controlada</td><td>AUD-001 / 001A</td><td>Items VMware Supported y datos coherentes.</td></tr>
<tr><td>Restaurar sesiones SNMP</td><td>AUD-001B/C/D</td><td>Sesión estable y caída significativa de unsupported.</td></tr>
<tr><td>Corregir división por cero y preprocessing</td><td>AUD-001E</td><td>Sin errores repetitivos.</td></tr>
<tr><td>Triage de problemas activos</td><td>AUD-006</td><td>Problemas envejecidos con owner/acción.</td></tr>
<tr><td>Identificar puertos Link Down ruidosos</td><td>AUD-003/003A</td><td>Top interfaces clasificadas por criticidad.</td></tr>
<tr><td>Baseline ICMP por sitio</td><td>AUD-004</td><td>p50/p95/p99 documentados.</td></tr>
<tr><td>Validar UPS y VSS</td><td>AUD-011/012</td><td>Causa y política operacional documentadas.</td></tr>
<tr><td>Revisar procesos internos</td><td>AUD-010</td><td>Housekeeper/unreachable poller explicados y estabilizados.</td></tr>
<tr><td>Crear Maintenance piloto</td><td>AUD-002</td><td>Ventana probada sin alertas no deseadas.</td></tr>
</table>

<h2>30–60 días — Rediseñar alerting y gobierno</h2>
<table>
<tr><th>Acción</th><th>Objetivo</th></tr>
<tr><td>Acciones por criticidad/tags/equipo</td><td>Eliminar catch-all como política principal.</td></tr>
<tr><td>Overrides ICMP por sitio</td><td>Reducir ruido sin perder degradación real.</td></tr>
<tr><td>Política LLD de interfaces</td><td>Separar uplink/infra/acceso.</td></tr>
<tr><td>Política Windows services</td><td>Alertar únicamente servicios accionables.</td></tr>
<tr><td>Normalización de naming/alias/owner</td><td>Mejorar trazabilidad.</td></tr>
<tr><td>Plan de actualización 7.0.x</td><td>Aplicar actualización después de backup/prueba.</td></tr>
</table>

<h2>60–90 días — Resiliencia y optimización</h2>
<table>
<tr><th>Acción</th><th>Objetivo</th></tr>
<tr><td>Mapa real de dependencias</td><td>Suprimir cascadas por causa raíz.</td></tr>
<tr><td>HA / DR assessment</td><td>Definir arquitectura según RTO/RPO.</td></tr>
<tr><td>Optimización DB/retención/caches</td><td>Estabilizar performance y housekeeping.</td></tr>
<tr><td>Revisión de templates custom vs official</td><td>Reducir deuda técnica.</td></tr>
<tr><td>KPI de monitoreo</td><td>Unsupported %, event rate, MTTA, stale problems, noisy triggers.</td></tr>
</table>

<img class="diagram" src="../diagrams/03_Modelo_Dependencias_Propuesto.svg" alt="Modelo de dependencias">
'@

Write-Utf8 `
    (Join-Path $Docs "06_Roadmap_0_30_60_90.html") `
    (New-HtmlPage "06 · Roadmap 0–90 días" "Priorización por riesgo y madurez" $Body06)

# ============================================================
# DOCUMENTO 07 - TEST Y ROLLBACK
# ============================================================

$Body07 = @'
<h2>Principio</h2>
<p>
Cada cambio debe tener: configuración anterior, alcance, hipótesis, prueba, métrica de éxito, observación y rollback.
No considerar un cambio exitoso sólo porque desaparece una alarma.
</p>

<table>
<tr>
<th>Cambio</th>
<th>Pre-check</th>
<th>Validación</th>
<th>Rollback</th>
</tr>
<tr>
<td>VMWARE.URL</td>
<td>Guardar macro efectivo y lista de items afectados.</td>
<td>Items vmware.* Supported durante varios ciclos.</td>
<td>Restaurar macro anterior.</td>
</tr>
<tr>
<td>SNMP</td>
<td>Guardar versión/interfaz/template.</td>
<td>snmpget/walk y Latest data.</td>
<td>Restaurar parámetros del host.</td>
</tr>
<tr>
<td>IFCONTROL</td>
<td>Identificar endpoint y criticidad.</td>
<td>Puerto deja de notificar sin perder cobertura de infraestructura.</td>
<td>Eliminar override o volver a 1.</td>
</tr>
<tr>
<td>ICMP override</td>
<td>Baseline p50/p95/p99.</td>
<td>Menor ruido, detección de degradación conservada.</td>
<td>Eliminar override.</td>
</tr>
<tr>
<td>Action</td>
<td>Export/documentar acción actual.</td>
<td>Evento sintético enruta al grupo/media correctos.</td>
<td>Deshabilitar nueva acción y reactivar anterior.</td>
</tr>
<tr>
<td>Maintenance</td>
<td>Validar alcance de host/group.</td>
<td>Supresión sólo durante la ventana.</td>
<td>Eliminar/deshabilitar mantenimiento.</td>
</tr>
<tr>
<td>zabbix_server.conf</td>
<td>Backup + métricas internas.</td>
<td>Procesos/caches estables y logs limpios.</td>
<td>Restaurar archivo y reiniciar servicio.</td>
</tr>
<tr>
<td>Upgrade</td>
<td>Backup DB/config + prueba de restore.</td>
<td>Frontend/API/server, items y triggers estables.</td>
<td>Procedimiento de restore aprobado previamente.</td>
</tr>
</table>

<h2>Métricas mínimas antes/después</h2>
<p>
Unsupported efectivos, PROBLEM/día, top noisy triggers, active problems, queue, unreachable poller utilization,
housekeeper utilization, NVPS, DB growth, alert deliveries y cantidad de incidentes accionables.
</p>
'@

Write-Utf8 `
    (Join-Path $Docs "07_Plan_Pruebas_y_Rollback.html") `
    (New-HtmlPage "07 · Plan de pruebas y rollback" "Control técnico de cambios" $Body07)

# ============================================================
# DOCUMENTO 08 - EVIDENCIAS
# ============================================================

$Body08 = @'
<h2>Archivos raw de auditoría existentes</h2>
<p>
La extracción API generó archivos numerados 00–23 en <code>C:\Zabbix-Audit\raw</code>.
Los raw deben tratarse como información sensible porque pueden contener estructura interna, macros y configuración.
No se incluyen en el ZIP de documentación.
</p>

<h2>Principales conjuntos extraídos</h2>
<table>
<tr><th>Archivo / conjunto</th><th>Contenido</th></tr>
<tr><td>02_hosts.json</td><td>Hosts</td></tr>
<tr><td>03_templates.json</td><td>Templates</td></tr>
<tr><td>04_items.json</td><td>Items</td></tr>
<tr><td>05_triggers.json</td><td>Triggers</td></tr>
<tr><td>06_discovery_rules.json</td><td>LLD rules</td></tr>
<tr><td>07_item_prototypes.json</td><td>Item prototypes</td></tr>
<tr><td>08_trigger_prototypes.json</td><td>Trigger prototypes</td></tr>
<tr><td>09/19 actions</td><td>Actions y operaciones</td></tr>
<tr><td>10_mediatypes.json</td><td>Media types</td></tr>
<tr><td>13_maintenances.json</td><td>Maintenance</td></tr>
<tr><td>15_current_problems.json</td><td>Problemas activos</td></tr>
<tr><td>16_problem_events_30d.json</td><td>Eventos PROBLEM 30 días</td></tr>
<tr><td>20/21/22</td><td>Macros host/template/global</td></tr>
<tr><td>23_snmp_hosts_proxy.json</td><td>Origen de monitoreo SNMP</td></tr>
</table>

<h2>Scripts de análisis</h2>
<pre>
C:\Zabbix-Audit\scripts\Export-ZabbixAudit.ps1
C:\Zabbix-Audit\scripts\Export-ZabbixAudit-Part2.ps1
C:\Zabbix-Audit\scripts\Analyze-ZabbixItems.ps1
C:\Zabbix-Audit\scripts\Analyze-ZabbixNoise.ps1
C:\Zabbix-Audit\scripts\Analyze-LinkDownFlapping.ps1
</pre>

<h2>Datos confirmados relevantes</h2>
<pre>
Zabbix API                  7.0.22
Items API totales           28.333
Items efectivos hosts       19.348
Unsupported efectivos        1.316
Problem events / 30d         8.406
Link Down / 30d              1.630
Current problems             ~184-190
VMware missing /sdk             430
SNMP session failures           390
Division by zero                 10
Maintenance objects                0
</pre>

<div class="note">
Las diferencias entre UI y API observadas en distintos momentos deben preservarse como evidencia temporal y no “corregirse” artificialmente.
</div>
'@

Write-Utf8 `
    (Join-Path $Docs "08_Evidencias_y_Trazabilidad.html") `
    (New-HtmlPage "08 · Evidencias y trazabilidad" "Fuentes utilizadas para la auditoría" $Body08)

# ============================================================
# EXCEL XLSX SIN DEPENDENCIAS EXTERNAS
# ============================================================

function Excel-ColName {
    param([int]$Number)

    $Name = ""
    while ($Number -gt 0) {
        $Number--
        $Name = [char](65 + ($Number % 26)) + $Name
        $Number = [math]::Floor($Number / 26)
    }
    return $Name
}

function XmlEscape {
    param([object]$Value)

    if ($null -eq $Value) {
        return ""
    }

    return [System.Security.SecurityElement]::Escape([string]$Value)
}

function New-WorksheetXml {
    param(
        [array]$Rows,
        [int]$PriorityColumn = 0
    )

    $RowXml = New-Object System.Collections.Generic.List[string]
    $MaxColumns = 1

    for ($r = 0; $r -lt $Rows.Count; $r++) {
        $Values = @($Rows[$r])
        if ($Values.Count -gt $MaxColumns) {
            $MaxColumns = $Values.Count
        }

        $ExcelRow = $r + 1
        $Cells = New-Object System.Collections.Generic.List[string]

        $RowPriority = ""
        if ($PriorityColumn -gt 0 -and $Values.Count -ge $PriorityColumn) {
            $RowPriority = [string]$Values[$PriorityColumn - 1]
        }

        for ($c = 0; $c -lt $Values.Count; $c++) {
            $Ref = "$(Excel-ColName ($c+1))$ExcelRow"
            $Style = 0

            if ($r -eq 0) {
                $Style = 1
            }
            elseif ($RowPriority -eq "Crítica") {
                $Style = 2
            }
            elseif ($RowPriority -eq "Alta") {
                $Style = 3
            }
            elseif ($RowPriority -eq "Media") {
                $Style = 4
            }
            elseif ($RowPriority -eq "Baja") {
                $Style = 5
            }

            $Value = XmlEscape $Values[$c]

            $Cells.Add(
                "<c r=`"$Ref`" t=`"inlineStr`" s=`"$Style`"><is><t xml:space=`"preserve`">$Value</t></is></c>"
            )
        }

        $RowXml.Add("<row r=`"$ExcelRow`">$($Cells -join '')</row>")
    }

    $LastCol = Excel-ColName $MaxColumns
    $LastRow = $Rows.Count

    return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews>
<sheetView workbookViewId="0">
<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
</sheetView>
</sheetViews>
<cols>
<col min="1" max="1" width="14" customWidth="1"/>
<col min="2" max="$MaxColumns" width="24" customWidth="1"/>
</cols>
<sheetData>
$($RowXml -join "`n")
</sheetData>
<autoFilter ref="A1:$LastCol$LastRow"/>
</worksheet>
"@
}

$ExcelSheets = New-Object System.Collections.Generic.List[object]

$FindingRows = New-Object System.Collections.Generic.List[object]
$FindingRows.Add(@(
    "ID","Prioridad","Estado","Dominio","Hallazgo","Evidencia",
    "Impacto","Solución propuesta","Validación","Rollback","Objetivo"
))

foreach ($F in $Findings) {
    $FindingRows.Add(@(
        $F.ID,$F.Priority,$F.Status,$F.Domain,$F.Finding,$F.Evidence,
        $F.Impact,$F.Solution,$F.Validation,$F.Rollback,$F.Target
    ))
}

$ExcelSheets.Add([PSCustomObject]@{
    Name="Hallazgos"
    Rows=$FindingRows
    PriorityColumn=2
})

$BaselineRows = @(
    @("Métrica","Valor","Período/Fuente","Comentario"),
    @("Zabbix version","7.0.22","System Information/API","Frontend y server observados"),
    @("Hosts","76 UI / 77 API","Snapshots distintos","Reconciliar"),
    @("Templates","359","UI/API","Clasificar antes de depurar"),
    @("Items UI","19.319","UI","Snapshot"),
    @("Items efectivos API","19.348","API","Sólo IDs reales de host"),
    @("Unsupported efectivos","1.316 (~6,8%)","API","Prioridad alta"),
    @("Problem events","8.406","30 días","280,2/día"),
    @("Link Down","1.630","30 días","19,4% del volumen"),
    @("Windows services","319","30 días","Revisar accionabilidad"),
    @("Maintenance","0","API","Ausencia confirmada"),
    @("Required performance","233,53 NVPS","System Information","Sizing completo pendiente"),
    @("HA","Disabled","System Information","Evaluar RTO/RPO")
)

$ExcelSheets.Add([PSCustomObject]@{
    Name="Baseline"
    Rows=$BaselineRows
    PriorityColumn=0
})

$RoadmapRows = @(
    @("Fase","Prioridad","Hallazgo/Área","Acción","Criterio de aceptación"),
    @("0-30","Alta","VMware","Validar y corregir /sdk en prueba controlada","Items VMware Supported"),
    @("0-30","Alta","SNMP","Restaurar sesiones desde Zabbix Server","Sesiones estables; unsupported baja"),
    @("0-30","Alta","Link Down","Clasificar top interfaces y endpoint","Criticality/owner definidos"),
    @("0-30","Alta","FortiGate ICMP","Medir p50/p95/p99 por sitio","Thresholds justificables"),
    @("0-30","Alta","UPS","Validar batería/autonomía","Estado físico documentado"),
    @("0-30","Alta","Zabbix server","Investigar pollers/housekeeper","Procesos estables"),
    @("30-60","Alta","Actions","Crear routing por tags/criticidad","Pruebas de entrega exitosas"),
    @("30-60","Media","Maintenance","Formalizar ventanas","Cambios planificados sin ruido"),
    @("30-60","Media","Upgrade","Actualizar 7.0.x con backup probado","Plataforma estable"),
    @("60-90","Media","Dependencias","Modelar topología confirmada","Supresión de cascadas"),
    @("60-90","Media","HA/DR","Evaluar arquitectura","RTO/RPO aprobado")
)

$ExcelSheets.Add([PSCustomObject]@{
    Name="Plan_0_90"
    Rows=$RoadmapRows
    PriorityColumn=2
})

$NoiseRows = @(
    @("Eventos30d","Severidad","Trigger"),
    @("967","Warning","FortiGate High ICMP ping response time"),
    @("709","Warning","FortiGate High ICMP ping response time"),
    @("520","Average","TP-LINK gigabitEthernet 1/0/4 Link down"),
    @("485","Warning","FortiGate High ICMP ping response time"),
    @("457","Warning","FortiGate High ICMP ping response time"),
    @("210","Warning","FortiGate High ICMP ping response time"),
    @("176","Average","Zabbix housekeeper processes >75%"),
    @("171","Warning","HP Enterprise Switch radio0_ssid_id1 High error rate"),
    @("168","High","UPS GALPON 01 Battery <10 Minutes Remaining"),
    @("162","Average","Windows VSS automatic service not running"),
    @("151","Average","Zabbix unreachable poller processes >75%"),
    @("108","Warning","HP Comware interface High error rate"),
    @("70","Average","FortiGate SD-WAN health check dead"),
    @("61","Average","FortiGate SD-WAN google wan1 dead"),
    @("58","Warning","Windows Memory Pages/sec >1000 for 5m")
)

$ExcelSheets.Add([PSCustomObject]@{
    Name="Ruido_Triggers"
    Rows=$NoiseRows
    PriorityColumn=0
})

$HostRows = @(
    @("Eventos30d","Host"),
    @("1201","FTG_ar-ssj-predio_SNMP"),
    @("887","FTG_ar-377-YPF_3er-Loop_SNMP"),
    @("622","FTG_ar-372-posco_SNMP"),
    @("620","SRO-E02-PB00-ACC01"),
    @("599","SRO-G01-P100-ACC01"),
    @("590","FTG_ar-223-rio_tinto_SNMP"),
    @("337","Zabbix server"),
    @("326","FTG_ar-341-san_luis_SNMP"),
    @("266","SW Ed Gris PB"),
    @("248","SSJ-HPV01"),
    @("242","AP RECEPCION"),
    @("174","UPS GALPON 01"),
    @("155","SRO-G01-P100-DIS01"),
    @("148","SRO-G01-P000-ACC2"),
    @("141","SRO-G01-P01-D04")
)

$ExcelSheets.Add([PSCustomObject]@{
    Name="Ruido_Hosts"
    Rows=$HostRows
    PriorityColumn=0
})

$LinkCsv = Join-Path $Reports "20_linkdown_flapping_7d.csv"

if (Test-Path $LinkCsv) {
    $LinkData = @(Import-Csv $LinkCsv)

    if ($LinkData.Count -gt 0) {
        $Headers = @($LinkData[0].PSObject.Properties.Name)
        $LinkRows = New-Object System.Collections.Generic.List[object]
        $LinkRows.Add($Headers)

        foreach ($Line in $LinkData) {
            $Values = foreach ($Header in $Headers) {
                $Line.$Header
            }
            $LinkRows.Add(@($Values))
        }

        $ExcelSheets.Add([PSCustomObject]@{
            Name="LinkDown_7d"
            Rows=$LinkRows
            PriorityColumn=0
        })
    }
}

$XlsxTemp = Join-Path $env:TEMP ("zabbix-xlsx-" + [guid]::NewGuid().ToString())
$XlPath   = Join-Path $XlsxTemp "xl"
$WsPath   = Join-Path $XlPath "worksheets"
$RelsRoot = Join-Path $XlsxTemp "_rels"
$XlRels   = Join-Path $XlPath "_rels"

New-Item -ItemType Directory -Path $WsPath,$RelsRoot,$XlRels -Force | Out-Null

$ContentOverrides = New-Object System.Collections.Generic.List[string]
$WorkbookSheets   = New-Object System.Collections.Generic.List[string]
$WorkbookRels     = New-Object System.Collections.Generic.List[string]

for ($i=0; $i -lt $ExcelSheets.Count; $i++) {
    $N = $i + 1
    $Sheet = $ExcelSheets[$i]

    $SheetXml = New-WorksheetXml `
        -Rows $Sheet.Rows `
        -PriorityColumn $Sheet.PriorityColumn

    Write-Utf8 (Join-Path $WsPath "sheet$N.xml") $SheetXml

    $ContentOverrides.Add(
        "<Override PartName=`"/xl/worksheets/sheet$N.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml`"/>"
    )

    $SafeSheetName = XmlEscape $Sheet.Name

    $WorkbookSheets.Add(
        "<sheet name=`"$SafeSheetName`" sheetId=`"$N`" r:id=`"rId$N`"/>"
    )

    $WorkbookRels.Add(
        "<Relationship Id=`"rId$N`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`" Target=`"worksheets/sheet$N.xml`"/>"
    )
}

$StylesRelId = $ExcelSheets.Count + 1

$ContentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
$($ContentOverrides -join "`n")
</Types>
"@

Write-Utf8 (Join-Path $XlsxTemp "[Content_Types].xml") $ContentTypes

$RootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
'@

Write-Utf8 (Join-Path $RelsRoot ".rels") $RootRels

$Workbook = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
$($WorkbookSheets -join "`n")
</sheets>
</workbook>
"@

Write-Utf8 (Join-Path $XlPath "workbook.xml") $Workbook

$WorkbookRelXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
$($WorkbookRels -join "`n")
<Relationship Id="rId$StylesRelId" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

Write-Utf8 (Join-Path $XlRels "workbook.xml.rels") $WorkbookRelXml

$Styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3">
<font><sz val="10"/><name val="Segoe UI"/></font>
<font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Segoe UI"/></font>
<font><b/><sz val="10"/><name val="Segoe UI"/></font>
</fonts>

<fills count="7">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF12304A"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF4CCCC"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFCE5CD"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD9EAD3"/><bgColor indexed="64"/></patternFill></fill>
</fills>

<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border>
<left style="thin"><color rgb="FFD7E0E8"/></left>
<right style="thin"><color rgb="FFD7E0E8"/></right>
<top style="thin"><color rgb="FFD7E0E8"/></top>
<bottom style="thin"><color rgb="FFD7E0E8"/></bottom>
<diagonal/>
</border>
</borders>

<cellStyleXfs count="1">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
</cellStyleXfs>

<cellXfs count="6">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
<alignment vertical="top" wrapText="1"/>
</xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
<alignment vertical="top" wrapText="1"/>
</xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
<alignment vertical="top" wrapText="1"/>
</xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1">
<alignment vertical="top" wrapText="1"/>
</xf>
<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1">
<alignment vertical="top" wrapText="1"/>
</xf>
<xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1">
<alignment vertical="top" wrapText="1"/>
</xf>
</cellXfs>

<cellStyles count="1">
<cellStyle name="Normal" xfId="0" builtinId="0"/>
</cellStyles>
</styleSheet>
'@

Write-Utf8 (Join-Path $XlPath "styles.xml") $Styles

$XlsxOutput = Join-Path $Reports "Problemas_Prioridad_y_Solucion.xlsx"

if (Test-Path $XlsxOutput) {
    Remove-Item $XlsxOutput -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $XlsxTemp,
    $XlsxOutput,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)

Remove-Item $XlsxTemp -Recurse -Force

# CSV complementario
$Findings |
Select-Object `
    ID,Priority,Status,Domain,Finding,Evidence,Impact,Solution,Validation,Rollback,Target |
Export-Csv `
    (Join-Path $Reports "Problemas_Prioridad_y_Solucion.csv") `
    -NoTypeInformation `
    -Encoding UTF8

# ============================================================
# INDICE HTML
# ============================================================

$IndexBody = @'
<div class="success">
<strong>Paquete de documentación de auditoría Zabbix.</strong>
Comenzar por el Resumen Ejecutivo y luego utilizar el Runbook para cualquier actividad de remediación.
</div>

<h2>Documentos</h2>
<table>
<tr><th>Documento</th><th>Contenido</th></tr>
<tr><td><a href="docs/01_Resumen_Ejecutivo.html">01 · Resumen ejecutivo</a></td><td>Situación actual, riesgos y conclusiones principales.</td></tr>
<tr><td><a href="docs/02_Arquitectura_e_Inventario.html">02 · Arquitectura e inventario</a></td><td>Arquitectura lógica, inventario y alcance.</td></tr>
<tr><td><a href="docs/03_Hallazgos_Tecnicos.html">03 · Hallazgos técnicos</a></td><td>Registro completo AUD-001 a AUD-012 con prioridad y recomendaciones.</td></tr>
<tr><td><a href="docs/04_Alertas_Ruido_y_Triggers.html">04 · Alertas, ruido y triggers</a></td><td>Análisis de FortiGate ICMP, Link Down, LLD y acción global.</td></tr>
<tr><td><a href="docs/05_Runbook_Remediacion_Paso_a_Paso.html">05 · Runbook paso a paso</a></td><td>Procedimiento técnico para resolver los hallazgos.</td></tr>
<tr><td><a href="docs/06_Roadmap_0_30_60_90.html">06 · Roadmap 0–90 días</a></td><td>Plan 0–30, 30–60 y 60–90 días.</td></tr>
<tr><td><a href="docs/07_Plan_Pruebas_y_Rollback.html">07 · Plan de pruebas y rollback</a></td><td>Validaciones obligatorias y reversión.</td></tr>
<tr><td><a href="docs/08_Evidencias_y_Trazabilidad.html">08 · Evidencias y trazabilidad</a></td><td>Fuentes raw, scripts y métricas confirmadas.</td></tr>
</table>

<h2>Diagramas</h2>
<table>
<tr><td><a href="diagrams/01_Arquitectura_Logica_Observada.svg">Arquitectura lógica observada</a></td></tr>
<tr><td><a href="diagrams/02_Flujo_Alertas.svg">Flujo de alertas</a></td></tr>
<tr><td><a href="diagrams/03_Modelo_Dependencias_Propuesto.svg">Modelo de dependencias propuesto</a></td></tr>
</table>

<h2>Excel / informes</h2>
<table>
<tr><td><a href="reports/Problemas_Prioridad_y_Solucion.xlsx">Problemas, prioridad y solución propuesta — Excel</a></td></tr>
<tr><td><a href="reports/Problemas_Prioridad_y_Solucion.csv">Versión CSV complementaria</a></td></tr>
<tr><td><a href="reports/20_linkdown_flapping_7d.csv">Análisis Link Down 7 días</a></td></tr>
</table>

<h2>Orden recomendado de lectura</h2>
<p>
Resumen Ejecutivo → Hallazgos → Alertas/Ruido → Runbook → Plan de pruebas/rollback → Roadmap.
</p>

<div class="warning">
Los directorios raw y sanitized no están enlazados desde esta guía para evitar exposición accidental de información sensible.
</div>
'@

$Index = New-HtmlPage `
    "Zabbix Audit · Guía general" `
    "Índice maestro de documentación" `
    $IndexBody `
    "00_Indice.html"

Write-Utf8 (Join-Path $Root "00_Indice.html") $Index

# ============================================================
# README
# ============================================================

$Readme = @"
ZABBIX AUDIT - PAQUETE DE DOCUMENTACION
Generado: $GeneratedAt

Inicio:
    $Root\00_Indice.html

Excel:
    $Reports\Problemas_Prioridad_y_Solucion.xlsx

Runbook:
    $Docs\05_Runbook_Remediacion_Paso_a_Paso.html

IMPORTANTE:
- No se incluyen API tokens ni credenciales.
- Los datos de C:\Zabbix-Audit\raw deben mantenerse restringidos.
- Los cambios deben seguir el documento de pruebas y rollback.
- Las causas marcadas "En investigación" o "Candidato" no deben tratarse como causa raíz confirmada.
"@

Write-Utf8 (Join-Path $Root "README_AUDITORIA.txt") $Readme

# ============================================================
# ZIP SOLO DE DOCUMENTACION, SIN RAW
# ============================================================

$PackageTemp = Join-Path $env:TEMP ("zabbix-doc-package-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $PackageTemp -Force | Out-Null

Copy-Item (Join-Path $Root "00_Indice.html") $PackageTemp
Copy-Item (Join-Path $Root "README_AUDITORIA.txt") $PackageTemp
Copy-Item $Docs (Join-Path $PackageTemp "docs") -Recurse
Copy-Item $Diagrams (Join-Path $PackageTemp "diagrams") -Recurse

New-Item -ItemType Directory -Path (Join-Path $PackageTemp "reports") | Out-Null

Copy-Item `
    (Join-Path $Reports "Problemas_Prioridad_y_Solucion.xlsx") `
    (Join-Path $PackageTemp "reports")

Copy-Item `
    (Join-Path $Reports "Problemas_Prioridad_y_Solucion.csv") `
    (Join-Path $PackageTemp "reports")

if (Test-Path $LinkCsv) {
    Copy-Item $LinkCsv (Join-Path $PackageTemp "reports")
}

$ZipOutput = Join-Path $Root "Zabbix-Audit-Documentation.zip"

if (Test-Path $ZipOutput) {
    Remove-Item $ZipOutput -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $PackageTemp,
    $ZipOutput,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $false
)

Remove-Item $PackageTemp -Recurse -Force

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " DOCUMENTACION ZABBIX GENERADA" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Indice HTML :" -ForegroundColor Green
Write-Host "  $Root\00_Indice.html"
Write-Host ""
Write-Host "Excel :" -ForegroundColor Green
Write-Host "  $XlsxOutput"
Write-Host ""
Write-Host "Runbook :" -ForegroundColor Green
Write-Host "  $Docs\05_Runbook_Remediacion_Paso_a_Paso.html"
Write-Host ""
Write-Host "ZIP :" -ForegroundColor Green
Write-Host "  $ZipOutput"
Write-Host ""