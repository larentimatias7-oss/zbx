---
name: grafana-mcp-tools
description: >-
  Guía oficial de Grafana Labs para interactuar con el servidor MCP mcp-grafana.
  Cubre categorías de herramientas, RBAC, gestión de contexto y mejores prácticas.
version: 1.5.1
type: tool-guide
---

# Grafana MCP Server (Official Grafana Labs Standard)

Servidor MCP oficial (`uvx mcp-grafana`) que expone las herramientas de la API de Grafana. Soporta Grafana 9.0+ local y Grafana Cloud.

## Configuración y Variables de Entorno

| Variable | Descripción |
|---|---|
| `GRAFANA_URL` | URL de la instancia de Grafana (`http://172.27.210.154:3005`) |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | Token de Service Account (cuenta `Ant-Local`, rol Admin) |
| `GRAFANA_ORG_ID` | ID de organización (por defecto `1`) |

## Categorías de Herramientas MCP Disponibles

### Dashboards
- `search_dashboards`: Búsqueda de tableros por título, carpeta o tags.
- `get_dashboard_summary`: Resumen compacto del dashboard (preferido sobre el JSON completo para no saturar contexto).
- `get_dashboard_by_uid`: JSON completo del dashboard (usar solo cuando se requiera editar la estructura entera).
- `update_dashboard`: Crear o actualizar un tablero completo enviando la definición JSON.
- `patch_dashboard`: Modificaciones acotadas sobre paneles sin reenviar todo el JSON.

### Datasources
- `list_datasources`: Listar todas las fuentes de datos configuradas.
- `get_datasource_by_uid`: Obtener configuración y metadatos del datasource (ej. `efz4nzx8r30g0c` para Zabbix).

### Folders
- `list_folders`: Listar carpetas de organización de tableros.
- `create_folder`: Crear nueva carpeta temática.

### Alerting & Annotations
- `list_alert_rules` / `get_alert_rule_by_uid`: Reglas de alerta en Grafana.
- `create_annotation`: Insertar marcas temporales en gráficos.

## Buenas Prácticas de Contexto y Seguridad
1. **Evitar volcar JSONs masivos:** Preferir `get_dashboard_summary` o `get_dashboard_panel_queries` antes de descargar dashboards de gran tamaño.
2. **Validación de Datasource:** Siempre referenciar el UID del datasource (`efz4nzx8r30g0c`) para evitar que los paneles queden desconectados.
3. **Persistencia Local:** Guardar siempre una copia del JSON generado en `.zabbix_context/dashboards/` para trazabilidad y versionado.
