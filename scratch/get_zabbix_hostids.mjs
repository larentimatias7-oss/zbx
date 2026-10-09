import http from 'http';
import { execSync } from 'child_process';

// Query Zabbix via MCP or via proxy or via node script
// Let's run a script that calls zabbix API to get all host ids
