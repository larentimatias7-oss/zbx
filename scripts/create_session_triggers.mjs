import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ps = 'Add-Type -AssemblyName System.Security; $cipher = [IO.File]::ReadAllBytes(\'C:\\\\ProgramData\\\\Milicic\\\\Zabbix\\\\codex_audit_token.bin\'); $plainBytes = [Security.Cryptography.ProtectedData]::Unprotect($cipher, [Text.Encoding]::UTF8.GetBytes(\'Milicic-Zabbix-Audit-v1\'), [Security.Cryptography.DataProtectionScope]::LocalMachine); [Text.Encoding]::UTF8.GetString($plainBytes)';
const token = execSync('powershell.exe -NoProfile -Command "' + ps + '"', { encoding: 'utf8' }).trim();

async function zabbixRequest(method, params) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const req = https.request({
      hostname: 'zabbix.mlccnet.local',
      port: 443,
      path: '/api_jsonrpc.php',
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== 1. VERIFICANDO HOST Y ITEM DE SESIONES ===');
  const hosts = await zabbixRequest('host.get', {
    filter: { host: 'FTG_milicic_border1_SNMP' },
    selectItems: ['itemid', 'name', 'key_']
  });

  if (!hosts.result || hosts.result.length === 0) {
    throw new Error('Host FTG_milicic_border1_SNMP no encontrado');
  }

  const host = hosts.result[0];
  const hostId = host.hostid;
  const sessionItem = host.items.find(i => i.key_ === 'net.ipv4.sessions[fgSysSesCount.0]');
  if (!sessionItem) {
    throw new Error('Item net.ipv4.sessions[fgSysSesCount.0] no encontrado en FTG_milicic_border1_SNMP');
  }

  console.log(`Host: ${host.host} (ID: ${hostId})`);
  console.log(`Item: ${sessionItem.name} (ID: ${sessionItem.itemid}, Key: ${sessionItem.key_})`);

  console.log('\n=== 2. VERIFICANDO SI YA EXISTE EL TRIGGER ===');
  const triggerNameWarn = 'FTG_milicic_border1_SNMP: Sesiones concurrentes elevadas (>18.000 sesiones)';
  const triggerNameHigh = 'FTG_milicic_border1_SNMP: Saturación crítica de sesiones concurrentes (>22.000 sesiones)';

  const existing = await zabbixRequest('trigger.get', {
    hostids: [hostId],
    filter: { description: [triggerNameWarn, triggerNameHigh] },
    output: ['triggerid', 'description', 'status', 'priority']
  });

  const createdTriggers = [];

  // Trigger 1: Warning (> 18.000)
  const existWarn = existing.result.find(t => t.description === triggerNameWarn);
  if (existWarn) {
    console.log(`Trigger Warning ya existe (ID: ${existWarn.triggerid})`);
  } else {
    console.log(`Creando Trigger Warning: ${triggerNameWarn}...`);
    const tPayload = {
      description: triggerNameWarn,
      expression: `min(/FTG_milicic_border1_SNMP/net.ipv4.sessions[fgSysSesCount.0], 5m) > 18000`,
      recovery_mode: 1,
      recovery_expression: `max(/FTG_milicic_border1_SNMP/net.ipv4.sessions[fgSysSesCount.0], 5m) < 16000`,
      priority: 2, // Warning (P3 Preventivo)
      opdata: 'Sesiones actuales: {ITEM.LASTVALUE1}',
      comments: 'Detección de sobrecarga de sesiones concurrentes en el firewall de borde Rosario. Supera el baseline histórico diurno (+25%). Posible incremento fuerte de tráfico, escaneo de red masivo o tarea no planificada.',
      tags: [
        { tag: 'team', value: 'redes' },
        { tag: 'tier', value: 'perimeter' },
        { tag: 'component', value: 'firewall' },
        { tag: 'scope', value: 'capacity' }
      ]
    };
    const cRes = await zabbixRequest('trigger.create', tPayload);
    if (cRes.error) throw new Error(JSON.stringify(cRes.error));
    const newId = cRes.result.triggerids[0];
    console.log(`-> Trigger Warning creado con TriggerID: ${newId}`);
    createdTriggers.push({ triggerid: newId, description: triggerNameWarn, priority: 2 });
  }

  // Trigger 2: High / Disaster (> 22.000)
  const existHigh = existing.result.find(t => t.description === triggerNameHigh);
  if (existHigh) {
    console.log(`Trigger High ya existe (ID: ${existHigh.triggerid})`);
  } else {
    console.log(`Creando Trigger Crítico: ${triggerNameHigh}...`);
    const tPayload = {
      description: triggerNameHigh,
      expression: `min(/FTG_milicic_border1_SNMP/net.ipv4.sessions[fgSysSesCount.0], 3m) > 22000`,
      recovery_mode: 1,
      recovery_expression: `max(/FTG_milicic_border1_SNMP/net.ipv4.sessions[fgSysSesCount.0], 5m) < 18000`,
      priority: 4, // High (P1 Crítico - Telegram Alertas P1)
      opdata: 'Sesiones actuales: {ITEM.LASTVALUE1}',
      comments: 'ALERTA CRÍTICA: Volumen anormal de sesiones concurrentes en Borde Central Rosario (+45% sobre histórico). Alto riesgo de saturación de tabla de estados o ataque de denegación de servicio (DDoS/SYN flood). Inspeccionar FortiView y top sources inmediatamente.',
      tags: [
        { tag: 'team', value: 'redes' },
        { tag: 'tier', value: 'perimeter' },
        { tag: 'component', value: 'firewall' },
        { tag: 'scope', value: 'availability' }
      ]
    };
    const cRes = await zabbixRequest('trigger.create', tPayload);
    if (cRes.error) throw new Error(JSON.stringify(cRes.error));
    const newId = cRes.result.triggerids[0];
    console.log(`-> Trigger High creado con TriggerID: ${newId}`);
    createdTriggers.push({ triggerid: newId, description: triggerNameHigh, priority: 4 });
  }

  // Guardar archivo de Rollback
  const rollbackPath = 'c:\\zabbix_anti\\.zabbix_context\\rollback_fortigate_session_triggers.json';
  const rollbackData = {
    created_at_utc: new Date().toISOString(),
    host: 'FTG_milicic_border1_SNMP',
    hostid: hostId,
    itemid: sessionItem.itemid,
    created_triggers: createdTriggers
  };
  fs.writeFileSync(rollbackPath, JSON.stringify(rollbackData, null, 2), 'utf8');
  console.log(`\nArchivo de rollback guardado en: ${rollbackPath}`);
}

main().catch(console.error);
