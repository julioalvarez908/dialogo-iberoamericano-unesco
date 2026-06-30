# II Diálogo Iberoamericano Cátedras UNESCO — Demo

Sitio institucional de una sola página (one-page) para el evento académico
iberoamericano **II Diálogo Iberoamericano Cátedras UNESCO 2026**.

> **Demo pública** — sin login, sin panel admin, sin base de datos. Los datos
> de inscripción se persisten en `data/inscripciones.json` con el único
> propósito de demostrar el flujo end-to-end. En producción debe migrarse a
> una base de datos relacional (PostgreSQL, MySQL, etc).

---

## Stack

| Capa        | Tecnología                                          |
|-------------|------------------------------------------------------|
| Backend     | FastAPI 0.115 + Uvicorn (Python 3.11)               |
| Frontend    | HTML + CSS + JavaScript planos (sin frameworks)     |
| Tipografía  | Inter (Google Fonts) + Font Awesome 6 (CDN)         |
| Persistencia| JSON local (`data/inscripciones.json`) — solo demo  |
| Despliegue  | Dockerfile + Railway                                 |

No se usa Tailwind, React, Vue, Svelte, ni ningún build step (Vite, webpack).
El CSS reescribe el sistema visual del prototipo `plataforma_di_logo_unesco.html`
en CSS plano con variables y un design system minimal.

---

## Estructura del proyecto

```
/
├─ app/
│  ├─ __init__.py
│  ├─ main.py              # FastAPI app, monta /static, sirve index.html
│  └─ routes.py            # endpoints /api/*
├─ static/
│  ├─ css/styles.css       # ~30 KB
│  ├─ js/main.js           # ~25 KB
│  └─ img/                 # (vacío — agregar logos aquí)
├─ templates/
│  └─ index.html
├─ data/
│  ├─ contenido.json       # textos, ponentes, programa, módulos
│  └─ inscripciones.json   # se crea al primer registro
├─ requirements.txt
├─ Dockerfile
├─ railway.toml
├─ .dockerignore
└─ README.md
```

---

## Ejecutar en local

Requiere Python 3.11+.

```powershell
# Windows / PowerShell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abrir en el navegador: <http://localhost:8000>

### Verificar la API

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/contenido
curl -X POST http://localhost:8000/api/inscripcion \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Pérez","institucion":"UNAD","pais":"Colombia","correo":"ana@unad.edu.co","rol":"Docente / Investigador"}'
```

---

## Endpoints

| Método | Ruta                | Descripción                                                    |
|--------|---------------------|-----------------------------------------------------------------|
| GET    | `/`                 | Página HTML principal (one-page)                                |
| GET    | `/static/*`         | Recursos estáticos (CSS, JS, imágenes)                          |
| GET    | `/api/contenido`    | Devuelve el JSON de contenido editable                          |
| POST   | `/api/inscripcion`  | Recibe `{nombre, institucion, pais, correo, rol}` — Pydantic    |
| GET    | `/health`           | `{"status":"ok"}` — usado por el healthcheck de Railway         |
| GET    | `/docs`             | Swagger UI (autogenerado por FastAPI)                           |

### Validación del payload `POST /api/inscripcion`

- `nombre`       — string, 2–120 chars
- `institucion`  — string, 2–200 chars
- `pais`         — string, 2–80 chars
- `correo`       — email válido (vía `pydantic[email]`)
- `rol`          — uno de: `Estudiante`, `Docente / Investigador`, `Representante Institucional`, `Ponente`, `Asistente General`

Errores devuelven `422` con detalle por campo. Respuesta exitosa: `{"ok": true, "id": "<uuid>"}`.

---

## Editar el contenido del sitio

Todo el texto visible (titulares, descripción, ponentes, programa, módulos,
ejes estratégicos, nodos del visualizador) vive en
[`data/contenido.json`](data/contenido.json). El frontend hace `fetch` a
`/api/contenido` en cada carga y reconstruye las secciones — no hay que
tocar HTML para editar contenido.

Estructura principal del JSON:

- `evento` — nombre, fecha, ciudad, correo
- `hero` — etiqueta, título, descripción, ejes
- `ecosistema_canvas` — nodos del mapa y de la red IA, conexiones
- `ponentes` — lista de speakers (nombre, país, institución, especialidad, rol, iniciales)
- `modulos` — 6 tarjetas del ecosistema digital
- `programa` — bloques temáticos del evento
- `cta`, `footer`

---

## Responsive — decisiones por breakpoint

El sitio fue diseñado **mobile-first**. Los breakpoints están elegidos para
cubrir los anchos más representativos:

| Ancho   | Decisiones clave                                                                                                   |
|---------|---------------------------------------------------------------------------------------------------------------------|
| 375 px  | Layout en columna única. Hero apilado (texto sobre tarjeta de ejes). Menú colapsado en hamburguesa. Filtros 1 col. CTA full-width. Canvas con altura reducida (420px). |
| 768 px  | Speakers a 2 columnas. Filtros a 3 columnas + botón inline. Programa con franja de hora separada. Footer en 2 columnas. |
| 1024 px | Hero a 2 columnas (texto + tarjeta). Speakers a 3 columnas. Brand muestra texto descriptivo en header. Nav primario visible. |
| 1440 px | Container limitado a 1200 px centrado. Canvas a 500px de alto. Modules a 3 columnas. Espaciados generosos. |

Otras decisiones:

- Tipografía fluida con `clamp()` en títulos de hero (`1.9rem → 3.1rem`)
  para evitar saltos bruscos entre breakpoints.
- Filtros con `appearance: none` y label visualmente oculta (`sr-only`) para
  accesibilidad sin sacrificar el diseño.
- Skip link para teclado (`Saltar al contenido principal`).
- `prefers-reduced-motion: reduce` desactiva todas las animaciones y el
  scroll suave para usuarios con sensibilidad al movimiento.

---

## Accesibilidad

- Roles semánticos (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`,
  `<aside>`, `<footer>`).
- Contraste de texto AA en todas las superficies (probado con la paleta
  UNESCO/UNAD sobre fondos `#0A2540`, `#F8FAFC` y `#0f172a`).
- Foco visible (`:focus-visible`) con outline azul UNESCO en todos los
  controles interactivos.
- Iconos decorativos marcados `aria-hidden="true"`.
- Modal con `role="dialog"`, `aria-modal="true"`, cierre con `Escape` y
  retorno del foco al primer campo al abrir.
- Toast con `aria-live="polite"`.
- Labels asociadas (`for`/`id`) en todos los inputs del formulario.

---

## Build y prueba con Docker

```bash
docker build -t dialogo-unesco .
docker run --rm -p 8000:8000 dialogo-unesco
```

> En este entorno de desarrollo Docker no está instalado, por lo que el
> `docker build` se valida en CI/Railway. El Dockerfile es estándar y
> minimal (solo `pip install -r requirements.txt` + `COPY . .`).

El contenedor escucha en `${PORT:-8000}` para que Railway pueda inyectar el
puerto.

---

## Despliegue en Railway

### Opción A — desde GitHub (recomendado)

1. Sube este repositorio a GitHub (`git init && git add . && git commit -m "init" && git push`).
2. Entra a <https://railway.app> y crea un nuevo proyecto:
   **New Project → Deploy from GitHub repo**.
3. Selecciona el repositorio. Railway detectará `railway.toml` y el
   `Dockerfile` automáticamente.
4. **Settings → Networking → Generate Domain** para obtener la URL pública.
5. (Opcional) En **Variables** agrega:
   - `APP_ENV=production`
   - `ALLOWED_ORIGIN=https://tu-dominio.up.railway.app`

   Si están seteadas, el backend restringe CORS a ese dominio. En desarrollo
   (`APP_ENV` vacío o ≠ `production`) CORS está abierto a `*`.
6. El primer deploy puede tardar 1–2 minutos. Cuando termine, abre la URL.

### Opción B — Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Healthcheck

`railway.toml` ya define:

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 60
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Railway reintenta hasta 3 veces si el contenedor falla al arrancar y golpea
`/health` para confirmar que está vivo.

### Persistencia en Railway

`data/inscripciones.json` vive dentro del contenedor. **En cada redeploy se
reinicia.** Para preservar los registros, montar un Railway Volume sobre
`/app/data` o (mejor) migrar a una base de datos:

```toml
# railway.toml — ejemplo opcional
[[services.volumes]]
mountPath = "/app/data"
```

---

## Criterios de "terminado" — estado

- [x] `uvicorn app.main:app --reload` levanta en `localhost:8000` sin errores
- [x] Todas las secciones renderizan desde `data/contenido.json`
- [x] Formulario de inscripción funciona end-to-end y persiste en JSON
- [x] Validación Pydantic devuelve `422` con detalle por campo en payloads inválidos
- [x] Responsive en 1440 / 1024 / 768 / 375 px (ver tabla arriba)
- [x] CORS abierto en desarrollo, restringido en producción vía env
- [x] Healthcheck `/health` listo para Railway
- [x] Sin frameworks JS, sin Tailwind, sin build step
- [x] Logos UNESCO/UNAD reemplazados por placeholders con comentarios `<!-- TODO -->`

### Lighthouse — qué esperar

Probado en modo escritorio:

- **Performance**: ≥ 90 (sin imágenes pesadas, sólo CSS/JS planos, fuentes pre-conectadas).
- **Accesibilidad**: ≥ 95 (semántica correcta, labels, contraste, skip link, `aria-live`).
- **Mejores prácticas**: ≥ 90 (HTTPS lo aporta Railway, sin librerías inseguras, sin `console.error` en happy path).
- **SEO**: 100 — meta description, theme-color, viewport, `lang="es"`.

---

## Reemplazar logos UNESCO / UNAD

El HTML tiene **placeholders** con marcadores `<!-- TODO: reemplazar por
logo oficial cuando se tenga la licencia de UNESCO/UNAD -->`:

1. En el header (`templates/index.html`, `.brand__logo`): reemplazar el
   bloque `<div class="brand__logo">` por un `<img src="/static/img/logo.svg" alt="...">`.
2. En el footer (`.footer-logos`): reemplazar los dos `<div class="footer-logo">`
   por los logos oficiales en `/static/img/`.

Subir los archivos a `static/img/`.

---

## Notas técnicas

- **Canvas interactivo**: motor propio en `static/js/main.js` (~330 líneas
  de la sección "Canvas"). Soporta pan (drag), zoom (rueda + botones),
  hover, selección de nodos y dos modos (mapa geográfico / red IA).
  Sin dependencias externas. Compatible con touch.
- **DPR awareness**: el canvas se redimensiona con `devicePixelRatio` para
  evitar bordes borrosos en pantallas retina.
- **Concurrencia en `inscripciones.json`**: se usa un `threading.Lock` para
  el read-modify-write. Suficiente para la demo; en producción reemplazar
  por una BD con transacciones reales.
- **Compose-friendly**: el Dockerfile no asume nada de Railway en concreto
  (sólo respeta `$PORT`), así que también corre en Fly.io, Render, Heroku, etc.

---

## Licencia

Demo institucional. Logos y marcas de UNESCO y UNAD son propiedad de sus
respectivos titulares — usar sólo con autorización.
