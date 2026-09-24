# Portal de Operaciones y Gobernanza Zabbix 7.0 LTS (Milicic S.A.)

Repositorio central de configuración, automatización con agentes IA, inventarios, directivas de gobernanza y documentación técnica oficial para la plataforma de monitoreo de **Milicic S.A.**

> **Última actualización:** 24 de Septiembre de 2026 — Dashboards de observabilidad y Cyber SOC optimizados, auditoría forense interactiva desplegada, pipeline de incidentes Zabbix estandarizado.

---

## 1. Reglas y Estándares Globales del Workspace

Cualquier agente o desarrollador que opere en este workspace debe regirse por las directivas mandatorias:
* 📜 [**GEMINI.md**](file:///c:/zabbix_anti/GEMINI.md): Estándares universales, inspección previa, política de solo lectura, protección de secretos y verificación pre-flight MCP.
* 🛡️ [**.agents/rules/milicic-zabbix-environment.md**](file:///c:/zabbix_anti/.agents/rules/milicic-zabbix-environment.md): Contexto de infraestructura, topología de contenedores, canales de Telegram y estado operativo activo al 23/09/2026.

---

## 2. Acceso Rápido a la Documentación Oficial

El suite completo de documentación técnica, manuales de usuario y estándares operativos se encuentra estructurado en [`docs/zabbix/manuals/`](file:///c:/zabbix_anti/docs/zabbix/manuals/):

| Documento | Descripción | Audiencia |
| :--- | :--- | :--- |
| 📘 [**01. Arquitectura Técnica e Infraestructura**](file:///c:/zabbix_anti/docs/zabbix/manuals/01-arquitectura-tecnica-zabbix.md) | Topología del host Linux (`172.30.20.61`), contenedores Docker, base de datos TimescaleDB, red y webhooks de Telegram. | Administradores, SysAdmins, DevOps |
| 🚨 [**02. Modelo de Alertas y Escalamiento**](file:///c:/zabbix_anti/docs/zabbix/manuals/02-modelo-alertas-y-escalamiento.md) | Pirámide de criticidad P1/P2/P3, retardo de persistencia, supresión en mantenimiento y los dos canales de Telegram. | SRE, NOC, Guardias |
| 🏷️ [**03. Guía de Creación y Alta de Hosts**](file:///c:/zabbix_anti/docs/zabbix/manuals/03-guia-creacion-hosts.md) | Convención de nombres, plantillas oficiales, SNMP, macro `{$IFCONTROL}` y matriz de tags obligatorios (*Tag-driven Alerting*). | Operadores NOC, Administradores |
| 🖥️ [**04. Manual de Usuario y Operador NOC**](file:///c:/zabbix_anti/docs/zabbix/manuals/04-manual-usuario-y-operador-noc.md) | Navegación de la consola web, operación de Dashboards, reconocimiento (*Acknowledge*) de problemas y rotación de guardias. | Mesa de Ayuda, NOC, Soporte |
| 👥 [**05. Gestión de Usuarios y Notificaciones**](file:///c:/zabbix_anti/docs/zabbix/manuals/05-gestion-usuarios-y-notificaciones.md) | Alta de operadores, RBAC, configuración de Medias de Telegram, los 4 eslabones obligatorios y resolución de errores. | Administradores Zabbix |
| 📱 [**06. Canales de Notificación en Telegram**](file:///c:/zabbix_anti/docs/zabbix/manuals/06-canales-notificacion-telegram.md) | Inventario de bots (@inframilicic_bot, @Milicic_bot), resolución de error "chat not found", formato de IDs (-100...) y vinculación paso a paso. | NOC, SRE, Administradores |

---

## 3. Inventarios, Auditoría y Contexto Histórico

En [`docs/zabbix/prod/`](file:///c:/zabbix_anti/docs/zabbix/prod/) y [`.zabbix_context/`](file:///c:/zabbix_anti/.zabbix_context/):
* 📋 [**Inventario Consolidado de Configuración**](file:///c:/zabbix_anti/docs/zabbix/prod/configuration-inventory.md): Lista clasificada de hosts, user groups, acciones y canales Telegram.
* 🛠️ [**Runbook de Operaciones SRE**](file:///c:/zabbix_anti/docs/zabbix/prod/operations-runbook.md): Procedimientos operativos avanzados, control de interfaces y ventanas de mantenimiento.
* 📊 [**Matriz de Cambios (Change Matrix)**](file:///c:/zabbix_anti/docs/zabbix/prod/change-matrix-ZBX-prod-20260916-ALERT-OPT.md): Trazabilidad de refactorizaciones y optimizaciones aplicadas.
* ⏪ [**Plan de Rollback**](file:///c:/zabbix_anti/docs/zabbix/prod/rollback-plan-ZBX-prod-20260916-ALERT-OPT.md): Procedimiento de contingencia y marcha atrás.
* 🗄️ [**Contexto Operativo e Histórico**](file:///c:/zabbix_anti/.zabbix_context/operational_context_chatgpt.md): Matriz completa de hallazgos (`AUD-001` a `AUD-009`), bitácoras cronológicas de remediación (08/09 al 23/09/2026), mapa de red LLDP y matriz de VLANs.
* 📊 [**Inventario de Dashboards Grafana**](file:///c:/zabbix_anti/.zabbix_context/grafana_dashboards.md): Catálogo completo de los 12 tableros en producción, plugins instalados y estado de paneles.
* 📁 **Repositorio Maestro en OneDrive:** `C:\Users\matias.larenti\OneDrive - Milicic SA\Documentos\Zabbix`

---

## 4. Skills y Workflows para Agentes IA

El proyecto cuenta con skills altamente especializadas y workflows deterministas:

| Recurso | Tipo | Descripción |
| :--- | :--- | :--- |
| 📊 [**zabbix-dashboard-architect**](file:///c:/zabbix_anti/.agents/skills/zabbix-dashboard-architect/SKILL.md) | Skill | Estándar de diseño en grid de 24 col, convenciones de Milicic, métricas core, colores por severidad y checklist pre-flight MCP obligatorio para Zabbix. |
| 📈 [**grafana-milicic-standards**](file:///c:/zabbix_anti/.agents/skills/grafana-milicic-standards/SKILL.md) | Skill | Estándar Milicic para Grafana con métodos USE y RED, datasource Zabbix (`efz4nzx8r30g0c`), esquemas de paneles v12 y paletas corporativas. |
| 🛠️ [**grafana-mcp-tools**](file:///c:/zabbix_anti/.agents/skills/grafana-mcp-tools/SKILL.md) | Skill | Skill oficial de Grafana Labs para interactuar con el servidor MCP `uvx mcp-grafana`, RBAC y gestión de context window. |
| ⚙️ [**zabbix-operations**](file:///c:/zabbix_anti/.agents/skills/zabbix-operations/SKILL.md) | Skill | Operaciones seguras, diagnóstico de microflapping con LLDP, resolución de errores Telegram (`chat not found`), monitoreo Veeam y desduplicación. |
| 📝 [**zabbix-config-docs**](file:///c:/zabbix_anti/.agents/skills/zabbix-config-docs/SKILL.md) | Skill | Auditoría, matrices de cambios y documentación de configuraciones tras cambios de API. |
| 🎨 [**milicic-corporate-docs**](file:///c:/zabbix_anti/.agents/skills/milicic-corporate-docs/SKILL.md) | Skill | Generación de reportes PDF, Excel, Word y dashboards con estándar corporativo de Milicic. |
| 🚀 [**nuevo-dashboard**](file:///c:/zabbix_anti/.agents/workflows/nuevo-dashboard.md) | Workflow | Guía de ejecución para `/nuevo-dashboard <servicio>` con pre-flight discovery, validación JSON y despliegue MCP. |

---

## 5. Plataforma de Observabilidad Grafana

**Grafana v11.5.2** desplegado en Dokploy (`http://172.27.210.154:3005`), con datasource Zabbix integrado y **11 plugins de visualización** instalados.

### Plugins Instalados (docker-compose)

```
alexanderzobnin-zabbix-app
yesoreyeram-infinity-datasource
marcusolsson-dynamictext-panel
volkovlabs-table-panel
grafana-polystat-panel
marcusolsson-treemap-panel
marcusolsson-hourly-heatmap-panel
nline-plotlyjs-panel
knightss27-weathermap-plugin
isaozler-paretochart-panel
marcusolsson-sankey-panel
```

### Dashboards en Producción (Carpeta `Milicic Observabilidad`)

| UID | Dashboard | URL |
| :--- | :--- | :--- |
| `milicic-switches-core` | 🌐 Networking: Switches Core y Distribución | [Abrir](http://172.27.210.154:3005/d/milicic-switches-core) |
| `milicic-vmware-datastores` | 🖥️ Virtualización y Storage: VMware & Datastores | [Abrir](http://172.27.210.154:3005/d/milicic-vmware-datastores) |
| `milicic-soc-overview` | 🛡️ Milicic SOC / NOC: Visión Ejecutiva Global | [Abrir](http://172.27.210.154:3005/d/milicic-soc-overview) |
| `milicic-sanjuan-infra` | ⛰️ San Juan: Monitoreo Integral (SSJ) | [Abrir](http://172.27.210.154:3005/d/milicic-sanjuan-infra) |
| `milicic-activedirectory-soc` | 🔐 Active Directory & Cyber SOC | [Abrir](http://172.27.210.154:3005/d/milicic-activedirectory-soc) |
| `milicic-servers-plataforma` | 🖥️ Servidores & Plataforma | [Abrir](http://172.27.210.154:3005/d/milicic-servers-plataforma) |
| `milicic-backup-continuidad` | 💾 Backup & Continuidad (Veeam) | [Abrir](http://172.27.210.154:3005/d/milicic-backup-continuidad) |
| `milicic-facilities-ups` | ⚡ Energía & Facilities (UPS) | [Abrir](http://172.27.210.154:3005/d/milicic-facilities-ups) |
| `milicic-fortigate-wan` | 🔥 FortiGate & WAN | [Abrir](http://172.27.210.154:3005/d/milicic-fortigate-wan) |
| `milicic-aruba-wifi` | 📡 Aruba Wi-Fi & Switches Instant On | [Abrir](http://172.27.210.154:3005/d/milicic-aruba-wifi) |
| `milicic-nuevos-plugins` | 🎨 Galería de Nuevos Plugins | [Abrir](http://172.27.210.154:3005/d/milicic-nuevos-plugins) |

> 📖 Ver inventario completo en [**grafana_dashboards.md**](file:///c:/zabbix_anti/.zabbix_context/grafana_dashboards.md)

---

## 6. Scripts de Diagnóstico y Automatización Local

En [`scripts/`](file:///c:/zabbix_anti/scripts/):

### Scripts de Build de Dashboards (`.mjs`)

| Script | Dashboard | Descripción |
| :--- | :--- | :--- |
| `build_activedirectory_dashboard.mjs` | AD & Cyber SOC | DC health, servicios AD (6 targets exactos), Eventlog security, heatmap 7d |
| `build_switches_dashboard.mjs` | Switches Core | Polystat de estado, heatmap de tráfico por puerto |
| `build_servers_dashboard.mjs` | Servidores | CPU, RAM, disco, servicios Windows/Linux |
| `build_vmware_dashboard.mjs` | VMware | VMs, datastores, hosts ESXi |
| `build_soc_dashboard.mjs` | SOC/NOC | Visión ejecutiva global, problems, triggers críticos |
| `build_sanjuan_dashboard.mjs` | San Juan | Infraestructura SSJ, Polystat + Treemap |
| `build_fortigate_dashboard.mjs` | FortiGate | WAN, interfaces, CPU/RAM, VPN |
| `build_facilities_ups_dashboard.mjs` | Facilities/UPS | Baterías, carga, autonomía, temperatura |
| `build_backup_dashboard.mjs` | Backup/Veeam | Jobs, sesiones, ventana de backup |
| `build_aruba_dashboard.mjs` | Aruba Wi-Fi | APs, radios, SSIDs, switches Instant On |
| `build_new_plugins_gallery.mjs` | Galería Plugins | Showcase de los 11 nuevos plugins |

### Scripts de Diagnóstico PowerShell

| Script | Descripción |
| :--- | :--- |
| `Get-VeeamVmBackupStatus.ps1` | Extracción de jobs/sesiones Veeam en JSON |
| `Analyze-LinkDownFlapping.ps1` | Discriminación microflapping vs caídas reales |
| `Analyze-ZabbixNoise.ps1` | Distribución de severidades y eventos ruidosos |
| `Analyze-ZabbixItems.ps1` | Auditoría de ítems no soportados por host |

---

## 7. Integración con Antigravity & Conectores MCP

El workspace cuenta con doble integración MCP para orquestar observabilidad y tableros:

1. **Zabbix MCP Server (initMAX):**
   * **Endpoint:** `http://127.0.0.1:8080/mcp` (Admin UI: `http://127.0.0.1:9090`)
   * **Transporte:** Native Streamable HTTP
   * **Uso:** Extracción de telemetría, validación pre-flight de métricas, gestión de alertas y hosts.

2. **Grafana MCP Server (Oficial Grafana Labs):**
   * **Endpoint Web Grafana:** `http://172.27.210.154:3005` (Dokploy en `172.27.210.154`)
   * **Comando:** `uvx mcp-grafana`
   * **Token Service Account:** `glsa_...` (Cuenta `Ant-Local`, rol Admin)
   * **Datasource Zabbix:** `alexanderzobnin-zabbix-datasource` (UID: `efz4nzx8r30g0c`)

* **Archivos de Configuración MCP:** [`mcp_config.json`](file:///c:/zabbix_anti/mcp_config.json), [`.agents/mcp_config.json`](file:///c:/zabbix_anti/.agents/mcp_config.json)

---

## 8. Estructura del Repositorio

```text
c:\zabbix_anti\
├── .agents/
│   ├── rules/
│   │   └── milicic-zabbix-environment.md        # Reglas operativas y contexto vivo del entorno
│   ├── skills/
│   │   ├── zabbix-dashboard-architect/          # Skill de diseño de dashboards Zabbix
│   │   ├── grafana-milicic-standards/           # Skill de dashboards Grafana (USE/RED)
│   │   ├── grafana-mcp-tools/                   # Skill oficial de Grafana Labs
│   │   ├── milicic-corporate-docs/              # Skill de documentación corporativa
│   │   ├── zabbix-operations/                   # Skill de operaciones y troubleshooting
│   │   └── zabbix-config-docs/                  # Skill de documentación y matrices de cambio
│   └── workflows/
│       └── nuevo-dashboard.md                   # Workflow /nuevo-dashboard <servicio>
├── .zabbix_context/
│   ├── audit_baseline.md                        # Estado de línea base auditoría inicial (16/09)
│   ├── tagging_plan.md                          # Plan de etiquetado y taxonomía de tags
│   ├── operational_context_chatgpt.md           # Acervo histórico y matriz de hallazgos
│   ├── grafana_dashboards.md                    # Inventario completo de dashboards Grafana
│   └── dashboards/                              # Exportaciones JSON y backups de tableros
├── docs/
│   └── zabbix/
│       ├── manuals/                             # Manuales técnicos oficiales (01 a 06)
│       └── prod/                               # Inventarios, runbooks y matrices de cambios
├── scripts/                                     # Scripts de build (.mjs) y diagnóstico (.ps1)
├── scratch/                                     # Scripts de diagnóstico temporales y pruebas
├── GEMINI.md                                    # Directivas universales mandatorias del workspace
└── README.md                                    # Portal principal y mapa de navegación
```
