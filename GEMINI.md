# Estándares Operativos y de Gobernanza: Zabbix 7.0 LTS (Milicic S.A.)

Este archivo define las reglas y directivas fundamentales que **deben aplicarse siempre** por cualquier agente en este workspace, independientemente de la tarea solicitada.

---

## 1. Identidad de Infraestructura y Conectividad

- **Plataforma:** Zabbix 7.0.22 LTS en Producción (`prod`).
- **Endpoint Web Zabbix:** `https://zabbix.mlccnet.local` (Host Linux `172.30.20.61`).
- **Conector MCP Zabbix:** initMAX Zabbix MCP Server en `http://127.0.0.1:8080/mcp` (Bearer token configurado en `mcp_config.json`).
- **Endpoint Web Grafana:** `http://172.27.210.154:3005` (Dokploy en Host Linux `172.27.210.154`).
- **Conector MCP Grafana:** Servidor oficial `uvx mcp-grafana` configurado en `mcp_config.json` con Service Account `Ant-Local`.
- **Datasource Zabbix en Grafana:** `alexanderzobnin-zabbix-datasource` (UID: `efz4nzx8r30g0c`, por defecto).
- **Repositorio de Evidencia y Auditoría:** `C:\Users\matias.larenti\OneDrive - Milicic SA\Documentos\Zabbix` y `.zabbix_context/`.

---

## 2. Directivas Universales de Modificación Segura

1. **Inspección Previa y Solo Lectura por Defecto:**
   - Toda interacción con Zabbix debe comenzar en modo consulta e inspección (`get`).
   - Mantener el acceso en solo lectura hasta contar con la autorización explícita del usuario para aplicar cambios.
2. **Registro Obligatorio de Cambio y Rollback:**
   - Antes de realizar cualquier modificación en producción, registrar:
     * Lista exacta de objetos afectados (`hostid`, `itemid`, `triggerid`, `actionid`, etc.).
     * Estado previo y valores originales de configuración.
     * Procedimiento claro de reversión (*rollback*).
     * Método de validación posterior (*post-change verification*).
3. **Protocolo Estricto de Link-Down / Caídas de Interfaz:**
   - **Exigencia de Evidencia:** Para evaluar o mitigar alertas de enlace caído (*link down*), es obligatorio contrastar previamente:
     * LLDP (vecino remoto y puerto asociado).
     * Alias y descripción del puerto (`ifAlias`).
     * Membresía LAG / LACP (Port-Channel).
   - **Prohibición:** **Jamás silenciar o editar una plantilla global** por un síntoma en un puerto individual. Usar macros de contexto, prototipos de trigger o ajustes puntuales.
4. **Verificación Pre-Flight Obligatoria vía MCP:**
   - Para dashboards, acciones o reglas de mantenimiento: **usar siempre las herramientas MCP** (`item_get`, `trigger_get`, `host_get`, `map_get`) para confirmar que las entidades existen y están activas antes de referenciarlas en la configuración. Queda prohibido asumir o inventar identificadores numéricos.
5. **Protección de Datos Sensibles y Confidencialidad:**
   - Prohibido exponer tokens de bots, chat IDs de Telegram, contraseñas o datos sensibles en reportes, commits o resúmenes visibles.
6. **No Modificación Directa de Base de Datos:**
   - Todas las operaciones deben ejecutarse a través de la API oficial (vía MCP o JSON-RPC), nunca mediante comandos SQL directos a PostgreSQL.

---

## 3. Modelo de Notificaciones y Alertas (P1, P2, P3)

Milicic opera con un modelo de escalamiento progresivo y supresión de flapping en dos canales de Telegram independientes:

| Nivel | Severidad | Demora (Persistencia) | Destinatarios | Medios Zabbix | Canales Telegram |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 - Crítico** | `Disaster`, `High` | **Inmediato (0 min)** | `Alertas-Guardia-P1` (15) | `Telegram_Test` (71) y `Telegram_Test_Milicic` (72) | Supergrupos `-100...` |
| **P2 - Redes** | `Average` | **10 minutos** (Paso 2) | `Alertas-NOC-Redes` (16) | `Telegram_Test` y `Telegram_Test_Milicic` | Alertas Infra / Monitoreo |
| **P2 - Plataforma** | `Average` | **10 minutos** (Paso 2) | `Alertas-SRE-Plataforma` (17) | `Telegram_Test` y `Telegram_Test_Milicic` | Alertas Infra / Monitoreo |
| **P3 - Preventivo** | `Warning` | **30 minutos** (Paso 2) | Grupos 16 y 17 | `Telegram_Test` y `Telegram_Test_Milicic` | Alertas Infra / Monitoreo |

> [!CAUTION]
> - Los chat IDs de supergrupos/canales siempre comienzan con `-100`. Omitir este prefijo provoca el error fatal `Bad Request: chat not found`.
> - Los eventos resueltos dentro de la ventana de retardo (10 min en P2, 30 min en P3) no generan ruido en los grupos de Telegram.

---

## 4. Estándar de Nomenclatura y Tags (*Tag-Driven Architecture*)

- **Nomenclatura:** `<SEDE>-<TIPO>-<IDENTIFICADOR>` (ej. `SRO-E02-PB00-CORE01`, `SRO-SQL01`, `SSJ-HPV01`).
- **Tags Obligatorios por Host:**
  * `team`: `redes` | `plataforma` | `dba`
  * `tier`: `core` | `access` | `perimeter` | `service` | `virtualization` | `facilities`
  * `component`: `switch` | `server` | `firewall` | `ups` | `database`
  * `scope`: `capacity` | `notice` | `performance` | `availability`

---

## 5. Skills y Documentación Operativa

- Skill de Dashboards: [zabbix-dashboard-architect](file:///c:/zabbix_anti/.agents/skills/zabbix-dashboard-architect/SKILL.md)
- Skill de Operaciones y Diagnóstico: [zabbix-operations](file:///c:/zabbix_anti/.agents/skills/zabbix-operations/SKILL.md)
- Skill de Auditoría y Documentación: [zabbix-config-docs](file:///c:/zabbix_anti/.agents/skills/zabbix-config-docs/SKILL.md)
- Contexto Histórico y Matriz de Hallazgos: [operational_context_chatgpt.md](file:///c:/zabbix_anti/.zabbix_context/operational_context_chatgpt.md)
- Scripts Operativos Locales: [scripts/](file:///c:/zabbix_anti/scripts/)
