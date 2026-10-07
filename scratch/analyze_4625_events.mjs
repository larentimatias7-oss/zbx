import fs from 'fs';

const text = fs.readFileSync('C:/Users/matias.larenti/.gemini/antigravity-ide/brain/e67bbee2-130d-42e8-b9bf-e254d2fa5cbe/.system_generated/steps/2142/output.txt', 'utf8');
const firstBracket = text.indexOf('[');
const secondBracket = text.indexOf('[', firstBracket + 1);
const events = JSON.parse(text.slice(secondBracket));

console.log('Total 4625 events loaded:', events.length);

const byAccount = {};
const byIP = {};
const byReason = {};
const byLogonType = {};

events.forEach(e => {
  if (!e || !e.value) return;
  const v = e.value;
  
  // Extract Account
  const mAcc = v.match(/Account For Which Logon Failed:[\s\S]*?Account Name:\s+([^\r\n\t]+)/);
  const account = mAcc ? mAcc[1].trim() : 'Unknown';
  byAccount[account] = (byAccount[account] || 0) + 1;

  // Extract IP
  const mIP = v.match(/Source Network Address:\s+([^\r\n\t]+)/);
  const ip = mIP ? mIP[1].trim() : '-';
  byIP[ip] = (byIP[ip] || 0) + 1;

  // Extract Reason
  const mReason = v.match(/Failure Reason:\s+([^\r\n]+)/);
  const reason = mReason ? mReason[1].trim() : 'Unknown';
  byReason[reason] = (byReason[reason] || 0) + 1;

  // Extract Logon Type
  const mType = v.match(/Logon Type:\s+(\d+)/);
  const lType = mType ? mType[1].trim() : '?';
  const typeName = lType === '2' ? '2 (Interactivo / Consola)' :
                   lType === '3' ? '3 (Red / SMB / Net)' :
                   lType === '10' ? '10 (RDP / Remote Desktop)' :
                   lType === '4' ? '4 (Batch / Job)' :
                   lType === '5' ? '5 (Service)' : lType;
  byLogonType[typeName] = (byLogonType[typeName] || 0) + 1;
});

console.log('\n=== TOP CUENTAS CON FALLOS DE LOGON (Muestra de 100) ===');
console.table(Object.entries(byAccount).sort((a,b) => b[1] - a[1]).map(([account, count]) => ({ account, count })));

console.log('\n=== TOP IPs DE ORIGEN ===');
console.table(Object.entries(byIP).sort((a,b) => b[1] - a[1]).map(([ip, count]) => ({ ip, count })));

console.log('\n=== TIPOS DE LOGON ===');
console.table(Object.entries(byLogonType).sort((a,b) => b[1] - a[1]).map(([type, count]) => ({ type, count })));

console.log('\n=== MOTIVOS DE FALLO ===');
console.table(Object.entries(byReason).sort((a,b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count })));
