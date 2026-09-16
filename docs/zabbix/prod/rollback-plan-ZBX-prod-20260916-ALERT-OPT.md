# Plan de Reversión (Rollback Runbook): ZBX-prod-20260916-ALERT-OPT

- **Entorno:** Producción (`prod`)
- **Propósito:** Proveer los payloads JSON exactos y el procedimiento secuencial para restaurar el estado previo de Zabbix 7.0 LTS en caso de emergencia operacional.
- **Nivel de Automatización:** **MANUAL**. No debe ser ejecutado automáticamente por herramientas ni agentes de documentación.

---

## 1. Procedimiento Secuencial de Reversión

La reversión debe ejecutarse en orden inverso a la implementación (Fase 4 -> Fase 3 -> Fase 2 -> Fase 1):

```
[Paso 1: Reversión de Macros y Host SRO-APP04]
                  ↓
[Paso 2: Reversión de Actions P3, P2-Plataforma, P2-Redes]
                  ↓
[Paso 3: Reversión de Action TG-P1-Crítico]
                  ↓
[Paso 4: Eliminación de User Groups 15, 16, 17]
```

---

## 2. Payloads JSON de Reversión Paso a Paso

### PASO 1: Reversión de Estabilización de Flapping (Fase 4)

#### A. Habilitar nuevamente SRO-APP04
Método API: `host.update`
```json
{
  "hostid": "10783",
  "status": 0
}
```

#### B. Eliminar macro de Zabbix Server
Método API: `usermacro.delete`
```json
[
  "8308"
]
```

#### C. Eliminar macros de switches Comware
Método API: `usermacro.delete`
```json
[
  "8309", "8310", "8311", "8312", "8313", "8314", "8315",
  "8316", "8317", "8318", "8319", "8320", "8321"
]
```

---

### PASO 2: Reversión de Actions P3 y P2 (Fases 2 y 3)

#### A. Restaurar TG-P3-Preventivo (ID: 11)
Restaura los 6 triggers hardcodeados, los filtros frágiles de texto y el destinatario `Admin`:
Método API: `action.update`
```json
{
  "actionid": "11",
  "evaltype": 3,
  "formula": "((A or B or C or D or E or F or (G and H and I)) and J) or (K and J)",
  "conditions": [
    { "conditiontype": 2, "operator": 0, "value": "34396", "formulaid": "A" },
    { "conditiontype": 2, "operator": 0, "value": "34660", "formulaid": "B" },
    { "conditiontype": 2, "operator": 0, "value": "35051", "formulaid": "C" },
    { "conditiontype": 2, "operator": 0, "value": "32912", "formulaid": "D" },
    { "conditiontype": 2, "operator": 0, "value": "33005", "formulaid": "E" },
    { "conditiontype": 2, "operator": 0, "value": "33484", "formulaid": "F" },
    { "conditiontype": 3, "operator": 2, "value": ": Space is low", "formulaid": "G" },
    { "conditiontype": 25, "operator": 0, "value": "capacity", "value2": "scope", "formulaid": "H" },
    { "conditiontype": 0, "operator": 0, "value": "27", "formulaid": "I" },
    { "conditiontype": 4, "operator": 0, "value": "2", "formulaid": "J" },
    { "conditiontype": 3, "operator": 2, "value": ": No SNMP data collection", "formulaid": "K" }
  ],
  "operations": [
    {
      "operationtype": 0,
      "esc_step_from": 2,
      "esc_step_to": 2,
      "esc_period": 0,
      "evaltype": 0,
      "opmessage": {
        "default_msg": 0,
        "subject": "{EVENT.SEVERITY}: {EVENT.NAME}",
        "message": "Problem: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nIP: {HOST.IP}\r\nTime: {EVENT.TIME} {EVENT.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ],
  "recovery_operations": [
    {
      "operationtype": 11,
      "opmessage": {
        "default_msg": 0,
        "subject": "RESOLVED: {EVENT.NAME}",
        "message": "Resolved: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nDuration: {EVENT.DURATION}\r\nTime: {EVENT.RECOVERY.TIME} {EVENT.RECOVERY.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ]
}
```

#### B. Restaurar TG-P2-Plataforma (ID: 10)
Restaura el host SQL hardcodeado, regex frágil y 4 triggers de UPS:
Método API: `action.update`
```json
{
  "actionid": "10",
  "evaltype": 3,
  "formula": "(A or B or C or D or E or ((F or G) and H) or (I and J) or K or L or M or N) and O",
  "conditions": [
    { "conditiontype": 0, "operator": 0, "value": "29", "formulaid": "A" },
    { "conditiontype": 0, "operator": 0, "value": "32", "formulaid": "B" },
    { "conditiontype": 0, "operator": 0, "value": "33", "formulaid": "C" },
    { "conditiontype": 0, "operator": 0, "value": "7", "formulaid": "D" },
    { "conditiontype": 0, "operator": 0, "value": "25", "formulaid": "E" },
    { "conditiontype": 0, "operator": 0, "value": "27", "formulaid": "F" },
    { "conditiontype": 0, "operator": 0, "value": "23", "formulaid": "G" },
    { "conditiontype": 25, "operator": 0, "value": "capacity", "value2": "scope", "formulaid": "H" },
    { "conditiontype": 1, "operator": 0, "value": "10784", "formulaid": "I" },
    { "conditiontype": 3, "operator": 2, "value": "Windows: \"MSSQL$", "formulaid": "J" },
    { "conditiontype": 2, "operator": 0, "value": "35418", "formulaid": "K" },
    { "conditiontype": 2, "operator": 0, "value": "35421", "formulaid": "L" },
    { "conditiontype": 2, "operator": 0, "value": "36459", "formulaid": "M" },
    { "conditiontype": 2, "operator": 0, "value": "36462", "formulaid": "N" },
    { "conditiontype": 4, "operator": 0, "value": "3", "formulaid": "O" }
  ],
  "operations": [
    {
      "operationtype": 0,
      "esc_step_from": 2,
      "esc_step_to": 2,
      "esc_period": 0,
      "evaltype": 0,
      "opmessage": {
        "default_msg": 0,
        "subject": "{EVENT.SEVERITY}: {EVENT.NAME}",
        "message": "Problem: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nIP: {HOST.IP}\r\nTime: {EVENT.TIME} {EVENT.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ],
  "recovery_operations": [
    {
      "operationtype": 11,
      "opmessage": {
        "default_msg": 0,
        "subject": "RESOLVED: {EVENT.NAME}",
        "message": "Resolved: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nDuration: {EVENT.DURATION}\r\nTime: {EVENT.RECOVERY.TIME} {EVENT.RECOVERY.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ]
}
```

#### C. Restaurar TG-P2-Redes (ID: 9)
Restaura los 4 switches Core hardcodeados:
Método API: `action.update`
```json
{
  "actionid": "9",
  "evaltype": 3,
  "formula": "(A or B or C or D or E or F) and G",
  "conditions": [
    { "conditiontype": 0, "operator": 0, "value": "44", "formulaid": "A" },
    { "conditiontype": 0, "operator": 0, "value": "42", "formulaid": "B" },
    { "conditiontype": 1, "operator": 0, "value": "10708", "formulaid": "C" },
    { "conditiontype": 1, "operator": 0, "value": "10722", "formulaid": "D" },
    { "conditiontype": 1, "operator": 0, "value": "10724", "formulaid": "E" },
    { "conditiontype": 1, "operator": 0, "value": "10711", "formulaid": "F" },
    { "conditiontype": 4, "operator": 0, "value": "3", "formulaid": "G" }
  ],
  "operations": [
    {
      "operationtype": 0,
      "esc_step_from": 2,
      "esc_step_to": 2,
      "esc_period": 0,
      "evaltype": 0,
      "opmessage": {
        "default_msg": 0,
        "subject": "{EVENT.SEVERITY}: {EVENT.NAME}",
        "message": "Problem: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nIP: {HOST.IP}\r\nTime: {EVENT.TIME} {EVENT.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ],
  "recovery_operations": [
    {
      "operationtype": 11,
      "opmessage": {
        "default_msg": 0,
        "subject": "RESOLVED: {EVENT.NAME}",
        "message": "Resolved: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nDuration: {EVENT.DURATION}\r\nTime: {EVENT.RECOVERY.TIME} {EVENT.RECOVERY.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ]
}
```

---

### PASO 3: Reversión de Action TG-P1-Crítico (Fase 1)

Método API: `action.update`
```json
{
  "actionid": "8",
  "evaltype": 0,
  "conditions": [
    { "conditiontype": 4, "operator": 5, "value": "4" }
  ],
  "operations": [
    {
      "operationtype": 0,
      "esc_step_from": 1,
      "esc_step_to": 1,
      "esc_period": 0,
      "evaltype": 0,
      "opmessage": {
        "default_msg": 0,
        "subject": "{EVENT.SEVERITY}: {EVENT.NAME}",
        "message": "Problem: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nIP: {HOST.IP}\r\nTime: {EVENT.TIME} {EVENT.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ],
  "recovery_operations": [
    {
      "operationtype": 11,
      "opmessage": {
        "default_msg": 0,
        "subject": "RESOLVED: {EVENT.NAME}",
        "message": "Resolved: {EVENT.NAME}\r\nSeverity: {EVENT.SEVERITY}\r\nHost: {HOST.NAME}\r\nDuration: {EVENT.DURATION}\r\nTime: {EVENT.RECOVERY.TIME} {EVENT.RECOVERY.DATE}",
        "mediatypeid": "71"
      },
      "opmessage_usr": [{ "userid": "1" }],
      "opmessage_grp": []
    }
  ]
}
```

---

### PASO 4: Eliminación de User Groups (Opcional)

Si se desea desmantelar los grupos creados:
Método API: `usergroup.delete`
```json
[
  "15",
  "16",
  "17"
]
```

---

## 3. Verificación Post-Reversión

Tras aplicar los pasos anteriores, ejecutar:
1. `action.get` para validar que `opmessage_usr` vuelve a apuntar a `Admin` y que `conditions` no contienen la condición 16.
2. `host.get` para validar que `SRO-APP04` regresa a `status: 0`.
3. `usermacro.get` para confirmar que las macros de host creadas ya no existen.
