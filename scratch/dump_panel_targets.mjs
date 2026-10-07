import fs from 'fs';

const d = JSON.parse(fs.readFileSync('scratch/live_ad_soc.json', 'utf8'));

console.log('--- PANEL DETAILS ---');
for (const p of d.panels) {
  if (p.type === 'row') continue;
  console.log({
    id: p.id,
    type: p.type,
    title: p.title,
    targets: p.targets?.map(t => ({ refId: t.refId, host: t.host?.filter, item: t.item?.filter }))
  });
}
