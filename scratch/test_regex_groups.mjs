import { execSync } from 'child_process';

const output = execSync(`powershell -NoProfile -Command "
Add-Type -AssemblyName System.Security
\\$cipher = [IO.File]::ReadAllBytes('C:\\ProgramData\\Milicic\\Zabbix\\codex_audit_token.bin')
\\$plain = [Security.Cryptography.ProtectedData]::Unprotect(\\$cipher, [Text.Encoding]::UTF8.GetBytes('Milicic-Zabbix-Audit-v1'), [Security.Cryptography.DataProtectionScope]::LocalMachine)
\\$token = [Text.Encoding]::UTF8.GetString(\\$plain)
\\$payload = @{
    jsonrpc = '2.0'
    method = 'history.get'
    params = @{
        itemids = @('96736', '96737')
        history = 2
        sortfield = 'clock'
        sortorder = 'DESC'
        limit = 20
    }
    id = 1
} | ConvertTo-Json -Depth 5 -Compress
\\$r = Invoke-RestMethod -Uri 'https://zabbix.mlccnet.local/api_jsonrpc.php' -Method Post -ContentType 'application/json-rpc' -Headers @{ Authorization = \\"Bearer \\$token\\" } -Body ([Text.Encoding]::UTF8.GetBytes(\\$payload))
ConvertTo-Json \\$r.result -Depth 5
"`, { encoding: 'utf8' });

const history = JSON.parse(output);
console.log(`Analyzing ${history.length} group modification events:\n`);

history.forEach((h, idx) => {
  const text = h.value;
  const dt = new Date(parseInt(h.clock) * 1000).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  const dc = h.itemid === '96736' ? 'SRO-DCO01' : 'SRO-DCO02';

  // 1. Action
  const actionMatch = text.match(/^([^\r\n]+)/);
  const rawAction = actionMatch ? actionMatch[1].trim() : 'Modificación de grupo';
  let actionFriendly = rawAction;
  if (rawAction.includes('A member was added')) actionFriendly = '➕ Miembro Añadido';
  else if (rawAction.includes('A member was removed')) actionFriendly = '➖ Miembro Removido';

  // 2. Operator (Subject -> Account Name)
  const operatorMatch = text.match(/Subject:[\s\S]*?Account Name:\s+([^\r\n]+)/i);
  const operator = operatorMatch ? operatorMatch[1].trim() : 'Desconocido';

  // 3. Member (Member -> Account Name or Security ID)
  let member = 'Desconocido';
  const memberMatch = text.match(/Member:[\s\S]*?Account Name:\s+([^\r\n]+)/i);
  if (memberMatch) {
    const rawMember = memberMatch[1].trim();
    // If it's a DN (CN=...,OU=...) extract the CN
    const cnMatch = rawMember.match(/^CN=([^,]+)/i);
    member = cnMatch ? cnMatch[1] : rawMember;
  }

  // 4. Group (Group -> Group Name)
  const groupMatch = text.match(/Group:[\s\S]*?Group Name:\s+([^\r\n]+)/i);
  const group = groupMatch ? groupMatch[1].trim() : 'Desconocido';

  console.log(`[${idx + 1}] ${dt} | DC: ${dc} | Acción: ${actionFriendly}`);
  console.log(`     Grupo:    ${group}`);
  console.log(`     Miembro:  ${member}`);
  console.log(`     Operador: ${operator}`);
  console.log('------------------------------------------------------------');
});
