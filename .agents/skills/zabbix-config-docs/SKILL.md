---
name: zabbix-config-docs
description: Audits, verifies, and documents applied, failed, rejected, pending, and unknown changes to Zabbix after MCP or API operations. Generates configuration inventories, before-and-after change matrices, validation reports, rollback runbooks, and architecture diagrams in Markdown.
version: 1.0.0
type: documentation-audit
read_only: true
---

# Zabbix Configuration Documentation & Audit Skill

## Seguridad y Alcance (Guardrails)
Esta habilidad es estrictamente de SOLO LECTURA Y DOCUMENTACIÓN.
- No ejecutar llamadas de escritura ni reintentos contra Zabbix.
- Declarar como 'desconocido' o 'fallido' cualquier estado dudoso.
- Solo redactar procedimientos de reversión en el plan de rollback; nunca ejecutarlos.

## Contexto y Evidencia
- Entorno: prod (http://zabbix.mlccnet.local/)
- Change ID: ZBX-prod-20260916-ALERT-OPT
- Zona horaria: America/Argentina/Buenos_Aires (ART UTC-3)
- Consultar en vivo mediante MCP: action_get, usergroup_get, host_get, item_get.
- Leer memoria local de .zabbix_context/ (audit_baseline.md, tagging_plan.md).

## Estándares de Documentación
1. **Verificación Estricta:** Contrastar las configuraciones reportadas con llamadas MCP de lectura directa en tiempo real.
2. **Seguridad y Confidencialidad:** Mascarar cualquier token, secreto, contraseña o webhook sensible como `***REDACTED***`.
3. **Reproducibilidad:** Proporcionar payloads JSON exactos de reversión y guías paso a paso para el equipo de guardia y SRE.
