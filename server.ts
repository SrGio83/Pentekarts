import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
// import pdf from "pdf-parse";

console.log("--- SERVER STARTING ---");
const __dirname = process.cwd();
console.log("--- DIRNAME:", __dirname);
const db = new Database("pentekarts.db");
console.log("--- DATABASE INITIALIZED ---");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    color TEXT NOT NULL,
    logo TEXT,
    season TEXT DEFAULT '2026'
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    teamId TEXT,
    points INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    image TEXT,
    season TEXT DEFAULT '2026',
    FOREIGN KEY (teamId) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS races (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    trackMap TEXT,
    description TEXT,
    officialWeb TEXT,
    season TEXT DEFAULT '2026'
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    url TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS reglamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    icon TEXT NOT NULL,
    content TEXT NOT NULL
  );
`);

// Seed data if empty
const teamCount = db.prepare("SELECT count(*) as count FROM teams").get() as { count: number };
if (teamCount.count === 0) {
  const insertTeam = db.prepare("INSERT INTO teams (id, name, points, rank, color, season) VALUES (?, ?, ?, ?, ?, ?)");
  insertTeam.run('navarro', 'Navarro Motorsport', 145, 1, '#FF1801', '2026');
  insertTeam.run('blanquer', 'Blanquer Racing', 132, 2, '#00D2BE', '2026');
  insertTeam.run('highlighters', 'Highlighters Karting Team', 98, 3, '#0600EF', '2026');
  insertTeam.run('gamusinos', 'Gamusinos Racing Team', 76, 4, '#FFF500', '2026');
  insertTeam.run('wayon', 'El Wayon Speed Master', 54, 5, '#FF8700', '2026');
  insertTeam.run('apex', 'APEX Racing Team', 42, 6, '#005AFF', '2026');

  const insertDriver = db.prepare("INSERT INTO drivers (id, name, teamId, points, rank, season) VALUES (?, ?, ?, ?, ?, ?)");
  insertDriver.run('1', 'Julián Navarro', 'navarro', 85, 1, '2026');
  insertDriver.run('2', 'Cristian Blanquer', 'blanquer', 78, 2, '2026');
  insertDriver.run('3', 'Sergio Navarro', 'navarro', 60, 3, '2026');
  insertDriver.run('4', 'José Blanquer', 'blanquer', 54, 4, '2026');
  insertDriver.run('5', 'Miguel Ruiz', 'highlighters', 45, 5, '2026');
  insertDriver.run('6', 'Dani Sánchez', 'gamusinos', 40, 6, '2026');

  const insertRace = db.prepare("INSERT INTO races (id, name, location, date, status, trackMap, description, officialWeb, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertRace.run('1', 'GP La Ribera Baja', 'Karting Nabella Las Palmeras', '8 Feb 2026', 'completed', 'https://pentekarts.web.app/img/Circuito26-1.png', 'El circuito de Las Palmeras es conocido por sus curvas técnicas y su asfalto de alta calidad.', 'https://kartvalencia.com/las-palmeras/', '2026');
  insertRace.run('2', 'GP Burjassot', 'Indoor Karting Valencia', '29 Mar 2026', 'upcoming', '', '', 'https://indoorkartingvalencia.com/', '2026');
  insertRace.run('3', 'GP Benicasim', 'KartingBeniKarts', '17 May 2026', 'upcoming', '', '', 'https://benikarts.com/', '2026');
  insertRace.run('4', 'GP Foia de Bunyol', 'Kartodromo Internacional Lucas Guerrero', '28 Jul 2026', 'upcoming', '', '', 'https://kartodromovalencia.com/', '2026');
  insertRace.run('5', 'GP La Ribera Alta', 'Aspar Circuit', '6 Sep 2026', 'upcoming', '', '', 'https://asparcircuit.com/', '2026');
  insertRace.run('6', 'GP Camp del Turia', 'Karting La Pobla', '18 Nov 2026', 'upcoming', '', '', 'https://kartinglapobla.com/', '2026');

  const insertVideo = db.prepare("INSERT INTO videos (id, title, thumbnail, url, date, category) VALUES (?, ?, ?, ?, ?, ?)");
  insertVideo.run('1', 'GP1 - KARTING RIVAS', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2024', '2024');
  insertVideo.run('2', 'GP2 - HENAKART', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '2024', '2024');
}

const reglamentoCount = db.prepare("SELECT count(*) as count FROM reglamento").get() as { count: number };
if (reglamentoCount.count === 0) {
  const insertReglamento = db.prepare("INSERT INTO reglamento (title, icon, content) VALUES (?, ?, ?)");
  insertReglamento.run('SISTEMA DE PUNTUACIÓN', 'Award', JSON.stringify([
    '1º Puesto: 25 puntos',
    '2º Puesto: 18 puntos',
    '3º Puesto: 15 puntos',
    '4º Puesto: 12 puntos',
    '5º Puesto: 10 puntos',
    '6º Puesto: 8 puntos',
    '7º Puesto: 6 puntos',
    '8º Puesto: 4 puntos',
    '9º Puesto: 2 puntos',
    '10º Puesto: 1 punto',
    'Pole Position: 1 punto extra',
    'Vuelta Rápida: 1 punto extra (si termina en el top 10)'
  ]));
  insertReglamento.run('FORMATO DE CARRERA', 'Flag', JSON.stringify([
    'Sesión de Clasificación: 10-15 minutos para determinar la parrilla de salida.',
    'Carrera Sprint: Una carrera corta que otorga puntos reducidos (opcional según GP).',
    'Carrera Principal: La carrera estelar con la duración total de vueltas establecida.',
    'Parada en Boxes: Obligatoria en circuitos de larga duración (si se especifica).'
  ]));
  insertReglamento.run('CÓDIGO DE CONDUCTA', 'Shield', JSON.stringify([
    'Respeto total a los comisarios y otros pilotos.',
    'Prohibido el contacto intencionado o maniobras peligrosas.',
    'Mantener al menos dos ruedas dentro de los límites de la pista en todo momento.',
    'Las banderas azules deben ser respetadas para permitir el paso de pilotos que doblan.'
  ]));
  insertReglamento.run('PENALIZACIONES', 'FileText', JSON.stringify([
    'Advertencia: Por infracciones leves de límites de pista.',
    '5 Segundos: Por causar una colisión evitable.',
    'Drive-Through: Por saltarse la salida o exceso de velocidad en boxes.',
    'Descalificación: Por conducta antideportiva grave o ignorar banderas negras.'
  ]));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/teams", (req, res) => {
    const season = req.query.season;
    let teams;
    if (season && season !== 'all') {
      teams = db.prepare("SELECT * FROM teams WHERE season = ? ORDER BY rank ASC").all(season);
    } else {
      teams = db.prepare("SELECT * FROM teams ORDER BY rank ASC").all();
    }
    res.json(teams);
  });

  app.get("/api/drivers", (req, res) => {
    const season = req.query.season;
    let drivers;
    if (season && season !== 'all') {
      drivers = db.prepare("SELECT * FROM drivers WHERE season = ? ORDER BY rank ASC").all(season);
    } else {
      drivers = db.prepare("SELECT * FROM drivers ORDER BY rank ASC").all();
    }
    res.json(drivers);
  });

  app.get("/api/races", (req, res) => {
    const season = req.query.season;
    let races;
    if (season && season !== 'all') {
      races = db.prepare("SELECT * FROM races WHERE season = ?").all(season);
    } else {
      races = db.prepare("SELECT * FROM races").all();
    }
    res.json(races);
  });

  app.get("/api/videos", (req, res) => {
    const videos = db.prepare("SELECT * FROM videos").all();
    res.json(videos);
  });

  app.get("/api/reglamento", (req, res) => {
    const data = db.prepare("SELECT * FROM reglamento").all();
    res.json(data.map((item: any) => ({
      ...item,
      content: JSON.parse(item.content)
    })));
  });

  app.post("/api/teams", (req, res) => {
    const { id, name, color, points, rank, logo, season } = req.body;
    db.prepare("INSERT INTO teams (id, name, color, points, rank, logo, season) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, name, color, points || 0, rank || 0, logo || '', season || '2026');
    res.json({ success: true });
  });

  app.post("/api/drivers", (req, res) => {
    const { id, name, teamId, points, rank, image, season } = req.body;
    db.prepare("INSERT INTO drivers (id, name, teamId, points, rank, image, season) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, name, teamId, points || 0, rank || 0, image || '', season || '2026');
    res.json({ success: true });
  });

  app.post("/api/videos", (req, res) => {
    const { id, title, thumbnail, url, date, category } = req.body;
    db.prepare("INSERT INTO videos (id, title, thumbnail, url, date, category) VALUES (?, ?, ?, ?, ?, ?)").run(id, title, thumbnail, url, date, category || '');
    res.json({ success: true });
  });

  app.post("/api/reglamento", (req, res) => {
    const { title, icon, content } = req.body;
    db.prepare("INSERT INTO reglamento (title, icon, content) VALUES (?, ?, ?)").run(title, icon, JSON.stringify(content));
    res.json({ success: true });
  });

  app.put("/api/teams/:id", (req, res) => {
    const { name, color, points, rank, logo, season } = req.body;
    db.prepare("UPDATE teams SET name = ?, color = ?, points = ?, rank = ?, logo = ?, season = ? WHERE id = ?").run(name, color, points, rank, logo, season || '2026', req.params.id);
    res.json({ success: true });
  });

  app.put("/api/drivers/:id", (req, res) => {
    const { name, teamId, points, rank, image, season } = req.body;
    db.prepare("UPDATE drivers SET name = ?, teamId = ?, points = ?, rank = ?, image = ?, season = ? WHERE id = ?").run(name, teamId, points, rank, image, season || '2026', req.params.id);
    res.json({ success: true });
  });

  app.put("/api/videos/:id", (req, res) => {
    const { title, thumbnail, url, date, category } = req.body;
    db.prepare("UPDATE videos SET title = ?, thumbnail = ?, url = ?, date = ?, category = ? WHERE id = ?").run(title, thumbnail, url, date, category, req.params.id);
    res.json({ success: true });
  });

  app.put("/api/reglamento/:id", (req, res) => {
    const { title, icon, content } = req.body;
    db.prepare("UPDATE reglamento SET title = ?, icon = ?, content = ? WHERE id = ?").run(title, icon, JSON.stringify(content), req.params.id);
    res.json({ success: true });
  });

  app.post("/api/races", (req, res) => {
    const { id, name, location, date, status, trackMap, description, officialWeb, season } = req.body;
    db.prepare("INSERT INTO races (id, name, location, date, status, trackMap, description, officialWeb, season) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, name, location, date, status, trackMap || '', description || '', officialWeb || '', season || '2026');
    res.json({ success: true });
  });

  app.put("/api/races/:id", (req, res) => {
    const { name, location, date, status, trackMap, description, officialWeb, season } = req.body;
    db.prepare("UPDATE races SET name = ?, location = ?, date = ?, status = ?, trackMap = ?, description = ?, officialWeb = ?, season = ? WHERE id = ?").run(name, location, date, status, trackMap, description, officialWeb, season || '2026', req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/reglamento/:id", (req, res) => {
    db.prepare("DELETE FROM reglamento WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // PDF Processing Endpoint
  const upload = multer({ storage: multer.memoryStorage() });

  /*
  app.post("/api/process-pdf", upload.single('pdf'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const data = await pdf(req.file.buffer);
      res.json({ text: data.text });
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      res.status(500).json({ error: error.message });
    }
  });
  */

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
