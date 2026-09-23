import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'raw/noc-infraestructura-2026-09-09-relevamiento.json'), 'utf8').replace(/^\uFEFF/, '')).results;
const hosts = evidence.hosts;
const sw = hosts.filter(h => h.hostgroups.some(g => g.groupid === '34'));
const fw = hosts.filter(h => h.parentTemplates.some(t => t.templateid === '10604'));
const all = [...sw, ...fw].map(h => h.hostid);
const ros = sw.filter(h => h.hostgroups.some(g => g.groupid === '30')).map(h => h.hostid);
const sj = sw.filter(h => h.hostgroups.some(g => g.groupid === '35')).map(h => h.hostid);
const fwids = fw.map(h => h.hostid);
const swids = sw.map(h => h.hostid);
const lldpids = evidence.lldpcoverage.map(i => i.hostid);
const F = (type, name, value) => ({ type, name, value: String(value) });
const list = (type, key, values) => values.map((v, i) => F(type, key + '.' + i, v));
let counter = 0;
function W(type, name, x, y, width, height, fields = [], reference) {
  return { type, name, x, y, width, height, view_mode: 0, fields: [
    F(0, 'rf_rate', 60),
    F(1, 'reference', reference || 'NC' + String(++counter).padStart(3, '0')),
    ...fields
  ] };
}
function honey(name, ids, pattern, box, thresholds = [[0,'E45959'],[1,'59DB8F']]) {
  return W('honeycomb', name, ...box, [
    ...list(3, 'hostids', ids), F(1, 'items.0', pattern), F(0, 'maintenance', 1),
    F(0, 'interpolation', 0), F(0, 'primary_label_bold', 1),
    F(0, 'secondary_label_decimal_places', 0),
    F(1, 'primary_label_color', '111820'), F(1, 'secondary_label_color', '111820'),
    ...thresholds.flatMap(([v,c],i) => [F(1,'thresholds.'+i+'.threshold',v),F(1,'thresholds.'+i+'.color',c)])
  ]);
}
function problems(name, ids, box, opts = {}) {
  return W('problems', name, ...box, [
    ...(opts.ref ? [F(1,'hostids._reference',opts.ref+'._hostids')] : list(3,'hostids',ids)),
    F(0,'show',3),F(0,'sort_triggers',1),F(0,'show_timeline',0),
    F(0,'show_lines',opts.lines || 12),F(0,'show_tags',1),F(0,'show_opdata',2),
    F(0,'show_suppressed',1),F(0,'highlight_row',1),
    ...(opts.match ? [F(1,'problem',opts.match)] : [])
  ]);
}
function hostnav(name, selectedHosts, box, ref) {
  return W('hostnavigator',name,...box,[
    ...list(1,'hosts',selectedHosts.map(h=>h.name)),F(0,'status',0),
    F(0,'maintenance',1),F(0,'show_problems',0),F(0,'show_lines',100)
  ],ref);
}
function itemnav(name, ids, patterns, box, ref, state = -1) {
  return W('itemnavigator',name,...box,[
    ...list(3,'hostids',ids),...list(1,'items',patterns),
    F(0,'state',state),F(0,'show_problems',0),
    F(0,'group_by.0.attribute',1),F(0,'show_lines',1000)
  ],ref);
}
function value(name, itemid, box, extra = []) {
  return W('item',name,...box,[
    F(4,'itemid.0',itemid),...list(0,'show',[2,3]),F(0,'decimal_places',2),...extra
  ]);
}
function selectedValue(name, ref, box) {
  return W('item',name,...box,[
    F(1,'itemid._reference',ref+'._itemid'),...list(0,'show',[1,2,3]),
    F(1,'description','{HOST.NAME}\n{ITEM.NAME}'),F(0,'value_size',28)
  ]);
}
function graph(name, datasets, box) {
  const colors = ['42B8F5','C78BFA','59DB8F','FFB84D','E45959','94B5CC'];
  return W('svggraph',name,...box,[
    F(1,'time_period._reference','DASHBOARD._timeperiod'),
    F(0,'show_problems',1),F(0,'graph_item_problems',1),F(0,'simple_triggers',1),
    F(0,'legend',1),F(0,'legend_lines',Math.min(6,Math.max(2,datasets.length))),
    F(0,'legend_columns',1),F(1,'lefty_min',0),
    ...datasets.flatMap((d,i)=>[
      ...(d.ref ? [F(0,'ds.'+i+'.dataset_type',0),F(1,'ds.'+i+'.itemids.0._reference',d.ref+'._itemid'),F(1,'ds.'+i+'.color.0',colors[i%colors.length])] :
        [...list(1,'ds.'+i+'.hosts',d.hosts),...list(1,'ds.'+i+'.items',d.items),F(1,'ds.'+i+'.color',colors[i%colors.length])]),
      F(0,'ds.'+i+'.width',2),F(0,'ds.'+i+'.fill',0),
      F(0,'ds.'+i+'.transparency',0),F(0,'ds.'+i+'.missingdatafunc',0)
    ])
  ]);
}
function top(name, ids, cols, box) {
  return W('tophosts',name,...box,[
    ...list(3,'hostids',ids),F(0,'maintenance',1),F(0,'show_lines',Math.min(25,ids.length)),
    F(0,'column',1),F(0,'order',2),
    F(1,'columns.0.name','Equipo'),F(0,'columns.0.data',2),F(1,'columns.0.base_color',''),
    ...cols.flatMap((c,j)=>{
      const i=j+1, prefix='columns.'+i+'.';
      return [F(1,prefix+'name',c.label),F(0,prefix+'data',1),
        F(1,prefix+'base_color',c.percent?'59DB8F':''),
        F(1,prefix+'item',c.item),F(0,prefix+'display',c.percent?2:1),
        F(0,prefix+'decimal_places',c.percent?1:0),
        ...(c.percent ? [F(1,prefix+'min',0),F(1,prefix+'max',100),
          F(1,'columnsthresholds.'+i+'.color.0','FFB84D'),F(1,'columnsthresholds.'+i+'.threshold.0',80),
          F(1,'columnsthresholds.'+i+'.color.1','E45959'),F(1,'columnsthresholds.'+i+'.threshold.1',90)] : [])];
    })
  ]);
}
const traffic = (hostname, iface) => [
  {hosts:[hostname],items:['Interface '+iface+'(*): Bits received']},
  {hosts:[hostname],items:['Interface '+iface+'(*): Bits sent']}
];
const snmp = (box) => W('hostavail','Disponibilidad de recolección SNMP',...box,[
  ...list(2,'groupids',['34','26']),F(0,'interface_type.0',2),F(0,'maintenance',1),F(0,'layout',0)
]);
const pages = [];
pages.push({name:'Resumen NOC',widgets:[
  W('clock','Hora de operación',60,0,12,2,[F(0,'clock_type',1),...list(0,'show',[2,3])]),
  W('problemsbysv','Problemas activos por severidad',0,0,42,2,[...list(3,'hostids',hosts.map(h=>h.hostid)),F(0,'show_type',1),F(0,'show_suppressed',1)]),
  snmp([42,0,18,2]),
  honey('Accesibilidad ICMP — verde significa responde',all,'ICMP ping',[0,2,30,8]),
  problems('Problemas activos — incluye los reconocidos',hosts.map(h=>h.hostid),[30,2,42,8],{lines:12})
]});
pages.push({name:'Estado por sede',widgets:[
  honey('Rosario — switches',ros,'ICMP ping',[0,0,27,5]),
  honey('San Juan — switches',sj,'ICMP ping',[27,0,18,5]),
  honey('Fortinet — sede por confirmar',fwids,'ICMP ping',[45,0,27,5]),
  hostnav('Seleccionar equipo',hosts,[0,5,22,6],'NSITE'),
  problems('Problemas del equipo seleccionado',[],[22,5,50,6],{ref:'NSITE',lines:12})
]});
pages.push({name:'Enlaces principales',widgets:[
  graph('CORE01 — Te1/0/20 · enlace Dell',traffic('SRO-E02-PB00-CORE01','Te1/0/20'),[0,0,36,5]),
  graph('Border1 — port14 TASA / port15 Claro',[
    ...traffic('FTG_milicic_border1_SNMP','port14'),...traffic('FTG_milicic_border1_SNMP','port15')
  ],[36,0,36,5]),
  value('CORE01 Te1/0/20 · estado','53201',[0,5,12,2]),
  value('CORE01 Te1/0/20 · velocidad','53047',[12,5,12,2]),
  value('Border1 port14 · estado','56554',[24,5,12,2]),
  value('Border1 port14 · velocidad de puerto','56489',[36,5,12,2]),
  value('Border1 port15 · estado','56548',[48,5,12,2]),
  value('Border1 port15 · velocidad de puerto','56483',[60,5,12,2]),
  graph('Errores y descartes — CORE01 Te1/0/20',[
    {hosts:['SRO-E02-PB00-CORE01'],items:['Interface Te1/0/20(*): *errors','Interface Te1/0/20(*): *discarded']}
  ],[0,7,36,5]),
  problems('Incidencias de interfaces — CORE01 y Border1',['10708','10697'],[36,7,36,5],{match:'Interface',lines:8})
]});
pages.push({name:'Firewalls Fortinet',widgets:[
  top('FortiGate — CPU, memoria, sesiones y túneles',fwids,[
    {label:'CPU %',item:'CPU utilization',percent:true},
    {label:'Memoria %',item:'Memory utilization',percent:true},
    {label:'Sesiones IPv4',item:'IPv4 Active sessions'},
    {label:'IPsec activos',item:'Active IPsec VPN tunnels'}
  ],[0,0,72,5]),
  itemnav('SD-WAN — elegir medición',fwids,['SD-WAN *: Latency','SD-WAN *: Jitter','SD-WAN *: Packets loss'],[0,5,24,5],'NSDWN'),
  graph('SD-WAN — medición seleccionada',[{ref:'NSDWN'}],[24,5,48,5]),
  itemnav('VPN y sensores — elegir estado o lectura',fwids,['VPN *: Tunnel Status','Sensor *: Value','Sensor *: Alarm status'],[0,10,24,5],'NFVPN'),
  selectedValue('VPN / sensor — valor y hora de muestra','NFVPN',[24,10,24,5]),
  problems('Problemas Fortinet — SNMP y HTTP',[...fwids,'10725'],[48,10,24,5],{lines:8}),
  graph('Border1 HTTP — CPU y memoria complementarias',[
    {hosts:['FTG_milicic_border1_HTTP'],items:['CPU utilization','Memory utilization']}
  ],[0,15,36,5]),
  itemnav('Border1 HTTP — túneles personalizados','10725'.split(','),['Estado VPN:*'],[36,15,18,5],'NHTTP'),
  selectedValue('HTTP — estado seleccionado','NHTTP',[54,15,18,5])
]});
pages.push({name:'Estado de red y switches',widgets:[
  honey('Switches — accesibilidad ICMP',swids,'ICMP ping',[0,0,30,5]),
  problems('Problemas de switches',swids,[30,0,42,5],{lines:8}),
  top('CPU — switches HP con métrica común',['10711','10713','10724','10726','10800'],[
    {label:'CPU %',item:'CPU utilization',percent:true}
  ],[0,5,36,4]),
  top('Comware — CPU y memoria de módulo',['10796','10797','10799'],[
    {label:'CPU %',item:'Level 1 Virtual Module #1: CPU utilization',percent:true},
    {label:'Memoria %',item:'Level 1 Virtual Module #1: Memory utilization',percent:true}
  ],[36,5,36,4]),
  itemnav('Interfaces — diagnóstico, todos los puertos',swids,['Interface *: Bits received','Interface *: Bits sent'],[0,9,24,5],'NSWIF'),
  graph('Tráfico de la interfaz seleccionada',[{ref:'NSWIF'}],[24,9,48,5]),
  top('TP-Link — CPU y memoria',['10798'],[
    {label:'CPU %',item:'#1: CPU utilization',percent:true},
    {label:'Memoria %',item:'#1: Memory utilization',percent:true}
  ],[0,14,36,3]),
  hostnav('Switches — acceso a detalle',sw,[36,14,36,3],'NSWHN')
]});
pages.push({name:'Topología e inventario LLDP',widgets:[
  hostnav('LLDP disponible — elegir switch',hosts.filter(h=>lldpids.includes(h.hostid)),[0,0,20,7],'NLLDP'),
  W('itemhistory','Tabla LLDP del switch — muestra cada 6 h',20,0,52,7,[
    F(0,'layout',1),F(0,'show_lines',1),F(0,'show_timestamp',1),F(0,'show_column_header',1),
    F(1,'columns.0.name','Evidencia LLDP'),F(4,'columns.0.itemid','94329'),F(0,'columns.0.display',1),
    F(1,'override_hostid._reference','NLLDP._hostid'),
    F(1,'time_period.from','now-2d'),F(1,'time_period.to','now')
  ]),
  itemnav('Vecinos y puertos remotos — nombres locales por resolver',lldpids,['LLDP *: remote system name','LLDP *: remote port'],[0,7,36,6],'NLLDI'),
  selectedValue('Vecino o puerto remoto seleccionado','NLLDI',[36,7,36,6])
]});
pages.push({name:'Calidad de monitoreo',widgets:[
  snmp([0,0,36,3]),
  honey('SNMP por equipo — gris: desconocido',all,'*SNMP agent availability',[36,0,36,3],[[0,'E45959'],[1,'59DB8F'],[2,'A1A1A1']]),
  graph('Cola Zabbix — total y más de 10 minutos',[
    {hosts:['Zabbix server'],items:['Queue','Queue over 10 minutes']}
  ],[0,3,36,5]),
  graph('Procesos de recolección y mantenimiento',[
    {hosts:['Zabbix server'],items:['Utilization of unreachable poller*','Utilization of snmp poller*','Utilization of housekeeper*']}
  ],[36,3,36,5]),
  itemnav('Ítems no soportados — revisar por host',hosts.map(h=>h.hostid),['*'],[0,8,30,6],'NQUAL',1),
  problems('Problemas de la plataforma Zabbix',['10084'],[30,8,42,6],{lines:10})
]});
const payload = {name:'NOC Infraestructura',private:1,display_period:60,auto_start:0,pages};
const refs = new Set();
for (const page of pages) {
  if (!page.widgets.length) throw new Error('Página vacía');
  for (const w of page.widgets) {
    if (w.x < 0 || w.y < 0 || w.x + w.width > 72 || w.height < 1) throw new Error('Geometría inválida '+w.name);
    const names = new Set();
    for (const f of w.fields) {
      if(names.has(f.name)) throw new Error('Campo duplicado '+f.name);
      names.add(f.name);
      if (f.name === 'reference') {
        if(refs.has(f.value)||f.value.length!==5) throw new Error('Referencia inválida');
        refs.add(f.value);
      }
    }
  }
  for (let i=0;i<page.widgets.length;i++) for(let j=i+1;j<page.widgets.length;j++){
    const a=page.widgets[i],b=page.widgets[j];
    if(a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y) throw new Error('Solapamiento');
  }
}
for(const pg of pages) for(const w of pg.widgets) for(const f of w.fields){
  if(f.name.endsWith('._reference')&&!f.value.startsWith('DASHBOARD.')&&!refs.has(f.value.split('.')[0]))throw new Error('Referencia sin origen');
}
fs.writeFileSync(path.join(root,'raw/noc-infraestructura-create-payload.json'),JSON.stringify(payload,null,2)+'\n');
const summary = pages.map(p=>({page:p.name,widgets:p.widgets.length,titles:p.widgets.map(w=>w.name)}));
fs.writeFileSync(path.join(root,'reports/noc-infraestructura-creacion-detalle.json'),JSON.stringify({action:'dashboard.create',server:'production',existing_dashboards:'No modificar',private:true,pages:summary,total_widgets:summary.reduce((a,p)=>a+p.widgets,0),validation:'Sin solapamientos; referencias internas verificadas; validación visual pendiente'},null,2)+'\n');
console.log(JSON.stringify({pages:pages.length,widgets:summary.reduce((a,p)=>a+p.widgets,0),checks:'grid, overlapping, field uniqueness, references passed'}));
