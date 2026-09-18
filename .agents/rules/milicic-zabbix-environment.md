# Reglas de Entorno: Zabbix 7.0 LTS (Milicic)

Este documento define el contexto persistente de infraestructura, estándares arquitectónicos y reglas operativas para cualquier agente que trabaje en este workspace.

---

## 1. Identidad de Infraestructura y Conectividad

- **Entorno:** Producción (`prod`).
- **URL Web Frontend:** `https://zabbix.mlccnet.local` (resolución DNS interna).
- **Host de Despliegue:** Servidor Linux en `172.30.20.61`.
- **Acceso SSH al Host:** `root@172.30.20.61` mediante llave ed25519 en `C:\claves\id_ed25519_zabbix`.
- **Topología de Contenedores Docker en el Host:**
  - `zabbix-server`: Motor de monitoreo y poller.
  - `zabbix-frontend`: Nginx + PHP-FPM con la UI de Zabbix.
  - Base de Datos: PostgreSQL con TimescaleDB.
  - `zabbix-snmptraps`: Recolector de traps SNMP.
- **Acceso API MCP:** Endpoint local `http://127.0.0.1:8080/mcp` con token de servicio `zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e`.

---

## 2. Mapa de Integraciones de Notificación (Telegram)

Existen dos bots y dos canales independientes operando en simultáneo:

| Entorno / Dominio | Media Type Zabbix | Bot Telegram | Chat ID Destino | Nombre Canal / Grupo | Finalidad Operativa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Infraestructura / Guardias** | `Telegram_Test` (ID: 71) | `@inframilicic_bot` (token `8899338410:...`) | `-1004383937012` | **Alertas Infra** | Canal operativo para personal de guardia de Infraestructura y Administradores. |
| **Monitoreo Corporativo Milicic** | `Telegram_Test_Milicic` (ID: 72) | `@Milicic_bot` (token `8666455955:...`) | `-1003912373499` | **Milicic - Monitoreo** | Canal institucional de monitoreo general y seguimiento de eventos. |

> [!CAUTION]
> - El ID `-5468713329` es un ID erróneo/obsoleto donde los bots no están invitados. Nunca debe usarse como `sendto`.
> - Ambos canales son **supergrupos/canales** y sus IDs siempre llevan el prefijo `-100`.
> - Zabbix descarta silenciosamente alertas si el usuario no tiene permisos de lectura sobre el host, aun cuando la acción le apunte.

---

## 3. Matriz de Acciones de Alerta (*Trigger Actions*)

Las 4 acciones operativas estándar en producción:

1. **`TG-P1-Crítico` (Action ID: 8):**
   - Severidad: `High` y `Disaster`.
   - Disparo: Inmediato (Paso 1, 0 min).
   - Destinatarios: Grupo `Alertas-Guardia-P1` (ID: 15).
   - Medios: `Telegram_Test` y `Telegram_Test_Milicic`.
2. **`TG-P2-Redes` (Action ID: 9):**
   - Severidad: `Average`.
   - Filtro: Tags `team: redes`, `tier: core` (o grupos de red).
   - Retardo: 10 minutos de persistencia (Paso 2).
   - Destinatarios: Grupo `Alertas-NOC-Redes` (ID: 16).
   - Medios: `Telegram_Test` y `Telegram_Test_Milicic`.
3. **`TG-P2-Plataforma` (Action ID: 10):**
   - Severidad: `Average`.
   - Filtro: Tags `team: plataforma` o `team: dba`, o grupos de servidores/bases de datos/UPS.
   - Retardo: 10 minutos de persistencia (Paso 2).
   - Destinatarios: Grupo `Alertas-SRE-Plataforma` (ID: 17).
   - Medios: `Telegram_Test` y `Telegram_Test_Milicic`.
4. **`TG-P3-Preventivo` (Action ID: 11):**
   - Severidad: `Warning`.
   - Filtro: Tags `scope: capacity` o `scope: notice`.
   - Retardo: 30 minutos de persistencia (Paso 2).
   - Destinatarios: Grupos `Alertas-NOC-Redes` (16) y `Alertas-SRE-Plataforma` (17).
   - Medios: `Telegram_Test` y `Telegram_Test_Milicic`.

---

## 4. Estándar de Tags para Creación de Hosts (*Tag-Driven Alerting*)

Al crear o editar cualquier host en Zabbix, es mandatario aplicar los tags según su rol tecnológico:
- `team`: `redes` | `plataforma` | `dba`
- `tier`: `core` | `access` | `perimeter` | `service` | `virtualization` | `facilities`
- `component`: `switch` | `server` | `firewall` | `ups` | `database`
- `scope`: `capacity` | `notice`

---

## 5. Reglas de Modificación Segura para el Agente

1. **Nunca editar las condiciones de las acciones básicas** sin justificación documentada.
2. **Respetar la persistencia de los 4 pasos de alerta.**
3. **Documentar cada cambio** en la matriz de cambios y el inventario.
4. **Evitar ejecutar scripts directos en la BD de Zabbix**: Toda modificación debe pasar por la API oficial (vía MCP o JSON-RPC).
