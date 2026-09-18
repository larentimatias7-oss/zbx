# Portal de Operaciones y Gobernanza Zabbix 7.0 LTS (Milicic)

Repositorio central de configuración, automatización con agentes IA, inventarios y documentación técnica oficial para la plataforma de monitoreo de **Milicic S.A.**

---

## 1. Acceso Rápido a la Documentación Oficial

El suite completo de documentación técnica, manuales de usuario y estándares operativos se encuentra estructurado en [`docs/zabbix/manuals/`](file:///c:/zabbix_anti/docs/zabbix/manuals/):

| Documento | Descripción | Audiencia |
| :--- | :--- | :--- |
| 📘 [**01. Arquitectura Técnica e Infraestructura**](file:///c:/zabbix_anti/docs/zabbix/manuals/01-arquitectura-tecnica-zabbix.md) | Topología del host Linux (`172.30.20.61`), contenedores Docker, base de datos TimescaleDB, red y webhooks de Telegram. | Administradores, SysAdmins, DevOps |
| 🚨 [**02. Modelo de Alertas y Escalamiento**](file:///c:/zabbix_anti/docs/zabbix/manuals/02-modelo-alertas-y-escalamiento.md) | Pirámide de criticidad P1/P2/P3, retardo de persistencia, supresión en mantenimiento y los dos canales de Telegram. | SRE, NOC, Guardias |
| 🏷️ [**03. Guía de Creación y Alta de Hosts**](file:///c:/zabbix_anti/docs/zabbix/manuals/03-guia-creacion-hosts.md) | Convención de nombres, plantillas oficiales, SNMP, macro `{$IFCONTROL}` y matriz de tags obligatorios (*Tag-driven Alerting*). | Operadores NOC, Administradores |
| 🖥️ [**04. Manual de Usuario y Operador NOC**](file:///c:/zabbix_anti/docs/zabbix/manuals/04-manual-usuario-y-operador-noc.md) | Navegación de la consola web, operación de Dashboards, reconocimiento (*Acknowledge*) de problemas y rotación de guardias. | Mesa de Ayuda, NOC, Soporte |
| 👥 [**05. Gestión de Usuarios y Notificaciones**](file:///c:/zabbix_anti/docs/zabbix/manuals/05-gestion-usuarios-y-notificaciones.md) | Alta de operadores, RBAC, configuración de Medias de Telegram, los 4 eslabones obligatorios y resolución de errores. | Administradores Zabbix |

---

## 2. Inventarios y Auditoría de Producción

En [`docs/zabbix/prod/`](file:///c:/zabbix_anti/docs/zabbix/prod/):
* 📋 [**Inventario Consolidado de Configuración**](file:///c:/zabbix_anti/docs/zabbix/prod/configuration-inventory.md): Lista clasificada de hosts, user groups, acciones y canales Telegram.
* 🛠️ [**Runbook de Operaciones SRE**](file:///c:/zabbix_anti/docs/zabbix/prod/operations-runbook.md): Procedimientos operativos avanzados, control de interfaces y ventanas de mantenimiento.
* 📊 [**Matriz de Cambios (Change Matrix)**](file:///c:/zabbix_anti/docs/zabbix/prod/change-matrix-ZBX-prod-20260916-ALERT-OPT.md): Trazabilidad de refactorizaciones y optimizaciones aplicadas.
* ⏪ [**Plan de Rollback**](file:///c:/zabbix_anti/docs/zabbix/prod/rollback-plan-ZBX-prod-20260916-ALERT-OPT.md): Procedimiento de contingencia y marcha atrás.

---

## 3. Integración con Antigravity & MCP Server

Este workspace cuenta con integración directa a la API de Zabbix 7.0 LTS mediante el servidor MCP ([initMAX/zabbix-mcp-server](https://github.com/initMAX/zabbix-mcp-server)):

* **Endpoint MCP Local:** `http://127.0.0.1:8080/mcp`
* **Admin Portal MCP:** `http://127.0.0.1:9090`
* **Transporte:** Native Streamable HTTP
* **Token MCP:** `zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e`
* **Reglas Persistentes del Agente:** [`.agents/rules/milicic-zabbix-environment.md`](file:///c:/zabbix_anti/.agents/rules/milicic-zabbix-environment.md)

### Archivos de Configuración MCP:
- [`.agents/mcp_config.json`](file:///c:/zabbix_anti/.agents/mcp_config.json)
- [`mcp_config.json`](file:///c:/zabbix_anti/mcp_config.json)
- [`.vscode/mcp.json`](file:///c:/zabbix_anti/.vscode/mcp.json)

---

## 4. Estructura del Repositorio

```text
c:\zabbix_anti\
├── .agents/
│   ├── rules/
│   │   └── milicic-zabbix-environment.md        # Reglas y contexto persistente para agentes IA
│   └── skills/
│       ├── zabbix-config-docs/                  # Skill de documentación y auditoría de cambios
│       └── zabbix-dashboard-architect/          # Skill de diseño y gestión de dashboards
├── .zabbix_context/
│   ├── audit_baseline.md                        # Estado de línea base de la auditoría inicial
│   ├── tagging_plan.md                          # Plan de etiquetado y taxonomía de tags
│   └── dashboards/                              # Exportaciones JSON de tableros desplegados
├── docs/
│   └── zabbix/
│       ├── manuals/                             # Manuales técnicos y guías de usuario finales
│       └── prod/                                # Inventarios, runbooks y matrices de cambios
└── README.md                                    # Portal principal y mapa de navegación
```
