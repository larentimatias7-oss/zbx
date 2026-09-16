---
name: zabbix-dashboard-architect
description: Especialista en diseño, auditoría y despliegue de Dashboards en Zabbix 7.0 LTS interactuando a través del servidor initMAX Zabbix MCP. Domina el grid de 24 columnas, el esquema de widgets/fields de la API JSON-RPC, el Widget Communication Framework y el filtrado por tags operacionales.
version: 1.1.0
type: visualization-expert
---

# Zabbix Dashboard Architect Skill (initMAX MCP / Zabbix 7.0 LTS)

## 1. Conexión y Descubrimiento MCP
Esta skill opera sobre el servidor `initMAX/zabbix-mcp-server`.
Antes de realizar operaciones:
1. Identifica cómo expone el MCP los métodos de dashboard:
   - Formato directo: `dashboard_get`, `dashboard_create`, `dashboard_update`, `dashboard_delete`.
   - O formato RPC genérico: herramienta de invocación de métodos con `method: "dashboard.<operacion>"`.
2. Para cualquier creación de dashboards, **siempre obtén primero un dashboard existente como plantilla** usando:
   ```json
   {
     "output": "extend",
     "selectPages": "extend",
     "limit": 1
   }
   ```
   Esto garantiza extraer la sintaxis exacta de `widgets.fields` que valida el Zabbix Server 7.0.22 en producción.

## 2. Especificación Técnica de Layout (Zabbix 7.0)
- **Grid:** 24 columnas (`x`: 0 a 23).
- **Estructura de Widgets en API (`pages -> widgets`):**
  Cada widget dentro de una página requiere:
  - `type`: Tipo canónico (`problems`, `svggraph`, `honeycomb`, `hostnavigator`, `gauge`, `itemhistory`, `toptriggers`, `tophosts`).
  - `name`: Título visible del widget.
  - `x`, `y`, `width`, `height`: Coordenadas enteras en el grid (suma de anchos en una fila <= 24).
  - `view_mode`: 0 (modo normal por defecto).
  - `fields`: Arreglo de pares de configuración tipados según el estándar Zabbix:
    * `type`: Tipo de dato (`0` = entero, `1` = string, `2` = hostid/itemid, `7` = tag/texto especial).
    * `name`: Nombre del parámetro (ej. `tags.tag.0`, `tags.value.0`, `show_suppressed`, `evaltype`).
    * `value`: Valor asignado.

## 3. Integración con Taxonomía Operacional
Ningún widget debe vincular nombres o IDs fijos de hosts salvo requerimiento expreso.
Aprovechar siempre los metadatos aplicados en las fases previas:
- **Redes:** `team: redes`, `tier: core`, `tier: access`.
- **Plataforma:** `team: plataforma`, `component: ups`, `component: server`.
- **Base de Datos:** `team: dba`.
- **Supresión de Mantenimiento:** En widgets de alarmas (`problems`), asegurar siempre que los incidentes en mantenimiento no saturen el tablero (`show_suppressed = 0`).

## 4. Flujo de Trabajo Seguro (Workflow)
1. **Auditoría / Backup:** Si se va a modificar un dashboard existente, volcar su backup en `.zabbix_context/dashboards/backup_<id>.json`.
2. **Diseño Local:** Crear la especificación JSON completa en `.zabbix_context/dashboards/<nombre>.json`.
3. **Validación:** Comprobar que la suma de anchos en una fila no exceda 24 y que no haya colisiones de coordenadas `x`, `y`.
4. **Despliegue:** Ejecutar la creación o actualización a través del MCP de initMAX y reportar la URL y el `dashboardid` resultante.
