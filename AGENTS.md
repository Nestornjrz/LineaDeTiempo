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

## Lo que dice la Biblia y lo que no

La app muestra lo que dice la Biblia. Todo lo que está fuera del registro bíblico
se marca como tal y no se mezcla con lo bíblico:

- **Parentescos por deducción.** Si la Biblia no dice un parentesco con todas
  las letras, sino que se deduce (aunque sea la explicación de *Perspicacia*;
  p. ej., que Helí era el padre de María, que Clopas es Alfeo, o que «hijo»
  significa «nieto»), se marca como deducción. Solo se ve al activar «Mostrar lo
  que no está en la Biblia», y con una nota que explica de dónde sale.
- **Lo que la Biblia dice, tal como lo dice.** Con las deducciones ocultas se
  muestra la relación con las palabras de la Biblia (p. ej., «Lucas lo llama hijo
  de Helí»), sin la interpretación.
- **Personajes que no están en la Biblia** (personajes históricos, como algunos
  miembros de la familia de Herodes): se marcan como extrabíblicos y también
  dependen de «Mostrar lo que no está en la Biblia». En la línea de tiempo
  dependen de «Fuente: Extrabíblicos».
- Ante la duda de si algo lo dice la Biblia o se deduce, trátalo como deducción
  y explícalo en la nota.

## Sobre el proyecto

- Es una PWA sin compilación (HTML, CSS y JavaScript sueltos):
  - `index.html`: portada, el menú de inicio con las secciones de la app
    (línea de tiempo y árbol genealógico).
  - `linea.html`: la línea de tiempo (código de dibujo, filtros y fichas). Tiene un
    modo «Linaje» (`verLinaje`): una persona y sus antepasados con fechas, unidos por
    conectores (`linea.html#linaje=<id>&l=<pa|ma|pl|su>`).
  - `arbol.html`: el árbol genealógico, centrado en una persona: su línea de
    antepasados, sus hermanos, sus cónyuges y sus hijos (horizontal en la PC,
    vertical en el celular). Las dos páginas se enlazan con `#p=<id>`
    (p. ej., `arbol.html#p=isaac`, `linea.html#p=isaac`). Incluye «¿Qué parentesco
    tienen?», que calcula el parentesco entre dos personas a partir de `FAMILIA`.
    La línea de antepasados (`linaje`, `opcionesLinaje`) está en `datos.js` y la
    usan las dos páginas.
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
