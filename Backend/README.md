# RestaurantFlow Backend

Backend de coordinación en tiempo real para restaurantes. PostgreSQL conserva el
estado persistente; FastAPI aplica la lógica de negocio; Portal distribuye eventos
realtime; Anthropic aporta análisis y recomendaciones con fallbacks determinísticos.

## Stack

- Python 3.10+
- FastAPI y Pydantic v2
- PostgreSQL, SQLAlchemy 2.x async y Alembic
- Portal HTTP API para realtime
- Anthropic Claude mediante el SDK oficial

## Arquitectura

```text
Frontend
   |
FastAPI
   |
PostgreSQL (fuente de verdad)
   |
Portal (distribución realtime)
   |
Cliente / Mesero / Cocina / Admin
```

La IA analiza, estima y recomienda; no sustituye la lógica determinística ni el
estado almacenado en PostgreSQL. Si Portal o la IA fallan, las operaciones ya
confirmadas en PostgreSQL no se revierten.

## Instalación

Desde `Backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn main:app --reload
```

En Linux/macOS, activa el entorno con `source .venv/bin/activate` y copia el
archivo con `cp .env.example .env`. La base configurada por defecto es
`restaurant_flow`; créala previamente con `createdb restaurant_flow`.

Swagger queda disponible en `http://localhost:8000/docs`.

## Configuración

El archivo `.env.example` enumera todas las variables. Las principales son:

- `APP_NAME`, `APP_ENV`, `DEBUG`, `HOST` y `PORT`.
- `FRONTEND_URL` o `FRONTEND_URLS` (lista separada por comas).
- `DATABASE_URL` y `DATABASE_ECHO`.
- `PORTAL_ENABLED`, `PORTAL_SECRET_KEY`, `PORTAL_API_URL`,
  `PORTAL_SENDER_ID` y `RESTAURANT_ID`.
- `AI_ENABLED`, `ANTHROPIC_API_KEY`, `AI_MODEL` y `AI_TIMEOUT_SECONDS`.
- `MONITORING_ENABLED`, `PREDICTOR_INTERVAL_SECONDS`,
  `SUPERVISOR_INTERVAL_SECONDS`, `READY_WARNING_MINUTES`,
  `DELAY_WARNING_MINUTES` y `ALERT_DEDUP_MINUTES`.

No guardes `.env` ni credenciales reales en Git. En producción, habilitar Portal
o IA sin su credencial requerida produce un error claro de configuración.

## Endpoints

### Sistema

- `GET /`
- `GET /health`: comprobación rápida del proceso.
- `GET /health/ready`: comprueba PostgreSQL e informa la configuración conocida
  de Portal, IA y monitoring sin hacer llamadas externas costosas.
- `GET /api/monitoring/status`

### Órdenes y mesas

- `POST /api/orders`
- `GET /api/orders?status=cooking&limit=50`
- `GET /api/orders/{order_id}`
- `PUT /api/orders/{order_id}/progress`
- `PUT /api/orders/{order_id}/status`
- `GET /api/tables`
- `GET /api/tables/{table_id}`
- `PUT /api/tables/{table_id}`

### Mensajes y administración

- `POST /api/messages`
- `GET /api/messages?table_id=7&limit=50`
- `GET /api/stats`
- `GET /api/dashboard`

`revenue_today` y `satisfaction` se devuelven como `null`: los precios dentro del
JSON de una orden no constituyen todavía un registro financiero auditable y no
existe un modelo persistente de feedback. El backend no fabrica esas métricas.

No existe un endpoint backend de presence: Portal gestiona esa información
efímera desde sus clientes. Tampoco existe un endpoint para controlar agentes.

## Canales Portal implementados

- `restaurant:{id}:orders`: creación, estado, ready y served.
- `restaurant:{id}:dishes`: progreso y cambios de ETA.
- `restaurant:{id}:tables`: cambios y disponibilidad de mesas.
- `restaurant:{id}:table:{table_id}:chat`: chat cliente/mesero por mesa.
- `restaurant:{id}:staff:chat`: comunicación interna del personal.
- `restaurant:{id}:chat`: mensajes generales sin mesa.
- `restaurant:{id}:agents`: actividad agregada de agentes.
- `restaurant:{id}:notifications`: solicitudes y alertas operativas.
- `restaurant:{id}:state`: aviso pequeño de cambio de recurso.

## Flujo de demo

1. Consulta `GET /api/tables/7` y confirma que la mesa esté libre.
2. Crea la orden con `POST /api/orders`; se guarda antes de publicar
   `order.created`. Analyzer y Prioritizer se ejecutan en background.
3. Cambia la orden a `cooking`.
4. Actualiza el progreso a 25, 50, 75 y 100.
5. Al llegar a 100 queda `ready` y se publica la notificación de plato listo.
6. Cambia a `served` y después a `paid`.
7. Al pagar, la mesa vuelve a `empty` y se publica su disponibilidad.
8. Consulta `GET /api/dashboard` para ver el estado final agregado.

Para desarrollo local puedes usar `PORTAL_ENABLED=false` y `AI_ENABLED=false`:
la persistencia y los fallbacks siguen funcionando. Para una demo realtime real
se necesitan credenciales válidas de Portal y, para resultados de IA reales, de
Anthropic.
