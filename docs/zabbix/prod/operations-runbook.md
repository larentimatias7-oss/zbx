# Guía de Operación SRE & Runbook: Zabbix 7.0 LTS

- **Change ID:** `ZBX-prod-20260916-ALERT-OPT`
- **Entorno:** Producción (`prod` - `http://zabbix.mlccnet.local/`)
- **Público Objetivo:** Ingenieros NOC, Administradores de Plataforma y Guardias SRE

---

## 1. Alta de Nuevos Dispositivos sin Modificar Actions (Tag-Driven Alerting)

Gracias a la arquitectura desacoplada implementada en las Fases 1 a 3, **nunca se deben editar las Actions (`TG-P1`, `TG-P2`, `TG-P3`)** al incorporar nuevos equipos. La integración al flujo de alertas se realiza automáticamente mediante la asignación de Tags en la creación o edición del Host.

### Matriz de Tags Requeridos

Al dar de alta un host en Zabbix (`Configuration -> Hosts -> Create host`), asigne los tags según el rol tecnológico:

| Tipo de Equipo | Tag `team` | Tag `tier` | Tag `component` | Host Groups Recomendados | Flujo de Alerta Asignado |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Switch Core o Distribución** | `redes` | `core` | `switch` | `switch`, `Network` | • P1 si Severidad >= High<br>• P2-Redes si Severidad Average |
| **Switch de Acceso** | `redes` | `access` | `switch` | `switch` | • P1 si Severidad >= High<br>• P3-Preventivo si Warning |
| **Servidor Windows / Linux** | `plataforma` | `core` / `service` | `server` / `app-server` | `Windows_Server` | • P1 si Severidad >= High<br>• P2-Plataforma si Average |
| **Hipervisor (ESXi / Hyper-V)** | `plataforma` | `virtualization` | `hypervisor` | `Hypervisors` | • P1 si Severidad >= High<br>• P2-Plataforma si Average |
| **Servidor SQL Server** | `dba` | `core` | `database` | `Databases`, `Windows_Server` | • P1 si Severidad >= High<br>• P2-Plataforma si Average |
| **Sistema UPS** | `plataforma` | `facilities` | `ups` | `UPS` | • P1 si Severidad >= High<br>• P2-Plataforma si Average |
| **Firewall FortiGate** | `redes` | `perimeter` | `firewall` | `FortiGate`, `FortiWorld` | • P1 si Severidad >= High<br>• P2-Redes si Average |

---

## 2. Gestión de Guardias y Rotación de Operadores

Las alertas ya no se envían a usuarios individuales (`Admin`). Para agregar, rotar o remover personal de guardia:

1. Ingrese a la consola web de Zabbix: `Administration -> User groups`.
2. Seleccione el grupo correspondiente:
   - **`Alertas-Guardia-P1` (`usrgrpid: 15`):** Recibe todas las alertas críticas (`High` y `Disaster`) de cualquier equipo.
   - **`Alertas-NOC-Redes` (`usrgrpid: 16`):** Recibe alertas `Average` de switches, firewalls, enlaces y APs.
   - **`Alertas-SRE-Plataforma` (`usrgrpid: 17`):** Recibe alertas `Average` de SO, almacenamiento, bases de datos y UPS.
3. En la pestaña **Users**, agregue o quite los usuarios deseados.
4. Haga clic en **Update**.

> [!IMPORTANT]
> Los usuarios asignados deben contar con el medio de notificación correspondiente configurado en su perfil de usuario (`Administration -> Users -> [Usuario] -> Media`) y habilitado para el horario de su turno.

---

## 3. Gestión de Ventanas de Mantenimiento sin Alertas a Telegram

Todas las acciones de notificación tienen activa la condición `Problem is not suppressed` (`conditiontype: 16`, `operator: 11`). Esto significa que Zabbix continúa recopilando datos y detectando problemas internamente, pero **suprime de forma automática cualquier notificación hacia Telegram** mientras dure el mantenimiento.

### Procedimiento para Programar una Ventana de Mantenimiento:
1. Vaya a `Configuration -> Maintenance periods -> Create maintenance period`.
2. Configure:
   - **Name:** Ej: `MANT-SRO-CORE01-FW-UPGRADE`
   - **Maintenance type:** `With data collection` (Recomendado: mantiene métricas y gráficos activos).
   - **Active since / Active till:** Rango de fecha y hora planificado.
3. En la pestaña **Periods**, defina el horario exacto (ej. sábado 02:00 a 06:00).
4. En la pestaña **Hosts and groups**, seleccione los hosts o host groups que intervendrán.
5. Haga clic en **Add**.

Durante la ventana, los problemas aparecerán en el Dashboard de Zabbix con un icono de llave inglesa naranja (indicando problema suprimido), pero ningún mensaje será despachado al canal de Telegram ni perturbará a la guardia.

---

## 4. Control de Interfaces de Red en Switches Comware (`{$IFCONTROL}`)

En los switches HP Comware con template `HP Comware HH3C by SNMP`, el descubrimiento automático LLD genera triggers de `Link down` para cada puerto.

Para evitar falsos positivos provocados por puestos de trabajo (PCs que se apagan al final del día laboral):
- **Macro base:** `{$IFCONTROL}` = `0` a nivel de host. (Silencia todos los puertos por defecto).
- **Macro específica de Uplink:** Para cada interfaz troncal, fibra o enlace a Core, agregue una macro con el nombre exacto de la interfaz:
  - `{$IFCONTROL:"Bridge-Aggregation1"}` = `1`
  - `{$IFCONTROL:"GigabitEthernet1/0/49"}` = `1`
  - `{$IFCONTROL:"GigabitEthernet1/0/50"}` = `1`

### Procedimiento para Habilitar una Nueva Interfaz Crítica:
1. Vaya a `Configuration -> Hosts -> [Switch de Acceso] -> Macros`.
2. Haga clic en **Add**.
3. Macro: `{$IFCONTROL:"<Nombre_Exacto_Interfaz>"}` (ej: `{$IFCONTROL:"GigabitEthernet1/0/48"}`).
4. Value: `1`.
5. Description: `Uplink hacia servidor crítico / Switch distribución`.
6. Haga clic en **Update**.

---

## 5. Tablero Operativo de Red: Dashboard "NOC - Core Network" (ID: 410)

Se ha desplegado un dashboard de alta resolución diseñado específicamente para los operadores e ingenieros de redes en Zabbix 7.0 LTS:

- **Acceso Directo:** [`http://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=410`](http://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=410)
- **Visibilidad:** Tablero Público (`private: 0`), visible en el menú principal `Monitoring -> Dashboards`.
- **Permisos de Edición:** Concedidos al grupo `Alertas-NOC-Redes` (`usrgrpid: 16`), con acceso de solo lectura para `Alertas-SRE-Plataforma` (`17`) y `Alertas-Guardia-P1` (`15`).

### Arquitectura de Layout en Grid de 72 Unidades (24 Columnas Visuales):

```
+------------------------------------+------------------------------------------------------------------------+
|                                    |  Incidentes Activos - Core Network (>= Average)                        |
|  Switches Core & Distribución      |  (Ancho: 48 / Alto: 5 - Tags: team:redes, tier:core, Supresión activa)  |
|  (team: redes, tier: core)         +------------------------------------------------------------------------+
|                                    |  Tráfico de Red - Interfaces Troncales & Uplinks                       |
|  (Ancho: 24 / Alto: 10)            |  (Ancho: 48 / Alto: 5 - SRO-E02-PB00-CORE* Bits sent/received)         |
+------------------------------------+------------------------------------------------------------------------+
```

1. **Columna Izquierda (Host Navigator):**
   - Agrupa los switches del backbone (`SRO-E02-PB00-CORE01`, `CORE02`, `CORE03` y `SRO-E01-P00-D01`) mediante filtrado dinámico por tags operacionales.
   - Proporciona navegación instantánea y conteo de incidentes por host.
2. **Columna Derecha Superior (Problems):**
   - Filtra alarmas de impacto operacional (`Average`, `High`, `Disaster`).
   - Posee activa la supresión de mantenimiento (`show_suppressed = 0`) para evitar distracciones durante ventanas programadas.
3. **Columna Derecha Inferior (SVG Graph):**
   - Monitoreo en tiempo real de bits recibidos y transmitidos en interfaces troncales agregadas y SFPs.

