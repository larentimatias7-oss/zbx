import http from 'http';
import { execSync } from 'child_process';

let token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
if (!token) {
  token = execSync('powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\'GRAFANA_SERVICE_ACCOUNT_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();
}

// Lista de los 12 FortiGates de Milicic con coordenadas reales de sedes y proyectos
const sitesMetadata = [
  { host: "FTG_milicic_border1_SNMP", site: "Central Rosario (SRO)", latitude: -32.9515, longitude: -60.6663, type: "Sede Central & Datacenter" },
  { host: "FTG_ar-ssj-predio_SNMP", site: "Sede San Juan (SSJ)", latitude: -31.5375, longitude: -68.5364, type: "Sede Operativa Cuyo" },
  { host: "FTG_ar-376-veladero_SNMP", site: "Mina Veladero", latitude: -29.3512, longitude: -69.9521, type: "Proyecto Minero Alta Cordillera" },
  { host: "FTG_ar-372-posco_SNMP", site: "Proyecto Posco Salar", latitude: -25.3214, longitude: -67.0543, type: "Proyecto Minero Litio" },
  { host: "FTG_ar-223-rio_tinto_SNMP", site: "Proyecto Río Tinto", latitude: -24.2851, longitude: -66.3211, type: "Proyecto Minero Rincón" },
  { host: "FTG_ar-377-YPF_3er-Loop_SNMP", site: "YPF 3er Loop Vaca Muerta", latitude: -38.2541, longitude: -68.9512, type: "Proyecto Gasoducto Oil & Gas" },
  { host: "FTG_ar-374-sierra_grande_SNMP", site: "Obra Sierra Grande", latitude: -41.6112, longitude: -65.3521, type: "Proyecto Oleoducto Vaca Muerta Sur" },
  { host: "FTG_ar-368-acueducto_SNMP", site: "Obra Acueducto San Javier", latitude: -30.5841, longitude: -59.9512, type: "Infraestructura Hídrica" },
  { host: "FTG_ar-375-las_flores_SNMP", site: "Base Las Flores", latitude: -36.0124, longitude: -59.1021, type: "Base Logística Vial" },
  { host: "FTG_ar-341-santa_fe_SNMP", site: "Sede Santa Fe Capital", latitude: -31.6333, longitude: -60.7000, type: "Oficina Regional" },
  { host: "FTG_ar-341-san_luis_SNMP", site: "Base San Luis", latitude: -33.3000, longitude: -66.3333, type: "Base Operativa" },
  { host: "FTG_pe-S04-lima_SNMP", site: "Sede Lima (Perú)", latitude: -12.0464, longitude: -77.0428, type: "Filial Internacional" }
];

console.log('Metadatos de 12 sedes y proyectos preparados con éxito.');
