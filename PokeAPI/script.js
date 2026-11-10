
const API = 'https://pokeapi.co/api/v2';

const $ = id => document.getElementById(id);

const MAX_ID = 1025;

let currentId = 25;

const STAT_ES = {
  'hp': 'PS',
  'attack': 'Ataque',
  'defense': 'Defensa',
  'special-attack': 'At. especial',
  'special-defense': 'Def. especial',
  'speed': 'Velocidad'
};

const TYPE_ES = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada'
};


function artworkUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}


async function getJSON(url) {
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    // 404 = no existe ese Pokémon
    throw new Error(respuesta.status === 404
      ? 'No se encontró ese Pokémon.'
      : 'Error al consultar la API.');
  }
  return respuesta.json();  
}



async function loadPokemon(query) {
  const msg = $('msg');
  msg.style.display = 'none';        

  try {

    const p = await getJSON(`${API}/pokemon/${String(query).toLowerCase().trim()}`);
    currentId = p.id;


    const img = $('art');
    img.src = p.sprites.other['official-artwork'].front_default || p.sprites.front_default;
    img.alt = p.name;
    img.hidden = false;
    $('num').textContent = 'N.º ' + String(p.id).padStart(3, '0');   // 25 -> 025
    $('name').textContent = p.name;


    const types = $('types');
    types.replaceChildren();                     
    p.types.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = TYPE_ES[t.type.name] || t.type.name;
      types.append(chip);
    });


    $('height').textContent = (p.height / 10).toFixed(1) + ' m';
    $('weight').textContent = (p.weight / 10).toFixed(1) + ' kg';
    $('abilities').textContent = p.abilities
      .map(a => a.ability.name.replace('-', ' '))
      .join(', ');


    showStats(p.stats);


    $('prev').disabled = p.id <= 1;
    $('next').disabled = p.id >= MAX_ID;

    // --- Línea evolutiva ---
    loadEvolution(p);

  } catch (error) {

    msg.textContent = error.message;
    msg.style.display = 'block';
  }
}



function showStats(stats) {
  const box = $('stats');
  box.replaceChildren();

  stats.forEach(s => {
    const row = document.createElement('div');
    row.className = 'stat';
    row.innerHTML = '<span></span><div class="track"><div class="fill"></div></div><b></b>';

    row.children[0].textContent = STAT_ES[s.stat.name] || s.stat.name;  // nombre
    row.children[2].textContent = s.base_stat;                          // valor
    box.append(row);

    // El valor máximo de una estadística es 255, así que se calcula el porcentaje
    const porcentaje = Math.min(100, (s.base_stat / 255) * 100);
    requestAnimationFrame(() => {
      row.querySelector('.fill').style.width = porcentaje + '%';
    });
  });
}

function flattenChain(node, lista = []) {
  lista.push({
    name: node.species.name,
    id: node.species.url.split('/').filter(Boolean).pop() 
  });
  node.evolves_to.forEach(siguiente => flattenChain(siguiente, lista));
  return lista;
}

async function loadEvolution(p) {
  const box = $('evo');
  box.replaceChildren();

  try {

    const species = await getJSON(p.species.url);
    const chain = await getJSON(species.evolution_chain.url);

    flattenChain(chain.chain).forEach(e => {
      const btn = document.createElement('button');
      if (Number(e.id) === p.id) btn.className = 'on';  

      btn.innerHTML = '<img alt=""><span></span><small></small>';
      btn.querySelector('img').src = artworkUrl(e.id);
      btn.children[1].textContent = e.name;
      btn.children[1].style.textTransform = 'capitalize';
      btn.children[2].textContent = 'N.º ' + String(e.id).padStart(3, '0');

      btn.onclick = () => {
        loadPokemon(e.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      box.append(btn);
    });

  } catch (error) {
    box.textContent = 'No se pudo cargar la línea evolutiva.';
  }
}



$('search').addEventListener('submit', event => {
  event.preventDefault();               
  const texto = $('q').value.trim();
  if (texto) loadPokemon(texto);
});

// Botones anterior y siguiente
$('prev').onclick = () => loadPokemon(currentId - 1);
$('next').onclick = () => loadPokemon(currentId + 1);



loadPokemon(currentId);
