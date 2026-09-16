# Zabbix MCP Server Integration for Antigravity

Integración configurada para el servidor MCP de Zabbix ([initMAX/zabbix-mcp-server](https://github.com/initMAX/zabbix-mcp-server)).

## Detalles de Conexión

- **URL del MCP Server:** `http://127.0.0.1:8080/mcp`
- **Admin Portal:** `http://127.0.0.1:9090`
- **Transporte:** Native Streamable HTTP
- **Token MCP:** `zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e`

## Configuración (`mcp_config.json`)

```json
{
  "mcpServers": {
    "zabbix": {
      "serverUrl": "http://127.0.0.1:8080/mcp",
      "headers": {
        "Authorization": "Bearer zmcp_6673ac9995fe59ae960e5597530912bdebdd76bbf56e6e1007ac6755a9eb545e"
      }
    }
  }
}
```

Archivos configurados:
- [`.agents/mcp_config.json`](file:///c:/zabbix_anti/.agents/mcp_config.json)
- [`mcp_config.json`](file:///c:/zabbix_anti/mcp_config.json)
- [`.agents/plugins/zabbix/mcp_config.json`](file:///c:/zabbix_anti/.agents/plugins/zabbix/mcp_config.json)
- [`.vscode/mcp.json`](file:///c:/zabbix_anti/.vscode/mcp.json)
- `~/.gemini/config/mcp_config.json`
