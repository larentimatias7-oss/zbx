# Canales de Notificación en Telegram - Configuración y Diagnóstico

Este manual describe el funcionamiento de los canales de notificación en Telegram integrados con Zabbix en Milicic, el procedimiento para crear y vincular nuevos grupos, y la resolución de incidentes de entrega (como el error `Bad Request: chat not found`).

---

## 1. Inventario de Bots Corporativos en Producción

En Zabbix existen actualmente dos tipos de medios tipo Webhook para Telegram:

| Tipo de Medio (Media Type) | ID en Zabbix | Nombre del Bot | Username en Telegram | Token del Bot | Estado | Destino Principal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`Telegram_Test`** | `71` | Alertas Infra MILICIC | `@inframilicic_bot` | `8899338410:AAHP9R...` | **Habilitado** (`status: 0`) | Grupo "Alertas Infra" (`-1004383937012`) |
| **`Telegram_Test_Milicic`** | `72` | Zbx_milicic_group | `@Milicic_bot` | `8666455955:AAHYjk...` | **Habilitado** (`status: 0`) | Canal "Milicic - Monitoreo" (`-1003912373499`) |

---

## 2. Anatomía del Error: "Bad Request: chat not found"

En el log de alertas de Zabbix (`alert.get`), las notificaciones dirigidas al chat `-5468713329` arrojaron reiteradamente el error:
```text
Sending failed: Bad Request: chat not found
```

### Causas Raíz Técnicas en la API de Telegram:
1. **El Bot no es Miembro del Grupo:**
   - A diferencia de los usuarios humanos, un bot de Telegram **no tiene permiso para iniciar una conversación ni enviar mensajes a un grupo en el que no fue agregado previamente**.
   - Si se configura un Chat ID en Zabbix pero nadie agregó al bot (`@Milicic_bot` o `@inframilicic_bot`) al grupo, la API de Telegram rechaza la petición con código HTTP `400 Bad Request: chat not found`.
2. **Falta del Prefijo `-100` en Supergrupos o Canales:**
   - En Telegram existen dos tipos de grupos:
     - **Grupos Básicos:** IDs cortos negativos (ej. `-123456789`). Tienen límite de 200 usuarios y funciones reducidas.
     - **Supergrupos y Canales:** Al habilitar temas, historial para nuevos miembros o superar 200 miembros, Telegram los convierte en supergrupos y su identificador **siempre lleva el prefijo `-100`** (ej. `-1005468713329`).
   - Si un supergrupo es configurado como `-5468713329` sin el `-100`, la API no encuentra el chat y devuelve `chat not found`.

---

## 3. Procedimiento Estándar para Integrar un Grupo de Telegram

Sigue estos 5 pasos exactos para asegurar que el grupo reciba todas las alertas sin errores:

### Paso 1: Agregar el Bot al Grupo en Telegram
1. Abrir la aplicación de Telegram en el celular o escritorio.
2. Ingresar al grupo objetivo.
3. Ir a la información del grupo → **Añadir miembros** (o Administradores).
4. Buscar y seleccionar el bot:
   - Para el canal Milicic: **`@Milicic_bot`** (*Zbx_milicic_group*).
   - Para el canal de alertas de infraestructura: **`@inframilicic_bot`** (*Alertas Infra MILICIC*).
5. **Recomendado:** Conceder permisos de **Administrador** al bot con autorización para **Publicar mensajes** (*Post messages*) y **Fijar mensajes** (*Pin messages*).

---

### Paso 2: Obtener el Chat ID Real con Precisión
1. En el grupo de Telegram, enviar un mensaje cualquiera (por ejemplo: `hola bot` o `/start`).
2. Abrir una pestaña en el navegador o ejecutar en terminal la consulta de actualizaciones del bot:
   ```bash
   # Para @Milicic_bot:
   curl -s "https://api.telegram.org/bot8666455955:AAHYjkPoCPVhm20yy7EJLgqha6BHRC8Y-6M/getUpdates"
   ```
3. En la respuesta JSON, buscar el bloque `"chat"` del mensaje que enviaste:
   ```json
   "chat": {
     "id": -1005468713329,
     "title": "Alertas Operaciones",
     "type": "supergroup"
   }
   ```
4. El valor de `"id"` (incluyendo el signo menos y el prefijo `-100`) es el **Chat ID exacto**.

---

### Paso 3: Asignar el Medio al Usuario en Zabbix
1. En Zabbix Frontend, ir a **Users** → **Users**.
2. Seleccionar el usuario que gestionará el canal (por ejemplo `mlarenti.zabbix` o crear un usuario de servicio tipo `svc_telegram_milicic`).
3. Ir a la solapa **Media** y hacer clic en **Add**:
   - **Type:** Seleccionar `Telegram_Test_Milicic` (o `Telegram_Test`).
   - **Send to:** Ingresar el Chat ID exacto obtenido en el paso anterior (ej. `-1005468713329`).
   - **When active:** `1-7,00:00-24:00` (24x7).
   - **Use if severity:** Marcar todas las casillas deseadas (`Disaster`, `High`, `Average`, `Warning`).
   - **Status:** `Enabled`.
4. Hacer clic en **Add** dentro del modal y luego en **Update** en la pantalla del usuario.

---

### Paso 4: Incorporar al Usuario a los Grupos de Notificación de Alertas
Para que le lleguen **todas las alertas** (P1, P2 de Redes, P2 de Plataforma y P3 Preventivo), el usuario debe ser miembro de los siguientes grupos:
1. En Zabbix Frontend, ir a **Users** → **User groups**.
2. Verificar que el usuario esté añadido en:
   - **`Alertas-Guardia-P1`** (ID: 15): Recibe incidentes críticos inmediatos (0m).
   - **`Alertas-NOC-Redes`** (ID: 16): Recibe incidentes de red persistentes (10m) y preventivos (30m).
   - **`Alertas-SRE-Plataforma`** (ID: 17): Recibe incidentes de servidores/plataforma persistentes (10m) y preventivos (30m).

---

### Paso 5: Probar el Envío desde Zabbix
1. Ir a **Alerts** → **Media types**.
2. En la fila de `Telegram_Test_Milicic`, hacer clic en el botón **Test** (en la columna de acciones).
3. En la ventana emergente:
   - `Send to`: Ingresar el Chat ID verificado (ej. `-1005468713329`).
   - `alert_message`: `Prueba de integración exitosa desde Zabbix`.
   - `alert_subject`: `TEST | ZABBIX`.
4. Hacer clic en **Test**.
5. Confirmar que el mensaje aparezca inmediatamente en el grupo de Telegram.

---

## 4. Tabla de Diagnóstico de Errores Frecuentes

| Error en Zabbix Alert Log | Causa Raíz | Solución Inmediata |
| :--- | :--- | :--- |
| `Bad Request: chat not found` | El bot no está dentro del grupo, o falta el prefijo `-100` en el ID. | Agregar `@Milicic_bot` al grupo, enviar un mensaje y verificar el ID con `getUpdates`. |
| `Forbidden: bot was blocked by the user` | Un usuario personal inició el bot y luego le dio a "Bloquear bot". | Enviar `/start` al bot en el chat privado para desbloquearlo. |
| `Forbidden: bot is not a member of the channel` | El canal es público o privado y el bot no fue agregado como Administrador. | En Telegram, ir a Administradores del canal y añadir al bot con permiso de publicación. |
| `No media defined for user.` | La acción intentó notificar a un usuario de ese grupo que no tiene configurada la solapa Media. | Ir a `Users -> Users -> Media` y configurar el canal de Telegram para ese usuario. |
| `Connection timed out` | El servidor Zabbix no tiene salida HTTPS saliente (443) hacia `api.telegram.org`. | Revisar reglas de firewall o proxy corporativo en el host `172.30.20.61`. |
