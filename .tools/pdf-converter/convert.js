const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const workspaceRoot = 'c:/zabbix_anti';
const prodDocsDir = path.join(workspaceRoot, 'docs/zabbix/prod');
const pdfOutputDir = path.join(prodDocsDir, 'pdf');
const diagramPngPath = path.join(workspaceRoot, '.zabbix_context/diagrams/alerta_flujo_actual.png');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (!fs.existsSync(pdfOutputDir)) {
  fs.mkdirSync(pdfOutputDir, { recursive: true });
}

// Convert diagram PNG to Base64
let diagramBase64 = null;
if (fs.existsSync(diagramPngPath)) {
  diagramBase64 = fs.readFileSync(diagramPngPath).toString('base64');
}

const css = `
  @page {
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #24292f;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 18pt;
    color: #0969da;
    border-bottom: 2px solid #0969da;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 14pt;
    color: #1f2328;
    border-bottom: 1px solid #d0d7de;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 12pt;
    color: #1f2328;
    margin-top: 16px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }
  p, ul, ol {
    margin-top: 0;
    margin-bottom: 10px;
  }
  li {
    margin-bottom: 4px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 14px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #d0d7de;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: #f6f8fa;
    font-weight: 600;
  }
  tr:nth-child(even) {
    background-color: #fcfcfc;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 9.5pt;
    background-color: #eff1f3;
    padding: 2px 4px;
    border-radius: 3px;
  }
  pre {
    background-color: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 10px;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    font-size: 8.5pt;
    line-height: 1.4;
    overflow-x: auto;
    page-break-inside: avoid;
    margin: 12px 0;
  }
  pre code {
    background: none;
    padding: 0;
  }
  blockquote {
    margin: 12px 0;
    padding: 6px 12px;
    color: #57606a;
    border-left: 4px solid #0969da;
    background-color: #f6f8fa;
    border-radius: 0 4px 4px 0;
  }
  .diagram-container {
    text-align: center;
    margin: 16px 0;
    page-break-inside: avoid;
  }
  .diagram-container img {
    max-width: 100%;
    height: auto;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .diagram-caption {
    font-size: 8.5pt;
    color: #57606a;
    margin-top: 6px;
    font-style: italic;
  }
  hr {
    border: 0;
    height: 1px;
    background-color: #d0d7de;
    margin: 18px 0;
  }
`;

const documents = [
  {
    src: 'DOCUMENTACION_CONFIGURACION_ZABBIX-ZBX-prod-20260916-ALERT-OPT.md',
    dest: 'DOCUMENTACION_CONFIGURACION_ZABBIX-ZBX-prod-20260916-ALERT-OPT.pdf',
    embedDiagram: true
  },
  {
    src: 'operations-runbook.md',
    dest: 'operations-runbook.pdf',
    embedDiagram: false
  },
  {
    src: 'validation-report-ZBX-prod-20260916-ALERT-OPT.md',
    dest: 'validation-report-ZBX-prod-20260916-ALERT-OPT.pdf',
    embedDiagram: false
  }
];

const results = [];

documents.forEach(doc => {
  const mdPath = path.join(prodDocsDir, doc.src);
  const pdfPath = path.join(pdfOutputDir, doc.dest);
  const tempHtmlPath = path.join(pdfOutputDir, `_temp_${doc.src}.html`);

  if (!fs.existsSync(mdPath)) {
    console.error(`Source file not found: ${mdPath}`);
    return;
  }

  let mdContent = fs.readFileSync(mdPath, 'utf8');

  // If requested, embed the visual diagram image
  if (doc.embedDiagram && diagramBase64) {
    const diagramHtml = `
<div class="diagram-container">
  <img src="data:image/png;base64,${diagramBase64}" alt="Diagrama de Arquitectura Zabbix 7.0 LTS" />
  <div class="diagram-caption">Figura: Topología de Arquitectura y Flujo de Alertas Zabbix 7.0 LTS (Archify Showcase)</div>
</div>
`;
    // Insert after the mermaid code block or replace it
    if (mdContent.includes('```mermaid')) {
      mdContent = mdContent.replace(/```mermaid[\s\S]*?```/, (match) => {
        return match + '\n\n' + diagramHtml;
      });
    } else {
      mdContent += '\n\n' + diagramHtml;
    }
  }

  const htmlBody = marked.parse(mdContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${doc.dest}</title>
  <style>${css}</style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  // Convert to file URL for Chrome
  const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
  const destPdfWindows = pdfPath.replace(/\//g, '\\');

  console.log(`Converting ${doc.src} -> ${doc.dest}...`);

  const cmd = `powershell -Command "Start-Process -FilePath '${chromePath}' -ArgumentList '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--print-to-pdf=\\"${destPdfWindows}\\"', '${fileUrl}' -Wait"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      results.push({
        name: doc.dest,
        path: pdfPath,
        sizeBytes: stats.size
      });
      console.log(`[OK] Generated: ${doc.dest} (${stats.size} bytes)`);
    } else {
      console.error(`[ERROR] PDF was not generated: ${doc.dest}`);
    }
  } catch (err) {
    console.error(`Execution error for ${doc.dest}:`, err.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
});

console.log('\n--- RESUMEN FINAL ---');
results.forEach(r => {
  console.log(`- ${r.name}: ${r.sizeBytes} bytes | ${r.path}`);
});
