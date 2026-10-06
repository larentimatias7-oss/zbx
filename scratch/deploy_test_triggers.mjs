import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const grafanaUrl = 'http://172.27.210.154:3005';
const dsUid = 'efz4nzx8r30g0c';

const testDashboard = {
  id: null,
  uid: 'test-triggers-panel',
  title: 'Test Triggers Panel',
  schemaVersion: 40,
  timezone: 'browser',
  time: { from: 'now-1h', to: 'now' },
  panels: [
    {
      id: 1,
      title: 'Problemas Activos de Zabbix (alexanderzobnin-zabbix-triggers-panel)',
      type: 'alexanderzobnin-zabbix-triggers-panel',
      gridPos: { x: 0, y: 0, w: 24, h: 12 },
      datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid },
      targets: [
        {
          refId: 'A',
          datasource: { type: 'alexanderzobnin-zabbix-datasource', uid: dsUid },
          schema: 12,
          queryType: '5',
          showProblems: 'problems',
          group: { filter: '/.*/' },
          host: { filter: '/.*/' },
          application: { filter: '' },
          trigger: { filter: '' },
          tags: { filter: '' },
          proxy: { filter: '' },
          options: {
            minSeverity: 2,
            severities: [2, 3, 4, 5],
            acknowledged: 2,
            hostsInMaintenance: false,
            sortProblems: 'priority',
            limit: 100
          }
        }
      ],
      options: {
        schemaVersion: 8,
        layout: 'table',
        hostField: true,
        hostTechNameField: false,
        hostGroups: false,
        hostProxy: false,
        showTags: false,
        statusField: false,
        statusIcon: false,
        severityField: true,
        ackField: true,
        ageField: true,
        descriptionField: false,
        descriptionAtNewLine: false,
        hostsInMaintenance: false,
        showTriggers: 'all triggers',
        sortProblems: 'priority',
        limit: null,
        fontSize: '110%',
        pageSize: 10,
        problemTimeline: true,
        highlightBackground: false,
        highlightNewEvents: true,
        highlightNewerThan: '1h',
        customLastChangeFormat: false,
        lastChangeFormat: '',
        resizedColumns: [],
        markAckEvents: true,
        okEventColor: '#73BF69',
        ackEventColor: '#3B82F6',
        triggerSeverity: [
          { priority: 0, severity: 'Not classified', color: '#6B7280', show: true },
          { priority: 1, severity: 'Information', color: '#5794F2', show: true },
          { priority: 2, severity: 'Warning', color: '#FADE2A', show: true },
          { priority: 3, severity: 'Average', color: '#F2CC0C', show: true },
          { priority: 4, severity: 'High', color: '#FA6400', show: true },
          { priority: 5, severity: 'Disaster', color: '#E02F44', show: true }
        ]
      }
    }
  ]
};

const payload = JSON.stringify({ dashboard: testDashboard, overwrite: true });

const req = http.request(`${grafanaUrl}/api/dashboards/db`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    console.log("Deploy response:", res.statusCode, b);
  });
});

req.on('error', console.error);
req.write(payload);
req.end();
