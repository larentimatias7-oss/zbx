import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const b=JSON.parse(fs.readFileSync(path.join(root,'raw/ad-operativo-before.json'),'utf8').replace(/^\uFEFF/,'' )).result;
const before=Array.isArray(b)?b[0]:b;
const cp=x=>JSON.parse(JSON.stringify(x));
const f=(type,name,value)=>({type:String(type),name,value:String(value)});
function clone(w,name,x,y,width,height){let a=cp(w);delete a.widgetid;Object.assign(a,{name,x:String(x),y:String(y),width:String(width),height:String(height)});return a;}
let ref=0;
function history(name,cols,y,height=4){return {type:'itemhistory',name,x:'0',y:String(y),width:'72',height:String(height),view_mode:'0',fields:[f(1,'reference','OP'+String(++ref).padStart(3,'0')),f(0,'layout',1),f(0,'show_timestamp',1),f(0,'show_column_header',1),f(0,'show_lines',100),f(0,'sortorder',0),f(0,'rf_rate',60),f(1,'time_period.from','now-7d'),f(1,'time_period.to','now'),...cols.flatMap(([name,id],i)=>[f(1,`columns.${i}.name`,name),f(4,`columns.${i}.itemid`,id),f(0,`columns.${i}.display`,5),f(0,`columns.${i}.max_length`,90),f(0,`columns.${i}.monospace_font`,0)])]};}
const overview=before.pages[0], changes=before.pages.find(p=>p.name==='Cambios de cuentas'),diagnosis=before.pages.find(p=>p.widgets.some(w=>w.type==='problems'));
const cards=overview.widgets.filter(w=>w.type==='item').map((w,i)=>clone(w,w.name+' · eventos DCO01',i*18,0,18,2));
const service=(id,host,x)=>({type:'item',name:host+' · servicio EventLog (no prueba auditoría)',x:String(x),y:'0',width:'24',height:'2',view_mode:'0',fields:[f(4,'itemid.0',id),f(0,'show.0',2),f(0,'rf_rate',60),f(0,'decimal_places',0)]});
const pages=[
 {name:'Resumen operativo',widgets:[...cards,history('Cobertura parcial: Security solo SRO-DCO01 · cuentas bloqueadas: estado actual desconocido',[['Usuario del evento','83820'],['Equipo informado','83821'],['4740 · abrir evidencia original','83274']],2,5),history('Fallos AD · 7 días · 0 registros no certifica recolección completa',[['4625 · abrir usuario, IP y motivo originales','83715']],7,4)]},
 {name:'Usuarios',widgets:[history('Bloqueos por evento · sin ranking en vivo · estado actual desconocido',[['Cuenta','83820'],['Equipo','83821'],['4740 · abrir original','83274']],0,5),history('Fallos por evento · usuario y motivo dentro del registro original',[['4625 · abrir evidencia','83715']],5,6)]},
 {name:'Orígenes',widgets:[history('IP vista por AD · puede ser intermediario · IP pública VPN: sin fuente en vivo',[['4625 · abrir Source Network Address y motivo','83715']],0,6),history('Equipos informados en bloqueos · no equivalen necesariamente al cliente final',[['Equipo informado','83821'],['4740 · evidencia original','83274']],6,5)]},
 {name:'Incidentes',widgets:[history('Evidencia AD · secuencia VPN no disponible en vivo · revisar informe histórico',[['4740 · abrir bloqueo original','83274']],0,4),clone(diagnosis.widgets[0],'Diagnóstico de alertas · RESOLVED no confirma desbloqueo · revisar tiempos y etiquetas',0,4,72,7)]},
 {name:'Salud y auditoría',widgets:[service('75478','SRO-DCO01',0),service('75616','SRO-DCO02',24),service('76551','SSJ-DCO01',48),...changes.widgets.filter(w=>w.type==='itemhistory').map((w,i)=>clone(w,w.name+' · SRO-DCO01',0,2+i*3,72,3)),history('Cobertura: DCO02 y SSJ sin ítems Security · estado técnico de ítems pendiente de panel específico',[['Último registro 4625 disponible · abrir','83715']],11,3)]}
].map((p,i)=>({...p,dashboard_pageid:before.pages[i].dashboard_pageid,display_period:'0'}));
for(const p of pages)for(const [i,a] of p.widgets.entries())for(const c of p.widgets.slice(i+1))assert(!(Number(a.x)<Number(c.x)+Number(c.width)&&Number(c.x)<Number(a.x)+Number(a.width)&&Number(a.y)<Number(c.y)+Number(c.height)&&Number(c.y)<Number(a.y)+Number(a.height)),'Overlapping widgets');
const payload={dashboardid:'403',auto_start:0,pages};
fs.writeFileSync(path.join(root,'raw/ad-operativo-dashboard-payload.json'),JSON.stringify(payload,null,2));
const rollback={dashboardid:'403',auto_start:before.auto_start,pages:before.pages.map(p=>({...p,widgets:p.widgets.map(w=>{const z=cp(w);delete z.widgetid;return z})}))};
fs.writeFileSync(path.join(root,'raw/ad-operativo-dashboard-rollback.json'),JSON.stringify(rollback,null,2));
console.log(JSON.stringify({pages:pages.map(p=>p.name),widgets:pages.reduce((n,p)=>n+p.widgets.length,0)}));
