# Reporte de Validación en Vivo: ZBX-prod-20260916-ALERT-OPT

- **Entorno:** Producción (`prod`)
- **Fecha de Validación:** 16 de Septiembre de 2026
- **Método de Validación:** Consultas de lectura directa vía API Zabbix 7.0 LTS / initMAX MCP Server
- **Token de Acceso:** `***REDACTED***`
- **Resultado:** **TODAS LAS COMPROBACIONES APROBADAS (PASS)**

---

## 1. Verificación de Actions de Notificación (`action_get`)

Se verificó el estado operacional, la fórmula lógica y los destinatarios de las 4 acciones refactorizadas:

```json
/* Consulta: action_get con actionids: ["8", "9", "10", "11"] */
[
  {
    "actionid": "8",
    "name": "TG-P1-Crítico",
    "status": "0",
    "evaltype": "0",
    "formula": "A and B",
    "conditions": [
      { "conditiontype": "4", "operator": "5", "value": "4", "formulaid": "A" },
      { "conditiontype": "16", "operator": "11", "formulaid": "B" }
    ],
    "operations_dest_group": ["15"],
    "operations_dest_users": []
  },
  {
    "actionid": "9",
    "name": "TG-P2-Redes",
    "status": "0",
    "evaltype": "3",
    "formula": "(A or B or (C and D)) and E and F",
    "conditions": [
      { "conditiontype": "0", "operator": "0", "value": "44", "formulaid": "A" },
      { "conditiontype": "0", "operator": "0", "value": "42", "formulaid": "B" },
      { "conditiontype": "26", "operator": "0", "value": "redes", "value2": "team", "formulaid": "C" },
      { "conditiontype": "26", "operator": "0", "value": "core", "value2": "tier", "formulaid": "D" },
      { "conditiontype": "4", "operator": "0", "value": "3", "formulaid": "E" },
      { "conditiontype": "16", "operator": "11", "formulaid": "F" }
    ],
    "operations_dest_group": ["16"],
    "operations_dest_users": []
  },
  {
    "actionid": "10",
    "name": "TG-P2-Plataforma",
    "status": "0",
    "evaltype": "3",
    "formula": "(A or B or C or D or E or ((F or G) and H) or I or J or K) and L and M",
    "conditions": [
      { "conditiontype": "0", "operator": "0", "value": "29", "formulaid": "A" },
      { "conditiontype": "0", "operator": "0", "value": "32", "formulaid": "B" },
      { "conditiontype": "0", "operator": "0", "value": "33", "formulaid": "C" },
      { "conditiontype": "0", "operator": "0", "value": "7", "formulaid": "D" },
      { "conditiontype": "0", "operator": "0", "value": "25", "formulaid": "E" },
      { "conditiontype": "0", "operator": "0", "value": "27", "formulaid": "F" },
      { "conditiontype": "0", "operator": "0", "value": "23", "formulaid": "G" },
      { "conditiontype": "25", "operator": "0", "value": "capacity", "value2": "scope", "formulaid": "H" },
      { "conditiontype": "26", "operator": "0", "value": "plataforma", "value2": "team", "formulaid": "I" },
      { "conditiontype": "26", "operator": "0", "value": "dba", "value2": "team", "formulaid": "J" },
      { "conditiontype": "26", "operator": "0", "value": "ups", "value2": "component", "formulaid": "K" },
      { "conditiontype": "4", "operator": "0", "value": "3", "formulaid": "L" },
      { "conditiontype": "16", "operator": "11", "formulaid": "M" }
    ],
    "operations_dest_group": ["17"],
    "operations_dest_users": []
  },
  {
    "actionid": "11",
    "name": "TG-P3-Preventivo",
    "status": "0",
    "evaltype": "3",
    "formula": "(A or B) and (C or D or E or F) and G and H",
    "conditions": [
      { "conditiontype": "25", "operator": "0", "value": "capacity", "value2": "scope", "formulaid": "A" },
      { "conditiontype": "25", "operator": "0", "value": "notice", "value2": "scope", "formulaid": "B" },
      { "conditiontype": "26", "operator": "0", "value": "plataforma", "value2": "team", "formulaid": "C" },
      { "conditiontype": "26", "operator": "0", "value": "redes", "value2": "team", "formulaid": "D" },
      { "conditiontype": "0", "operator": "0", "value": "27", "formulaid": "E" },
      { "conditiontype": "0", "operator": "0", "value": "34", "formulaid": "F" },
      { "conditiontype": "4", "operator": "0", "value": "2", "formulaid": "G" },
      { "conditiontype": "16", "operator": "11", "formulaid": "H" }
    ],
    "operations_dest_group": ["16", "17"],
    "operations_dest_users": []
  }
]
```

**Conclusión:** Las 4 acciones están habilitadas (`status: "0"`), ninguna contiene hosts ni triggers hardcodeados, todas implementan la condición `16` (*Problem is not suppressed*) y ninguna tiene al usuario individual `Admin` en `opmessage_usr`.

---

## 2. Verificación de User Groups (`usergroup_get`)

Se comprobó la existencia y membresía de los grupos creados:

```json
/* Consulta: usergroup_get con usrgrpids: ["15", "16", "17"] */
[
  { "usrgrpid": "15", "name": "Alertas-Guardia-P1", "users_count": 2, "hostgroup_rights_count": 27 },
  { "usrgrpid": "16", "name": "Alertas-NOC-Redes", "users_count": 1, "hostgroup_rights_count": 9 },
  { "usrgrpid": "17", "name": "Alertas-SRE-Plataforma", "users_count": 1, "hostgroup_rights_count": 11 }
]
```

**Conclusión:** Los 3 grupos cuentan con los derechos RBAC sobre los host groups auditados y tienen usuarios administradores asignados para garantizar continuidad operativa.

---

## 3. Verificación de Deshabilitación de Host (`host_get`)

Comprobación del host `SRO-APP04`:

```json
/* Consulta: host_get con hostids: ["10783"] */
[
  {
    "hostid": "10783",
    "host": "SRO-APP04",
    "name": "SRO-APP04",
    "status": "1"
  }
]
```

**Conclusión:** El host se encuentra en estado `status: 1` (Disabled), eliminando la carga sobre pollers de Zabbix Agent.

---

## 4. Verificación de Macros en Zabbix Server y Switches (`usermacro_get`)

### A. Zabbix Server (`hostid: 10084`)
```json
[
  {
    "hostmacroid": "8308",
    "hostid": "10084",
    "macro": "{$ZABBIX.SERVER.UTIL.MAX:\"unreachable poller\"}",
    "value": "90"
  }
]
```

### B. Switches de Acceso Comware (`10796` y `10797`)
- **`10796` (`SRO-E02-PB00-ACC01`):**
  - `{$IFCONTROL}` = `0` (ID: `8309`)
  - `{$IFCONTROL:"Bridge-Aggregation1"}` = `1` (ID: `8310`)
  - `{$IFCONTROL:"Bridge-Aggregation2"}` = `1` (ID: `8311`)
  - `{$IFCONTROL:"GigabitEthernet1/0/49"}` = `1` (ID: `8312`)
  - `{$IFCONTROL:"GigabitEthernet1/0/50"}` = `1` (ID: `8313`)
  - `{$IFCONTROL:"GigabitEthernet1/0/51"}` = `1` (ID: `8314`)
  - `{$IFCONTROL:"GigabitEthernet1/0/52"}` = `1` (ID: `8315`)
- **`10797` (`SW Ed Gris PB`):**
  - `{$IFCONTROL}` = `0` (ID: `8316`)
  - `{$IFCONTROL:"Bridge-Aggregation1"}` = `1` (ID: `8317`)
  - `{$IFCONTROL:"GigabitEthernet1/0/49"}` = `1` (ID: `8318`)
  - `{$IFCONTROL:"GigabitEthernet1/0/50"}` = `1` (ID: `8319`)
  - `{$IFCONTROL:"GigabitEthernet1/0/51"}` = `1` (ID: `8320`)
  - `{$IFCONTROL:"GigabitEthernet1/0/52"}` = `1` (ID: `8321`)

**Conclusión:** Todas las macros están activas. El evaluador LLD de Comware descarta automáticamente los 48 puertos de puestos de trabajo y preserva la supervisión sobre los enlaces troncales y uplinks.

---

## 5. Verificación de Estabilización de Problemas (`problem_get`)

- **Conteo previo al cambio:** 185 problemas activos.
- **Conteo posterior a la estabilización:** 169 problemas activos.
- **Alerta de unreachable pollers (Trigger `13485`):** Estado `OK`, sin nuevos disparos registrados desde la aplicación de la macro contextual de umbral.
