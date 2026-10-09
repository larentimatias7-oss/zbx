import fs from 'fs';

function parseToolOutput(path) {
  let content = fs.readFileSync(path, 'utf8');
  const lines = content.split('\n');
  const startIdx = lines.findIndex(l => l.trim() === '[');
  return JSON.parse(lines.slice(startIdx).join('\n'));
}

const hosts = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/984/output.txt');
const triggers = parseToolOutput('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/cc9dd136-6a4b-4468-890d-48b93061f177/.system_generated/steps/998/output.txt');

const enabledHosts = hosts.filter(h => h.status === '0');

// Group triggers by hostid
const hostTriggers = {};
triggers.forEach(t => {
  const h = t.hosts?.[0];
  if (!h) return;
  if (!hostTriggers[h.hostid]) hostTriggers[h.hostid] = [];
  hostTriggers[h.hostid].push(t);
});

function detectSede(h) {
  const name = (h.name || h.host || '').toUpperCase();
  const ip = h.interfaces?.[0]?.ip || '';
  if (name.includes('SSJ') || name.includes('SAN JUAN') || ip.startsWith('172.29.')) return 'SSJ';
  if (name.startsWith('FTG_AR-') || name.includes('OBRADOR') || name.includes('MINERA') || name.includes('CAMPAMENTO') || name.includes('VELADERO') || name.includes('JOSEMARIA') || name.includes('GUACOLDA') || name.includes('ACUEDUCTO') || name.includes('SAL DE VIDA') || name.includes('ALUMBRERA')) return 'OBRADOR';
  return 'SRO';
}

function detectTier(h) {
  const name = (h.name || h.host || '').toUpperCase();
  if (name.includes('CORE') || name.includes('BORDER')) return 'Core';
  if (name.startsWith('FTG_')) return 'Perimeter';
  if (name.includes('DIS')) return 'Distribution';
  if (name.includes('ACC') || name.startsWith('SW ') || name.startsWith('AP ') || name.includes('P2P')) return 'Access';
  if (name.includes('STO') || name.includes('NAS')) return 'Storage';
  if (name.includes('SQL') || name.includes('SAPR')) return 'Database';
  if (name.includes('VCENTER') || name.includes('HPV')) return 'Virtualization';
  if (name.includes('UPS')) return 'Facilities';
  return 'Service';
}

const categories = ['web', 'api', 'cpu', 'memory', 'disk', 'network', 'dns', 'cert', 'vpn', 'mail', 'backup', 'replication'];

function categorizeTrigger(desc) {
  const d = desc.toLowerCase();
  if (d.includes('unavailable by icmp') || d.includes('ping') || d.includes('host is unavailable') || d.includes('http service')) return 'web';
  if (d.includes('zabbix agent') || d.includes('service') || d.includes('process')) return 'api';
  if (d.includes('cpu') || d.includes('processor')) return 'cpu';
  if (d.includes('memory') || d.includes('swap') || d.includes('ram')) return 'memory';
  if (d.includes('disk') || d.includes('space') || d.includes('datastore') || d.includes('fs [') || d.includes('filesystem')) return 'disk';
  if (d.includes('vpn') || d.includes('tunnel') || d.includes('sd-wan') || d.includes('packet') || d.includes('packets loss')) return 'vpn';
  if (d.includes('interface') || d.includes('link') || d.includes('ethernet') || d.includes('flapping') || d.includes('speed') || d.includes('duplex') || d.includes('bandwidth')) return 'network';
  if (d.includes('time') || d.includes('ntp') || d.includes('dns') || d.includes('sync')) return 'dns';
  if (d.includes('temperature') || d.includes('tpm') || d.includes('snmp data collection') || d.includes('sin monitoreo snmp') || d.includes('certificate') || d.includes('cert')) return 'cert';
  if (d.includes('mail') || d.includes('smtp') || d.includes('exchange')) return 'mail';
  if (d.includes('backup')) return 'backup';
  if (d.includes('ha') || d.includes('replication') || d.includes('cluster')) return 'replication';
  return 'network'; // default
}

function priorityToSevName(pri) {
  if (pri >= 5) return 'disaster';
  if (pri === 4) return 'high';
  if (pri === 3) return 'average';
  if (pri === 2) return 'warning';
  if (pri === 1) return 'info';
  return 'ok';
}

function determinePLevel(pri) {
  if (pri >= 4) return '🚨 P1 Crítico (0m Inmediato)';
  if (pri === 3) return '⚠️ P2 Redes/Plataforma (10m delay)';
  if (pri === 2) return '📋 P3 Preventivo (30m delay)';
  return 'ℹ️ P3 Informativo';
}

function determineTg(pri) {
  if (pri >= 4) return '🚨 Alertas P1 CRITICAS (-1004383937012)';
  return '📋 Alertas General (-1004396424523)';
}

const fullHostList = enabledHosts.map(h => {
  const hostid = h.hostid;
  const name = h.name || h.host;
  const sede = detectSede(h);
  const tier = detectTier(h);
  const trs = hostTriggers[hostid] || [];

  // Default cells based on host type
  const isNet = tier === 'Access' || tier === 'Core' || tier === 'Distribution' || tier === 'Perimeter' || tier === 'Facilities';
  const isStorage = tier === 'Storage';
  const isSrv = !isNet && !isStorage;

  const cells = {
    web: 'ok',
    api: isSrv ? 'ok' : 'empty',
    cpu: isNet && tier === 'Access' ? 'empty' : 'ok',
    memory: isNet && tier === 'Access' ? 'empty' : 'ok',
    disk: isNet ? 'empty' : 'ok',
    network: 'ok',
    dns: isSrv || tier === 'Core' || tier === 'Perimeter' ? 'ok' : 'empty',
    cert: isSrv || tier === 'Perimeter' || tier === 'Facilities' ? 'ok' : 'empty',
    vpn: tier === 'Perimeter' || tier === 'Core' ? 'ok' : 'empty',
    mail: isSrv ? 'empty' : 'empty',
    backup: isSrv || isStorage ? 'ok' : 'empty',
    replication: isStorage || tier === 'Virtualization' || tier === 'Database' ? 'ok' : 'empty'
  };

  const details = {};

  trs.forEach(t => {
    const pri = parseInt(t.priority);
    const cat = categorizeTrigger(t.description);
    const sev = priorityToSevName(pri);
    const p_level = determinePLevel(pri);
    const tg = determineTg(pri);

    // If current cell is empty or has lower severity, upgrade it
    const sevPriority = { disaster: 5, high: 4, average: 3, warning: 2, info: 1, ok: 0, empty: -1 };
    if (!cells[cat] || sevPriority[sev] > (sevPriority[cells[cat]] || 0)) {
      cells[cat] = sev;
      details[cat] = {
        sev: pri,
        text: `${sev.toUpperCase()}: ${t.description}`,
        p_level,
        tg
      };
    }
  });

  return {
    name,
    hostid,
    sede,
    tier,
    maint: false,
    cells,
    details
  };
});

console.log('Total processed hosts:', fullHostList.length);
const byS = { SRO: 0, SSJ: 0, OBRADOR: 0 };
fullHostList.forEach(h => byS[h.sede]++);
console.log('Count by Sede:', byS);

const degraded = fullHostList.filter(h => Object.keys(h.details).length > 0);
console.log('Total degraded hosts:', degraded.length);

console.log('\n--- ALL SSJ HOSTS DETAIL ---');
fullHostList.filter(h => h.sede === 'SSJ').forEach(h => {
  console.log(`[${h.hostid}] ${h.name} (${h.tier}):`, JSON.stringify(h.cells));
  if (Object.keys(h.details).length > 0) {
    console.log('   Problems:', JSON.stringify(h.details));
  }
});
