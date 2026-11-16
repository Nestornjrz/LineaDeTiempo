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

- Es una PWA sin compilación (HTML, CSS y JavaScript sueltos):
  - `index.html`: portada, el menú de inicio con las secciones de la app
    (línea de tiempo y árbol genealógico).
  - `linea.html`: la línea de tiempo (código de dibujo, filtros y fichas).
  - `arbol.html`: el árbol genealógico, centrado en una persona: su línea de
    antepasados, sus hermanos, sus cónyuges y sus hijos (horizontal en la PC,
    vertical en el celular). Las dos páginas se enlazan con `#p=<id>`
    (p. ej., `arbol.html#p=isaac`, `linea.html#p=isaac`).
  - `datos.js`: los datos que comparten las secciones (`CATS`, `GRUPOS`,
    `PEOPLE`, `JUICIO`, `EVENTS` y `JW`). Cada entrada de `PEOPLE` tiene un `id`
    estable (minúsculas, sin acentos ni artículos, p. ej. `abrahan`,
    `jehoram-juda`); no lo cambies aunque cambie el nombre, y dale uno nuevo y
    único a cada entrada que añadas. En `linea.html`, `p.ix` es la posición de
    la entrada en `PEOPLE`.
    `FAMILIA` guarda el parentesco para el árbol genealógico (padre, madre,
    padre legal, suegro, cónyuges y hermanos), con los textos que lo muestran
    (`rp`). Las personas que no tienen fechas solo están en `FAMILIA`. Los
    campos se explican en el comentario que hay sobre `FAMILIA`.
  - Después de cambiar `datos.js`, ejecuta `node herramientas/validar-datos.cjs`:
    comprueba ids, vínculos, nombres repetidos, ciclos y fechas, y que las dos
    genealogías de Jesús (Mateo y Lucas) lleguen hasta Adán.
  - `comun.css`: colores (modo claro y oscuro) y estilos base de todas las páginas.
- `sw.js` es el service worker; si cambias iconos o el manifiesto, o añades
  archivos a `ASSETS`, sube la versión de `CACHE`.
- La interfaz, los comentarios y los mensajes de commit van en español.
