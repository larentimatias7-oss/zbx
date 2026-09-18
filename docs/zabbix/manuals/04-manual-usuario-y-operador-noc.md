# Manual de Usuario y Operador NOC: Zabbix 7.0 LTS (Milicic)

- **Plataforma:** Zabbix Enterprise Monitoring Platform
- **Entorno:** Producción (`prod` - `https://zabbix.mlccnet.local`)
- **Público:** Operadores NOC, Ingenieros de Mesa de Ayuda y Guardias de Infraestructura
- **Organización:** Milicic S.A.

---

## 1. Acceso a la Consola y Navegación Básica

1. Ingrese mediante su navegador web a: [`https://zabbix.mlccnet.local`](https://zabbix.mlccnet.local).
2. Inicie sesión con sus credenciales corporativas asignadas.
3. El menú lateral izquierdo se organiza en las secciones principales:
   - **Dashboards:** Vistas consolidadas y tableros en tiempo real.
   - **Monitoring:**
     - `Problems`: Lista viva de todos los incidentes activos y resueltos.
     - `Hosts`: Estado de salud, interfaces y disponibilidad de cada dispositivo.
     - `Latest data`: Explorador de métricas y gráficos históricos bajo demanda.
     - `Maps`: Topología de red y diagramas de interconexión.
   - **Services:** Monitoreo de disponibilidad SLA / SLO.
   - **Alerts:** Auditoría de acciones ejecutadas y registro de despachos a Telegram.

---

## 2. Operación de Dashboards: Tablero "NOC - Core Network" (ID: 410)

Para los operadores de telecomunicaciones y redes, se encuentra disponible el tablero de alta resolución:
* **Acceso Directo:** [`https://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=410`](https://zabbix.mlccnet.local/zabbix.php?action=dashboard.view&dashboardid=410)
* **Visualización:**
  - **Panel Izquierdo:** Estado y disponibilidad de todos los Switches Core y de Distribución de la compañía.
  - **Panel Superior Derecho:** Incidentes activos exclusivos de la infraestructura de red con severidad `>= Average`.
  - **Panel Inferior Derecho:** Gráficas de tráfico en tiempo real de los uplinks y enlaces troncales más congestionados.

---

## 3. Gestión y Ciclo de Vida de Incidentes (*Problems*)

Al ingresar a `Monitoring -> Problems`:

```
+---------------------------------------------------------------------------------------------------+
| Time          | Severity | Recovery | Status   | Host          | Problem                   | Ack  |
| 14:40:27      | HIGH     | -        | PROBLEM  | SRO-SW-CORE01 | Link down: Te1/0/1        | No   |
+---------------------------------------------------------------------------------------------------+
```

### 3.1. Reconocimiento de un Problema (*Acknowledge*)
Cuando un operador toma conocimiento de una alerta y comienza a trabajar en ella, debe registrarlo en Zabbix para informar al resto del equipo y evitar duplicidad de esfuerzos:

1. Haga clic sobre la columna **Ack / No** del incidente.
2. En la ventana emergente:
   - **Message:** Ingrese un comentario breve (ej: `Tomado por Guardia NOC. Revisando fibra con datacenter`).
   - **Acknowledge:** Marque la casilla para confirmar que el problema está siendo atendido.
   - **Severity change (Opcional):** Si tras el diagnóstico se determina que el impacto es mayor o menor, puede reclasificar la severidad.
   - **Suppress (Opcional):** Permite silenciar el incidente temporalmente (ej. `Suppress for 2 hours`).
3. Haga clic en **Update**.

El estado cambiará a **Yes** en verde, y cualquier operador que ingrese verá el historial de comentarios y la persona responsable.

---

## 4. Programación de Ventanas de Mantenimiento

> [!TIP]
> Programar una ventana de mantenimiento **evita que salgan alertas a los canales de Telegram de guardia** durante intervenciones planificadas, manteniendo la recolección de métricas intacta.

### Procedimiento Paso a Paso:
1. Diríjase a `Data collection -> Maintenance periods -> Create maintenance period`.
2. Pestaña **Maintenance period**:
   - **Name:** Indique una convención descriptiva: `MANT-[SEDE]-[EQUIPO]-[MOTIVO]` (ej: `MANT-SRO-CORE01-UPGRADE-FIRMWARE`).
   - **Maintenance type:** Seleccione **`With data collection`** (fundamental para no perder el histórico de CPU y tráfico durante el trabajo).
   - **Active since / Active till:** Defina el día de inicio y finalización del período.
3. Pestaña **Periods**:
   - Haga clic en **Add** para establecer la ventana horaria (ej: `One time only`, Fecha: Sábado, Horario: 01:00 a 05:00).
4. Pestaña **Hosts and groups**:
   - En **Hosts**, busque y agregue el o los equipos que serán intervenidos (o el Host Group completo si aplica).
5. Haga clic en **Add** para guardar.

Durante el mantenimiento, los problemas en esos equipos mostrarán un ícono de herramienta naranja en la consola, y **ninguna alerta será despachada a Telegram**.

---

## 5. Rotación de Personal de Guardia

Para cambiar qué personas reciben las alertas en sus teléfonos:
1. Ingrese a `Users -> User groups`.
2. Localice el grupo correspondiente:
   - **`Alertas-Guardia-P1` (ID: 15):** Guardias 24/7 de incidentes críticos.
   - **`Alertas-NOC-Redes` (ID: 16):** Especialistas de redes.
   - **`Alertas-SRE-Plataforma` (ID: 17):** Especialistas de servidores y bases de datos.
3. Haga clic sobre el grupo, vaya a la pestaña **Users**, agregue o remueva los usuarios según la rotación de la semana.
4. Haga clic en **Update**.
