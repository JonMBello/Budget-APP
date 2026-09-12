# Fuentes y alcance de revisión

Revisión realizada el 5 de septiembre de 2026 en la zona America/Mexico_City (6 de septiembre UTC).

1. Archivo de objetivo entregado por el usuario: `/Users/jonmtz/.codex/attachments/01c1ecaa-ff04-44ae-8a2a-1beb31ca98e9/goal-objective.md`.
2. [Planeación de Budget-API](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/features), nueve README de features; [guía de integración](https://github.com/JonMBello/Budget-API/blob/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/docs/README.md).
3. [Código de Budget-API](https://github.com/JonMBello/Budget-API/tree/bebfc5e5694d717d65fc34c69efd5d4b035a1ab5/src/modules): controladores, DTOs y servicios de auth, users, cards, people, budgets, recurring, expenses, incomes, metrics y notifications; schemas de movimientos y configuración Caddy. Se descargó una copia de referencia vía GitHub CLI y se comprobó SHA coincidente con el prefijo del archivo tarball. No se modificó el repositorio remoto.
4. [API publicada](https://budget.jonmb.com/api) y [Swagger publicado](https://budget.jonmb.com/api/docs): se intentó abrir con navegador de investigación y la herramienta no pudo recuperarlos. No se concluye que el servicio esté caído ni que la versión desplegada coincida con main. Los contratos de este plan se fundamentan en código, no en una prueba de producción autenticada.
5. [Next.js basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath) y [self-hosting](https://nextjs.org/docs/app/guides/self-hosting): consultados para despliegue con prefijo y proceso Node.
6. [WebKit: Web Push para apps de iOS/iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/): push requiere capacidades compatibles y acción explícita; en iOS/iPadOS la instalación en inicio forma parte del flujo documentado desde 16.4. La matriz efectiva de versiones se vuelve a verificar al implementar.

No se accedió a la hoja de Google Sheets, al VPS ni a datos personales financieros. No se crearon usuarios, movimientos, notificaciones ni issues externos. La revisión de código identifica dependencias; no sustituye pruebas de integración del backend.
