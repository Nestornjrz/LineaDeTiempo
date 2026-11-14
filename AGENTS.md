# Instrucciones para agentes de IA (Claude, Codex y otros)

## Fuente de información: siempre jw.org

Todo el contenido bíblico de este proyecto (personajes, fechas, descripciones,
valoraciones, citas y eventos) **debe basarse siempre en las publicaciones de los
testigos de Jehová**:

- **www.jw.org** (sitio oficial).
- **wol.jw.org** — Biblioteca en Línea Watchtower, en español (`/es/`), sobre todo:
  - *Perspicacia para comprender las Escrituras* (artículos por personaje).
  - *Toda Escritura es inspirada de Dios y provechosa* (fechas de escritura y
    periodo que abarca cada libro bíblico).
  - Los apéndices de la *Traducción del Nuevo Mundo* (cuadros de reyes, profetas
    y fechas).
- Las citas bíblicas y los nombres propios se escriben como en la
  **Traducción del Nuevo Mundo** en español (por ejemplo: Jehová, Abrahán,
  Rehoboam, Jehoás, Ahíyá).

Reglas:

1. No uses otras cronologías (por ejemplo, la que fecha la destrucción de
   Jerusalén en 587/586 a.e.c.). Se usa la cronología de las publicaciones:
   607 a.e.c. para la destrucción de Jerusalén, 537 a.e.c. para el regreso, etc.
2. Si jw.org da una fecha como aproximada («c.», «antes de», «después de» o con
   «?»), márcala como aproximada en los datos (campo `a`) y, si hace falta,
   explícalo en el texto.
3. Si no encuentras un dato en jw.org, no lo inventes: déjalo fuera o
   pregúntale al usuario.
4. Usa el estilo de fechas del proyecto: «a.e.c.» y «e.c.».

## Sobre el proyecto

- Es una PWA de una sola página: casi todo está en `index.html` (datos en
  `CATS`, `PEOPLE`, `JUICIO` y `EVENTS`, más el código de dibujo).
- `sw.js` es el service worker; si cambias iconos o el manifiesto, sube la
  versión de `CACHE`.
- La interfaz, los comentarios y los mensajes de commit van en español.
