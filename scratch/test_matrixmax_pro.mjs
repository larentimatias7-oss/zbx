import fs from 'fs';

// Complete dataset for Milicic Hosts with Sede, Tier, and HostID
const milicicProHosts = [
  {
    name: 'AP PAÑOL', hostid: '10807', sede: 'SRO', tier: 'Access', maint: false,
    cells: { web: 'disaster', api: 'empty', cpu: 'empty', memory: 'empty', disk: 'empty', network: 'high', dns: 'ok', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      web: { sev: 5, text: 'Disaster: Host is unavailable by ICMP ping', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' },
      network: { sev: 4, text: 'High: Aruba AP uplink port down', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' }
    }
  },
  {
    name: 'FTG_ar-368-acueducto', hostid: '10774', sede: 'OBRADOR', tier: 'Perimeter', maint: false,
    cells: { web: 'disaster', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'high', dns: 'ok', cert: 'empty', vpn: 'high', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      web: { sev: 5, text: 'Disaster: Host is unavailable by ICMP ping', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' },
      network: { sev: 4, text: 'High: Obradores link down', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' },
      vpn: { sev: 4, text: 'High: IPSec tunnel disconnected', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' }
    }
  },
  {
    name: 'FTG_ar-376-veladero', hostid: '10776', sede: 'OBRADOR', tier: 'Perimeter', maint: false,
    cells: { web: 'disaster', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'high', dns: 'ok', cert: 'empty', vpn: 'high', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      web: { sev: 5, text: 'Disaster: Host is unavailable by ICMP ping', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' },
      network: { sev: 4, text: 'High: Minera Veladero uplink down', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' },
      vpn: { sev: 4, text: 'High: IPSec tunnel disconnected', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' }
    }
  },
  {
    name: 'vCenter', hostid: '10680', sede: 'SRO', tier: 'Virtualization', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'high', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      disk: { sev: 4, text: 'High: VMware Datastore free space < 10%', p_level: 'P1 - Crítico (Inmediato 0m)', tg: '🚨 Alertas P1' }
    }
  },
  {
    name: 'SRO-MDS01', hostid: '10782', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'average', backup: 'ok', replication: 'ok' },
    details: {
      mail: { sev: 3, text: 'Average: Zabbix agent unreachable / Service halted', p_level: 'P2 - Plataforma (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'FTG_ar-ssj-predio', hostid: '10780', sede: 'SSJ', tier: 'Perimeter', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'ok', cert: 'ok', vpn: 'average', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      network: { sev: 3, text: 'Average: Tunnel ALL_TRAFFIC Down', p_level: 'P2 - Redes (10m delay)', tg: '📋 Alertas General' },
      vpn: { sev: 3, text: 'Average: IPSec San Juan degraded', p_level: 'P2 - Redes (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'FTG_milicic_border1', hostid: '10725', sede: 'SRO', tier: 'Perimeter', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'warning', cert: 'average', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      network: { sev: 3, text: 'Average: Interface wan1 link down', p_level: 'P2 - Redes (10m delay)', tg: '📋 Alertas General' },
      dns: { sev: 2, text: 'Warning: Public DNS resolver response slow', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' },
      cert: { sev: 3, text: 'Average: Fortinet appliance cert check', p_level: 'P2 - Redes (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'FTG_ar-377-YPF', hostid: '10779', sede: 'OBRADOR', tier: 'Perimeter', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'ok', cert: 'empty', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      network: { sev: 3, text: 'Average: Interface lan1 link down', p_level: 'P2 - Redes (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'FTG_ar-372-posco', hostid: '10771', sede: 'OBRADOR', tier: 'Perimeter', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average', dns: 'ok', cert: 'empty', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      network: { sev: 3, text: 'Average: Interface lan2/lan3 link down', p_level: 'P2 - Redes (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'TP-LINK (SRO-G01-ACC01)', hostid: '10798', sede: 'SRO', tier: 'Access', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'warning', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      network: { sev: 2, text: 'Warning: Link flapping (>6 cambios/h)', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-E02-PB00-ACC01', hostid: '10796', sede: 'SRO', tier: 'Access', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'ok', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      cpu: { sev: 2, text: 'Warning: Switch temperature > 50°C', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SW Ed Gris PB', hostid: '10797', sede: 'SRO', tier: 'Access', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'warning', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      cpu: { sev: 2, text: 'Warning: Module temperature > 50°C', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' },
      network: { sev: 2, text: 'Warning: High collision count', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-G01-P100-DIS01', hostid: '10799', sede: 'SRO', tier: 'Distribution', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'ok', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      cpu: { sev: 2, text: 'Warning: Module temperature > 50°C', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-SQL01', hostid: '10786', sede: 'SRO', tier: 'Database', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'average' },
    details: {
      replication: { sev: 3, text: 'Average: MSSQL Launchpad service is not running', p_level: 'P2 - Plataforma (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-SIP01', hostid: '10790', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'average' },
    details: {
      disk: { sev: 2, text: 'Warning: C: drive space < 15%', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' },
      replication: { sev: 3, text: 'Average: LocalKdc Kerberos service stopped', p_level: 'P2 - Plataforma (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-FIL01', hostid: '10698', sede: 'SRO', tier: 'Storage', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'average', network: 'ok', dns: 'ok', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      disk: { sev: 3, text: 'Average: Volume DATOS (F:) usage > 90%', p_level: 'P2 - Plataforma (10m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-APP02', hostid: '10789', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      disk: { sev: 2, text: 'Warning: Disk C: free space < 18%', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-APP03', hostid: '10785', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      disk: { sev: 2, text: 'Warning: Disks C: & D: free space < 20%', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-DCO01', hostid: '10715', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      cert: { sev: 2, text: 'Warning: System time sync drift > 60s', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-DCO02', hostid: '10701', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      cert: { sev: 2, text: 'Warning: System time sync drift > 60s', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-SVC01', hostid: '10702', sede: 'SRO', tier: 'Service', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {
      cert: { sev: 2, text: 'Warning: System time sync drift > 60s', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'UPS E02 PA', hostid: '10802', sede: 'SRO', tier: 'Facilities', maint: true,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'warning', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {
      network: { sev: 2, text: 'Warning: SNMP monitoring unavailable (>10m)', p_level: 'P3 - Preventivo (30m delay)', tg: '📋 Alertas General' }
    }
  },
  {
    name: 'SRO-E02-CORE01', hostid: '10708', sede: 'SRO', tier: 'Core', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'ok' },
    details: {}
  },
  {
    name: 'SRO-E02-CORE02', hostid: '10722', sede: 'SRO', tier: 'Core', maint: false,
    cells: { web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'ok' },
    details: {}
  },
  {
    name: 'SSJ-HPV01', hostid: '10704', sede: 'SSJ', tier: 'Virtualization', maint: false,
    cells: { web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok', dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok' },
    details: {}
  },
  {
    name: 'SRO-UPS-DC01', hostid: '10801', sede: 'SRO', tier: 'Facilities', maint: false,
    cells: { web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok', dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty' },
    details: {}
  }
];

// Calculate systemic column summary
const categories = ['web', 'api', 'cpu', 'memory', 'disk', 'network', 'dns', 'cert', 'vpn', 'mail', 'backup', 'replication'];

const colStats = {};
categories.forEach(c => {
  colStats[c] = { total: 0, maxSev: 0, countBySev: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  milicicProHosts.forEach(h => {
    const d = h.details && h.details[c];
    if (d && d.sev > 0) {
      colStats[c].total++;
      if (d.sev > colStats[c].maxSev) colStats[c].maxSev = d.sev;
      colStats[c].countBySev[d.sev] = (colStats[c].countBySev[d.sev] || 0) + 1;
    }
  });
});

console.log('Column Stats Summary:');
console.log(JSON.stringify(colStats, null, 2));

const degradedHosts = milicicProHosts.filter(h => Object.keys(h.details || {}).length > 0);
console.log('Total Degraded Hosts:', degradedHosts.length, 'out of', milicicProHosts.length);
