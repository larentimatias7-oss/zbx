import fs from 'fs';

const data = JSON.parse(fs.readFileSync('c:/zabbix_anti/scratch/ad_dashboard_raw.json', 'utf8'));
const panels = data.dashboard.panels.filter(p => [1, 2, 3, 4].includes(p.id));

panels.forEach(p => {
  console.log(`\n================ ID ${p.id}: ${p.title} ================`);
  console.log('Type:', p.type);
  console.log('Targets:', JSON.stringify(p.targets, null, 2));
  console.log('Transformations:', JSON.stringify(p.transformations, null, 2));
  console.log('Options:', JSON.stringify(p.options, null, 2));
  console.log('FieldConfig:', JSON.stringify(p.fieldConfig, null, 2));
});
