# Calidad y aceptación del producto

Esta es una estrategia de verificación para la implementación futura. La entrega actual es documentación: se revisaron enlaces locales, IDs, dependencias y cobertura. No hay una aplicación cuyo build o E2E se pueda ejecutar aún.

## Definición global de terminado

- Historia y checklist del ticket completos; contratos reales verificados en staging y GAPs que afectan al flujo resueltos o alcance limitado explícitamente sin prometer el flujo bloqueado.
- UI en español con carga, vacío, error y sin conexión; formularios conservan datos ante fallo, validan campos y previenen envíos accidentales duplicados.
- Mes y usuario correctos en cada solicitud; ninguna información privada accesible sin sesión ni persistida en caché pública. API verifica autorización independientemente de la UI.
- Tipos, lint y build pasan. Pruebas de componentes para validación/interacciones relevantes; pruebas de integración de adaptadores y E2E de flujos críticos. No duplicar pruebas del algoritmo bancario en frontend: contrastar preview y representación.
- Evidencia visual en tamaños objetivo; teclado y VoiceOver, foco, contraste y zoom revisados. Ninguna tabla spreadsheet sustituye la experiencia prevista.
- Efectos financieros concordantes en gasto, ingreso, persona, presupuesto e historial después de recargar; timestamps y fechas civiles correctamente distinguidos.
- No logs de secretos, credenciales o datos financieros. Pruebas de notificaciones solo con cuentas sintéticas y envío explícitamente autorizado en el entorno de prueba.

## Matriz de plataformas

| Entorno | Revisión obligatoria |
|---|---|
| iPhone Safari/PWA | Barra inferior, safe areas, teclado, modal/hoja, instalación, permisos y push real si compatible |
| iPad Safari/PWA | Barra superior, vertical/horizontal, Split View estrecho, toque y teclado, instalación y push |
| Mac Safari/PWA | Navegación superior, teclado/VoiceOver, instalación disponible y notificaciones |
| Chromium escritorio | Navegación, formularios, manifest y service worker |
| Red lenta/sin conexión | Estados visibles, resultado desconocido de escritura, recuperación sin duplicar |

Tamaños de referencia: 375/390, 768, 1024 y 1440 px; zoom 200%. Fijar versiones mínimas al iniciar implementación y registrar modelos/OS usados. Emulación visual no sustituye comprobar instalación y push en Apple real. Ver [fuente WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

## Casos integrales de aceptación

| ID | Preparación y acción | Resultado verificable |
|---|---|---|
| QA-01 | Abrir detalle financiero sin sesión; probar BFF directamente | Login o 401; sin contenido privado ni open redirect |
| QA-02 | Expirar sesión con 5 consultas simultáneas | Una renovación por sesión; fallo termina sin bucle |
| QA-03 | Usuario A crea movimiento; usuario B intenta usar su periodId/personId | Rechazo del servidor; sin movimientos huérfanos |
| QA-04 | Ahorro 1000, ingresos 5000/recibidos 2000, gastos 3000/pagados 500 | Balance 3000, efectivo según registros 2500; no confundirlos |
| QA-05 | Nómina 25000; servicios 1500; suscripciones 600; MSI 4000; regulares 3000 | Fijos 6100, remanente inicial 18900 y restante 15900 |
| QA-06 | Gasto 1000 con 40% a persona; editar a 1200; cobrar | Ingreso único de 400, luego 480, luego recibido; gasto bancario no cambia isPaid al cobrar |
| QA-07 | Quitar split pendiente y eliminar gasto con cobro recibido | Proyección pendiente se retira; cobro histórico recibido sigue política de conservación y trazabilidad |
| QA-08 | Crear solo ingreso 15000 y abrir mes siguiente | Acarreo concuerda con summary; detecta GAP-03 aun sin gastos |
| QA-09 | Copiar ingresos de enero a febrero, incluyendo día 31 y DEBT_COLLECTION; repetir | Fechas válidas, cobro omitido, nuevos pendientes y cero duplicados |
| QA-10 | Servicio 650 y MSI 9000 en seis cuotas; abrir dos meses y repetir generación | Cada mes servicio 650 y cuota MSI 1500 única; tras sexta no hay séptima |
| QA-11 | MSI 1000 a tres cuotas; fallo entre persistencia y avance | Total exacto 1000, recuperación sin pérdida de cuota ni duplicado |
| QA-12 | Cancelar, adelantar y pagar totalmente plan compartido | Efecto financiero, deuda y proyecciones coherentes; recibidos conservados |
| QA-13 | Persona con MSI futuro y cuota ya instanciada en dos tarjetas | Sin doble conteo; inmediato/global distintos y fechas correctas |
| QA-14 | Corte 15, pago 5: comprar 10 y 16 de septiembre | Impactos octubre/noviembre respectivamente; cambiar tarjeta recalcula fecha |
| QA-15 | Cerrar mes desde otra pestaña mientras se edita | Escritura rechazada; reabrir explícitamente habilita edición |
| QA-16 | Cambiar periodo con respuesta vieja en vuelo; cambiar cuenta | Ningún dato de otro mes/usuario aparece en el contexto nuevo |
| QA-17 | POST de alta devuelve timeout después de persistir | Estado desconocido, reconciliación; no reintento automático que duplique |
| QA-18 | Instalar PWA, modo avión y actualización con formulario abierto | Shell sin datos privados cacheados, sin guardado falso, actualización no pierde formulario sin aviso |
| QA-19 | Push denegado y email sin configurar | Mensajes veraces por canal, sin afirmar entrega por success externo |
| QA-20 | Avisos hoy/en 3 días, febrero día 31 y cambio de zona; repetir cron | Fechas y deduplicación correctas; amount desconocido de tarjeta no se presenta como cero adeudado |
| QA-21 | Logout, Atrás, cambio de usuario en dispositivo compartido | Sin datos anteriores ni avisos financieros de la cuenta previa tras revocación |
| QA-22 | Gasto FOOD y OTHER_RECURRING | Fórmula explícita y consistente con decisión GAP-13; nunca remanente inflado por omisión silenciosa |

## Verificación de entrega documental

Validar que todos los enlaces Markdown locales resuelven, haya 40 HUs y 40 tickets únicos, todas las dependencias FE existan sin ciclos, todos los GAP referidos estén definidos y cada requisito del objetivo tenga referencia en requirements.md. `backlog.json` debe ser JSON válido y concordar con los documentos. No cambiar el estado a completado por aprobar únicamente esta revisión documental.
