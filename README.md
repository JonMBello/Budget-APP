# Budget APP 💰

<div align="center">

[![CI](https://github.com/JonMBello/Budget-APP/actions/workflows/verify.yml/badge.svg)](https://github.com/JonMBello/Budget-APP/actions/workflows/verify.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/JonMBello/Budget-APP/releases)
[![Tests](https://img.shields.io/badge/tests-231%20passing-brightgreen.svg)](https://github.com/JonMBello/Budget-APP)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Aplicación web de finanzas personales: presupuestos mensuales, tarjetas, MSI, deudas compartidas y recordatorios. Corre en `/app` y se conecta a [Budget-API](https://github.com/JonMBello/Budget-API) en `/api`.**

[Abrir la app](https://budget.jonmb.com/app) • [API y Swagger](https://budget.jonmb.com/api/docs) • [Roadmap y especificaciones](./docs/README.md)

</div>

---

## 🌟 Características principales

- **🔐 Sesión solo en servidor:** login JWT contra NestJS, cookie HttpOnly en Path `/app`, BFF en `/app/bff` que añade `x-api-key` y Bearer. La clave y los tokens no salen al navegador ni a `NEXT_PUBLIC_`.
- **📱 Navegación adaptable:** iPhone con barra inferior (Inicio, Ingresos, Gastos, Más); iPad y Mac con barra superior. Más abre en Perfil y deja el submenú visible para cambiar de sección.
- **💳 Tarjetas y ciclos:** crédito, débito y efectivo, simulador de corte y fecha límite, sin CVV ni número completo.
- **👥 Personas y deudas:** directorio, gastos compartidos, cobros vinculados y liquidación.
- **📅 Periodos mensuales:** abrir, cerrar y reabrir el mes, ahorro acarreado (también negativo) e historial comparable.
- **🛍️ Recurrentes y MSI:** servicios, suscripciones y plazos con avance de cuotas o liquidación.
- **💸 Ingresos y gastos:** categorías, pago/cobro, splits y copia de ingresos del mes anterior.
- **📊 Inicio con métricas:** balance proyectado, efectivo según registros, remanente de nómina y agenda de flujo de caja.
- **⏰ PWA y avisos:** instalación en iPhone/iPad/Mac, Web Push y pruebas de recordatorios (el cron diario vive en la API).

---

## 📚 Documentación y roadmap

La planeación (historias, tickets y criterios) está en [`docs/`](./docs/README.md). El avance entregado está en [`docs/progress.md`](./docs/progress.md).

1. [Feature 01: Arquitectura, diseño adaptable e infraestructura](./docs/features/01-setup-and-infrastructure/README.md)
2. [Feature 02: Autenticación y perfil](./docs/features/02-auth-and-users/README.md)
3. [Feature 03: Cuentas y tarjetas](./docs/features/03-cards-and-accounts/README.md)
4. [Feature 04: Personas y deudas](./docs/features/04-people-and-debts/README.md)
5. [Feature 05: Periodos mensuales y ahorro](./docs/features/05-budget-periods-and-savings/README.md)
6. [Feature 06: Recurrentes y MSI](./docs/features/06-recurring-and-msi/README.md)
7. [Feature 07: Ingresos, gastos y splits](./docs/features/07-transactions-and-splits/README.md)
8. [Feature 08: Métricas y flujo de caja](./docs/features/08-metrics-and-cashflow/README.md)
9. [Feature 09: PWA y notificaciones](./docs/features/09-notifications-and-reminders/README.md)

También: [contratos de integración](./docs/integration.md), [diferencias de API](./docs/api-gaps.md) y [despliegue](./docs/deployment.md).

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **App** | [Next.js 16](https://nextjs.org/) (App Router, `basePath: /app`, output standalone) |
| **UI** | [React 19](https://react.dev/) + TypeScript estricto |
| **Contratos** | [Zod 4](https://zod.dev/) en cliente y BFF |
| **API** | [Budget-API](https://github.com/JonMBello/Budget-API) (NestJS + MongoDB) |
| **Pruebas** | Vitest + Testing Library, Playwright contra el build standalone |
| **Proxy / TLS** | [Caddy 2](https://caddyserver.com/) (plantilla en `ops/`) |
| **Proceso** | systemd (ejemplo en `ops/budget-app.service.example`) |

---

## 🚀 Inicio rápido (local)

Requiere Node.js 20.19+ (CI usa Node 22) y Budget-API en marcha.

```bash
git clone https://github.com/JonMBello/Budget-APP.git
cd Budget-APP
npm ci
cp .env.example .env.local
```

Completa en `.env.local` la URL de la API, la API key y el origen. Nunca uses el prefijo `NEXT_PUBLIC_` en secretos.

```bash
npm run dev
```

Abre **`http://127.0.0.1:3003/app`**.

| Script | Uso |
| :--- | :--- |
| `npm run dev` | Desarrollo en `127.0.0.1:3003` |
| `npm run build` | Build de producción + paquete standalone |
| `npm start` | Sirve el standalone en `127.0.0.1:3003` (el mismo puerto que e2e y el ejemplo de Caddy) |

---

## 🧪 Pruebas automatizadas

La suite no usa cuentas ni datos financieros reales. CI ejecuta `npm run verify` en cada push y PR.

```text
Vitest:     231 passed (57 files)
Playwright: 44 passed
```

```bash
npm test              # unidades y componentes (Vitest)
npm run test:e2e      # integración HTTP (Playwright, requiere build)
npm run test:coverage # cobertura adicional
npm run lint
npm run typecheck
npm run verify        # lint + tipos + tests + build + e2e
```

Para e2e en local: `npx playwright install chromium webkit`.

---

## 🏷️ Versionado y release

La versión canónica está en `package.json` (ahora `1.0.0`). El flujo es el mismo que en Budget-API: etiqueta Git `vX.Y.Z` y [GitHub Release](https://github.com/JonMBello/Budget-APP/releases).

```bash
npm run verify
npm version 1.0.0 --no-git-tag-version   # si aún no coincide package.json
git add package.json package-lock.json README.md
git commit -m "Release v1.0.0"
git tag -a v1.0.0 -m "v1.0.0 - Production Launch"
git push origin main
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0 - Production Launch" --notes-file - <<'EOF'
### Features
- App Next.js en /app con BFF hacia Budget-API.
- Presupuestos, tarjetas, personas, recurrentes/MSI, movimientos y métricas.
- PWA y pruebas de notificaciones.

### Calidad
- Vitest (unidades/componentes) y Playwright (e2e) en CI.
EOF
```

Después del tag, en el VPS se reconstruye el standalone y se reinicia el servicio Node. Plantillas (no aplicadas solas) en `ops/`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).
