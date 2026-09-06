# Budget-APP: planeación del frontend

Planeación en español de React/Next.js para la API NestJS/MongoDB existente. Incluye historias, criterios de aceptación, tickets técnicos y verificación, replicando la estructura de nueve features de Budget-API. No se ha implementado ni desplegado la aplicación.

## Mapa de features

| # | Feature | Historias / tickets | Estado |
|---|---|---:|---|
| 01 | [Arquitectura, diseño adaptable e infraestructura](features/01-setup-and-infrastructure/README.md) | 5 / 5 | Planeada |
| 02 | [Autenticación y perfil](features/02-auth-and-users/README.md) | 4 / 4 | Planeada |
| 03 | [Cuentas, tarjetas y fechas de pago](features/03-cards-and-accounts/README.md) | 3 / 3 | Planeada |
| 04 | [Personas y cuentas por cobrar](features/04-people-and-debts/README.md) | 4 / 4 | Planeada |
| 05 | [Periodos mensuales, historial y ahorro](features/05-budget-periods-and-savings/README.md) | 4 / 4 | Planeada |
| 06 | [Servicios, suscripciones y MSI](features/06-recurring-and-msi/README.md) | 5 / 5 | Planeada |
| 07 | [Ingresos, gastos y división de compras](features/07-transactions-and-splits/README.md) | 6 / 6 | Planeada |
| 08 | [Balance, nómina y flujo de caja](features/08-metrics-and-cashflow/README.md) | 4 / 4 | Planeada |
| 09 | [PWA y recordatorios](features/09-notifications-and-reminders/README.md) | 5 / 5 | Planeada |

## Documentos de trabajo

- [Alcance, decisiones y preguntas pendientes](decisions.md)
- [Contratos, seguridad y actualización de datos](integration.md)
- [Diferencias verificadas y dependencias de API](api-gaps.md)
- [Cobertura de requisitos](requirements.md)
- [Orden de implementación y prioridades](roadmap.md)
- [Calidad y escenarios de aceptación](quality.md)
- [Despliegue propuesto en el VPS](deployment.md)
- [Backlog estructurado](backlog.json)
- [Fuentes y alcance de la revisión](sources.md)

## Cómo usar la planeación

Cada HU-FE tiene un TICKET-FE correspondiente. Los puntos son estimaciones relativas iniciales, no días ni compromisos de entrega. P0 identifica base o flujo crítico; P1 completa el alcance solicitado. Ambos forman parte del producto completo. Las dependencias GAP son trabajo requerido en Budget-API, no endpoints ya disponibles. No se crearon issues remotos.

El frontend puede desarrollarse con fixtures mientras se resuelven dependencias, pero una pantalla simulada no satisface los criterios de integración. El roadmap establece puertas de salida para evitar liberar cálculos o automatismos incompletos.
