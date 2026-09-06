# Budget-APP

Aplicación de finanzas personales con React y Next.js, integrada con Budget-API (NestJS/MongoDB). Frontend bajo `/app`; API bajo `/api`.

## Desarrollo

Requiere Node.js 20.19+ (CI usa Node 22).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abrir `http://127.0.0.1:3002/app`. Completar las variables de servidor para conectar la API. Nunca añadir la API key o los tokens a variables `NEXT_PUBLIC_`.

## Pruebas y commits por feature

```sh
npm run verify
```

Ejecuta **todas** las comprobaciones: ESLint, tipos, tests de unidades/componentes, build de producción y pruebas de integración HTTP con Playwright. Se agregan pruebas por cada feature y se ejecuta nuevamente toda la suite antes de su commit; CI repite esa verificación en cada push y PR. `npm run test:coverage` produce cobertura adicional.

La suite nunca debe usar cuentas ni datos financieros reales. Para futuras pruebas de navegador, instalar Chromium con `npx playwright install chromium`.

## Documentación

- [Planeación y tickets](docs/README.md)
- [Avance por feature](docs/progress.md)
- [Contratos y diferencias de API](docs/integration.md)
- [Dependencias de backend](docs/api-gaps.md)
- [Despliegue](docs/deployment.md)

`ops/` contiene ejemplos de Caddy y servicio Node para el VPS. Son plantillas, no una configuración ya aplicada.
