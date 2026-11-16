// Comprueba los datos de datos.js, sobre todo el parentesco (FAMILIA).
// Uso: node herramientas/validar-datos.cjs        (desde la carpeta del proyecto)
//      node herramientas/validar-datos.cjs --lineas   (además, muestra las dos genealogías de Jesús)
// Lo comprueba todo dos veces: solo con lo que dice la Biblia (como se ve normalmente) y con
// «Mostrar lo que no está en la Biblia» (parentescos por deducción y personajes extrabíblicos).
// Termina con código 1 si encuentra errores; los avisos no impiden continuar.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'datos.js'), 'utf8');
const CLAVES_DE = ['pa', 'ma', 'pl', 'su', 'cy', 'hm', 'mh', 'persona'];

function validar(verNoBiblico){
  globalThis.VER_NO_BIBLICO = verNoBiblico;
  const { PEOPLE, FAMILIA } = new Function(src + '\nreturn {PEOPLE, FAMILIA};')();

  const errores = [], avisos = [];
  const error = m => errores.push(m), aviso = m => avisos.push(m);

  // ---------- Ids y nombres de PEOPLE ----------
  const P = new Map();
  for (const p of PEOPLE){
    if (!p.id) error(`PEOPLE: «${p.n}» no tiene id`);
    else if (P.has(p.id)) error(`PEOPLE: id repetido «${p.id}»`);
    else P.set(p.id, p);
  }

  // ---------- FAMILIA ----------
  const F = new Map();
  for (const f of FAMILIA){
    if (!f.id){ error(`FAMILIA: entrada sin id (${JSON.stringify(f).slice(0, 60)})`); continue; }
    if (F.has(f.id)) error(`FAMILIA: id repetido «${f.id}»`);
    F.set(f.id, f);
    if (P.has(f.id)){
      if (f.n || f.d || f.r) error(`FAMILIA: «${f.id}» ya está en PEOPLE; su nombre, descripción y textos van allí`);
      if (f.xb) error(`FAMILIA: «${f.id}» está en PEOPLE; los extrabíblicos de la línea de tiempo se marcan allí con su categoría`);
    } else {
      for (const k of ['n', 'd', 'r']) if (!f[k]) error(`FAMILIA: «${f.id}» no está en PEOPLE y le falta «${k}»`);
      if (f.s !== undefined || f.e !== undefined) error(`FAMILIA: «${f.id}» tiene fechas; las personas con fechas van en PEOPLE`);
    }
  }

  // Persona completa: datos de PEOPLE y de FAMILIA juntos
  const persona = id => ({...(P.get(id) || {}), ...(F.get(id) || {})});
  const existe = id => P.has(id) || F.has(id);
  const nombre = id => persona(id).n || id;

  // Nombres repetidos entre personas (el árbol los mostraría iguales)
  const nombres = new Map();
  for (const id of new Set([...P.keys(), ...F.keys()])){
    const n = persona(id).n;
    if (nombres.has(n)) error(`Nombre repetido «${n}» (${nombres.get(n)} y ${id}): añade una aclaración entre paréntesis`);
    else nombres.set(n, id);
  }

  // Vínculos
  const PADRES = ['pa', 'ma', 'pl'];
  for (const f of FAMILIA){
    const refs = [...PADRES.map(k => [k, f[k]]), ['su', f.su], ...(f.cy || []).map(c => ['cy', c]),
                  ...(f.hm || []).map(h => ['hm', h]), ...(f.mh || []).map(h => ['mh', h]),
                  ...(f.pm || []).map(h => ['pm', h])].filter(([, v]) => v);
    for (const [k, v] of refs){
      if (!existe(v)) { error(`«${f.id}».${k}: no existe la persona «${v}»`); continue; }
      if (v === f.id) error(`«${f.id}».${k}: se refiere a sí mismo`);
      const mujer = !!persona(v).mu;
      if ((k === 'pa' || k === 'pl' || k === 'su') && mujer) error(`«${f.id}».${k} = «${v}», que es mujer`);
      if (k === 'ma' && !mujer) error(`«${f.id}».ma = «${v}», que no está marcada como mujer (mu:1)`);
    }
    if ((f.pa || f.ma || f.pl || f.su || f.cy || f.hm || f.pm) && !f.rp) error(`«${f.id}»: tiene parentesco pero no textos (rp)`);
    if (f.sx && f.mu) error(`«${f.id}»: tiene sx (no se sabe si es hombre o mujer) y también mu`);
    if (f.pl && !f.np) aviso(`«${f.id}»: tiene padre legal (pl); conviene explicarlo en np`);
    if (f.pt && (!f.pl || !['adoptivo', 'legal'].includes(f.pt))) error(`«${f.id}».pt = «${f.pt}»: debe ser 'adoptivo' o 'legal', y solo va con pl`);
    if (f.pr) error(`«${f.id}»: pr ya no se usa; los parentescos que no dice la Biblia se marcan con de`);
    // Deducciones: cada clave de «de» debe ser válida, y el vínculo debe estar (si se muestran) y explicarse
    if (f.de && !Array.isArray(f.de)) error(`«${f.id}».de debe ser una lista, p. ej. ['pa']`);
    for (const k of f.de || []){
      if (!CLAVES_DE.includes(k)) error(`«${f.id}».de: «${k}» no es válido (${CLAVES_DE.join(', ')})`);
      else if (verNoBiblico && k !== 'persona' && !f[k]) error(`«${f.id}».de incluye «${k}», pero no tiene ese vínculo`);
    }
    if ((f.de || []).length && !f.np) error(`«${f.id}»: tiene un parentesco por deducción (de) pero no lo explica en np`);
    for (const h of f.mh || []){
      const o = F.get(h) || {};
      if (!['pa', 'ma'].some(k => f[k] && f[k] === o[k])) error(`«${f.id}».mh = «${h}»: los medios hermanos deben tener el padre o la madre en común`);
    }
    for (const c of f.cy || []){
      if ((F.get(c)?.cy || []).includes(f.id)) aviso(`Matrimonio anotado dos veces: «${f.id}» y «${c}»`);
      if (!!persona(c).mu === !!persona(f.id).mu) aviso(`«${f.id}» y su cónyuge «${c}» tienen el mismo sexo en los datos`);
    }
  }

  // Ciclos (alguien que sería su propio antepasado)
  const estado = new Map();   // 1 = visitando, 2 = terminado
  const visitar = (id, camino) => {
    if (estado.get(id) === 2) return;
    if (estado.get(id) === 1){ error(`Ciclo en el parentesco: ${[...camino, id].join(' → ')}`); return; }
    estado.set(id, 1);
    const f = F.get(id) || {};
    for (const k of PADRES) if (f[k] && existe(f[k])) visitar(f[k], [...camino, id]);
    estado.set(id, 2);
  };
  for (const id of F.keys()) visitar(id, []);

  // Fechas: con nacimiento y muerte conocidos (k: 'vida'), el padre o la madre nace antes que el hijo
  for (const f of FAMILIA){
    const h = P.get(f.id);
    if (!h || h.k !== 'vida') continue;
    for (const k of ['pa', 'ma']){
      const p = P.get(f[k]);
      if (p && p.k === 'vida' && p.s >= h.s) error(`Fechas: «${p.id}» (${p.s}) no nace antes que su hijo «${h.id}» (${h.s})`);
    }
  }

  // ---------- Las dos genealogías de Jesús ----------
  // Mateo sigue la línea legal (padre legal antes que el carnal). Lucas sube de Helí a Adán (suegro
  // antes que padre, porque Lucas llama «hijo» al yerno): con las deducciones, por María, la hija
  // de Helí; sin ellas, como lo dice Lucas: por José, «hijo de Helí».
  function linea(desde, orden){
    const out = [desde];
    for (let id = desde, n = 0; n < 200; n++){
      const f = F.get(id) || {};
      const k = orden.find(k => f[k]);
      if (!k) break;
      id = f[k];
      out.push(id);
    }
    return out;
  }
  const mateo = linea('jesus', ['pl', 'pa']);
  const lucas = ['jesus', ...linea(verNoBiblico ? 'maria' : 'jose-maria', ['su', 'pl', 'pa'])];
  for (const [nom, l] of [['Mateo', mateo], ['Lucas', lucas]])
    if (l[l.length - 1] !== 'adan') error(`La línea de ${nom} no llega a Adán: se corta en «${l[l.length - 1]}»`);
  // Lucas 3:23-38 nombra 74 personas de Helí a Adán; sin el segundo Cainán (ver la nota de Selá), 73
  const deHeli = lucas.slice(lucas.indexOf('heli'));
  if (deHeli.length !== 73) error(`La línea de Lucas tiene ${deHeli.length} personas de Helí a Adán; deberían ser 73`);

  // ---------- Resumen ----------
  const enArbol = new Set();
  for (const f of FAMILIA){
    const rel = [f.pa, f.ma, f.pl, f.su, ...(f.cy || []), ...(f.hm || []), ...(f.pm || [])].filter(Boolean);
    if (rel.length){ enArbol.add(f.id); rel.forEach(v => enArbol.add(v)); }
  }
  const resumen = [
    `Personas en el árbol: ${enArbol.size} (de ellas, ${FAMILIA.filter(f => !P.has(f.id)).length} solo en el árbol, sin fechas)`,
    `Mujeres: ${[...enArbol].filter(id => persona(id).mu).length} · sin nombre en la Biblia: ${[...enArbol].filter(id => persona(id).sn).length}`,
    `Vínculos de padre o madre: ${FAMILIA.reduce((n, f) => n + PADRES.filter(k => f[k]).length, 0)} · matrimonios: ${FAMILIA.reduce((n, f) => n + (f.cy || []).length, 0)}` +
      (verNoBiblico ? ` · entradas con deducciones: ${FAMILIA.filter(f => (f.de || []).length).length}` : ''),
    `Línea de Mateo (legal, por José): ${mateo.length} personas de Jesús a Adán`,
    `Línea de Lucas (${verNoBiblico ? 'natural, por María' : 'como la escribe Lucas, por José'}): ${lucas.length} personas de Jesús a Adán`,
  ];
  if (process.argv.includes('--lineas'))
    resumen.push('', 'Mateo: ' + mateo.map(nombre).join(' ← '), '', 'Lucas: ' + lucas.map(nombre).join(' ← '));
  return {errores, avisos, resumen};
}

let total = 0;
for (const [titulo, ver] of [['Solo lo que dice la Biblia', false], ['Con lo que no está en la Biblia (deducciones)', true]]){
  const {errores, avisos, resumen} = validar(ver);
  console.log(`== ${titulo} ==`);
  resumen.forEach(l => console.log(l));
  for (const a of avisos) console.log('Aviso: ' + a);
  for (const e of errores) console.log('ERROR: ' + e);
  console.log('');
  total += errores.length;
}
console.log(total ? `${total} errores` : 'Sin errores');
process.exit(total ? 1 : 0);
