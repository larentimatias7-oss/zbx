import https from 'https';

const files = [
  'Module.php',
  'manifest.json',
  'actions/CControllerIncidentInvestigationView.php',
  'actions/CControllerIncidentServiceImpact.php',
  'assets/js/problem-investigation-icon.js',
  'views/incident.investigation.view.php',
  'views/layout.htmlpage.php',
  'views/js/incident.investigation.js.php'
];

function fetchFile(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://raw.githubusercontent.com/Monzphere/IncidentInvestigation/main/${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ path, content: data, status: res.statusCode }));
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log('Auditing Monzphere/IncidentInvestigation files...\n');
  const dangerousPatterns = [
    /DBselect/i,
    /DBexecute/i,
    /\bexec\s*\(/i,
    /\bsystem\s*\(/i,
    /\bshell_exec\s*\(/i,
    /\bpassthru\s*\(/i,
    /\beval\s*\(/i,
    /\bfile_get_contents\s*\(\s*['"]http/i,
    /\bcurl_init\s*\(/i,
    /\bbase64_decode\s*\(/i,
    /\bassert\s*\(/i,
    /\$\b_GET\b/,
    /\$\b_POST\b/,
    /\$\b_REQUEST\b/,
    /window\.fetch\s*\(\s*['"]http/i
  ];

  for (const f of files) {
    const res = await fetchFile(f);
    console.log(`[FILE] ${res.path} (HTTP ${res.status}, ${res.content.length} bytes)`);
    let matches = [];
    for (const pat of dangerousPatterns) {
      if (pat.test(res.content)) {
        matches.push(pat.toString());
      }
    }
    if (matches.length > 0) {
      console.log(`  -> Warning: Pattern matches: ${matches.join(', ')}`);
    } else {
      console.log(`  -> OK: No suspicious or raw execution patterns detected.`);
    }
  }
}

runAudit().catch(console.error);
