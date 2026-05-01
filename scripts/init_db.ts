import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'pokemon.db');

export function initDb() {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      types TEXT NOT NULL,
      hp INTEGER,
      attack INTEGER,
      defense INTEGER,
      sp_atk INTEGER,
      sp_def INTEGER,
      speed INTEGER,
      base_total INTEGER,
      abilities TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS lore USING fts5(
      pokemon_name,
      content,
      tokenize='porter'
    );
  `);

  console.log('Database initialized at', DB_PATH);

  // If table is empty, we could seed it here...
  const count = db.prepare('SELECT count(*) as c FROM pokemon').get() as { c: number };
  if (count.c === 0) {
    console.log('Seeding initial data...');
    // Seed a couple of pokemons just to have some structured data
    const insertPoke = db.prepare(`
      INSERT INTO pokemon (id, name, types, hp, attack, defense, sp_atk, sp_def, speed, base_total, abilities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPoke.run(25, 'pikachu', 'Electric', 35, 55, 40, 50, 50, 90, 320, 'Static,Lightning Rod');
    insertPoke.run(39, 'jigglypuff', 'Normal,Fairy', 115, 45, 20, 45, 25, 20, 270, 'Cute Charm,Competitive,Friend Guard');
    insertPoke.run(887, 'dragapult', 'Dragon,Ghost', 88, 120, 75, 100, 75, 142, 600, 'Clear Body,Infiltrator,Cursed Body');
    insertPoke.run(460, 'abomasnow', 'Grass,Ice', 90, 92, 75, 92, 85, 60, 494, 'Snow Warning,Soundproof');

    const insertLore = db.prepare(`
      INSERT INTO lore (pokemon_name, content)
      VALUES (?, ?)
    `);

    insertLore.run('pikachu', 'Pikachu es muy amigo de Ash Ketchum en el anime. Sus principales rivales han sido Meowth del Equipo Rocket y Raichu (su forma evolucionada). Aparece en casi todos los episodios.');
    insertLore.run('jigglypuff', 'Jigglypuff es conocido en el anime por cantar una canción de cuna que duerme a todos, y luego enojarse y pintarles la cara con un marcador. Su habilidad principal en canto lo hace destacar.');
    insertLore.run('dragapult', 'Dragapult aloja a dos Dreepy en sus cuernos y los dispara como misiles en batalla. En la región de Galar es muy temido por su gran velocidad.');
    
    console.log('Seed complete.');
  }

  return db;
}

if (require.main === module) {
  initDb();
}
