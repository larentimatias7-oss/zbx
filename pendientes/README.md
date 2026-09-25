# Registro Maestro de Casos y Pendientes Operativos (Milicic S.A.)

Este repositorio consolida el inventario, seguimiento y resolución de incidentes, ajustes de conectividad, reglas de firewall, falsos positivos de monitoreo y pendientes de infraestructura identificados durante las operaciones de **Zabbix 7.0 LTS**, **Grafana** y **Networking / Seguridad Perimetral**.

---

## 1. Matriz de Control de Pendientes

| ID | Fecha Detección | Activo / Servicio | Severidad | Descripción del Hallazgo | Estado | Entregable / Runbook |
| :---: | :---: | :--- | :---: | :--- | :---: | :--- |
| **PND-001** | 2026-09-23 | `SRO-STO02` (HPE MSA 2060)<br>`SRO-STO01` (HPE MSA 2040) | **Alta (P1)** | Descarte de tráfico HTTPS (TCP 443) por regla `Implicit Deny` en FortiGate desde Zabbix (`172.30.20.61`). Disparo de alarma de servicio no disponible (Falso Positivo de hardware). | **Pendiente de Aplicación en FortiGate** | [PND-001-HPE-MSA-FORTINET-HTTPS](PND-001-HPE-MSA-FORTINET-HTTPS/acciones-fortinet-zabbix.md)<br>[PDF Oficial](PND-001-HPE-MSA-FORTINET-HTTPS/MILICIC-PND-001-HPE-MSA-HTTPS-FORTINET.pdf) |
| **PND-002** | 2026-09-23 | `FTG_milicic_border1_SNMP`<br>`SRO-STO02` (HPE MSA 2060) | **Alta (P1)** /<br>**Media (P3)** | Mitigación de 2 falsos positivos: (1) OIDs legadas sin instancia en FortiOS y (2) Alarma P1 de storage caído por bloqueo HTTPS. Desactivación de triggers, auditoría y supresión de Telegram. | **Resuelto / Desactivado con Rollback** | [PND-002-GESTION-INCIDENCIAS](PND-002-GESTION-INCIDENCIAS-FALSOS-POSITIVOS/informe-tecnico-incidencias.md)<br>[PDF Oficial](PND-002-GESTION-INCIDENCIAS-FALSOS-POSITIVOS/MILICIC-PND-002-GESTION-INCIDENCIAS-ZABBIX.pdf) |
| **PND-003** | 2026-09-25 | `SRO-ZAB01` — Zabbix Server<br>TimescaleDB / PostgreSQL 16 | **Media (P2 Plataforma)** | Housekeeper al 100% crónico (AUD-006). Causa raíz: tablas `history*`/`trends*` nunca migradas a hypertables pese a tener `ZBX_ENABLE_TIMESCALEDB=true`. DELETE fila-por-fila en 46 GB de datos. | **✅ Resuelto 25/09/2026** | [runbook-tecnico.md](PND-003-TIMESCALEDB-HOUSEKEEPER-MIGRATION/runbook-tecnico.md)<br>[PDF Oficial](PND-003-TIMESCALEDB-HOUSEKEEPER-MIGRATION/MILICIC-PND-003-TIMESCALEDB-MIGRATION.pdf) |


---

## 2. Convención de Ciclo de Vida para Casos Pendientes

1. **Detección y Evidencia:** Todo caso debe sustentarse con evidencia técnica irrebatible (logs de firewall, capturas, comandos CLI o respuestas de la API de Zabbix/FortiOS).
2. **Entregable en Carpeta:** Cada caso se aloja en su propia carpeta `PND-XXX-...` conteniendo:
   - Runbook técnico en Markdown (`.md`).
   - Plantilla HTML institucional bajo el estándar `milicic-corporate-docs`.
   - Reporte ejecutivo en PDF (`.pdf`) listo para gerencia o mesa de ayuda.
3. **Validación Posterior (*Post-Change Verification*):** Al aplicarse la remediación, se valida la recuperación de métricas y el cierre del evento en Zabbix, actualizando el estado a **Resuelto**.
