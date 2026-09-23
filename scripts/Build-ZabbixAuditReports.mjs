import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const docsDir = path.join(root, "docs");
const diagramsDir = path.join(root, "diagrams");
const reportsDir = path.join(root, "reports");
const buildDir = path.join(root, ".audit-build");
const extractionDate = "2026-09-02";
const generatedAt = new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");

for (const dir of [docsDir, diagramsDir, reportsDir, buildDir]) await fs.mkdir(dir, { recursive: true });

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const [headers = [], ...data] = rows;
  return data.filter((r) => r.some((v) => v !== "")).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

async function readCsv(name) {
  return parseCsv((await fs.readFile(path.join(reportsDir, name), "utf8")).replace(/^\uFEFF/, ""));
}

async function readJson(relative) {
  return JSON.parse((await fs.readFile(path.join(root, relative), "utf8")).replace(/^\uFEFF/, ""));
}

function htmlTable(headers, rows, classes = "") {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table class="${classes}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

const css = `
:root{--navy:#12304a;--blue:#1769aa;--pale:#eef5fb;--line:#d7e0e8;--ink:#1c2730;--muted:#5d6d7a;--red:#b42318;--amber:#a75a00;--green:#177245}
*{box-sizing:border-box}body{margin:0;background:#eef2f5;color:var(--ink);font-family:"Segoe UI",Arial,sans-serif;line-height:1.55}header{padding:30px max(30px,calc((100% - 1160px)/2));background:linear-gradient(115deg,#102f49,#1769aa);color:#fff}header h1{margin:0 0 5px;font-size:30px}header p{margin:0;opacity:.9}main{max-width:1160px;margin:22px auto;background:white;padding:28px 36px 46px;box-shadow:0 2px 12px #0a24301a}a{color:#075d9c}nav{padding:12px 16px;background:var(--pale);border-left:4px solid var(--blue);margin-bottom:26px}h2{margin-top:34px;color:var(--navy);border-bottom:2px solid var(--line);padding-bottom:7px}h3{color:var(--blue);margin-top:25px}.lead{font-size:18px}.note,.warning,.success{padding:13px 16px;border-left:5px solid;margin:18px 0}.note{background:#eef6fd;border-color:var(--blue)}.warning{background:#fff4eb;border-color:var(--amber)}.success{background:#ecf8f1;border-color:var(--green)}.critical{color:var(--red);font-weight:700}.high{color:#c33b20;font-weight:700}.medium{color:#8a6500;font-weight:700}.low{color:var(--green);font-weight:700}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:13px;margin:20px 0}.kpi{border:1px solid var(--line);border-radius:5px;padding:15px;background:#f7fafc}.kpi strong{display:block;color:var(--navy);font-size:27px}.kpi span{font-size:13px;color:var(--muted)}table{border-collapse:collapse;width:100%;font-size:14px}th{background:var(--navy);color:#fff;text-align:left;padding:9px;vertical-align:top}td{border:1px solid var(--line);padding:8px;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.table-wrap{overflow:auto;margin:15px 0 26px}.compact{font-size:13px}code{background:#edf1f4;padding:2px 5px;border-radius:3px}.diagram{display:block;width:100%;max-width:1040px;border:1px solid var(--line);margin:18px auto;background:white}footer{border-top:1px solid var(--line);margin-top:40px;padding-top:14px;color:var(--muted);font-size:12px}@media print{body{background:white}main{box-shadow:none;margin:0;padding:0}header{padding:20px}nav{display:none}}`;

function page(title, subtitle, body, back = "../00_Indice.html") {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body><header><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></header><main><nav><a href="${esc(back)}">← Volver al índice general</a></nav>${body}<footer>Auditoría técnica Zabbix · fuente: extracción API ${extractionDate} · generado ${esc(generatedAt)} · sin credenciales ni tokens.</footer></main></body></html>`;
}

const findings = [
  ["AUD-001", "Alta", "Confirmado", "Ítems", "Cobertura degradada por ítems no soportados", "1.316 ítems en estado no soportado; 1.191 permanecen habilitados sobre 28.116 ítems habilitados (4,2%).", "Métricas y triggers pueden perder cobertura mientras se consumen ciclos de reintento.", "Priorizar por causa raíz y host; no eliminar ítems ni templates durante el diagnóstico.", "La cantidad de no soportados habilitados disminuye y vuelve a llegar dato válido.", "Revertir solo el cambio puntual de macro, template o parámetro probado.", "0–30 días"],
  ["AUD-001A", "Alta", "Confirmado", "VMware", "Errores de endpoint VMware", "430 errores exactamente 'Invalid URL: missing /sdk'.", "Monitoreo VMware incompleto y ruido operativo.", "Validar {$VMWARE.URL} en un objeto de prueba y el endpoint efectivo; el slash final es candidato, no causa raíz confirmada.", "Items vmware.* pasan a supported tras varios ciclos.", "Restaurar la macro original registrada si no corrige.", "0–30 días"],
  ["AUD-001B", "Alta", "Confirmado", "SNMP", "Sesiones SNMP que no abren", "390 errores 'zbx_snmp_open_session() failed'.", "Bloques de métricas quedan sin actualizar y pueden presionar pollers.", "Probar UDP/161 desde el origen de monitoreo; validar versión, credenciales, ACL, ruta y timeout por host.", "snmpget o snmpwalk exitoso y recuperación de Latest data.", "Modificar una sola interfaz/host y restaurar el valor previo si falla.", "0–30 días"],
  ["AUD-001C", "Alta", "Confirmado", "FortiGate / SNMP", "FTG_ar-368-acueducto_SNMP concentra fallas", "260 ítems no soportados, incluidos 256 errores de apertura de sesión SNMP en el corte revisado.", "Cobertura del firewall degradada y reintentos repetidos.", "Priorizar conectividad y autenticación SNMP antes de revisar OID o template.", "Sesión estable; descenso visible de errores por host.", "Revertir solo los parámetros SNMP del host bajo prueba.", "0–30 días"],
  ["AUD-001D", "Media", "En investigación", "Templates", "Ajuste de template en AP GERENCIAS y AP Administración", "65 y 64 ítems no soportados respectivamente; ambos presentan primero una falla de sesión SNMP.", "Una mala asociación de template puede mantener fallas aun después de recuperar conectividad.", "Confirmar fabricante/modelo y recién luego contrastar el template con el dispositivo real.", "OID y descubrimientos coherentes con el modelo confirmado.", "Exportar el vínculo de templates antes de cualquier relink.", "0–30 días"],
  ["AUD-001E", "Media", "Confirmado", "Ítems calculados", "División por cero en cálculo de filesystem", "10 errores 'Cannot evaluate expression: division by zero' con vfs.fs.total[fgSysDiskCapacity.0] como denominador.", "Ítems calculados y triggers derivados quedan no soportados.", "Agregar guarda explícita para denominador mayor a cero o esperar dato válido.", "No vuelve a aparecer el error y el cálculo conserva valores esperados.", "Conservar y restaurar la fórmula original si la prueba no es válida.", "0–30 días"],
  ["AUD-002", "Media", "Confirmado", "Operación", "No hay ventanas de mantenimiento", "El inventario API devuelve 0 maintenances.", "Cambios planificados pueden generar alertas, tickets o escalaciones evitables.", "Definir mantenimiento para intervenciones recurrentes y procedimiento de aprobación.", "Prueba controlada sin alertas durante una ventana autorizada.", "Finalizar o deshabilitar la ventana de prueba.", "0–30 días"],
  ["AUD-003", "Alta", "Confirmado", "Alerting", "Acción global sin condiciones", "La acción activa 'Report problems to Zabbix administrators' no contiene condiciones de filtro.", "Puede escalar todo problema y amplificar el ruido.", "Diseñar severidad, grupos, tags, deduplicación y escalamiento explícitos.", "Matriz de casos de prueba entrega solo las notificaciones esperadas.", "Deshabilitar la acción nueva y volver a la acción actual si falta cobertura.", "0–30 días"],
  ["AUD-004", "Alta", "Confirmado", "Ruido de alertas", "Volumen alto de eventos de problema", "8.406 eventos en 30 días; promedio 280,2/día; 647 triggers y 71 hosts con eventos.", "La señal importante compite con alertas repetitivas.", "Atacar los cinco disparadores principales antes de cambiar umbrales de forma masiva.", "Reducción de eventos sin pérdida de detección de fallas reales.", "Revertir por trigger prototype, macro contextual u override; no editar LLD individual.", "0–30 días"],
  ["AUD-005", "Alta", "Confirmado", "Red", "Microflapping en SRO-G01-P100-ACC01 Gi1/0/4", "176 problemas en 7 días; 76,7% dura menos de 2 min y 93,8% menos de 5 min.", "Intermitencia real o puerto no operativo genera gran cantidad de eventos.", "Verificar extremo físico, negociación, PoE/uso y dependencia; ajustar control solo si el puerto es deliberadamente no accionable.", "La interfaz se estabiliza y el patrón de microflapping desaparece.", "Restaurar macro/override inicial si el cambio reduce cobertura.", "0–30 días"],
  ["AUD-006", "Media", "Confirmado", "Capacidad Zabbix", "Procesos housekeeper y unreachable poller sobre 75%", "176 eventos de housekeeper y 151 de unreachable poller en 30 días.", "La plataforma puede acumular tareas y tardar en detectar/reintentar dispositivos.", "Medir cola, procesos, DB y conectividad; ajustar solo después de línea base.", "Utilización y colas bajo umbrales acordados durante horario pico.", "Restaurar parámetros de procesos y conservar respaldo de configuración.", "30–60 días"],
  ["AUD-007", "Alta", "Confirmado", "Energía", "UPS GALPON 01 con batería baja recurrente", "El trigger de batería menor a 10 minutos generó 168 eventos High en 30 días.", "Riesgo operativo y posible pérdida de continuidad ante corte eléctrico.", "Validar batería, carga y prueba controlada con el área responsable.", "Autonomía registrada por encima del umbral operativo acordado.", "No silenciar la alerta; usar mantenimiento solo durante prueba autorizada.", "0–30 días"],
  ["AUD-008", "Media", "Confirmado", "Windows", "Servicio VSS no ejecutándose", "El trigger de Volume Shadow Copy generó 162 eventos en 30 días.", "Afecta respaldos, snapshots o recuperación según la función del servidor.", "Confirmar rol del host y política de inicio del servicio antes de automatizar su arranque.", "Servicio en estado esperado y ausencia de eventos repetidos.", "Restaurar configuración de servicio anterior.", "0–30 días"],
  ["AUD-009", "Media", "En investigación", "Resiliencia", "Proxy y HA requieren validación operativa", "La API lista un proxy SSJ-ZAB01; la conversación previa reporta HA deshabilitado. No hay evidencia suficiente de la topología efectiva en esta extracción.", "Una dependencia única puede limitar continuidad de monitoreo.", "Confirmar modo de proxy, disponibilidad, flujos y diseño HA con responsables de plataforma.", "Diagrama y prueba de continuidad aprobados.", "No aplicar cambios de arquitectura sin plan específico.", "60–90 días"]
];

const plan = [
  ["0–30", "AUD-001A / VMware", "Corregir endpoint VMware en una prueba controlada", "Plataforma Zabbix + virtualización", "No iniciado", "Menos ítems vmware.* no soportados; sin impacto lateral."],
  ["0–30", "AUD-001B / SNMP", "Restaurar sesiones SNMP prioritarias y validar templates", "Red + Zabbix", "No iniciado", "Pruebas desde el origen y datos válidos en Latest data."],
  ["0–30", "AUD-003 / alerting", "Definir condiciones y escalamiento de la acción global", "Operaciones", "No iniciado", "Matriz de notificaciones validada."],
  ["0–30", "AUD-005 / microflapping", "Investigar Gi1/0/4 y clasificar puertos long-down", "Red", "No iniciado", "Caen flaps sin ocultar enlaces críticos."],
  ["0–30", "AUD-007 / UPS", "Revisar autonomía de UPS GALPON 01", "Infraestructura", "No iniciado", "Batería y carga verificadas."],
  ["30–60", "AUD-006 / capacidad", "Ajustar housekeeper, pollers y DB con línea base", "Plataforma Zabbix", "No iniciado", "Utilización y colas estables en pico."],
  ["30–60", "AUD-002 / mantenimiento", "Formalizar ventanas y pruebas de supresión autorizada", "Operaciones", "No iniciado", "No hay falso escalamiento en cambios planificados."],
  ["30–60", "Ruido ICMP", "Revisar umbral FortiGate ICMP con datos de SLA", "Red", "No iniciado", "Menos ruido con detección de degradación real."],
  ["60–90", "AUD-009 / resiliencia", "Validar proxy, continuidad y alternativa HA", "Arquitectura", "No iniciado", "Diseño y prueba de recuperación aprobados."],
  ["60–90", "Gobierno", "Revisión periódica de unsupported, ruido y deuda de templates", "Operaciones", "No iniciado", "Tablero mensual y responsables definidos."]
];

const svgArchitecture = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620" viewBox="0 0 1200 620"><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#163046}.t{font-size:24px;font-weight:700}.h{font-size:17px;font-weight:700}.b{font-size:14px}.box{stroke:#1769aa;stroke-width:2;rx:12;ry:12}.line{stroke:#63798a;stroke-width:3;fill:none;marker-end:url(#a)}</style><defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#63798a"/></marker></defs><rect width="1200" height="620" fill="#f5f8fb"/><text x="55" y="55" class="t">Arquitectura lógica observada · no representa IP ni credenciales</text><rect x="60" y="155" width="220" height="150" class="box" fill="#eaf5ff"/><text x="95" y="205" class="h">Dispositivos y servicios</text><text x="91" y="235" class="b">77 hosts monitoreados</text><text x="91" y="260" class="b">Red · FortiGate · Windows</text><text x="91" y="285" class="b">VMware · UPS · storage</text><rect x="450" y="140" width="280" height="180" class="box" fill="#dceefa"/><text x="505" y="190" class="h">Zabbix Server 7.0.22</text><text x="487" y="220" class="b">28.333 items API · 12.421 triggers</text><text x="487" y="245" class="b">2.187 LLD · 4.544 trigger prototypes</text><text x="487" y="270" class="b">housekeeper / pollers a validar</text><rect x="910" y="155" width="230" height="150" class="box" fill="#fff3e8"/><text x="950" y="205" class="h">Operación y alerting</text><text x="946" y="235" class="b">5 acciones API</text><text x="946" y="260" class="b">40 media types</text><text x="946" y="285" class="b">0 maintenances</text><path d="M280 230 H450" class="line"/><path d="M730 230 H910" class="line"/><rect x="450" y="415" width="280" height="110" class="box" fill="#eef7ef"/><text x="495" y="460" class="h">Proxy listado: SSJ-ZAB01</text><text x="510" y="490" class="b">Rol y continuidad por confirmar</text><path d="M590 320 V415" class="line"/><text x="60" y="575" class="b">Fuente: extracción API 2026-09-02. Las flechas expresan relaciones lógicas de monitoreo, no topología física.</text></svg>`;

const svgAlertFlow = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="460" viewBox="0 0 1200 460"><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#163046}.t{font-size:24px;font-weight:700}.h{font-size:16px;font-weight:700}.b{font-size:13px}.box{stroke:#1769aa;stroke-width:2;rx:10;ry:10}.line{stroke:#63798a;stroke-width:3;fill:none;marker-end:url(#a)}</style><defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#63798a"/></marker></defs><rect width="1200" height="460" fill="#f5f8fb"/><text x="55" y="55" class="t">Flujo de alerta y controles recomendados</text><g><rect x="55" y="150" width="180" height="105" class="box" fill="#eaf5ff"/><text x="93" y="190" class="h">Métrica / LLD</text><text x="78" y="216" class="b">dato, preprocessing,</text><text x="78" y="235" class="b">macro contextual</text></g><g><rect x="295" y="150" width="180" height="105" class="box" fill="#eaf5ff"/><text x="337" y="190" class="h">Trigger prototype</text><text x="316" y="216" class="b">dependencia, umbral,</text><text x="316" y="235" class="b">histeresis</text></g><g><rect x="535" y="150" width="180" height="105" class="box" fill="#fff5df"/><text x="585" y="190" class="h">Evento</text><text x="552" y="216" class="b">severidad, tags,</text><text x="552" y="235" class="b">mantenimiento</text></g><g><rect x="775" y="150" width="180" height="105" class="box" fill="#fff1ed"/><text x="811" y="190" class="h">Acción</text><text x="792" y="216" class="b">filtros, deduplicación,</text><text x="792" y="235" class="b">escalamiento</text></g><g><rect x="1015" y="150" width="140" height="105" class="box" fill="#eef7ef"/><text x="1046" y="190" class="h">Operación</text><text x="1036" y="216" class="b">respuesta y</text><text x="1036" y="235" class="b">evidencia</text></g><path d="M235 203H295M475 203H535M715 203H775M955 203H1015" class="line"/><rect x="305" y="330" width="590" height="65" class="box" fill="#fff4eb"/><text x="334" y="360" class="h">Control crítico: no editar triggers LLD individuales</text><text x="334" y="383" class="b">Corregir en discovery, trigger prototype, macro contextual, filtro u override; probar y documentar rollback.</text></svg>`;

const svgDependency = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="530" viewBox="0 0 1200 530"><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#163046}.t{font-size:24px;font-weight:700}.h{font-size:16px;font-weight:700}.b{font-size:13px}.box{stroke:#1769aa;stroke-width:2;rx:10;ry:10}.line{stroke:#63798a;stroke-width:3;fill:none;marker-end:url(#a)}</style><defs><marker id="a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#63798a"/></marker></defs><rect width="1200" height="530" fill="#f5f8fb"/><text x="55" y="55" class="t">Modelo de dependencias propuesto para reducir ruido</text><rect x="55" y="180" width="190" height="100" class="box" fill="#ffe9e7"/><text x="100" y="220" class="h">Sitio / WAN</text><text x="85" y="246" class="b">padre de conectividad</text><rect x="325" y="180" width="190" height="100" class="box" fill="#fff5df"/><text x="365" y="220" class="h">Firewall / core</text><text x="350" y="246" class="b">dependiente del sitio</text><rect x="595" y="180" width="190" height="100" class="box" fill="#eaf5ff"/><text x="635" y="220" class="h">Acceso / AP</text><text x="621" y="246" class="b">dependiente del core</text><rect x="865" y="180" width="245" height="100" class="box" fill="#eef7ef"/><text x="905" y="220" class="h">Servicio local</text><text x="889" y="246" class="b">dependiente de red/host</text><path d="M245 230H325M515 230H595M785 230H865" class="line"/><rect x="325" y="365" width="560" height="75" class="box" fill="#eef5fb"/><text x="351" y="395" class="h">Resultado esperado</text><text x="351" y="420" class="b">Si falla el padre, conservar evidencia del incidente y suprimir alertas derivadas sin ocultar la causa primaria.</text></svg>`;

async function writeText(relative, content) { await fs.writeFile(path.join(root, relative), content, "utf8"); }

const priorityClass = (priority) => priority === "Alta" ? "high" : priority === "Media" ? "medium" : "low";

async function createHtml(overview, severity, noisyTriggers, noisyHosts, unsupportedHosts, unsupportedErrors, linkDown) {
  const findingRows = findings.map((f) => [esc(f[0]), `<span class="${priorityClass(f[1])}">${esc(f[1])}</span>`, esc(f[2]), esc(f[3]), esc(f[4]), esc(f[5]), esc(f[6]), esc(f[7])]);
  const indexBody = `<p class="lead">Paquete de documentación de la auditoría técnica. Parte de una extracción API del ${extractionDate}; no contiene credenciales, tokens ni archivos raw.</p><div class="kpis"><div class="kpi"><strong>77</strong><span>hosts API</span></div><div class="kpi"><strong>1.191</strong><span>unsupported habilitados</span></div><div class="kpi"><strong>8.406</strong><span>eventos PROBLEM / 30 días</span></div><div class="kpi"><strong>0</strong><span>ventanas de mantenimiento</span></div></div><h2>Documentos</h2>${htmlTable(["Documento", "Propósito"], [[`<a href="docs/01_Resumen_Ejecutivo.html">Resumen ejecutivo</a>`, "Decisiones, riesgos y prioridades."], [`<a href="docs/02_Arquitectura_e_Inventario.html">Arquitectura e inventario</a>`, "Línea base API y alcance."], [`<a href="docs/03_Hallazgos_Tecnicos.html">Hallazgos técnicos</a>`, "Evidencia, impacto y remediación."], [`<a href="docs/04_Alertas_Ruido_y_Triggers.html">Alertas, ruido y triggers</a>`, "Eventos de 30 días y reducción segura de ruido."], [`<a href="docs/05_Runbook_Remediacion_Paso_a_Paso.html">Runbook de remediación</a>`, "Secuencia controlada de intervención."], [`<a href="docs/06_Roadmap_0_30_60_90.html">Roadmap 0–90 días</a>`, "Plan de ejecución y criterios de salida."], [`<a href="docs/07_Plan_Pruebas_y_Rollback.html">Pruebas y rollback</a>`, "Controles antes de producción."], [`<a href="docs/08_Evidencias_y_Trazabilidad.html">Evidencias y trazabilidad</a>`, "Fuentes y límites del análisis."], [`<a href="docs/09_Alerting_y_Escalamiento.html">Alerting y escalamiento</a>`, "Matriz de condiciones y respuesta."], [`<a href="docs/10_Dependencias.html">Dependencias</a>`, "Modelo propuesto de supresión derivada." ]])}<h2>Entregables</h2>${htmlTable(["Archivo", "Contenido"], [[`<a href="reports/Problemas_Prioridad_y_Solucion.xlsx">Excel de problemas, prioridad y solución</a>`, "Dashboard, hallazgos, baseline, ruido, Link Down y roadmap."], [`<a href="reports/Problemas_Prioridad_y_Solucion.csv">CSV de hallazgos</a>`, "Registro interoperable de hallazgos y controles."], [`<a href="diagrams/01_Arquitectura_Logica_Observada.svg">Diagrama de arquitectura</a>`, "Vista lógica del monitoreo."], [`<a href="diagrams/02_Flujo_Alertas.svg">Flujo de alertas</a>`, "Puntos de control del ciclo de alerta."], [`<a href="diagrams/03_Modelo_Dependencias_Propuesto.svg">Modelo de dependencias</a>`, "Supresión derivada conservando causa primaria."]])}<div class="warning"><strong>Alcance:</strong> las hipótesis se rotulan como “En investigación”; no se transforman en cambios de producción sin prueba y rollback.</div>`;
  await writeText("00_Indice.html", page("Zabbix Audit · Guía general", "Índice maestro de documentación", indexBody, "00_Indice.html"));

  const executive = `<p class="lead">La plataforma muestra buena cobertura funcional, pero la operación está dominada por ítems no soportados y eventos repetitivos. La recomendación es restaurar la señal primero —VMware, SNMP, batería UPS y VSS— y recién entonces ajustar umbrales o notificaciones.</p><div class="kpis"><div class="kpi"><strong>${overview.TotalProblemEvents}</strong><span>problemas en 30 días</span></div><div class="kpi"><strong>${overview.AverageEventsPerDay}</strong><span>eventos promedio por día</span></div><div class="kpi"><strong>${overview.LinkDownEvents}</strong><span>Link Down en 30 días</span></div><div class="kpi"><strong>430</strong><span>errores VMware /sdk</span></div></div><h2>Prioridades de dirección</h2>${htmlTable(["Orden", "Decisión", "Justificación", "Resultado esperado"], [["1", "Restaurar recolección", "1.191 no soportados habilitados; VMware y SNMP concentran las causas repetidas.", "Cobertura y calidad de datos recuperadas."], ["2", "Reducir ruido sin silenciar riesgos", "8.406 eventos en 30 días; la acción global activa no tiene condiciones.", "Alertas accionables y escalamiento trazable."], ["3", "Atender riesgos físicos/servicios", "UPS GALPON 01 y VSS generan eventos repetidos y tienen impacto potencial.", "Riesgos verificados con responsable técnico."], ["4", "Fortalecer operación", "No existen mantenimientos y hay avisos de housekeeper/unreachable poller.", "Cambios planificados y capacidad bajo control."]])}<h2>Reglas de ejecución</h2><div class="note">Cada cambio debe registrar: hallazgo, evidencia, hipótesis, responsable, prueba, resultado y rollback. Para LLD, modificar discovery, prototype, macro, filtro u override; no el trigger descubierto individual.</div><h2>Estado de evidencia</h2>${htmlTable(["Tipo", "Uso en el informe"], [["Confirmado", "Existe evidencia directa en la extracción API o CSV."], ["En investigación", "Hay síntoma o indicio; exige validación antes de considerarlo causa raíz."], ["Propuesto", "Diseño operativo para probar, no configuración ya aplicada."]])}`;
  await writeText("docs/01_Resumen_Ejecutivo.html", page("Resumen ejecutivo", "Riesgos, decisiones y criterio de prioridad", executive));

  const architecture = `<p class="lead">Inventario obtenido por API. Esta vista representa relaciones lógicas de monitoreo; no debe utilizarse como topología física ni como registro de credenciales.</p><img class="diagram" src="../diagrams/01_Arquitectura_Logica_Observada.svg" alt="Arquitectura lógica observada"><h2>Línea base</h2>${htmlTable(["Componente", "Cantidad / estado", "Lectura operativa"], [["Zabbix", "7.0.22", "Versión devuelta por API."], ["Hosts", "77", "Todos aparecen habilitados en la extracción."], ["Templates", "359", "Requiere gobierno de asociación y versiones."], ["Items", "28.333", "28.116 habilitados; 1.191 no soportados habilitados."], ["Triggers", "12.421", "4.544 provienen de prototypes."], ["LLD", "2.187 reglas y 9.898 item prototypes", "El control debe hacerse aguas arriba de los objetos descubiertos."], ["Acciones / media types", "5 / 40", "Existe una acción global activa sin condiciones."], ["Maintenance", "0", "Falta un mecanismo formal para cambios planificados."], ["Proxy", "SSJ-ZAB01 listado", "Rol, estado y continuidad requieren validación."]])}<h2>Alcance y límites</h2><div class="warning">La extracción enumera configuración y datos observados en el corte. No prueba por sí sola la causa raíz de cada falla, la topología física ni el estado actual posterior al corte.</div>`;
  await writeText("docs/02_Arquitectura_e_Inventario.html", page("Arquitectura e inventario", "Línea base de plataforma y límites de la extracción", architecture));

  const technical = `<p class="lead">Registro de hallazgos priorizados. El estado de evidencia separa hechos observados de hipótesis a validar.</p>${htmlTable(["ID", "Prioridad", "Estado", "Dominio", "Hallazgo", "Evidencia", "Impacto", "Siguiente acción"], findingRows, "compact")}<h2>Concentración de ítems no soportados</h2>${htmlTable(["Host", "Ítems no soportados"], unsupportedHosts.slice(0, 12).map((r) => [esc(r.Host), esc(r.UnsupportedItems)]))}<h2>Causas repetidas</h2>${htmlTable(["Cantidad", "Error"], unsupportedErrors.slice(0, 10).map((r) => [esc(r.Count), esc(r.Error)]), "compact")}`;
  await writeText("docs/03_Hallazgos_Tecnicos.html", page("Hallazgos técnicos", "Evidencia, impacto, solución y control", technical));

  const alerts = `<p class="lead">El análisis cubre ${overview.PeriodDays} días. Se busca eliminar repetición sin disminuir la detección de incidentes reales.</p><div class="kpis">${severity.map((r) => `<div class="kpi"><strong>${esc(r.Events30d)}</strong><span>${esc(r.Severity)} · ${esc(r.Percent)}%</span></div>`).join("")}</div><h2>Triggers con mayor volumen</h2>${htmlTable(["Eventos", "Severidad", "Problema"], noisyTriggers.slice(0, 15).map((r) => [esc(r.Events30d), esc(r.Severity), esc(r.Problem)]), "compact")}<h2>Hosts con mayor volumen</h2>${htmlTable(["Host", "Eventos"], noisyHosts.slice(0, 15).map((r) => [esc(r.Host), esc(r.Events30d)]))}<h2>Controles de diseño</h2><img class="diagram" src="../diagrams/02_Flujo_Alertas.svg" alt="Flujo de alertas"><div class="warning">Antes de cambiar umbrales ICMP, Link Down o servicios Windows: definir servicio afectado, ventana de evaluación, histéresis, dependencia, severidad y prueba de falla real.</div>`;
  await writeText("docs/04_Alertas_Ruido_y_Triggers.html", page("Alertas, ruido y triggers", "Volumen de eventos y reducción segura de repetición", alerts));

  const runbook = `<p class="lead">Ejecutar una línea de trabajo por vez, empezando por una muestra pequeña y reversible. Registrar el resultado antes de continuar.</p>${htmlTable(["Paso", "Acción", "Prueba", "Punto de detención / rollback"], [["0", "Registrar valor actual, exportar objeto y abrir cambio.", "Evidencia adjunta y responsable definido.", "No continuar sin valor previo y ventana autorizada."], ["1", "VMware: revisar {$VMWARE.URL} en un único objeto de prueba.", "Items vmware.* recuperan datos varios ciclos.", "Restaurar macro original si no hay recuperación."], ["2", "SNMP: ejecutar prueba desde el origen de monitoreo.", "UDP/161 y consulta básica exitosos.", "No cambiar credenciales o ACL globales."], ["3", "Template-fit: confirmar modelo de AP/red luego de recuperar SNMP.", "OID y descubrimientos se corresponden con el dispositivo.", "Restaurar vínculo exportado si el relink empeora."], ["4", "Link Down: inspeccionar Gi1/0/4 y extremos físicos.", "Desaparece el patrón o se clasifica el puerto.", "No suprimir un enlace crítico sin dependencia válida."], ["5", "Alerting: crear condiciones de acción y matriz de prueba.", "Solo llega el aviso esperado por severidad/tag.", "Deshabilitar la acción nueva; no borrar la previa."], ["6", "Capacidad: tomar línea base de procesos, cola y DB.", "Uso estable en horario pico.", "Restaurar parámetros previos." ]])}<h2>Criterios de cierre</h2><ul><li>La métrica o alerta se recupera en Latest data.</li><li>Los eventos nuevos responden a una condición accionable.</li><li>Se documenta evidencia, fecha, responsable y cambio realizado.</li><li>El rollback está probado o queda explícitamente justificado.</li></ul>`;
  await writeText("docs/05_Runbook_Remediacion_Paso_a_Paso.html", page("Runbook de remediación paso a paso", "Intervenciones controladas sobre causas de mayor impacto", runbook));

  const roadmap = `<p class="lead">La hoja de ruta prioriza restaurar cobertura y luego estabilizar la operación. Los plazos son ventanas de planificación, no fechas comprometidas.</p>${htmlTable(["Horizonte", "Iniciativa", "Entregable", "Criterio de salida"], plan.map((r) => [esc(r[0]), esc(r[1]), esc(r[2]), esc(r[5])]))}<h2>Orden recomendado</h2><div class="success"><strong>0–30:</strong> VMware, SNMP, acción global, microflapping, UPS y VSS.<br><strong>30–60:</strong> capacidad Zabbix, maintenance, umbrales ICMP basados en SLA.<br><strong>60–90:</strong> continuidad proxy/HA y gobierno de la deuda técnica.</div>`;
  await writeText("docs/06_Roadmap_0_30_60_90.html", page("Roadmap 0–30 / 30–60 / 60–90 días", "Secuencia de remediación y resultados esperados", roadmap));

  const tests = `<p class="lead">Toda remediación debe tener hipótesis, condición de éxito y un retorno simple al estado anterior. Las pruebas no autorizan cambios masivos.</p>${htmlTable(["Caso", "Objetivo", "Preparación", "Éxito", "Rollback"], [["VMware /sdk", "Restaurar métricas VMware.", "Registrar macro actual y elegir un objeto no crítico.", "Items supported y valor fresco.", "Restaurar macro previa."], ["SNMP", "Abrir sesión y recuperar OID.", "Registrar interfaz, versión y timeout.", "Consulta desde origen y Latest data actualizada.", "Restaurar interfaz/parámetro previo."], ["Acción global", "Reducir notificación no accionable.", "Matriz con problema, recuperación y severidades.", "Solo se notifica el caso esperado.", "Deshabilitar acción nueva."], ["Link Down", "Diferenciar flap de puerto fuera de servicio.", "Verificar extremo, rol y dependencia.", "Incidente padre conserva la señal relevante.", "Retirar dependencia u override."], ["Maintenance", "Evitar alertas de cambio autorizado.", "Aprobar ventana y objeto de prueba.", "No se escalan eventos dentro de ventana.", "Cerrar o deshabilitar ventana."]])}<h2>Regla de rollback</h2><div class="warning">Si la prueba reduce datos válidos, genera alertas no esperadas o afecta un servicio crítico, detenerse, restaurar el valor previo y adjuntar la evidencia antes de replanificar.</div>`;
  await writeText("docs/07_Plan_Pruebas_y_Rollback.html", page("Plan de pruebas y rollback", "Criterios de cambio seguro y recuperación", tests));

  const evidence = `<p class="lead">La trazabilidad enlaza cada conclusión con la fuente local que la respalda. Los archivos raw permanecen fuera del ZIP de documentación por contener datos operativos que no deben difundirse accidentalmente.</p>${htmlTable(["Fuente", "Uso", "Límite"], [["raw/00_api_version.json", "Versión y fecha de extracción.", "Foto puntual, no estado en tiempo real."], ["raw/02_hosts.json y raw/03_templates.json", "Inventario de hosts y templates.", "No valida alcance físico ni rol de negocio."], ["raw/04_items.json + reports/10_unsupported_items.csv", "Ítems no soportados y errores.", "El texto de error es síntoma; no siempre causa raíz."], ["raw/05_triggers.json + reports/02_noisy_triggers_30d.csv", "Diseño de triggers y volumen.", "No demuestra el impacto de negocio sin validación."], ["raw/09_actions.json", "Acciones y filtros.", "No prueba la entrega efectiva en cada media type."], ["raw/13_maintenances.json", "Ausencia de maintenances API.", "No incluye procesos externos de cambio."], ["reports/20_linkdown_flapping_7d.csv", "Duración y clasificación de Link Down.", "Requiere inspección física para atribuir causa." ]])}<h2>Convenciones</h2>${htmlTable(["Etiqueta", "Significado"], [["Confirmado", "El dato aparece directamente en la extracción o reporte."], ["En investigación", "Se debe comprobar antes de tratarlo como causa raíz."], ["Propuesto", "Control o diseño recomendado, aún no aplicado."]])}`;
  await writeText("docs/08_Evidencias_y_Trazabilidad.html", page("Evidencias y trazabilidad", "Fuentes, límites y convenciones de evidencia", evidence));

  const escalation = `<p class="lead">El objetivo es que una alerta llegue a la persona correcta, con contexto suficiente y sin amplificar eventos derivados. La acción global actual no tiene condiciones y debe ser rediseñada mediante prueba.</p>${htmlTable(["Capa", "Regla propuesta", "Verificación"], [["Filtro de evento", "Usar severidad, host group y tags de servicio/entorno.", "Casos de prueba por severidad y grupo."], ["Deduplicación", "Agrupar por trigger/host o incidente padre; evitar repetición cada ciclo.", "Una falla persistente no genera múltiples notificaciones equivalentes."], ["Escalamiento", "Primer aviso a operación; escalar por duración/impacto confirmado.", "Escalamiento ocurre solo en el caso definido."], ["Recovery", "Enviar recuperación solo si existe destinatario y acción previa relevante.", "La recuperación referencia el mismo incidente."], ["Maintenance", "Evitar escalamiento durante ventana aprobada sin borrar evidencia.", "Eventos no se notifican; la ventana queda auditada."]])}<div class="note">Las 5 acciones API y 40 media types deben revisarse con una matriz de destinatario, horario, severidad, servicio y evidencia de recepción.</div>`;
  await writeText("docs/09_Alerting_y_Escalamiento.html", page("Alerting y escalamiento", "Diseño propuesto para señal accionable", escalation));

  const dependencies = `<p class="lead">Las dependencias evitan que la caída de un componente padre genere una tormenta de alertas hijas. Deben preservar la causa primaria y aplicarse después de entender la topología y el servicio.</p><img class="diagram" src="../diagrams/03_Modelo_Dependencias_Propuesto.svg" alt="Modelo de dependencias propuesto"><h2>Patrón recomendado</h2>${htmlTable(["Nivel", "Ejemplos", "Control"], [["Padre", "Sitio, WAN, router/firewall, core.", "Alertar como causa primaria con alta prioridad."], ["Intermedio", "Switch de acceso, AP, enlaces internos.", "Depender del padre cuando la topología lo justifique."], ["Hijo", "Servicios, métricas y puertos en el extremo.", "Suprimir durante caída del padre, manteniendo su histórico." ]])}<div class="warning">No crear dependencias por similitud de nombres. Validar flujo físico, rol de red, necesidad de negocio y escenario de recuperación.</div>`;
  await writeText("docs/10_Dependencias.html", page("Dependencias", "Modelo propuesto de causalidad y supresión derivada", dependencies));

  await writeText("diagrams/01_Arquitectura_Logica_Observada.svg", svgArchitecture);
  await writeText("diagrams/02_Flujo_Alertas.svg", svgAlertFlow);
  await writeText("diagrams/03_Modelo_Dependencias_Propuesto.svg", svgDependency);

  const csvHeader = ["ID", "Prioridad", "Estado", "Dominio", "Hallazgo", "Evidencia", "Impacto", "Solucion", "Validacion", "Rollback", "Horizonte"];
  const csv = [csvHeader, ...findings].map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";
  await writeText("reports/Problemas_Prioridad_y_Solucion.csv", csv);

  const readme = `ZABBIX AUDIT · PAQUETE DE DOCUMENTACIÓN\n\nGenerado: ${generatedAt}\nCorte de evidencia: ${extractionDate}\nInicio: 00_Indice.html\nExcel: reports\\Problemas_Prioridad_y_Solucion.xlsx\nRunbook: docs\\05_Runbook_Remediacion_Paso_a_Paso.html\n\nIMPORTANTE\n- El ZIP final contiene documentación, diagramas y los informes generados; excluye raw y sanitized.\n- Los reportes separan hechos confirmados de hipótesis en investigación.\n- No aplicar cambios productivos sin prueba, ventana y rollback documentado.\n`;
  await writeText("README_AUDITORIA.txt", readme);
}

function styleTitle(sheet, range, color = "#12304A") {
  const r = sheet.getRange(range);
  r.format = { fill: color, font: { bold: true, color: "#FFFFFF", size: 16 }, horizontalAlignment: "left", verticalAlignment: "center" };
  r.format.rowHeight = 28;
}

function styleHeader(sheet, range) {
  const r = sheet.getRange(range);
  r.format = { fill: "#12304A", font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "left", verticalAlignment: "center", wrapText: true, borders: { preset: "all", style: "thin", color: "#CBD5E1" } };
  r.format.rowHeight = 28;
}

function styleData(sheet, range) {
  sheet.getRange(range).format = { verticalAlignment: "top", wrapText: true, borders: { preset: "inside", style: "thin", color: "#E2E8F0" } };
}

function col(sheet, letter, width) { sheet.getRange(`${letter}:${letter}`).format.columnWidth = width; }

async function createWorkbook(overview, severity, noisyTriggers, noisyHosts, linkDown) {
  const workbook = Workbook.create();
  const dashboard = workbook.worksheets.add("Resumen");
  const hallazgos = workbook.worksheets.add("Hallazgos");
  const baseline = workbook.worksheets.add("Baseline");
  const ruidoTriggers = workbook.worksheets.add("Ruido triggers");
  const ruidoHosts = workbook.worksheets.add("Ruido hosts");
  const linkDownSheet = workbook.worksheets.add("LinkDown 7d");
  const roadmapSheet = workbook.worksheets.add("Plan 0-90");
  const sources = workbook.worksheets.add("Fuentes");
  for (const s of [dashboard, hallazgos, baseline, ruidoTriggers, ruidoHosts, linkDownSheet, roadmapSheet, sources]) s.showGridLines = false;

  // Hallazgos: source table for the operational dashboard and detailed register.
  hallazgos.mergeCells("A1:K1"); hallazgos.getRange("A1").values = [["Registro de hallazgos y controles"]]; styleTitle(hallazgos, "A1:K1");
  hallazgos.getRange("A2:K2").values = [["ID", "Prioridad", "Estado", "Dominio", "Hallazgo", "Evidencia", "Impacto", "Solución propuesta", "Validación", "Rollback", "Horizonte"]]; styleHeader(hallazgos, "A2:K2");
  hallazgos.getRange(`A3:K${findings.length + 2}`).values = findings;
  styleData(hallazgos, `A3:K${findings.length + 2}`);
  hallazgos.tables.add(`A2:K${findings.length + 2}`, true, "HallazgosTable");
  [14, 12, 18, 20, 35, 52, 40, 52, 38, 36, 14].forEach((w, i) => col(hallazgos, String.fromCharCode(65 + i), w));
  hallazgos.freezePanes.freezeRows(2);
  hallazgos.getRange(`B3:B${findings.length + 2}`).conditionalFormats.add("containsText", { text: "Alta", format: { fill: "#FDE2E1", font: { bold: true, color: "#B42318" } } });
  hallazgos.getRange(`B3:B${findings.length + 2}`).conditionalFormats.add("containsText", { text: "Media", format: { fill: "#FFF0CC", font: { bold: true, color: "#8A6500" } } });
  hallazgos.getRange(`C3:C${findings.length + 2}`).conditionalFormats.add("containsText", { text: "En investigación", format: { fill: "#FFF4E5", font: { italic: true, color: "#9A6700" } } });

  // Baseline: raw counts and calculated coverage rate, visibly formula-driven.
  baseline.mergeCells("A1:D1"); baseline.getRange("A1").values = [["Línea base de la extracción API"]]; styleTitle(baseline, "A1:D1");
  baseline.getRange("A2:D2").values = [["Métrica", "Valor", "Fuente", "Nota"]]; styleHeader(baseline, "A2:D2");
  const baselineRows = [["Versión Zabbix", "7.0.22", "raw/00_api_version.json", "Corte 2026-09-02"], ["Hosts", 77, "raw/02_hosts.json", "Inventario API"], ["Templates", 359, "raw/03_templates.json", "Inventario API"], ["Items API", 28333, "raw/04_items.json", "Incluye ítems de hosts"], ["Items habilitados", 28116, "raw/04_items.json", "status=0"], ["Unsupported habilitados", 1191, "raw/04_items.json", "state=1 y status=0"], ["Tasa unsupported habilitada", null, "Calculada", "Unsupported habilitados / items habilitados"], ["Unsupported total", 1316, "reports/10_unsupported_items.csv", "Incluye 125 ítems deshabilitados"], ["Triggers API", 12421, "raw/05_triggers.json", "Inventario API"], ["Discovery rules", 2187, "raw/06_discovery_rules.json", "Inventario API"], ["Item prototypes", 9898, "raw/07_item_prototypes.json", "Inventario API"], ["Trigger prototypes", 4544, "raw/08_trigger_prototypes.json", "Inventario API"], ["Actions", 5, "raw/09_actions.json", "Inventario API"], ["Media types", 40, "raw/10_mediatypes.json", "Inventario API"], ["Maintenance windows", 0, "raw/13_maintenances.json", "Inventario API"], ["PROBLEM events · 30 días", Number(overview.TotalProblemEvents), "raw/16_problem_events_30d.json", "Corte de eventos"], ["Promedio diario", null, "Calculada", "Eventos / período"], ["Link Down · 30 días", Number(overview.LinkDownEvents), "reports/04_link_down_30d.csv", "Eventos Link Down"]];
  baseline.getRange(`A3:D${baselineRows.length + 2}`).values = baselineRows;
  baseline.getRange("B9").formulas = [["=B8/B7"]]; baseline.getRange("B19").formulas = [["=B18/30"]];
  baseline.getRange("B9").format.numberFormat = "0.0%"; baseline.getRange("B19").format.numberFormat = "#,##0.0";
  styleData(baseline, `A3:D${baselineRows.length + 2}`); baseline.tables.add(`A2:D${baselineRows.length + 2}`, true, "BaselineTable"); [28, 18, 36, 44].forEach((w, i) => col(baseline, String.fromCharCode(65 + i), w)); baseline.freezePanes.freezeRows(2);

  // Dashboard: formula-backed KPI cards plus a single clear severity chart.
  dashboard.mergeCells("A1:J1"); dashboard.getRange("A1").values = [["Zabbix Audit · Dashboard de prioridad"]]; styleTitle(dashboard, "A1:J1");
  dashboard.getRange("A2:J2").values = [[`Corte de evidencia: ${extractionDate}. Las cifras representan la extracción analizada; no son telemetría en tiempo real.`]]; dashboard.mergeCells("A2:J2"); dashboard.getRange("A2:J2").format = { fill: "#EEF5FB", font: { color: "#36546B", italic: true } };
  dashboard.getRange("A4:H4").values = [["Ítems no soportados habilitados", "Tasa de cobertura degradada", "Eventos PROBLEM / 30d", "Promedio diario", "Link Down / 30d", "Hallazgos alta prioridad", "Maintenance windows", "Acción global sin filtro"]];
  styleHeader(dashboard, "A4:H4");
  dashboard.getRange("A5:H5").formulas = [["='Baseline'!B8", "='Baseline'!B9", "='Baseline'!B18", "='Baseline'!B19", "='Baseline'!B20", "=COUNTIF('Hallazgos'!B3:B16,\"Alta\")", "='Baseline'!B17", "=COUNTIF('Hallazgos'!A3:A16,\"AUD-003\")"]];
  dashboard.getRange("A5:H5").format = { fill: "#F7FAFC", font: { bold: true, color: "#12304A", size: 15 }, horizontalAlignment: "center", borders: { preset: "all", style: "thin", color: "#D7E0E8" } }; dashboard.getRange("B5").format.numberFormat = "0.0%"; dashboard.getRange("D5").format.numberFormat = "#,##0.0";
  dashboard.getRange("A7:C7").values = [["Severidad", "Eventos", "% del total"]]; styleHeader(dashboard, "A7:C7");
  const sevRows = severity.map((r) => [r.Severity, Number(r.Events30d), Number(String(r.Percent).replace(",", ".")) / 100]);
  dashboard.getRange(`A8:C${sevRows.length + 7}`).values = sevRows; dashboard.getRange(`C8:C${sevRows.length + 7}`).format.numberFormat = "0.0%"; styleData(dashboard, `A8:C${sevRows.length + 7}`); dashboard.tables.add(`A7:C${sevRows.length + 7}`, true, "SeverityTable");
  const chart = dashboard.charts.add("bar", dashboard.getRange(`A7:B${sevRows.length + 7}`)); chart.title = "Eventos por severidad · 30 días"; chart.hasLegend = false; chart.yAxis = { numberFormatCode: "#,##0" }; chart.setPosition("E7", "J21");
  dashboard.getRange("A15:D15").values = [["Causa de error", "Cantidad", "Acción de remediación", "Evidencia"]]; styleHeader(dashboard, "A15:D15");
  const rootRows = [["VMware: missing /sdk", 430, "Probar {$VMWARE.URL} en un objeto", "Confirmado"], ["SNMP: open_session", 390, "Validar sesión desde origen", "Confirmado"], ["OID / preprocessing", 366, "Corroborar modelo, OID y LLD", "Confirmado como síntoma"], ["División por cero", 10, "Agregar guarda de denominador", "Confirmado"]];
  dashboard.getRange("A16:D19").values = rootRows; styleData(dashboard, "A16:D19"); dashboard.tables.add("A15:D19", true, "RootCauseTable");
  [26, 18, 30, 28, 16, 16, 16, 18, 2, 2].forEach((w, i) => col(dashboard, String.fromCharCode(65 + i), w)); dashboard.freezePanes.freezeRows(4);

  function writeImported(sheet, title, headers, rows, tableName, widths) {
    const lastCol = String.fromCharCode(64 + headers.length);
    sheet.mergeCells(`A1:${lastCol}1`); sheet.getRange("A1").values = [[title]]; styleTitle(sheet, `A1:${lastCol}1`);
    sheet.getRange(`A2:${lastCol}2`).values = [headers]; styleHeader(sheet, `A2:${lastCol}2`);
    if (rows.length) { sheet.getRange(`A3:${lastCol}${rows.length + 2}`).values = rows; styleData(sheet, `A3:${lastCol}${rows.length + 2}`); sheet.tables.add(`A2:${lastCol}${rows.length + 2}`, true, tableName); }
    widths.forEach((w, i) => col(sheet, String.fromCharCode(65 + i), w)); sheet.freezePanes.freezeRows(2);
  }
  writeImported(ruidoTriggers, "Triggers con eventos PROBLEM · 30 días", ["Trigger ID", "Eventos", "Severidad", "Problema"], noisyTriggers.map((r) => [r.TriggerID, Number(r.Events30d), r.Severity, r.Problem]), "NoisyTriggersTable", [14, 12, 14, 90]);
  writeImported(ruidoHosts, "Hosts con eventos PROBLEM · 30 días", ["Host", "Eventos"], noisyHosts.map((r) => [r.Host, Number(r.Events30d)]), "NoisyHostsTable", [45, 14]);
  writeImported(linkDownSheet, "Análisis Link Down · últimos 7 días", ["Trigger", "Host", "Problema", "Eventos", "<2m", "% <2m", "<5m", "% <5m", ">30m", ">8h", "Promedio min", "Mediana min", "Clasificación"], linkDown.map((r) => [r.TriggerID, r.Host, r.Problem, Number(r.Problems7d), Number(r.Under2Min), Number(String(r.PctUnder2Min).replace(",", ".")) / 100, Number(r.Under5Min), Number(String(r.PctUnder5Min).replace(",", ".")) / 100, Number(r.Over30Min), Number(r.Over8Hours), Number(String(r.AverageMinutes).replace(",", ".")), Number(String(r.MedianMinutes).replace(",", ".")), r.Classification]), "LinkDownTable", [12, 28, 80, 12, 10, 11, 10, 11, 10, 10, 14, 14, 30]);
  linkDownSheet.getRange(`F3:F${linkDown.length + 2}`).format.numberFormat = "0.0%"; linkDownSheet.getRange(`H3:H${linkDown.length + 2}`).format.numberFormat = "0.0%"; linkDownSheet.getRange(`K3:L${linkDown.length + 2}`).format.numberFormat = "#,##0.0";
  writeImported(roadmapSheet, "Plan de remediación 0–90 días", ["Horizonte", "Iniciativa", "Entregable", "Responsable", "Estado", "Criterio de salida"], plan, "RoadmapTable", [14, 24, 52, 28, 16, 50]);
  roadmapSheet.getRange(`E3:E${plan.length + 2}`).dataValidation = { rule: { type: "list", values: ["No iniciado", "En curso", "Bloqueado", "Validado"] } };
  roadmapSheet.getRange(`E3:E${plan.length + 2}`).conditionalFormats.add("containsText", { text: "Bloqueado", format: { fill: "#FDE2E1", font: { bold: true, color: "#B42318" } } });
  roadmapSheet.getRange(`E3:E${plan.length + 2}`).conditionalFormats.add("containsText", { text: "Validado", format: { fill: "#DCFCE7", font: { bold: true, color: "#177245" } } });
  writeImported(sources, "Fuentes y controles de uso", ["Fuente", "Contenido", "Uso", "Restricción"], [["raw/*.json", "Extracción API", "Evidencia primaria", "No se incluye en el ZIP de documentación."], ["reports/*.csv", "Análisis derivado", "Volumen, ruido y clasificación", "Revisar corte temporal antes de comparar."], ["docs/*.html", "Informe técnico", "Comunicación y runbook", "No reemplaza aprobación de cambios."], ["diagrams/*.svg", "Modelos lógicos", "Explicar relaciones", "No representa topología física."]], "SourcesTable", [32, 30, 36, 52]);

  const preview = await workbook.render({ sheetName: "Resumen", range: "A1:J21", scale: 1.2, format: "png" });
  await fs.writeFile(path.join(buildDir, "preview-resumen.png"), new Uint8Array(await preview.arrayBuffer()));
  for (const sheetName of ["Hallazgos", "Baseline", "Ruido triggers", "Ruido hosts", "LinkDown 7d", "Plan 0-90", "Fuentes"]) {
    const image = await workbook.render({ sheetName, autoCrop: "all", scale: 0.6, format: "png" });
    await fs.writeFile(path.join(buildDir, `preview-${sheetName.replaceAll(" ", "-")}.png`), new Uint8Array(await image.arrayBuffer()));
  }

  const check = await workbook.inspect({ kind: "table", range: "Resumen!A1:J21", include: "values,formulas", tableMaxRows: 21, tableMaxCols: 10 });
  const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 50 }, summary: "Formula errors" });
  await fs.writeFile(path.join(buildDir, "workbook-check.txt"), `${check.ndjson}\n${formulaErrors.ndjson}\n`, "utf8");
  const target = path.join(reportsDir, "Problemas_Prioridad_y_Solucion.xlsx");
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(target);
  return target;
}

async function main() {
  const [summaryRows, severity, noisyTriggers, noisyHosts, unsupportedHosts, unsupportedErrors, linkDown, version] = await Promise.all([
    readCsv("00_summary.csv"), readCsv("01_events_by_severity.csv"), readCsv("02_noisy_triggers_30d.csv"), readCsv("03_noisy_hosts_30d.csv"), readCsv("11_unsupported_by_host.csv"), readCsv("12_unsupported_errors.csv"), readCsv("20_linkdown_flapping_7d.csv"), readJson("raw/00_api_version.json")
  ]);
  const overview = summaryRows[0];
  if (!overview || version.version !== "7.0.22") throw new Error("No se encontró la línea base esperada de Zabbix 7.0.22.");
  await createHtml(overview, severity, noisyTriggers, noisyHosts, unsupportedHosts, unsupportedErrors, linkDown);
  const workbookPath = await createWorkbook(overview, severity, noisyTriggers, noisyHosts, linkDown);
  console.log(JSON.stringify({ workbookPath, docs: 10, diagrams: 3, generatedAt }, null, 2));
}

await main();
