import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'pokemon.db');

async function fetchPokemonData(id: number) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch Pokemon ${id}`);
  return res.json();
}

async function fetchPokemonSpecies(id: number) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch Species ${id}`);
  return res.json();
}

export async function seedPokeApi() {
  const db = new Database(DB_PATH);

  const insertPoke = db.prepare(`
    INSERT OR REPLACE INTO pokemon (id, name, types, hp, attack, defense, sp_atk, sp_def, speed, base_total, abilities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLore = db.prepare(`
    INSERT OR REPLACE INTO lore (rowid, pokemon_name, content)
    VALUES (?, ?, ?)
  `);

  console.log('Iniciando descarga de los primeros 151 Pokémon desde la PokeAPI...');

  for (let i = 1; i <= 151; i++) {
    try {
      const data = await fetchPokemonData(i);
      const species = await fetchPokemonSpecies(i);

      const name = data.name;
      const types = data.types.map((t: any) => t.type.name).join(',');
      const abilities = data.abilities.map((a: any) => a.ability.name).join(',');
      
      const stats = {
        hp: data.stats.find((s: any) => s.stat.name === 'hp').base_stat,
        attack: data.stats.find((s: any) => s.stat.name === 'attack').base_stat,
        defense: data.stats.find((s: any) => s.stat.name === 'defense').base_stat,
        sp_atk: data.stats.find((s: any) => s.stat.name === 'special-attack').base_stat,
        sp_def: data.stats.find((s: any) => s.stat.name === 'special-defense').base_stat,
        speed: data.stats.find((s: any) => s.stat.name === 'speed').base_stat,
      };
      const base_total = stats.hp + stats.attack + stats.defense + stats.sp_atk + stats.sp_def + stats.speed;

      insertPoke.run(i, name, types, stats.hp, stats.attack, stats.defense, stats.sp_atk, stats.sp_def, stats.speed, base_total, abilities);

      // Extract spanish flavor text if available, otherwise english
      let flavorText = species.flavor_text_entries.find((f: any) => f.language.name === 'es')?.flavor_text;
      if (!flavorText) {
        flavorText = species.flavor_text_entries.find((f: any) => f.language.name === 'en')?.flavor_text;
      }
      flavorText = flavorText?.replace(/[\n\f\r]/g, ' ') || 'Sin información de lore disponible.';

      insertLore.run(i, name, flavorText);
      
      if (i % 25 === 0) console.log(`Progreso: ${i}/151 procesados.`);
      
      // Pequeño delay para no saturar la API
      await new Promise(r => setTimeout(r, 50));
    } catch (err) {
      console.error(`Error procesando el Pokémon ${i}:`, err);
    }
  }

  console.log('¡Sincronización completada con éxito!');
  db.close();
}

if (require.main === module) {
  seedPokeApi();
}
