import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

const scripts = [
  'build_aruba_dashboard.mjs',
  'build_backup_dashboard.mjs',
  'build_facilities_ups_dashboard.mjs',
  'build_fortigate_dashboard.mjs',
  'build_sanjuan_dashboard.mjs',
  'build_servers_dashboard.mjs',
  'build_soc_dashboard.mjs',
  'build_switches_dashboard.mjs',
  'build_vmware_dashboard.mjs'
];

console.log('Auditing dashboard build scripts...');
const report = [];

scripts.forEach(script => {
  const filePath = path.join('c:/zabbix_anti/scripts', script);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');

  const issues = [];

  // Check 1: status-history panels
  if (content.includes('type: "status-history"') || content.includes("type: 'status-history'")) {
    issues.push('Contains "status-history" panel (risk of "Too many points" error; should be "state-timeline")');
  }

  // Check 2: eventlog or log queries with queryType: "0"
  const logMatches = content.match(/queryType:\s*["']0["'][\s\S]*?(eventlog|log\.|Eventlog)/gi);
  if (logMatches) {
    issues.push('Contains log/eventlog queries with queryType: "0" (should be queryType: "2")');
  }

  // Check 3: table panels with unorganized Item/Key
  if (content.includes('type: "table"') && !content.includes('"Item": true') && !content.includes("'Item': true") && (content.includes('queryType: "2"') || content.includes('queryType: "0"'))) {
    // Check if table targets return Item/Key
    if (content.includes('resultFormat: "table"')) {
      issues.push('Contains table panel without Item/Key column exclusion in organize transformation');
    }
  }

  // Check 4: queryType: "5" (problems) table panel parsing
  if (content.includes('queryType: "5"') && content.includes('type: "table"')) {
    if (!content.includes('extractFields')) {
      issues.push('Contains queryType: "5" table panel without extractFields transformation (raw JSON string in column)');
    }
  }

  report.push({ script, issues });
});

console.log('\n=== AUDIT REPORT ===');
report.forEach(r => {
  console.log(`\n📄 ${r.script}`);
  if (r.issues.length === 0) {
    console.log('  ✅ No known patterns/issues detected');
  } else {
    r.issues.forEach(iss => console.log(`  ⚠️  ${iss}`));
  }
});
