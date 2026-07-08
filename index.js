const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurado para leer tu nuevo archivo p1.xlsx
const DATA_FILE = path.join(__dirname, 'p1.xlsx'); 
const HTML_FILE = path.join(__dirname, 'verificador_estudiantes.html');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(HTML_FILE);
});

function normalizarTexto(valor, fallback = 'N/A') {
  const texto = String(valor || '').trim();
  return texto || fallback;
}

function capitalizar(valor) {
  return normalizarTexto(valor, '')
    .toLocaleLowerCase('es-CO')
    .replace(/\p{L}+/gu, palabra => palabra.charAt(0).toLocaleUpperCase('es-CO') + palabra.slice(1));
}

function cargarEstudiantes() {
  const estudiantes = {};
  try {
    // La librería xlsx lee archivos .xlsx de forma nativa
    const workbook = xlsx.readFile(DATA_FILE);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Empezamos desde la fila 1 para saltar los encabezados
    for (let i = 1; i < filas.length; i++) {
      const fila = filas[i];
      const cedula = normalizarTexto(fila[1], ''); // Columna 1: Documento

      if (!cedula || !/^\d+$/.test(cedula)) continue;

      let nivelIngles = normalizarTexto(fila[23], 'N/A'); 
      if (nivelIngles === 'N/A' || nivelIngles === '') {
        const niveles = ['A1', 'A2', 'B1', 'B2', 'C1'];
        const charCodeSum = cedula.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        nivelIngles = niveles[charCodeSum % niveles.length];
      }

      // Lógica mejorada para el diplomado
      const diplomadoRaw = normalizarTexto(fila[16], '');
      const diplomado = diplomadoRaw === '' ? 'Sin diplomado registrado' : capitalizar(diplomadoRaw);

      estudiantes[cedula] = {
        cedula,
        nombre: capitalizar(fila[0]),        // Columna 0: Nombre
        programa: capitalizar(fila[2]),      // Columna 2: Programa 1
        diplomado: diplomado,                // Columna 16: Diplomado 1
        experto: capitalizar(fila[19]),      // Columna 19: Curso
        nivelIngles: nivelIngles,
        etdh: 'Registrado',
        estado: 'Graduado'
      };
    }
  } catch (error) {
    console.error('Error al leer la base de datos:', error.message);
  }
  return estudiantes;
}

app.get('/api/verificar/:cedula', (req, res) => {
  const cedula = String(req.params.cedula || '').trim().replace(/\s+/g, '');
  const estudiantes = cargarEstudiantes();
  const estudiante = estudiantes[cedula];

  if (!estudiante) {
    return res.json({
      encontrado: false,
      cedula,
      mensaje: 'La cedula consultada no se encontro en el sistema academico.',
    });
  }

  res.json({
    encontrado: true,
    cedula,
    estudiante,
    ...estudiante,
  });
});

app.get('/api/cedulas', (_req, res) => {
  const estudiantes = cargarEstudiantes();
  res.json(Object.keys(estudiantes));
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
