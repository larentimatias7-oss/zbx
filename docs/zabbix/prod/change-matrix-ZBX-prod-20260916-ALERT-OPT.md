# Matriz de Cambios: ZBX-prod-20260916-ALERT-OPT

- **Change ID:** `ZBX-prod-20260916-ALERT-OPT`
- **Entorno:** Producción (`prod`)
- **Fecha de Aplicación:** 16 de Septiembre de 2026
- **Responsable:** Ingeniero Principal de Observabilidad & SRE
- **Criterio de Aceptación:** 100% de cambios aplicados y verificados contra API de Zabbix 7.0 LTS.

---

## 1. Matriz de Cambios Aplicados (Antes vs Después)

| Ref ID | Componente / Entidad | Configuración Anterior (Antes) | Configuración Nueva (Después) | Estado | Evidencia de Validación |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **CHG-01** | **User Groups (RBAC)** | No existían grupos dedicados de notificación de alertas. | Creados 3 grupos: `Alertas-Guardia-P1` (`15`), `Alertas-NOC-Redes` (`16`), `Alertas-SRE-Plataforma` (`17`) con 27 permisos de lectura. | **APLICADO** | `usergroup.get` -> IDs `15`, `16`, `17` confirmados con miembros y permisos. |
| **CHG-02** | **TG-P1-Crítico (Action 8)** | • `opmessage_usr`: `Admin` (ID: 1)<br>• `opmessage_grp`: `[]`<br>• `Problem is not suppressed`: Ausente. | • `opmessage_usr`: `[]`<br>• `opmessage_grp`: `Alertas-Guardia-P1` (`15`)<br>• `Problem is not suppressed`: Activo (`conditiontype: 16`). | **APLICADO** | `action.get` -> `actionid: 8`, fórmula `A and B`, `status: 0`. |
| **CHG-03** | **TG-P2-Redes (Action 9)** | • 4 Switches Core hardcodeados (`10708`, `10722`, `10724`, `10711`)<br>• Enrutado a `Admin`<br>• Sin condición 16. | • Desacoplado con tags `team: redes` AND `tier: core`<br>• Enrutado a `Alertas-NOC-Redes` (`16`)<br>• `Problem is not suppressed` activo. | **APLICADO** | `action.get` -> `actionid: 9`, fórmula `(A or B or (C and D)) and E and F`, `status: 0`. |
| **CHG-04** | **TG-P2-Plataforma (Action 10)** | • Host `SRO-SQL01` (`10784`) hardcodeado<br>• Regex frágil `MSSQL$`<br>• 4 triggers de UPS hardcodeados (`35418`, `35421`, `36459`, `36462`)<br>• Enrutado a `Admin`. | • Desacoplado con tags `team: plataforma`, `team: dba`, `component: ups`<br>• Enrutado a `Alertas-SRE-Plataforma` (`17`)<br>• `Problem is not suppressed` activo. | **APLICADO** | `action.get` -> `actionid: 10`, fórmula con tags, 0 triggers individuales, `status: 0`. |
| **CHG-05** | **TG-P3-Preventivo (Action 11)** | • 6 Triggers hardcodeados de temperatura y NTP (`34396`, `34660`, `35051`, `32912`, `33005`, `33484`)<br>• Regex `Space is low` y `No SNMP`<br>• Enrutado a `Admin`. | • Filtrado dinámico por tags `scope: capacity` y `scope: notice`<br>• Enrutado a grupos `16` y `17`<br>• `Problem is not suppressed` activo. | **APLICADO** | `action.get` -> `actionid: 11`, fórmula `(A or B) and (C or D or E or F) and G and H`, `status: 0`. |
| **CHG-06** | **Tags en Hosts Clave** | Hosts sin etiquetas operacionales estandarizadas de equipo y rol. | Aplicados tags `team: redes`, `tier: core`, `component: switch` en Core Switches; `team: dba`, `tier: core` en SQL; `team: plataforma` en Servidores y UPS. | **APLICADO** | `host.get` con `selectTags: extend` -> Tags verificados en hosts 10708, 10722, 10724, 10711, 10784, 10801, 10819, 10699, 10701, 10702. |
| **CHG-07** | **Host SRO-APP04 (10783)** | Host Windows inalcanzable (`172.30.15.67:10050`) activo en monitoreo (`status: 0`), saturando pollers. | Deshabilitado (`status: 1`), cancelando reintentos cíclicos de conexión de agente. | **APLICADO** | `host.get` -> `{"hostid": "10783", "status": "1"}`. |
| **CHG-08** | **Zabbix Server Macro (10084)** | Sin macro contextual de pollers. Umbral por defecto al 75% provocando flapping constante (trigger `13485`). | Creada macro a nivel de host: `{$ZABBIX.SERVER.UTIL.MAX:"unreachable poller"}` = `90` (ID: `8308`). | **APLICADO** | `usermacro.get` -> `hostmacroid: 8308`, valor `90`, descripción registrada. |
| **CHG-09** | **Switch Acceso SRO-ACC01 (10796)** | Sin macro `{$IFCONTROL}`. Los 48 puertos de puestos de trabajo evaluaban a 1, disparando alertas de Link down al desconectar PCs. | • Macro base `{$IFCONTROL}` = `0` (ID: `8309`)<br>• Macros específicas `= 1` para LAGs 1-2 y uplinks GE1/0/49 a 52 (IDs: `8310` a `8315`). | **APLICADO** | `usermacro.get` -> 7 macros verificadas en host `10796`. |
| **CHG-10** | **Switch Acceso SW Ed Gris (10797)** | Sin macro `{$IFCONTROL}`. Mismo ruido masivo de desconexión de puestos de usuario. | • Macro base `{$IFCONTROL}` = `0` (ID: `8316`)<br>• Macros específicas `= 1` para LAG 1 y uplinks GE1/0/49 a 52 (IDs: `8317` a `8321`). | **APLICADO** | `usermacro.get` -> 6 macros verificadas en host `10797`. |

---

## 2. Resumen Estadístico de Cambios

- **Total Operaciones de Cambio Planificadas:** 10
- **Total Operaciones Aplicadas con Éxito:** 10 (100%)
- **Operaciones Rechazadas:** 0 (0%)
- **Operaciones Pendientes:** 0 (0%)
- **Operaciones Desconocidas / Dudosas:** 0 (0%)
- **Nivel de Éxito de la Ventana de Cambio:** **100% EXITOSO**
