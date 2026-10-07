# Informe Técnico & Análisis Forense: Zabbix Dashboard 411 vs Grafana

**Plataforma:** Zabbix 7.0.22 LTS (`prod`) & Grafana (`172.27.210.154:3005`)  
**Dashboard Evaluado:** Zabbix ID 411 — *Security Logs 2 - Active Directory Cyber SOC & Controladores de Dominio*  
**Dashboards Destino en Grafana:**  
1. `milicic-activedirectory-soc` (*Active Directory & Cyber SOC: Identidades, Seguridad y Salud del Bosque*)  
2. `noc-zabbix-command-center` (*NOC - Zabbix Command Center*)  

---

## 1. Resumen Ejecutivo de la Evaluación

Se realizó una inspección técnica profunda del Dashboard 411 en Zabbix mediante la API oficial JSON-RPC, extrayendo su estructura de 5 páginas, la telemetría asociada a los 3 Controladores de Dominio corporativos (`SRO-DCO01`, `SRO-DCO02`, `SSJ-DCO01`) y el historial real de eventos forenses en producción.

### Arquitectura de Páginas del Dashboard 411:
| Página | Nombre | Widgets | Rol Operativo |
| :--- | :--- | :---: | :--- |
| **Pág 1** | **Seguridad & Auditoría de Identidades (Cyber SOC)** | 9 | Vista ejecutiva SOC: Bloqueos de cuenta, fallos NTLM vs Kerberos, navegación interactiva multi-DC y auditoría de grupos. |
| **Pág 2** | **Salud del Bosque & Matriz Multi-DC** | 10 | Monitoreo de servicios vitales AD DS (NTDS, DNS, KDC, Netlogon, DFSR, W32Time), desvío NTP y alertas activas. |
| **Pág 3** | **DC01: SRO-DCO01 (Rosario - Primario / FSMO)** | 11 | Vista de host detallada: Ping, Uptime, CPU, RAM, Disco C:, Red e incidentes. |
| **Pág 4** | **DC02: SRO-DCO02 (Rosario - Secundario)** | 11 | Vista de host detallada idéntica para DC02. |
| **Pág 5** | **DC03: SSJ-DCO01 (San Juan - Sucursal)** | 11 | Vista de host detallada para el DC regional en San Juan. |

---

## 2. Análisis Específico de los Widgets Forenses Solicitados

### A. Historial Forense de Bloqueos (Event 4740) — Usuario & Equipo Origen
* **Widget Zabbix:** ID `87112`, tipo `itemhistory` (Page 1, pos `x=20, y=9, w=38, h=5`).
* **Cómo funciona en Zabbix:**
  - Ítem Maestro: `eventlog[Security,,,,4740,,skip]` (ID `83274` en DCO01 / ID `96712` en DCO02).
  - Ítems Dependientes con Preprocesamiento Regex nativo:
    * `locked.user` (ID `83820` en DCO01 / ID `96714` en DCO02): Extrae el campo `Account That Was Locked Out -> Account Name`.
    * `locked.pc` (ID `83821` en DCO01 / ID `96715` en DCO02): Extrae el campo `Caller Computer Name`.
  - El widget muestra una tabla de dos columnas: `Usuario Bloqueado` y `Equipo Origen` con las últimas 50 ocurrencias (ventana `now-7d` a `now`).
* **Evidencia Real de Producción:**
  Se verificaron bloqueos reales recientes:
  - Cuenta `Administrador`: intentos y bloqueos desde puestos internos (`NB-2000001829`, `NB-2000001727`, `NB-2000001585`, `NB-2000001845`, `NB-2000001306`, `PC-100001992`, `PC-100002057` y servidor `SRO-APP01`).
  - Cuentas de usuarios: `jorge.calvo` (`NB-M200000096`), `daniela.puentes` (`NB-2000001168`), `laureano.oliva` (`NB-2000001808`), `emiliano.ruarte` (`NB-2000001661`), `lorena.fernandez` (`NB-M200000088`).

---

### B. Auditoría Forense: Modificación de Grupos Privilegiados (Event IDs 4728 / 4732 / 4756)
* **Widget Zabbix:** ID `87114`, tipo `itemhistory` (Page 1, pos `x=0, y=14, w=72, h=6`).
* **Cómo funciona en Zabbix:**
  - Consulta directamente el ítem `eventlog[Security,,,,4728|4732|4756,,skip]` (ID `96736` en DCO01 / ID `96737` en DCO02).
  - **Limitación en Zabbix:** Se muestra como un volcado de texto continuo truncado a 120 caracteres en dos columnas separadas por DC. No divide por Operador, Grupo ni Miembro.
* **Evidencia Real de Producción & Extracción Lograda:**
  Al consultar el histórico Zabbix y aplicar el motor de parsing forense, se reconstruyó la siguiente tabla cronológica estructurada:

| Fecha / Hora | Controlador | Acción | Grupo Privilegiado | Miembro Afectado / Usuario | Operador Responsable |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `2026-10-06 14:43:18` | `SRO-DCO02` | ➕ Añadido | `ACL-SAP` | Carlos Ramos | `mllarenti.itadmin` |
| `2026-10-06 14:42:18` | `SRO-DCO02` | ➕ Añadido | `ACL-SAP` | Franco Diaz | `mllarenti.itadmin` |
| `2026-10-06 12:35:31` | `SRO-DCO01` | ➕ Añadido | `ACL-FileServer` | Fabricio Cristian Funes | `saarriola.itadmin` |
| `2026-10-06 12:35:31` | `SRO-DCO01` | ➕ Añadido | `ACL-SAP` | Fabricio Cristian Funes | `saarriola.itadmin` |
| `2026-10-05 17:56:30` | `SRO-DCO01` | ➕ Añadido | `ACL-SAP` | Mirta Griselda Cabral | `fjmartin.adadmin` |
| `2026-10-05 17:56:30` | `SRO-DCO01` | ➕ Añadido | `ACL-SAP` | Cristian Rafael De Buono | `fjmartin.adadmin` |
| `2026-10-05 16:03:18` | `SRO-DCO02` | ➕ Añadido | `AUXILIAR_ADMINISTRACION` | Renata Gentiletti | `mllarenti.itadmin` |
| `2026-10-05 16:03:18` | `SRO-DCO02` | ➕ Añadido | `ACL-SAP` | Renata Gentiletti | `mllarenti.itadmin` |
| `2026-10-05 16:02:18` | `SRO-DCO02` | ➕ Añadido | `09.Gastos-Generales-RW` | Renata Gentiletti | `mllarenti.itadmin` |
| `2026-10-05 16:02:18` | `SRO-DCO02` | ➕ Añadido | `18.ADMINS_EX` | Renata Gentiletti | `mllarenti.itadmin` |
| `2026-10-05 16:02:18` | `SRO-DCO02` | ➕ Añadido | `ACL-FileServer` | Renata Gentiletti | `mllarenti.itadmin` |
| `2026-10-05 16:02:18` | `SRO-DCO02` | ➕ Añadido | `08.GASTOS_GENERALES_RO` | Renata Gentiletti | `mllarenti.itadmin` |
| `2026-10-05 16:02:18` | `SRO-DCO02` | ➕ Añadido | `EntraID AD Sync` | Renata Gentiletti | `mllarenti.itadmin` |

---

## 3. Estado Actual de Grafana y Brechas Detectadas

En Grafana ya se encuentra disponible el tablero:  
👉 **`Active Directory & Cyber SOC: Identidades, Seguridad y Salud del Bosque`** (`/d/milicic-activedirectory-soc/9ea775c`).

### Diagnóstico de los paneles 60 y 61 en dicho tablero:
1. **Panel 60 (`🔒 Historial de Bloqueos de Cuenta`):**
   - Consulta el ítem maestro `Eventlog by Zabbix agent: User locked` en crudo en vez de los ítems ya normalizados (`locked.user` y `locked.pc`).
   - Muestra el texto completo sin separar columnas de Usuario y Equipo.
2. **Panel 61 (`👥 Modificación de Grupos Privilegiados`):**
   - Consulta el log crudo en una única columna: *"Detalle de Modificación (Operador · Miembro Afectado · Grupo)"*.
   - No desglosa quién realizó la acción, qué miembro fue incorporado y a qué grupo afectó.
3. **Controlador de San Juan (`SSJ-DCO01`):**
   - Posee los ítems maestros de eventos (ID `101379` y `101382`), pero carece de los ítems dependientes normalizados que ya tienen `SRO-DCO01` y `SRO-DCO02`.

---

## 4. Plan de Acción y Propuesta de Implementación

### Fase 1: Creación de Dependent Items en Zabbix (Gobernanza y Normalización)
Siguiendo las mejores prácticas de Zabbix 7.0 LTS y Tag-Driven Architecture:
1. **Bajo el ítem de Grupos (`96736` en DCO01 y `96737` en DCO02):**
   - `group.operator` (*Operador Responsable*): Regex `Subject:[\s\S]*?Account Name:\s+([^\r\n]+)` -> `\1`.
   - `group.name` (*Grupo Modificado*): Regex `Group:[\s\S]*?Group Name:\s+([^\r\n]+)` -> `\1`.
   - `group.member` (*Miembro Añadido/Removido*): Regex `Member:[\s\S]*?Account Name:\s+(?:CN=)?([^,\r\n]+)` -> `\1`.
   - `group.action` (*Tipo de Operación*): Regex `^([^\r\n]+)` -> `\1`.
2. **En `SSJ-DCO01`:**
   - Crear los ítems dependientes `locked.user` y `locked.pc` bajo el ítem maestro `101379` para paridad completa multi-sitio.

### Fase 2: Rediseño de Paneles en Grafana
1. **Actualizar el dashboard dedicado `/d/milicic-activedirectory-soc/`:**
   - **Panel 60 (Bloqueos de Cuenta):** Tabla multi-columna ordenada cronológicamente con:
     `Fecha / Hora` | `Controlador DC` | `Usuario Bloqueado` (badge) | `Equipo / Host Origen` (badge monospace) | `Estado Forense`
   - **Panel 61 (Modificación de Grupos Privilegiados):** Tabla ejecutiva forense con:
     `Fecha / Hora` | `Controlador DC` | `Acción (➕ Añadido / ➖ Removido)` | `Grupo Privilegiado` | `Miembro Afectado` | `Operador Responsable`
2. **Enriquecer `/d/noc-zabbix-command-center/`:**
   - Agregar una sección colapsable o tarjeta resumen de Cyber SOC con contadores de Bloqueos 24h, Cambios de Grupos 24h y enlace directo con navegación contextual al dashboard forense de Active Directory.
