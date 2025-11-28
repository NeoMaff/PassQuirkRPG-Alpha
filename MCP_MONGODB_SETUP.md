# Configuración del Servidor MCP de MongoDB

Este proyecto incluye un servidor MCP (Model Context Protocol) local para MongoDB. Esto permite que el asistente de IA interactúe directamente con tu base de datos MongoDB.

## Requisitos

1. Tener MongoDB instalado y ejecutándose (localmente o en Atlas).
2. Haber instalado las dependencias del proyecto (`npm install`).

## Configuración en tu cliente MCP (Trae, Claude Desktop, etc.)

Debes agregar la siguiente configuración a tu archivo de configuración de servidores MCP.

### Para Trae / Claude Desktop

Edita tu archivo de configuración (normalmente se encuentra en `%APPDATA%\Claude\claude_desktop_config.json` en Windows o en la configuración de Trae):

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "node",
      "args": [
        "E:\\PassQuirk\\mcp\\mongodb-server.js"
      ]
    }
  }
}
```

**¡IMPORTANTE SOBRE LA SEGURIDAD!**
He configurado el servidor para que lea automáticamente el archivo `.env` de la carpeta raíz.
**NO pongas tu contraseña en este archivo JSON.**
En su lugar, abre el archivo `E:\PassQuirk\.env` y busca la línea `MONGODB_URI`. Reemplaza `<db_password>` con tu contraseña real de MongoDB Atlas.

## ¿Cuál es mi contraseña?

La contraseña que te falta `<db_password>` **NO** es tu contraseña de inicio de sesión de MongoDB Atlas.
Es la contraseña específica que creaste para el usuario de base de datos `neomaffofficial_db_user`.

**Si no la recuerdas:**
1. Ve al panel de [MongoDB Atlas](https://cloud.mongodb.com).
2. En el menú lateral izquierdo, ve a **Security** -> **Database Access**.
3. Busca el usuario `neomaffofficial_db_user`.
4. Haz clic en **Edit** -> **Edit Password**.
5. Crea una nueva contraseña (anótala) y guarda los cambios.
6. Pon esa nueva contraseña en tu archivo `.env` reemplazando `<db_password>`.

## Probando el servidor

Puedes probar que el servidor funciona ejecutando manualmente:

```bash
npm run mcp:mongodb
```

Si ves "Servidor MCP MongoDB iniciado en stdio", significa que está funcionando correctamente (esperará comandos por stdin, así que no verás mucho más). Presiona `Ctrl+C` para salir.

## Capacidades

El servidor expone las siguientes herramientas a la IA:
- `list_collections`: Ver qué colecciones existen.
- `find_documents`: Buscar datos en las colecciones.
- `insert_document`: Insertar nuevos datos.
- `update_document`: Modificar datos existentes.
- `delete_document`: Eliminar datos.
