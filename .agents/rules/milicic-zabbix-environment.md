# Reglas de Entorno: Zabbix 7.0 LTS (Milicic)

Este documento define el contexto persistente de infraestructura, directivas operativas de seguridad, estándares arquitectónicos y estado operativo activo para cualquier agente que trabaje en este workspace.

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
- **Acceso API MCP Zabbix:** Endpoint local `http://127.0.0.1:8080/mcp` con token de servicio `zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e`.
- **Grafana Enterprise:** `http://172.27.210.154:3005` (Dokploy en `172.27.210.154`).
- **Acceso API MCP Grafana:** Servidor `uvx mcp-grafana` integrado en `mcp_config.json` con token Service Account `Ant-Local`.
- **Datasource Zabbix en Grafana:** `alexanderzobnin-zabbix-datasource` (UID: `efz4nzx8r30g0c`).
- **Repositorio Histórico de Auditoría y Bitácoras (ChatGPT):** `C:\Users\matias.larenti\OneDrive - Milicic SA\Documentos\Zabbix`.

---

## 2. Directivas Operativas y de Seguridad Mandatorias (AGENTS.md)

1. **Principio de Inspección Previa y Solo Lectura:**
   - Toda interacción con la API o SSH debe comenzar en modo inspección (`get`).
   - Mantener el acceso en solo lectura a menos que el usuario autorice explícitamente un cambio.
2. **Procedimiento de Modificación Segura:**
   - Antes de aplicar cualquier cambio en producción, documentar:
     a) Objetos afectados (`hostid`, `itemid`, `triggerid`, etc.).
     b) Estado actual exacto (valores de configuración previos).
     c) Plan de reversión (*rollback*).
     d) Método de verificación posterior (*post-change verification*).
   - Documentar cada decisión en la bitácora correspondiente (`Bitacora-saneamiento-Zabbix-YYYY-MM-DD.md` y reportes en `reports/`).
3. **Protocolo Estricto para Link-Down / Caídas de Interfaz:**
   - **Exigencia de Evidencia:** Antes de modificar o deshabilitar cualquier disparador de enlace caído (*link down*), se debe recopilar evidencia obligatoria de:
     * LLDP (vecino remoto y puerto asociado).
     * Alias y descripción de interfaz (`ifAlias`).
     * Membresía LAG / Port-Channel.
   - **Prohibición:** **Jamás silenciar o modificar una plantilla completa** por un síntoma en un puerto individual.
4. **Protección de Datos Sensibles:**
   - No exponer contraseñas, tokens de bots, chat IDs de Telegram ni secretos en reportes, commits, ni mensajes de resumen. Tratar la evidencia cruda (`raw/`) como confidencial.
5. **No Ejecución de Scripts Directos en BD:**
   - Toda modificación de configuración o estado en Zabbix debe realizarse por la API oficial (vía MCP o JSON-RPC), nunca mediante queries SQL directas a PostgreSQL.

---

## 3. Mapa de Integraciones de Notificación (Telegram)

Existen dos bots y dos canales independientes operando en producción:

| Entorno / Dominio | Media Type Zabbix | Bot Telegram | Chat ID Destino | Nombre Canal / Grupo | Finalidad Operativa |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Infraestructura / Guardias** | `Telegram_Test` (ID: 71) | `@inframilicic_bot` (token `8899338410:...`) | `-1004383937012` | **Alertas Infra** | Canal operativo para personal de guardia de Infraestructura y Administradores. |
| **Monitoreo Corporativo Milicic** | `Telegram_Test_Milicic` (ID: 72) | `@Milicic_bot` (token `8666455955:...`) | `-1003912373499` | **Milicic - Monitoreo** | Canal institucional de monitoreo general y seguimiento de eventos. |

> [!CAUTION]
> - El ID `-5468713329` es un ID erróneo/obsoleto donde los bots no están invitados. Nunca debe usarse como `sendto`.
> - Ambos canales son **supergrupos/canales** y sus IDs siempre llevan el prefijo `-100`.
> - Zabbix descarta silenciosamente alertas si el usuario no tiene permisos de lectura sobre el host, aun cuando la acción le apunte.

---

## 4. Matriz de Acciones de Alerta (*Trigger Actions*)

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

## 5. Estado Operativo Activo y Puntos Críticos (al 23/09/2026)

Cualquier intervención debe tener presente el estado vivo de la plataforma:

1. **Fallo de Entrega en Telegram (`mlarenti.zabbix`):**
   - En las últimas ventanas de observación, el usuario `mlarenti.zabbix` registra fallos con error `Sending failed: Bad Request: chat not found` mediante `Telegram_Test` (Media ID 71).
   - `Admin` y `fmartin.zabbix` entregan correctamente por sus respectivos canales.
   - **Directiva:** No alterar destinatarios a ciegas; se debe corregir el Chat ID en el perfil del usuario o verificar los permisos del bot `@inframilicic_bot`.
2. **Monitoreo de Backups Veeam (`SSJ-HPV01` y `SSJ-BKP01`):**
   - En `SSJ-HPV01`, el servicio VSS inicia por demanda; se reemplazó el trigger ruidoso 34062 por el disparador 37635 que solo alerta si el inicio queda deshabilitado (`service.info["VSS",startup]=3`).
   - El estado real de backup reside en `SSJ-BKP01` (hostid 10718), que actualmente **no tiene ítems de jobs ni sesiones Veeam** (solo servicios de Windows).
   - Existe el script `scripts/Get-VeeamVmBackupStatus.ps1` listo para ser ejecutado en el servidor Veeam para descubrir jobs y telemetría de tareas.
3. **Endpoint Duplicado G01 (192.168.0.224):**
   - Dos hosts monitorean el mismo switch: `SRO-G01-P01-D04` (hostid 10713) y `SRO-G01-P100-DIS01` (hostid 10799).
   - `DIS01` es el canónico (HP Comware, 337 ítems válidos, métricas de entorno).
   - Se deshabilitaron los triggers duplicados de puertos 11 y 12 en `D04`.
   - **Precaución:** El dashboard `NOC Infraestructura` (ID 408) tiene 9 widgets que aún apuntan a `D04`. No deshabilitar el host completo hasta migrar estos widgets a `DIS01`.
4. **Almacenamiento Docker en Zabbix Server:**
   - 5 bind mounts comparten el mismo sistema de archivos raíz (>90% ocupado).
   - Se creó el trigger local 37637 etiquetado para P2 Plataforma para evitar tormentas de duplicados.
5. **UPS E02 PA:**
   - Disparador 35455 deshabilitado (estaba basado en `upsOutputSource` que nunca reportó muestras).
   - Monitoreo de disponibilidad SNMP activo vía ítem 98122 y trigger preventivo 37636 (P3).
6. **Mapas de Red:**
   - Mapa 11 (`NOC Infraestructura`) y 4 submapas (7 al 10) desplegados con 77 hosts sin solapamientos.

---

## 6. Arquitectura de Red y Matriz de VLANs Confirmada

- **Perímetro WAN:** FortiGate Border1 (`172.30.20.1`, FortiOS 7.4.12) y FortiGate San Juan (`172.29.70.1`).
- **Core Rosario:** Concentrado en `CORE01 Dell N4032` con uplinks hacia `CORE02`, `CORE03 Aruba 1930`, Edificio Blanco (`D01`), Edificio Gris y Galpón 01 (`DIS01`).
- **VLANs Confirmadas:**
  - `VLAN 10`: Infraestructura de Red
  - `VLAN 15`: DMZ
  - `VLAN 20`: Monitoreo (Zabbix y sondas)
  - `VLAN 70`: Management Servidores / Virtualización
  - `VLAN 71`: Management Redes / Switches
  - `VLAN 80`: Red de Backup (Veeam / Storage)
  - `VLAN 100 - 104`: Segmentos de Usuarios
  - `VLAN 215 - 216`: Redes Inalámbricas (WiFi Aruba)

---

## 7. Estándar de Tags para Creación de Hosts (*Tag-Driven Alerting*)

Al crear o editar cualquier host en Zabbix, es mandatario aplicar los tags según su rol tecnológico:
- `team`: `redes` | `plataforma` | `dba`
- `tier`: `core` | `access` | `perimeter` | `service` | `virtualization` | `facilities`
- `component`: `switch` | `server` | `firewall` | `ups` | `database`
- `scope`: `capacity` | `notice`
