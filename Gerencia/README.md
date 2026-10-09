# Módulo Gerencia: Reportes Ejecutivos, SLA & Gobernanza SRE
## Milicic S.A. | Dirección de Tecnología e Infraestructura de TI

Bienvenido al directorio central de **Reportes para Gerencia y Dirección**. Este espacio consolida la suite ejecutiva de observabilidad, gobierno de acuerdos de nivel de servicio (SLA), ingeniería de fiabilidad del sitio (SRE) y justificación matemática de inversiones de capital (CAPEX).

---

## 1. Contenido del Directorio `Gerencia/`

| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| 📕 [**Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf**](file:///c:/zabbix_anti/Gerencia/Manual_Ejecutivo_Dashboard_SLA_Milicic.pdf) | **PDF Oficial (300 DPI)** | Entregable institucional de 11 páginas A4 listo para imprimir o enviar a la Gerencia General y Directorio. Incluye análisis de KPIs y guion de oratoria. |
| 📘 [**MANUAL_EJECUTIVO_DASHBOARD_SLA.md**](file:///c:/zabbix_anti/Gerencia/MANUAL_EJECUTIVO_DASHBOARD_SLA.md) | **Markdown Oficial** | Documentación técnica completa en texto legible, tablas comparativas y guion de presentación para auditoría y consulta rápida. |
| 🌐 [**manual_ejecutivo_dashboard_milicic.html**](file:///c:/zabbix_anti/Gerencia/manual_ejecutivo_dashboard_milicic.html) | **HTML Template** | Código fuente maquetado con el Design System oficial de Milicic (colores `#EA580C` y `#0F172A`, CSS Paged Media). |
| 📊 [**milicic-exec-monthly.json**](file:///c:/zabbix_anti/Gerencia/milicic-exec-monthly.json) | **Dashboard Grafana** | Definición completa en JSON del tablero ejecutivo desplegado en producción (19 paneles, 5 secciones). |
| ⚙️ [**build_milicic_exec_enterprise.mjs**](file:///c:/zabbix_anti/Gerencia/build_milicic_exec_enterprise.mjs) | **Script de Telemetría** | Script Node.js que consulta en vivo a Zabbix 7.0 (`event.get`, `trend.get`), calcula las fórmulas SRE/Error Budget y actualiza el dashboard en Grafana. |
| 🖨️ [**build_executive_manual_pdf.mjs**](file:///c:/zabbix_anti/Gerencia/build_executive_manual_pdf.mjs) | **Compilador PDF** | Script que automatiza la generación del HTML y el renderizado a PDF mediante Chrome/Edge DevTools Protocol (CDP). |

---

## 2. Dashboard Ejecutivo en Producción

- **Nombre:** `MILICIC S.A. — Dashboard Ejecutivo Mensual de SLA & Gobernanza SRE`
- **UID Grafana:** `milicic-exec-monthly`
- **URL Directa:** [`http://172.27.210.154:3005/d/milicic-exec-monthly/68e5447`](http://172.27.210.154:3005/d/milicic-exec-monthly/68e5447)
- **Carpeta en Grafana:** `Milicic Observabilidad` (UID: `milicic-observability`)
- **Periodo Auditado:** Últimos 30 Días Continuos (Cierre Mensual)
- **Activos Auditados:** 65 Activos Críticos Tier 0, Tier 1 y Tier 2 (Rosario, San Juan y Faenas Mineras)

---

## 3. Resumen de Indicadores Clave (KPI)

### Bloque 1: Scorecard y Presupuesto de Error
* **SLI Global Uptime (30d):** `99.82%` frente a meta comprometida de `99.50%` (**+0.32% a favor**).
* **Base Mensual:** 43.200 minutos (30 días × 24 horas × 60 minutos).
* **Presupuesto Total de Indisponibilidad Tolerada (Total Error Budget):** `216 minutos` (0.50% admisible).
* **Consumo Real de Indisponibilidad:** `78 minutos` acumulados en el mes (solo el 36% del margen).
* **Presupuesto de Error Restante (Remaining Error Budget):** `64%` (**138 minutos de reserva segura**).
* **Tiempo Medio de Recuperación P1 (MTTR):** `18 minutos` (estándar ITIL &lt; 30 min).
* **Incidentes P1 en el Mes:** `1 evento` (contenido y mitigado sin afectación a la facturación ni a las obras).
* **Alertas Predictivas CAPEX:** `2 volúmenes` con riesgo de saturación en &lt; 60 días.

### Bloque 2: Matriz de Servicios por Niveles (Tiering)
* **Tier 0 (Misión Crítica):** Presea / SAP & Bases de Datos (`99.98%`), Datacenter Core Virtualización (`99.92%`), Core Switching Rosario (`100.00%`).
* **Tier 1 (Operación & Faenas Mineras):** Enlace SD-WAN / Satelital San Juan (`99.64%`), Perímetro FortiGate HA (`99.99%`), Energía UPS Datacenter (`100.00%`).
* **Tier 2 (Distribución & Campus):** Switches de Acceso Oficinas Centrales (`99.78%`).

### Bloque 4: Planificación de Capacidad (CAPEX)
Algoritmo de regresión lineal sobre tabla histórica `trends` de Zabbix:
1. `SRO-SQL01 - Data Volume (D:)`: Uso 89.2% (1.85 TB / 2.07 TB), tasa +14.2 GB/día $\rightarrow$ **Saturación en 23 días**.
2. `SRO-HPV01 - Cluster CSV01`: Uso 84.6% (7.61 TB / 9.00 TB), tasa +28.5 GB/día $\rightarrow$ **Saturación en 48 días**.

---

## 4. Guía de Ejecución y Mantenimiento

### 4.1 Para Refrescar la Telemetría y Redesplegar el Dashboard en Grafana
Cuando se requiera actualizar los cálculos con nuevos eventos de Zabbix o al cierre de cada mes:
```bash
node Gerencia/build_milicic_exec_enterprise.mjs
```
*Este comando regenera el JSON, calcula los promedios y lo inyecta mediante la API de Grafana.*

### 4.2 Para Recompilar el Reporte PDF Institucional
Si se modifican textos, KPIs o la maquetación:
```bash
node Gerencia/build_executive_manual_pdf.mjs
```
*El script generará el PDF mediante Chrome/Edge CDP y lo depositará tanto en `Gerencia/` como en `docs/` y `reports/`.*

---

## 5. Contactos y Responsables

* **Líder de Infraestructura & Ciberseguridad:** Ing. Matías Larenti (`matias.larenti@milicic.com.ar`)
* **Gerencia de Tecnologías de la Información & Comunicaciones:** Milicic S.A.
* **Plataforma Zabbix:** `https://zabbix.mlccnet.local` (Host `172.30.20.61`)
* **Plataforma Grafana:** `http://172.27.210.154:3005` (Dokploy en `172.27.210.154`)
