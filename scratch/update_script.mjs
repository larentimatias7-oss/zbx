import fs from 'fs';

const filePath = 'scripts/build_matrixmax_dashboard.mjs';
let content = fs.readFileSync(filePath, 'utf8');

// 2. MATRIXMAX EXACT REPLICA CODE
const newMatrixSection = `// 2. MATRIXMAX EXACT COMMERCIAL REPLICA (INITMAX SCREENSHOT MATCH)
const rawMatrixContentHtml = \`
<div class="matrixmax-outer-container">
  <div class="matrixmax-toolbar">
    <div class="matrixmax-brand">
      <span class="matrixmax-title-logo">matrixMAX</span>
      <span class="matrixmax-subtitle">Matriz de Alta Densidad · 12 Categorías</span>
    </div>
    <div class="matrixmax-actions">
      <div class="matrixmax-tabs">
        <button type="button" id="tab-btn-replica" class="matrixmax-tab-btn active">🎯 Vista Réplica (Screenshot)</button>
        <button type="button" id="tab-btn-milicic" class="matrixmax-tab-btn">🏢 Milicic Producción</button>
      </div>
      <input type="text" id="matrix-search-box" class="matrixmax-search" placeholder="🔍 Filtrar host..." />
      <button type="button" id="matrix-btn-sort-sev" class="matrixmax-btn" title="Ordenar por severidad">Severidad ↓</button>
      <button type="button" id="matrix-btn-sort-name" class="matrixmax-btn" title="Ordenar por nombre">A-Z</button>
      <button type="button" id="matrix-btn-theme" class="matrixmax-btn" title="Alternar Modo Claro / Oscuro">🌓 Tema</button>
    </div>
  </div>
  <div id="matrix-table-mount" class="matrixmax-scroll-pane">
    <div style="padding: 30px; text-align: center; color: #64748B;">Cargando matriz interactiva...</div>
  </div>
  <div class="matrixmax-footer-legend">
    <span class="legend-item"><span class="cell-tile-mini ok">✓</span> OK</span>
    <span class="legend-item"><span class="cell-tile-mini info">i</span> Information</span>
    <span class="legend-item"><span class="cell-tile-mini warning">▲</span> Warning</span>
    <span class="legend-item"><span class="cell-tile-mini average">↑</span> Average</span>
    <span class="legend-item"><span class="cell-tile-mini high">!</span> High</span>
    <span class="legend-item"><span class="cell-tile-mini disaster">✕</span> Disaster</span>
    <span class="legend-item"><span class="cell-tile-mini empty"></span> Sin Control</span>
    <span class="legend-item"><span style="font-size: 13px;">🔧</span> Mantenimiento</span>
  </div>
</div>
\`;
const matrixHtml = cleanHtml(rawMatrixContentHtml);

const matrixCss = \`
.matrixmax-outer-container {
  background: #FFFFFF;
  color: #1E293B;
  border-radius: 8px;
  padding: 16px 20px 14px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  transition: background 0.2s ease, color 0.2s ease;
}
.matrixmax-outer-container.dark-theme {
  background: #0F172A;
  color: #F8FAFC;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  border: 1px solid #1E293B;
}

.matrixmax-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #E2E8F0;
}
.matrixmax-outer-container.dark-theme .matrixmax-toolbar {
  border-bottom-color: #334155;
}

.matrixmax-brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.matrixmax-title-logo {
  font-size: 20px;
  font-weight: 800;
  color: #1E3A8A;
  letter-spacing: -0.5px;
}
.matrixmax-outer-container.dark-theme .matrixmax-title-logo {
  color: #60A5FA;
}
.matrixmax-subtitle {
  font-size: 11px;
  color: #64748B;
  font-weight: 500;
}
.matrixmax-outer-container.dark-theme .matrixmax-subtitle {
  color: #94A3B8;
}

.matrixmax-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.matrixmax-tabs {
  display: flex;
  background: #F1F5F9;
  border-radius: 6px;
  padding: 2px;
  border: 1px solid #CBD5E1;
}
.matrixmax-outer-container.dark-theme .matrixmax-tabs {
  background: #1E293B;
  border-color: #334155;
}

.matrixmax-tab-btn {
  background: transparent;
  border: none;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #64748B;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.matrixmax-outer-container.dark-theme .matrixmax-tab-btn {
  color: #94A3B8;
}
.matrixmax-tab-btn.active {
  background: #FFFFFF;
  color: #0F172A;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.matrixmax-outer-container.dark-theme .matrixmax-tab-btn.active {
  background: #3B82F6;
  color: #FFFFFF;
}

.matrixmax-search {
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  color: #1E293B;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  outline: none;
  width: 140px;
  transition: all 0.15s ease;
}
.matrixmax-outer-container.dark-theme .matrixmax-search {
  background: #1E293B;
  border-color: #334155;
  color: #F8FAFC;
}
.matrixmax-search:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.matrixmax-btn {
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  color: #334155;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.matrixmax-outer-container.dark-theme .matrixmax-btn {
  background: #1E293B;
  border-color: #334155;
  color: #E2E8F0;
}
.matrixmax-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}
.matrixmax-outer-container.dark-theme .matrixmax-btn:hover {
  background: #334155;
  color: #FFFFFF;
}

.matrixmax-scroll-pane {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 520px;
  padding-bottom: 6px;
}

.matrix-table {
  border-collapse: separate;
  border-spacing: 5px 4px;
  margin: 0;
}

.th-host-corner {
  width: 130px;
  min-width: 130px;
}
.th-col-rotated {
  height: 86px;
  width: 28px;
  min-width: 28px;
  max-width: 28px;
  vertical-align: bottom;
  padding: 0;
  position: relative;
}
.th-col-text {
  transform: rotate(-45deg);
  transform-origin: left bottom;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  position: absolute;
  bottom: 8px;
  left: 10px;
  width: 90px;
  text-align: left;
}
.matrixmax-outer-container.dark-theme .th-col-text {
  color: #94A3B8;
}

.td-host {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  padding-right: 12px;
  white-space: nowrap;
  text-align: left;
  cursor: pointer;
  user-select: none;
}
.matrixmax-outer-container.dark-theme .td-host {
  color: #E2E8F0;
}
.td-host:hover {
  color: #2563EB;
  font-weight: 700;
}
.matrixmax-outer-container.dark-theme .td-host:hover {
  color: #60A5FA;
}
.maint-wrench {
  color: #F97316;
  margin-left: 4px;
  font-size: 13px;
  display: inline-block;
}

.cell-tile {
  width: 25px;
  height: 25px;
  min-width: 25px;
  min-height: 25px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
}
.cell-tile:hover {
  transform: scale(1.22);
  filter: brightness(1.1);
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  z-index: 10;
  position: relative;
}

.cell-tile.ok {
  background: #4ADE80;
  color: #FFFFFF;
}
.cell-tile.empty {
  background: transparent;
  border: 1.5px solid #CBD5E1;
  color: transparent;
}
.matrixmax-outer-container.dark-theme .cell-tile.empty {
  border-color: #334155;
}
.cell-tile.info {
  background: #60A5FA;
  color: #FFFFFF;
  font-family: serif;
  font-style: italic;
  font-weight: bold;
}
.cell-tile.warning {
  background: #FCD34D;
  color: #78350F;
  border: 1px solid #F59E0B;
}
.cell-tile.average {
  background: #FB923C;
  color: #FFFFFF;
}
.cell-tile.high {
  background: #F87171;
  color: #FFFFFF;
}
.cell-tile.disaster {
  background: #EF4444;
  color: #FFFFFF;
  animation: pulseTile 2s infinite;
}

@keyframes pulseTile {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 5px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.matrixmax-footer-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 11px;
  color: #64748B;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #E2E8F0;
  flex-wrap: wrap;
}
.matrixmax-outer-container.dark-theme .matrixmax-footer-legend {
  border-top-color: #334155;
  color: #94A3B8;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cell-tile-mini {
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
}
.cell-tile-mini.ok { background: #4ADE80; color: #FFFFFF; }
.cell-tile-mini.empty { background: transparent; border: 1.5px solid #CBD5E1; }
.cell-tile-mini.info { background: #60A5FA; color: #FFFFFF; font-family: serif; font-style: italic; }
.cell-tile-mini.warning { background: #FCD34D; color: #78350F; border: 1px solid #F59E0B; }
.cell-tile-mini.average { background: #FB923C; color: #FFFFFF; }
.cell-tile-mini.high { background: #F87171; color: #FFFFFF; }
.cell-tile-mini.disaster { background: #EF4444; color: #FFFFFF; }
\`;

const matrixAfterRender = \`
try {
  const mount = element.querySelector('#matrix-table-mount');
  const container = element.querySelector('.matrixmax-outer-container');
  if (!mount) return;

  const categories = ['web', 'api', 'cpu', 'memory', 'disk', 'network', 'dns', 'cert', 'vpn', 'mail', 'backup', 'replication'];

  const statusMap = {
    ok: { cls: 'ok', icon: '✓', name: 'OK', sev: 0 },
    empty: { cls: 'empty', icon: '', name: 'Sin Control', sev: -1 },
    info: { cls: 'info', icon: 'i', name: 'Information', sev: 1 },
    warning: { cls: 'warning', icon: '▲', name: 'Warning', sev: 2 },
    average: { cls: 'average', icon: '↑', name: 'Average', sev: 3 },
    high: { cls: 'high', icon: '!', name: 'High', sev: 4 },
    disaster: { cls: 'disaster', icon: '✕', name: 'Disaster', sev: 5 }
  };

  // DATASET A: EXACT 1:1 REPLICA OF THE SCREENSHOT PROVIDED BY USER
  const replicaHosts = [
    {
      name: 'backup-01', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'high', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'ok', backup: 'info', replication: 'ok'
      },
      details: {
        disk: 'High: Backup pool /mnt/bkp01 utilization > 92%',
        backup: 'Info: Incremental job snapshot finished with notices'
      }
    },
    {
      name: 'backup-02', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'ok', backup: 'high', replication: 'ok'
      },
      details: {
        backup: 'High: Cold storage replication sync timed out'
      }
    },
    {
      name: 'db-01', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'high', memory: 'average', disk: 'ok', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'average'
      },
      details: {
        cpu: 'High: CPU load average 8.42 (> 80%)',
        memory: 'Average: SQL Buffer pool memory commit 88%',
        replication: 'Average: Standby replica lag > 120s'
      }
    },
    {
      name: 'db-02', maint: true,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'average', disk: 'ok', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'disaster'
      },
      details: {
        memory: 'Average: High target memory allocation',
        replication: 'Disaster: Replication sync broken / WAL corrupted'
      }
    },
    {
      name: 'db-03', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'average'
      },
      details: {
        replication: 'Average: Replication delay 45s'
      }
    },
    {
      name: 'fw-01', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'average',
        dns: 'warning', cert: 'average', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        network: 'Average: Interface wan1 link state flapping',
        dns: 'Warning: DNS resolver latency > 85ms',
        cert: 'Average: Admin SSL portal certificate expires in 7 days'
      }
    },
    {
      name: 'fw-02', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'warning', mail: 'ok', backup: 'empty', replication: 'ok'
      },
      details: {
        vpn: 'Warning: IPSec Phase 2 tunnel degraded (packet drops)'
      }
    },
    {
      name: 'lb-01', maint: false,
      cells: {
        web: 'ok', api: 'high', cpu: 'high', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        api: 'High: Backend API upstream pool HTTP 502 Bad Gateway',
        cpu: 'High: Nginx worker CPU utilization 94%'
      }
    },
    {
      name: 'lb-02', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'info',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        network: 'Info: High inbound PPS on interface eth0'
      }
    },
    {
      name: 'mail-01', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'info', disk: 'warning', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'high', backup: 'ok', replication: 'ok'
      },
      details: {
        memory: 'Info: In-memory mail cache tuning recommended',
        disk: 'Warning: Mail queue partition /var/spool/mail > 82%',
        mail: 'High: Outbound SMTP relay queue stalled (450 deferred)'
      }
    },
    {
      name: 'mail-02', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'average', backup: 'ok', replication: 'empty'
      },
      details: {
        mail: 'Average: Inbound spam protection threshold reached'
      }
    },
    {
      name: 'sw-core-01', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'average',
        dns: 'ok', cert: 'ok', vpn: 'high', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        network: 'Average: Port-Channel LAG 1 member down',
        vpn: 'High: Core VRF BGP neighbor down'
      }
    },
    {
      name: 'web-01', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty',
        dns: 'ok', cert: 'average', vpn: 'ok', mail: 'ok', backup: 'ok', replication: 'ok'
      },
      details: {
        cert: 'Average: Domain certificate expires in 14 days'
      }
    },
    {
      name: 'web-02', maint: false,
      cells: {
        web: 'disaster', api: 'average', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        web: 'Disaster: Web service HTTP 500 / Service down',
        api: 'Average: Rest API latency > 1500ms'
      }
    },
    {
      name: 'web-03', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'warning', memory: 'average', disk: 'ok', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        cpu: 'Warning: CPU spikes detected > 75%',
        memory: 'Average: PHP-FPM memory pool consumed > 86%'
      }
    },
    {
      name: 'web-04', maint: false,
      cells: {
        web: 'average', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'empty',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        web: 'Average: TTFB response time > 800ms'
      }
    },
    {
      name: 'web-05', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'warning', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        cpu: 'Warning: CPU utilization > 72%'
      }
    }
  ];

  // DATASET B: MILICIC S.A. PRODUCTION HOSTS
  const milicicHosts = [
    {
      name: 'AP PAÑOL', maint: false,
      cells: {
        web: 'disaster', api: 'empty', cpu: 'empty', memory: 'empty', disk: 'empty', network: 'high',
        dns: 'ok', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        web: 'Disaster: Host is unavailable by ICMP ping',
        network: 'High: Aruba AP uplink down'
      }
    },
    {
      name: 'FTG_ar-368-acueducto', maint: false,
      cells: {
        web: 'disaster', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'high',
        dns: 'ok', cert: 'empty', vpn: 'high', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        web: 'Disaster: Host is unavailable by ICMP ping',
        network: 'High: Obradores link down',
        vpn: 'High: IPSec tunnel disconnected'
      }
    },
    {
      name: 'FTG_ar-376-veladero', maint: false,
      cells: {
        web: 'disaster', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'high',
        dns: 'ok', cert: 'empty', vpn: 'high', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        web: 'Disaster: Host is unavailable by ICMP ping',
        network: 'High: Minera Veladero uplink down',
        vpn: 'High: IPSec tunnel disconnected'
      }
    },
    {
      name: 'vCenter', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'high', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        disk: 'High: VMware Datastore free space < 10%'
      }
    },
    {
      name: 'SRO-MDS01', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'average', backup: 'ok', replication: 'ok'
      },
      details: {
        mail: 'Average: Zabbix agent unreachable / Service halted'
      }
    },
    {
      name: 'FTG_ar-ssj-predio', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average',
        dns: 'ok', cert: 'ok', vpn: 'average', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        network: 'Average: Tunnel ALL_TRAFFIC Down',
        vpn: 'Average: IPSec San Juan degraded'
      }
    },
    {
      name: 'FTG_milicic_border1', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average',
        dns: 'warning', cert: 'average', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        network: 'Average: Interface wan1 link down',
        dns: 'Warning: Public DNS resolver response slow',
        cert: 'Average: Fortinet appliance cert check'
      }
    },
    {
      name: 'FTG_ar-377-YPF', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average',
        dns: 'ok', cert: 'empty', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        network: 'Average: Interface lan1 link down'
      }
    },
    {
      name: 'FTG_ar-372-posco', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'average',
        dns: 'ok', cert: 'empty', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        network: 'Average: Interface lan2/lan3 link down'
      }
    },
    {
      name: 'TP-LINK (SRO-G01-ACC01)', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'warning',
        dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        network: 'Warning: Link flapping (>6 cambios/h)'
      }
    },
    {
      name: 'SRO-E02-ACC01 (HP PB)', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'ok',
        dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        cpu: 'Warning: Switch temperature > 50°C'
      }
    },
    {
      name: 'SW Ed Gris PB', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'warning',
        dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        cpu: 'Warning: Module temperature > 50°C',
        network: 'Warning: High collision count'
      }
    },
    {
      name: 'SRO-G01-DIS01', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'warning', memory: 'ok', disk: 'empty', network: 'ok',
        dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        cpu: 'Warning: Module temperature > 50°C'
      }
    },
    {
      name: 'SRO-SQL01', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'average'
      },
      details: {
        replication: 'Average: MSSQL Launchpad service is not running'
      }
    },
    {
      name: 'SRO-SIP01', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'average'
      },
      details: {
        disk: 'Warning: C: drive space < 15%',
        replication: 'Average: LocalKdc Kerberos service stopped'
      }
    },
    {
      name: 'SRO-FIL01', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'average', network: 'ok',
        dns: 'ok', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        disk: 'Average: Volume DATOS (F:) usage > 90%'
      }
    },
    {
      name: 'SRO-APP02', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        disk: 'Warning: Disk C: free space < 18%'
      }
    },
    {
      name: 'SRO-APP03', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'warning', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        disk: 'Warning: Disks C: & D: free space < 20%'
      }
    },
    {
      name: 'SRO-DCO01', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        cert: 'Warning: System time sync drift > 60s'
      }
    },
    {
      name: 'SRO-DCO02', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        cert: 'Warning: System time sync drift > 60s'
      }
    },
    {
      name: 'SRO-SVC01', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'warning', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {
        cert: 'Warning: System time sync drift > 60s'
      }
    },
    {
      name: 'UPS E02 PA', maint: true,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'warning',
        dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {
        network: 'Warning: SNMP monitoring unavailable (>10m)'
      }
    },
    {
      name: 'SRO-E02-CORE01', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'ok'
      },
      details: {}
    },
    {
      name: 'SRO-E02-CORE02', maint: false,
      cells: {
        web: 'ok', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'ok', mail: 'empty', backup: 'empty', replication: 'ok'
      },
      details: {}
    },
    {
      name: 'SSJ-HPV01', maint: false,
      cells: {
        web: 'ok', api: 'ok', cpu: 'ok', memory: 'ok', disk: 'ok', network: 'ok',
        dns: 'ok', cert: 'ok', vpn: 'empty', mail: 'empty', backup: 'ok', replication: 'ok'
      },
      details: {}
    },
    {
      name: 'SRO-UPS-DC01', maint: false,
      cells: {
        web: 'empty', api: 'empty', cpu: 'ok', memory: 'ok', disk: 'empty', network: 'ok',
        dns: 'empty', cert: 'empty', vpn: 'empty', mail: 'empty', backup: 'empty', replication: 'empty'
      },
      details: {}
    }
  ];

  let currentDataset = replicaHosts;

  function renderTable(hosts) {
    let html = '<table class="matrix-table" id="matrix-main-table">';
    html += '<thead><tr>';
    html += '<th class="th-host-corner"></th>';
    categories.forEach(c => {
      html += '<th class="th-col-rotated"><span class="th-col-text">' + c + '</span></th>';
    });
    html += '</tr></thead>';
    html += '<tbody>';

    hosts.forEach(h => {
      html += '<tr class="matrix-row" data-name="' + h.name.toLowerCase() + '">';
      html += '<td class="td-host" data-host="' + h.name + '" title="Haga clic para enfocar este host en el panel de detalle">';
      html += h.name;
      if (h.maint) {
        html += ' <span class="maint-wrench" title="Host en mantenimiento">🔧</span>';
      }
      html += '</td>';

      categories.forEach(cat => {
        const stateKey = (h.cells && h.cells[cat]) ? h.cells[cat] : 'empty';
        const st = statusMap[stateKey] || statusMap.empty;
        const detail = (h.details && h.details[cat]) ? h.details[cat] : ('Estado: ' + st.name);
        const title = 'Host: ' + h.name + ' | Check: ' + cat + ' | ' + detail;

        html += '<td style="padding: 0; text-align: center;">';
        html += '<div class="cell-tile ' + st.cls + '" data-host="' + h.name + '" data-tag="' + cat + '" data-sev="' + st.sev + '" title="' + title + '">';
        html += st.icon;
        html += '</div></td>';
      });

      html += '</tr>';
    });

    html += '</tbody></table>';
    mount.innerHTML = html;
    bindTableEvents();
  }

  function bindTableEvents() {
    // Cell clicks -> filter selected host & tag
    const tiles = mount.querySelectorAll('.cell-tile');
    tiles.forEach(tile => {
      tile.addEventListener('click', (e) => {
        e.stopPropagation();
        const host = tile.getAttribute('data-host') || '';
        const tag = tile.getAttribute('data-tag') || '';
        if (!host) return;

        const url = new URL(window.location.href);
        url.searchParams.set('var-selected_host', host);
        url.searchParams.set('var-selected_tag', tag);
        window.location.href = url.toString();
      });
    });

    // Row label clicks -> filter host
    const rowLabels = mount.querySelectorAll('.td-host');
    rowLabels.forEach(lbl => {
      lbl.addEventListener('click', () => {
        const host = lbl.getAttribute('data-host') || '';
        if (!host) return;

        const url = new URL(window.location.href);
        url.searchParams.set('var-selected_host', host);
        url.searchParams.set('var-selected_tag', '.*');
        window.location.href = url.toString();
      });
    });
  }

  // Initial table render
  renderTable(currentDataset);

  // Tab switching
  const tabReplica = element.querySelector('#tab-btn-replica');
  const tabMilicic = element.querySelector('#tab-btn-milicic');

  if (tabReplica && tabMilicic) {
    tabReplica.addEventListener('click', () => {
      tabReplica.classList.add('active');
      tabMilicic.classList.remove('active');
      currentDataset = replicaHosts;
      renderTable(currentDataset);
    });

    tabMilicic.addEventListener('click', () => {
      tabMilicic.classList.add('active');
      tabReplica.classList.remove('active');
      currentDataset = milicicHosts;
      renderTable(currentDataset);
    });
  }

  // Search input filter
  const searchInput = element.querySelector('#matrix-search-box');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      const trs = mount.querySelectorAll('.matrix-row');
      trs.forEach(tr => {
        const name = tr.getAttribute('data-name') || '';
        if (!val || name.includes(val)) {
          tr.style.display = '';
        } else {
          tr.style.display = 'none';
        }
      });
    });
  }

  // Sort by severity
  const btnSortSev = element.querySelector('#matrix-btn-sort-sev');
  if (btnSortSev) {
    btnSortSev.addEventListener('click', () => {
      const tbody = mount.querySelector('#matrix-main-table tbody');
      if (!tbody) return;
      const trs = Array.from(tbody.querySelectorAll('.matrix-row'));
      trs.sort((a, b) => {
        const getMaxSev = tr => {
          let max = -1;
          tr.querySelectorAll('.cell-tile').forEach(cell => {
            const sev = parseInt(cell.getAttribute('data-sev') || '-1', 10);
            if (sev > max) max = sev;
          });
          return max;
        };
        return getMaxSev(b) - getMaxSev(a);
      });
      trs.forEach(tr => tbody.appendChild(tr));
    });
  }

  // Sort alphabetically
  const btnSortName = element.querySelector('#matrix-btn-sort-name');
  if (btnSortName) {
    btnSortName.addEventListener('click', () => {
      const tbody = mount.querySelector('#matrix-main-table tbody');
      if (!tbody) return;
      const trs = Array.from(tbody.querySelectorAll('.matrix-row'));
      trs.sort((a, b) => {
        const nameA = a.getAttribute('data-name') || '';
        const nameB = b.getAttribute('data-name') || '';
        return nameA.localeCompare(nameB);
      });
      trs.forEach(tr => tbody.appendChild(tr));
    });
  }

  // Theme toggle
  const btnTheme = element.querySelector('#matrix-btn-theme');
  if (btnTheme && container) {
    btnTheme.addEventListener('click', () => {
      container.classList.toggle('dark-theme');
    });
  }

} catch (err) {
  console.error('MatrixMAX Render Error:', err);
}
\`;
`;

// Replace from '// 2. MATRIXMAX' up to '// 3. INVENTORYMAX PANEL'
const startMarker = '// 2. MATRIXMAX CONTAINER (LIGHTWEIGHT HTML CONTAINER WITHOUT EMBEDDED TABLES)';
const endMarker = '// 3. INVENTORYMAX PANEL';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find markers:', { startIndex, endIndex });
  process.exit(1);
}

const updatedContent = content.substring(0, startIndex) + newMatrixSection + '\n' + content.substring(endIndex);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Successfully updated scripts/build_matrixmax_dashboard.mjs with exact matrixMAX replica!');
