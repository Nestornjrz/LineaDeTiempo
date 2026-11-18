/* Parentesco: las personas (PEOPLE + FAMILIA de datos.js), sus vínculos y el cálculo de
   «¿Qué parentesco tienen?». Lo usan el árbol genealógico (arbol.html) y los juegos (juegos.html).
   Se carga después de datos.js. */

/* ===================== PERSONAS Y PARENTESCO =====================
   Cada persona junta sus datos de PEOPLE (fechas, descripción…) y de FAMILIA (parentesco).
   ord: orden de los datos, que en FAMILIA sigue el de las genealogías (y el de nacimiento). */
const PER = new Map();
PEOPLE.forEach((p, i) => PER.set(p.id, {...p, ord:100000 + i}));
FAMILIA.forEach((f, i) => PER.set(f.id, {...(PER.get(f.id) || {}), ...f, ord:i}));
const get = id => PER.get(id);
const push = (m, k, v) => { if (!m.has(k)) m.set(k, []); if (!m.get(k).includes(v)) m.get(k).push(v); };
const HIJOS = new Map(), CONYUGES = new Map(), YERNOS = new Map(), HERMANOS = new Map(), PRIMOS = new Map();
const LEJANOS = new Map();   // descendientes lejanos (ds) de cada antepasado
for (const f of FAMILIA){
  for (const k of ['pa', 'ma', 'pl']) if (f[k]) push(HIJOS, f[k], f.id);
  for (const c of f.cy || []){ push(CONYUGES, f.id, c); push(CONYUGES, c, f.id); }
  for (const c of f.pm || []){ push(PRIMOS, f.id, c); push(PRIMOS, c, f.id); }
  if (f.su) push(YERNOS, f.su, f.id);
  if (f.ds) push(LEJANOS, f.ds, f.id);
  if (f.hm){ const g = [f.id, ...f.hm]; for (const a of g) for (const b of g) if (a !== b) push(HERMANOS, a, b); }
}
// ¿El vínculo entre a y b es una deducción (de en los datos)? Solo puede pasar si se muestra lo
// que no está en la Biblia; si no, esos vínculos ya no están en FAMILIA.
// dedDe(x, y): la deducción está anotada en x (su ficha la explica)
const dedDe = (x, y) => {
  const p = get(x);
  return !!p && (p.de || []).some(k => k !== 'su' && k !== 'ds' && (p[k] === y || (Array.isArray(p[k]) && p[k].includes(y))));
};
const dedVinculo = (a, b) => dedDe(a, b) || dedDe(b, a);
// ¿x es descendiente lejano de y por una deducción que se está mostrando? (ds con de:['ds'])
const dsDeducido = (x, y) => get(x)?.ds === y && deducido(get(x), 'ds') && !dsLiteral(x);
// Paso de la línea de antepasados que se dibuja con línea discontinua y etiqueta: padre legal,
// suegro (o yerno al que Lucas llama «hijo»), antepasado lejano y vínculo por deducción
const pasoRaro = st => ['pl', 'su', 'ds'].includes(st.rel) || dedVinculo(st.child, st.id);
// (El del antepasado lejano, corto para que quepa: «llamado «hijo»» o «por deducción»; el grupo de
// la persona ya dice «Descendiente»)
const etiquetaPaso = st => st.rel === 'ds' ? (dsLiteral(st.child) ? 'llamado «hijo»' : dsDeducido(st.child, st.id) ? 'por deducción' : 'antepasado')
                         : ['pl', 'su'].includes(st.rel) ? vinculo(st.rel, st.child)
                         : dedVinculo(st.child, st.id) ? 'por deducción' : '';
const byOrd = (a, b) => get(a).ord - get(b).ord;
const hijosDe = id => [...(HIJOS.get(id) || [])].sort(byOrd);
const nombre = id => get(id).n;
// Nombre breve para las tarjetas: sin la aclaración entre paréntesis, que el árbol ya muestra
// con el parentesco (p. ej., «Gad (hijo de Jacob)» → «Gad»)
const corto = id => get(id).lb || get(id).n.replace(/\s*\(.*\)$/, '');
// Nombre dentro de una frase: las personas sin nombre en la Biblia llevan artículo
// («Hijos de la hija de Súa», «Moab es hijo de la hija mayor de Lot»)
const enFrase = id => {
  const p = get(id), c = corto(id);
  return p.sn ? (p.mu ? 'la ' : 'el ') + c.charAt(0).toLowerCase() + c.slice(1) : c;
};
const mayuscula = s => s.charAt(0).toUpperCase() + s.slice(1);

// Etiqueta junto a un hijo cuando el parentesco no es el carnal (los yernos van en su propio grupo)
function tagDe(id, padre){
  const p = get(id);
  if (p.pl !== padre || p.pa === padre) return '';
  const t = tipoPl(id);
  return p.mu ? 'hija ' + (t === 'adoptivo' ? 'adoptiva' : 'legal') : 'hijo ' + t;
}

/* ===================== ¿QUÉ PARENTESCO TIENEN? =====================
   Parentesco de sangre: se busca el antepasado común más cercano siguiendo padres y madres
   (pa, ma). Con las generaciones de cada persona hasta él (da y db) se nombra el parentesco:
   da = 0 → antepasado (padre, abuelo…); db = 0 → descendiente (hijo, nieto…); 1 y 1 → hermanos;
   1 y 2 → tío; 2 y 2 → primos… Si no tiene un nombre corriente, se explica con el antepasado común.
   Además: padre legal o adoptivo, matrimonio, yerno, y parentesco por matrimonio (cuñados, suegros).
   Si no hay parentesco de sangre, se prueba también por los padres legales (pl). */
const ASC = [null, ['padre', 'madre'], ['abuelo', 'abuela'], ['bisabuelo', 'bisabuela'], ['tatarabuelo', 'tatarabuela']];
const DESC = [null, ['hijo', 'hija'], ['nieto', 'nieta'], ['bisnieto', 'bisnieta'], ['tataranieto', 'tataranieta']];
// Palabra según sea hombre o mujer; si no se sabe (sx), las dos («padre o madre»)
const gen = (id, par) => get(id).sx ? `${par[0]} o ${par[1]}` : par[get(id).mu ? 1 : 0];
const N = id => get(id).n;

// Antepasados de una persona: generaciones hasta cada uno, y por qué hijo se llega (para el camino)
// Los hermanos anotados con hm (p. ej., Zeruyá y David) comparten un progenitor que la Biblia no
// nombra: en el cálculo es un antepasado más («hm:…»), que nunca se muestra.
const GRUPO_HM = new Map();
{
  const grupos = [];
  for (const f of FAMILIA) if (f.hm){
    const ids = new Set([f.id, ...f.hm]);
    const unidos = grupos.filter(g => [...ids].some(x => g.has(x)));
    for (const g of unidos){ g.forEach(x => ids.add(x)); grupos.splice(grupos.indexOf(g), 1); }
    grupos.push(ids);
  }
  for (const g of grupos){ const k = 'hm:' + [...g].sort().join(','); g.forEach(x => GRUPO_HM.set(x, k)); }
}
const esGrupo = id => id.startsWith('hm:');
function antepasados(id, claves){
  const dist = new Map([[id, 0]]), hijo = new Map(), cola = [id];
  const llegar = (y, x) => { if (!dist.has(y)){ dist.set(y, dist.get(x) + 1); hijo.set(y, x); cola.push(y); } };
  while (cola.length){
    const x = cola.shift();
    if (esGrupo(x)) continue;
    const p = get(x);
    for (const k of claves) if (p[k] && PER.has(p[k])) llegar(p[k], x);
    if (GRUPO_HM.has(x)) llegar(GRUPO_HM.get(x), x);
  }
  return {dist, hijo};
}
// Camino de una persona hasta su antepasado c: [persona, …, c]
function subida(anc, c){
  const out = [c];
  while (anc.hijo.has(out[0])) out.unshift(anc.hijo.get(out[0]));
  return out;
}
// Antepasado común más cercano (el de menos generaciones en total; a igualdad, el más equilibrado)
function sangre(a, b, claves){
  const A = antepasados(a, claves), B = antepasados(b, claves);
  let best = null;
  for (const [c, da] of A.dist){
    const db = B.dist.get(c);
    if (db === undefined) continue;
    if (!best || da + db < best.da + best.db || (da + db === best.da + best.db && Math.max(da, db) < Math.max(best.da, best.db)))
      best = {c, da, db};
  }
  if (!best) return null;
  // Antepasados comunes a esa distancia; si hay alguno con nombre, se deja fuera el «no nombrado»
  let comunes = [...A.dist].filter(([c, da]) => da === best.da && B.dist.get(c) === best.db).map(([c]) => c);
  const reales = comunes.filter(c => !esGrupo(c));
  if (reales.length) comunes = reales.sort(byOrd);
  const c = comunes[0];
  return {...best, c, comunes, grupo:esGrupo(c), ca:subida(A, c), cb:subida(B, c)};
}
// Hermanos de padre o de madre solamente
function medios(a, b, comunes){
  const pa = get(a), pb = get(b);
  if ((pa.mh || []).includes(b) || (pb.mh || []).includes(a)) return true;
  if (comunes.length !== 1) return false;
  const c = comunes[0];
  const otro = p => c === p.ma ? (p.pa || (p.pl ? 'pl:' + p.pl : null)) : c === p.pa ? (p.ma || null) : null;
  const oa = otro(pa), ob = otro(pb);
  return !!(oa && ob && oa !== ob);
}
// Nombre del parentesco de a respecto de b (o null si no tiene un nombre corriente)
function termino(da, db, a, medio){
  const g = par => gen(a, par);
  if (da === 0) return db < ASC.length ? g(ASC[db]) : g(['antepasado', 'antepasada']);
  if (db === 0) return da < DESC.length ? g(DESC[da]) : 'descendiente';
  if (da === 1 && db === 1) return g(medio ? ['medio hermano', 'media hermana'] : ['hermano', 'hermana']);
  if (da === 1 && db === 2) return g(['tío', 'tía']);
  if (da === 2 && db === 1) return g(['sobrino', 'sobrina']);
  if (da === 1 && db === 3) return g(['tío abuelo', 'tía abuela']);
  if (da === 3 && db === 1) return g(['sobrino nieto', 'sobrina nieta']);
  if (da === db && da <= 4) return g([['primo', 'prima'], ['primo segundo', 'prima segunda'], ['primo tercero', 'prima tercera']][da - 2]);
  return null;
}
const desc = (id, n) => n < DESC.length ? gen(id, DESC[n]) : `descendiente (${n} generaciones después)`;
// Camino de a hasta b pasando por el antepasado común: a … c … b
// (Si el antepasado común es el progenitor no nombrado de unos hermanos, no se incluye)
const caminoPor = s => s.grupo ? [...s.ca.slice(0, -1), ...s.cb.slice(0, -1).reverse()]
                               : [...s.ca, ...s.cb.slice(0, -1).reverse()];
// «Los dos son hijos» / «Las dos son hijas»
const losDos = (a, b) => get(a).mu && get(b).mu ? 'Las dos son hijas' : 'Los dos son hijos';

// Frases que explican el parentesco de sangre de a con b (nm: nombre de cada persona en las frases)
function explicarSangre(a, b, s, pre, nm){
  const frases = [], exp = [];
  const lista = ids => ids.length > 1 ? ids.slice(0, -1).map(nm).join(', ') + ' y ' + nm(ids[ids.length - 1]) : nm(ids[0]);
  const t = termino(s.da, s.db, a, s.da === 1 && s.db === 1 && medios(a, b, s.comunes));
  if (t) frases.push(`${pre}${nm(a)} es ${t} de ${nm(b)}.`);
  else frases.push(`${pre}${nm(a)} y ${nm(b)} son parientes.`);
  if (s.da === 0 || s.db === 0){
    const n = s.da + s.db;
    if (n >= 5) exp.push(`Por este camino hay ${n} generaciones entre ${nm(a)} y ${nm(b)}.`);
  } else if (s.grupo){
    // Por unos hermanos cuyos padres (o cuál comparten) no nombra la Biblia
    if (s.da > 1 || s.db > 1){
      const sa = s.ca[s.ca.length - 2], sb = s.cb[s.cb.length - 2];
      exp.push(`${nm(sa)} y ${nm(sb)} eran ${get(sa).mu && get(sb).mu ? 'hermanas' : 'hermanos'}.`);
    }
  } else if (s.da === 1 && s.db === 1){
    const c = s.comunes[0];
    if (s.comunes.length > 1) exp.push(`${losDos(a, b)} de ${lista(s.comunes)}.`);
    else if (t && t.startsWith('medi')) exp.push(`Tienen ${get(c).mu ? 'la misma madre' : 'el mismo padre'}, ${nm(c)}, pero no ${get(c).mu ? 'el mismo padre' : 'la misma madre'}.`);
    else exp.push(`${losDos(a, b)} de ${nm(c)}.`);
  } else {
    exp.push(`${s.comunes.length > 1 ? 'Sus antepasados comunes más cercanos son' : 'Su antepasado común más cercano es'} ${lista(s.comunes)}: ` +
             `${nm(a)} es su ${desc(a, s.da)}, y ${nm(b)}, su ${desc(b, s.db)}.`);
  }
  return {frases, exp};
}

function parentesco(a, b){
  const A = get(a), B = get(b);
  let frases = [], exp = [], camino = null, comun = null;
  if (a === b) return {frases, exp, camino, comun};
  // En las frases, el nombre breve (sin la aclaración entre paréntesis), salvo que los dos coincidan
  const largo = corto(a) === corto(b);
  const nm = id => largo && (id === a || id === b) ? get(id).n : enFrase(id);
  const N = nm;   // dentro de esta función, todas las frases usan el nombre breve
  // Padre legal o adoptivo
  if (B.pl === a) frases.push(`${N(a)} es padre ${tipoPl(b)} de ${N(b)}.`);
  if (A.pl === b) frases.push(`${N(a)} es ${tagDe(a, b)} de ${N(b)}.`);
  // Matrimonio
  if ((CONYUGES.get(a) || []).includes(b)) frases.push(`${N(a)} es ${gen(a, ['esposo', 'esposa'])} de ${N(b)}.`);
  // Yerno al que la Biblia llama «hijo» (Lucas 3:27)
  if (A.su === b) frases.push(sueLiteral(a) ? `La genealogía de Lucas llama a ${N(a)} «hijo de ${N(b)}».` : `${N(a)} es yerno de ${N(b)}.`);
  if (B.su === a) frases.push(sueLiteral(b) ? `La genealogía de Lucas llama a ${N(b)} «hijo de ${N(a)}».` : `${N(a)} es suegro de ${N(b)}.`);
  // Descendiente lejano al que la Biblia llama «hijo» (Esdras 7:1)
  const lejano = (x, y) => dsLiteral(x) ? `La Biblia llama a ${N(x)} «hijo de ${N(y)}» (${get(x).rp}).`
                                        : `${N(x)} es descendiente de ${N(y)}; la Biblia no dice por cuántas generaciones.`;
  if (A.ds === b) frases.push(lejano(a, b));
  if (B.ds === a) frases.push(lejano(b, a));
  // Sangre; si no la hay (ni otro vínculo directo), por la línea legal y después por los
  // antepasados lejanos (ds), con los que no se pueden contar las generaciones
  let s = sangre(a, b, ['pa', 'ma']), legal = false, porLejano = false;
  if (!s && !frases.length){ s = sangre(a, b, ['pa', 'ma', 'pl']); legal = !!s; }
  if (!s && !frases.length){
    s = sangre(a, b, ['pa', 'ma', 'pl', 'ds']);
    if (s){
      porLejano = true;
      // ¿Algún paso de la subida es por un padre legal? (ca y cb van de cada persona a c)
      legal = [s.ca, s.cb].some(l => l.some((x, i) => i + 1 < l.length && get(x).pl === l[i + 1] && get(x).pa !== l[i + 1]));
    }
  }
  if (s && porLejano){
    // Solo se sabe quién es antepasado de quién; los pasos ds se explican con las palabras de la Biblia
    frases.push(s.da === 0 ? `${N(a)} es ${gen(a, ['antepasado', 'antepasada'])} de ${N(b)}.`
              : s.db === 0 ? `${N(a)} es descendiente de ${N(b)}.` : `${N(a)} y ${N(b)} son parientes.`);
    for (const lado of [s.ca, s.cb]) lado.forEach((x, i) => { if (i + 1 < lado.length && get(x).ds === lado[i + 1]) exp.push(lejano(x, lado[i + 1])); });
    if (s.da && s.db && !s.grupo) exp.push(`Su antepasado común más cercano es ${nm(s.c)}.`);
    if (legal) exp.push('Este parentesco pasa por un padre legal o adoptivo; no es de sangre.');
    camino = caminoPor(s);
    comun = s.grupo ? null : s.c;
  } else if (s){
    const r = explicarSangre(a, b, s, frases.length ? 'Además, ' : '', nm);
    frases.push(...r.frases);
    exp.push(...r.exp);
    if (legal) exp.push('Este parentesco pasa por un padre legal o adoptivo; no es de sangre.');
    camino = caminoPor(s);
    comun = s.grupo ? null : s.c;
    // Además, suegro o yerno (Labán era tío de Jacob y también su suegro)
    const hijoDe = (x, y) => get(x).pa === y || get(x).ma === y;
    if ((CONYUGES.get(a) || []).some(c => hijoDe(c, b))) frases.push(`Además, ${N(a)} es ${gen(a, ['yerno', 'nuera'])} de ${N(b)}.`);
    if ((CONYUGES.get(b) || []).some(c => hijoDe(c, a))) frases.push(`Además, ${N(a)} es ${gen(a, ['suegro', 'suegra'])} de ${N(b)}.`);
  }
  // Por matrimonio: el cónyuge de uno es pariente del otro
  if (!frases.length){
    // x es el que está casado; su cónyuge c es pariente de sangre de y. invertir: x es b (no a)
    const porConyuge = (x, y, invertir) => {
      for (const c of CONYUGES.get(x) || []){
        const r = sangre(c, y, ['pa', 'ma']);
        if (!r) continue;
        let t = null;
        if (r.da === 1 && r.db === 0) t = invertir ? gen(a, ['suegro', 'suegra']) : gen(a, ['yerno', 'nuera']);   // c es hijo de y
        if (r.da === 1 && r.db === 1) t = gen(a, ['cuñado', 'cuñada']);                                           // c es hermano de y
        const tc = termino(r.da, r.db, c, medios(c, y, r.comunes));
        frases.push(t ? `${N(a)} es ${t} de ${N(b)}.` : `${N(a)} y ${N(b)} son parientes por matrimonio.`);
        exp.push(`${N(x)} es ${gen(x, ['esposo', 'esposa'])} de ${N(c)}, y ${N(c)} es ${tc || 'pariente'} de ${N(y)}.`);
        const p = caminoPor(r);                       // de c a y
        camino = invertir ? [...p.reverse(), b] : [a, ...p];
        comun = r.c;
        return true;
      }
      return false;
    };
    // Los dos casados con dos hermanos (Rut y Orpá): concuñados
    const concunados = () => {
      for (const ca of CONYUGES.get(a) || []) for (const cb of CONYUGES.get(b) || []){
        const r = sangre(ca, cb, ['pa', 'ma']);
        if (!r || r.da !== 1 || r.db !== 1) continue;
        frases.push(`${N(a)} es ${gen(a, ['concuñado', 'concuñada'])} de ${N(b)}.`);
        exp.push(`${N(a)} es ${gen(a, ['esposo', 'esposa'])} de ${N(ca)}, y ${N(b)}, de ${N(cb)}, que eran ${get(ca).mu && get(cb).mu ? 'hermanas' : 'hermanos'}.`);
        camino = [a, ca, cb, b];
        return true;
      }
      return false;
    };
    porConyuge(a, b, false) || porConyuge(b, a, true) || concunados();
  }
  // Primos que la Biblia nombra como tales sin decir por qué padre (pm): si no salió otro parentesco
  if (!frases.length && (PRIMOS.get(a) || []).includes(b))
    frases.push(`${N(a)} es ${gen(a, ['primo', 'prima'])} de ${N(b)}. La Biblia no dice por cuál de sus padres.`);
  // Vínculos del camino que son deducciones, no lo que dice la Biblia (de en los datos; la ficha lo
  // explica). Solo pasa si se muestra lo que no está en la Biblia.
  const deducciones = [];
  const anotar = x => { if (get(x) && !deducciones.includes(x)) deducciones.push(x); };
  // Matrimonio entre los dos que es una deducción (p. ej., Jerimot y Abihail)
  if ((CONYUGES.get(a) || []).includes(b)){ if (dedDe(a, b)) anotar(a); if (dedDe(b, a)) anotar(b); }
  // Descendiente lejano por deducción (que «hijo» signifique descendiente; p. ej., Esdras)
  if (dsDeducido(a, b)) anotar(a);
  if (dsDeducido(b, a)) anotar(b);
  (camino || []).forEach((x, i, c) => {
    const y = c[i + 1];
    if ((get(x)?.de || []).includes('persona')) anotar(x);
    if (y === undefined) return;
    if (dedDe(x, y) || dsDeducido(x, y)) anotar(x);
    if (dedDe(y, x) || dsDeducido(y, x)) anotar(y);
    // Hermanos anotados con hm: el camino pasa por un progenitor oculto («hm:…»)
    if (String(y).startsWith('hm:') && (get(x)?.de || []).includes('hm')) anotar(x);
    if (String(x).startsWith('hm:') && (get(y)?.de || []).includes('hm')) anotar(y);
  });
  // Hermanos: también cuenta si uno de los padres en común es un vínculo por deducción
  if (s) for (const x of [a, b]){
    if (s.comunes.some(c => dedDe(x, c) || String(c).startsWith('hm:') && (get(x)?.de || []).includes('hm'))) anotar(x);
    for (const c of s.comunes) if (dedDe(c, x)) anotar(c);
  }
  if (deducciones.length) exp.push(`Este parentesco incluye una deducción, no lo dice la Biblia: lee la nota en la ficha de ${deducciones.map(nm).join(', ')}.`);
  // Personas del camino (o antepasados comunes) que no aparecen en la Biblia (xb)
  const fuera = [...new Set([...(camino || []), ...(s ? s.comunes : [])])].filter(x => get(x)?.xb);
  if (fuera.length) exp.push(`Este parentesco pasa por ${fuera.length > 1 ? 'personas que no aparecen' : 'una persona que no aparece'} en la Biblia: ${fuera.map(nm).join(', ')}.`);
  // «de el sobrino de Pablo» → «del sobrino de Pablo» (personas sin nombre, que llevan artículo)
  const pulir = s => mayuscula(s.replace(/\bde el /g, 'del ').replace(/\ba el /g, 'al '));
  // Sin repetir la misma frase (p. ej., «José es yerno de Helí» por su suegro y por su esposa)
  const sinAdemas = s => s.replace(/^Además, /, '').toLowerCase();
  const unicas = frases.filter((f, i) => frases.findIndex(g => sinAdemas(g) === sinAdemas(f)) === i);
  return {frases:unicas.map(pulir), exp:exp.map(pulir), camino, comun};
}
