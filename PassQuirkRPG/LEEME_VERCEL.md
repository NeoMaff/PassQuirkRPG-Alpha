# ⚠️ Guía de Despliegue en Vercel (IMPORTANTE)

Estás intentando desplegar un **Bot de Discord (WebSocket)** en **Vercel (Serverless)**. Esto tiene limitaciones críticas:

## 🚫 El Problema
Vercel está diseñado para páginas web y funciones que se ejecutan y mueren en segundos.
Los bots de Discord (como el tuyo, usando `discord.js` y `client.login()`) necesitan estar **siempre encendidos** escuchando eventos.

Si despliegas este proyecto tal cual en Vercel:
1. El bot se encenderá cuando reciba una petición HTTP.
2. **Se apagará automáticamente a los 10-15 segundos** (Timeout de Vercel).
3. No responderá a comandos ni eventos de Discord la mayor parte del tiempo.
4. La música y los coleccionistas de botones fallarán.

## ✅ La Solución Correcta para Vercel
Para usar Vercel correctamente con Discord, debes cambiar la arquitectura del bot de **Gateway (WebSocket)** a **HTTP Interactions (Webhooks)**.
Esto implica:
1. Configurar en Discord Developer Portal la URL de "Interactions Endpoint URL" apuntando a tu dominio de Vercel.
2. Reescribir `index.js` para no usar `client.login()` sino exportar una función que reciba `req` y `res`.
3. Verificar las firmas criptográficas de Discord en cada petición.

## 🛠️ Alternativas Recomendadas (VPS/Persistent)
Si quieres mantener tu código actual sin reescribirlo, usa:
*   **Railway** (Recomendado, aunque querías quitarlo).
*   **Heroku**.
*   **Render**.
*   **DigitalOcean Droplet**.
*   **Tu propio PC** (como lo haces ahora con `npm start`).

## 📦 Si insistes en Vercel...
He creado el archivo `vercel.json`, pero necesitarás reestructurar el punto de entrada (`bot/index.js`) para que funcione como una API Serverless, lo cual es una tarea compleja que cambia todo el funcionamiento del bot.
