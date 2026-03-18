const express = require('express');
const xlsx    = require('xlsx');
const path    = require('path');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ── Carga y parsea el Excel ──────────────────────────────────────────────────
function cargarEstudiantes() {
  const wb   = xlsx.readFile(path.join(__dirname, 'prueba_1.xlsx'));
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const db = {};

  for (const row of rows) {
    const nombre   = String(row[0] || '').trim();
    const cedula   = String(row[1] || '').trim();
    const programa = String(row[2] || '').trim();

    // Saltarse filas vacías o sin cédula numérica
    if (!cedula || !/^\d+$/.test(cedula)) continue;

    db[cedula] = {
      nombre:   capitalize(nombre),
      programa: capitalize(programa),
      semestre: row[3] ? String(row[3]).trim() : 'N/A',
      jornada:  row[4] ? String(row[4]).trim() : 'N/A',
      estado:   row[5] ? String(row[5]).trim() : 'Activo',
    };
  }

  return db;
}

function capitalize(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ── Endpoint de verificación ─────────────────────────────────────────────────
app.get('/api/verificar/:cedula', (req, res) => {
  const db         = cargarEstudiantes();          // recarga en cada petición (archivo pequeño)
  const cedula     = req.params.cedula.trim();
  const estudiante = db[cedula];

  if (estudiante) {
    return res.json({ encontrado: true, cedula, ...estudiante });
  }

  res.json({ encontrado: false, cedula });
});

// ── Healthcheck para Render ───────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
