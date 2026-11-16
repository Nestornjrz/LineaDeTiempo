// Comprueba los datos de datos.js, sobre todo el parentesco (FAMILIA).
// Uso: node herramientas/validar-datos.cjs        (desde la carpeta del proyecto)
//      node herramientas/validar-datos.cjs --lineas   (además, muestra las dos genealogías de Jesús)
// Termina con código 1 si encuentra errores; los avisos no impiden continuar.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'datos.js'), 'utf8');
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
                ...(f.hm || []).map(h => ['hm', h]), ...(f.mh || []).map(h => ['mh', h])].filter(([, v]) => v);
  for (const [k, v] of refs){
    if (!existe(v)) { error(`«${f.id}».${k}: no existe la persona «${v}»`); continue; }
    if (v === f.id) error(`«${f.id}».${k}: se refiere a sí mismo`);
    const mujer = !!persona(v).mu;
    if ((k === 'pa' || k === 'pl' || k === 'su') && mujer) error(`«${f.id}».${k} = «${v}», que es mujer`);
    if (k === 'ma' && !mujer) error(`«${f.id}».ma = «${v}», que no está marcada como mujer (mu:1)`);
  }
  if ((f.pa || f.ma || f.pl || f.su || f.cy || f.hm) && !f.rp) error(`«${f.id}»: tiene parentesco pero no textos (rp)`);
  if (f.sx && f.mu) error(`«${f.id}»: tiene sx (no se sabe si es hombre o mujer) y también mu`);
  if (f.pl && !f.np) aviso(`«${f.id}»: tiene padre legal (pl); conviene explicarlo en np`);
  if (f.pt && (!f.pl || !['adoptivo', 'legal'].includes(f.pt))) error(`«${f.id}».pt = «${f.pt}»: debe ser 'adoptivo' o 'legal', y solo va con pl`);
  if (f.pr && !f.np) error(`«${f.id}»: tiene parentesco probable (pr) pero no lo explica en np`);
  if (f.pr && !['pa', 'ma'].includes(f.pr) || f.pr && !f[f.pr]) error(`«${f.id}».pr = «${f.pr}»: debe ser 'pa' o 'ma', y ese vínculo debe existir`);
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
// Mateo sigue la línea legal (padre legal antes que el carnal); Lucas, la de María (suegro antes
// que padre, porque Lucas llama «hijo» al yerno).
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
const lucas = ['jesus', ...linea('maria', ['su', 'pl', 'pa'])];   // de Jesús se pasa a María
for (const [nom, l] of [['Mateo', mateo], ['Lucas', lucas]])
  if (l[l.length - 1] !== 'adan') error(`La línea de ${nom} no llega a Adán: se corta en «${l[l.length - 1]}»`);
// Lucas 3:23-38 nombra 74 personas de Helí a Adán; sin el segundo Cainán (ver la nota de Selá), 73
const deHeli = lucas.slice(lucas.indexOf('heli'));
if (deHeli.length !== 73) error(`La línea de Lucas tiene ${deHeli.length} personas de Helí a Adán; deberían ser 73`);

// ---------- Resumen ----------
const enArbol = new Set();
for (const f of FAMILIA){
  if (f.pa || f.ma || f.pl || f.su || f.cy || f.hm) enArbol.add(f.id);
  for (const v of [f.pa, f.ma, f.pl, f.su, ...(f.cy || []), ...(f.hm || [])]) if (v) enArbol.add(v);
}
const nuevas = FAMILIA.filter(f => !P.has(f.id));
console.log(`Personas en el árbol: ${enArbol.size} (de ellas, ${nuevas.length} solo en el árbol, sin fechas)`);
console.log(`Mujeres: ${[...enArbol].filter(id => persona(id).mu).length} · sin nombre en la Biblia: ${[...enArbol].filter(id => persona(id).sn).length}`);
console.log(`Vínculos de padre o madre: ${FAMILIA.reduce((n, f) => n + PADRES.filter(k => f[k]).length, 0)} · matrimonios: ${FAMILIA.reduce((n, f) => n + (f.cy || []).length, 0)}`);
console.log(`Línea de Mateo (legal, por José): ${mateo.length} personas de Jesús a Adán`);
console.log(`Línea de Lucas (natural, por María): ${lucas.length} personas de Jesús a Adán`);
if (process.argv.includes('--lineas')){
  console.log('\nMateo: ' + mateo.map(nombre).join(' ← '));
  console.log('\nLucas: ' + lucas.map(nombre).join(' ← '));
}
for (const a of avisos) console.log('Aviso: ' + a);
for (const e of errores) console.log('ERROR: ' + e);
console.log(errores.length ? `\n${errores.length} errores` : '\nSin errores');
process.exit(errores.length ? 1 : 0);
