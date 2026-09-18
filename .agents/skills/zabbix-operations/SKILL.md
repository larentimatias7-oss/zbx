---
name: zabbix-operations
description: >-
  Estándares operativos, diagnóstico y automatización para Zabbix Monitoring y Zabbix MCP Server en Milicic.
  Úsalo cuando interactúes con la API de Zabbix, configures hosts, plantillas SNMP, acciones de escalamiento,
  medios de notificación (Telegram, Email, Webhooks), o resuelvas incidentes de monitoreo de infraestructura.
---

# Skill: Operaciones y Estándares Zabbix - Milicic

Esta skill define las directivas, flujos y comandos estándar para administrar, consultar y diagnosticar el ecosistema de monitoreo Zabbix corporativo (`https://zabbix.mlccnet.local`) mediante la API oficial y herramientas MCP.

---

## 1. Arquitectura de Monitoreo y Acceso MCP

```
                                  ┌───────────────────────────────┐
                                  │   Zabbix Server / Frontend    │
                                  │   zabbix.mlccnet.local        │
                                  │   IP: 172.30.20.61            │
                                  └──────────────▲────────────────┘
                                                 │ HTTPS / JSON-RPC
                                                 │
                                  ┌──────────────┴────────────────┐
                                  │   Zabbix MCP Server (WSL)     │
                                  │   127.0.0.1:8080 (/mcp)       │
                                  │   127.0.0.1:9090 (Admin UI)   │
                                  └──────────────▲────────────────┘
                                                 │ Bearer Token
                                                 │
                                  ┌──────────────┴────────────────┐
                                  │       Antigravity Agent       │
                                  │       (zabbix MCP tools)      │
                                  └───────────────────────────────┘
```

- **Servidor Zabbix:** `https://zabbix.mlccnet.local` (IP: `172.30.20.61`, SNI obligatorio).
- **Zabbix MCP Server:** Servicio local en WSL (`/opt/zabbix-mcp/venv/bin/zabbix-mcp-server`), escuchando en el puerto local `8080` para MCP y `9090` para portal de administración.
- **Resolución de Nombres en WSL:** El entorno WSL debe contar con la entrada `172.30.20.61 zabbix.mlccnet.local` en `/etc/hosts` para alcanzar la API a través del túnel VPN.

---

## 2. Herramientas MCP y Comprobación de Salud

Antes de ejecutar consultas o modificaciones masivas:
1. **Verificar Salud del Conector:**
   - Ejecutar `health_check` en el servidor `zabbix`.
   - Si `server_1` o `production` retorna error, verificar que la entrada de DNS `/etc/hosts` en WSL esté presente y que la VPN esté activa.
2. **Consultas Seguras (`get`):**
   - Utilizar herramientas dedicadas (`host_get`, `problem_get`, `alert_get`, `mediatype_get`, `user_get`, `action_get`).
   - Para parámetros avanzados (`selectOperations`, `selectMedias`, `selectInterfaces`), emplear el diccionario `extra_params`.

---

## 3. Matriz de Severidades y Modelo de Alertas (P1, P2, P3)

El sistema de alertas de Milicic utiliza supresión de flapping y escalamiento progresivo por persistencia:

| Nivel | Severidad Zabbix | Demora de Escalamiento | Destinatarios (Grupos de Usuarios) | Canales | Objetivo Operativo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1 - Crítico** | `Disaster`, `High` | **Inmediato (0 min)** | `Alertas-Guardia-P1` (ID: 15) | Telegram (`Telegram_Test`, `Telegram_Test_Milicic`) | Caída total de sedes, fallas de core switches, hipervisores caídos. |
| **P2 - Redes** | `High`, `Average` | **10 minutos** | `Alertas-NOC-Redes` (ID: 16) | Telegram | Caída de enlaces redundantes, SD-WAN Health check dead, switches de acceso. |
| **P2 - Plataforma** | `High`, `Average` | **10 minutos** | `Alertas-SRE-Plataforma` (ID: 17) | Telegram | Servicios críticos de SO detenidos, degradación de VMs o bases de datos. |
| **P3 - Preventivo** | `Average`, `Warning` | **30 minutos** | `Alertas-NOC-Redes` y `Alertas-SRE-Plataforma` | Telegram | Espacio en disco > 85%, temperatura elevada, desincronización horaria NTP. |

> [!IMPORTANT]
> Los eventos transitorios que se resuelven antes de la ventana de persistencia (10 min en P2, 30 min en P3) **no generan ruido en los canales de Telegram**. Si un incidente se resuelve luego de notificado, Zabbix envía un mensaje de recuperación (*EVENTO RECUPERADO*).

---

## 4. Estándar Corporativo para Creación de Hosts

Al dar de alta nuevos activos en Zabbix:

### A. Nomenclatura del Host
- **Formato:** `<SEDE>-<TIPO_DISPOSITIVO>-<IDENTIFICADOR>`
  - Sedes: `SRO` (Rosario), `SSJ` (San Juan), `SER` (Sede Entre Ríos / Central), `AR-###` (Campamentos/Obras).
  - Ejemplos válidos: `SRO-E02-PB00-CORE02`, `SSJ-SWADM`, `SRO-SQL01`, `FTG_milicic_border1_HTTP`.

### B. Asignación de Interfaces y Protocolos
- **Switches y Routers:** Interfaz tipo **SNMP** (puerto 161, versión SNMPv2c).
- **Firewalls FortiGate:** Plantilla dual o SNMP (puerto 161).
- **Servidores Linux / Windows:** Interfaz tipo **Agent** (puerto 10050) utilizando Zabbix Agent 2.
- **Equipos sin agente:** Interfaz tipo **Agent** o **SNMP** asociada a la plantilla `ICMP Ping`.

### C. Plantillas Oficiales Aprobadas
- Switches Dell Networking: `Dell N-Series by SNMP` (ID: 10721).
- Firewalls Fortinet: `FortiGate by SNMP` (ID: 10604) o `FortiGate by HTTP` (ID: 10603).
- Servidores Windows: `Windows by Zabbix agent 2`.
- Servidores Linux: `Linux by Zabbix agent`.
- UPS y Energía: `Template Network Generic Device by SNMP` o plantilla del fabricante.

### D. Macros Requeridas
- Comunidad SNMP Global: `{$SNMP_COMMUNITY} = public` (o sobreescribir a nivel de host si el equipo utiliza una comunidad protegida).
- Umbral de disco crítico: `{$VFS.FS.PUSED.MAX.CRIT} = 90`.
- Umbral de disco advertencia: `{$VFS.FS.PUSED.MAX.WARN} = 80`.

---

## 5. Procedimiento para Canales de Telegram

### Requisitos Mandatorios de Telegram:
1. **Membresía del Bot:** Un bot de Telegram **no puede enviar mensajes** a un grupo ni canal a menos que haya sido añadido previamente como miembro o administrador con permisos de publicación.
2. **Formato de Chat ID:**
   - Grupos estándar: número negativo simple (ej. `-5468713329`).
   - Supergrupos y Canales: número negativo **con prefijo `-100`** (ej. `-1005468713329`).
   - Si se omite el prefijo en un supergrupo o si el bot no está agregado, Telegram responde con el error fatal `Sending failed: Bad Request: chat not found`.

### Lista de Bots Corporativos:
- **`Telegram_Test` (ID: 71):** `@inframilicic_bot` (Token: `8899338410:...`)
- **`Telegram_Test_Milicic` (ID: 72):** `@Milicic_bot` (Token: `8666455955:...`)

### Vinculación de Alertas a Usuarios:
Para que un usuario reciba las alertas P1, P2 y P3 en Telegram:
1. El usuario debe tener configurado en su perfil de Zabbix (`Users -> Media`) el medio correspondiente (`Telegram_Test` o `Telegram_Test_Milicic`) con el `Send to` configurado con el Chat ID validado.
2. El usuario debe ser miembro de los grupos de destinatarios:
   - `Alertas-Guardia-P1` (ID: 15)
   - `Alertas-NOC-Redes` (ID: 16)
   - `Alertas-SRE-Plataforma` (ID: 17)
