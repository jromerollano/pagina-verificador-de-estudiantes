const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración absoluta para leer el archivo p1
const DATA_FILE = path.join(__dirname, 'p1.xlsx'); 
const HTML_FILE = path.join(__dirname, 'verificador_estudiantes.html');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(HTML_FILE);
});

function normalizarTexto(valor, fallback = 'N/A') {
  const texto = String(valor || '').trim();
  return texto === '' || texto === 'undefined' ? fallback : texto;
}

function capitalizar(valor) {
  return normalizarTexto(valor, '')
    .toLocaleLowerCase('es-CO')
    .replace(/\p{L}+/gu, palabra => palabra.charAt(0).toLocaleUpperCase('es-CO') + palabra.slice(1));
}

function cargarEstudiantes() {
  const estudiantes = {};
  try {
    // Leemos el archivo asegurando codificación para caracteres especiales
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const lineas = fileContent.split(/\r?\n/);

    // Iteramos desde la línea 1 para saltar el encabezado
    for (let i = 1; i < lineas.length; i++) {
      if (!lineas[i].trim()) continue;
      
      // Separamos por coma
      const cols = lineas[i].split(',');
      
      // Columna 1 = Cedula
      const cedula = normalizarTexto(cols[1], ''); 
      if (!cedula || !/^\d+$/.test(cedula)) continue;

      estudiantes[cedula] = {
        cedula: cedula,
        nombre: capitalizar(cols[0]),          // Columna 0: Nombre
        programa: capitalizar(cols[2]),        // Columna 2: Programa
        diplomado: capitalizar(cols[16] || 'Diplomado en TICS'), // Columna 16: Diplomado
        etdh: 'Registrado',                    // Campo fijo
        experto: capitalizar(cols[19] || 'N/A'), // Columna 19: Curso
        nivelIngles: normalizarTexto(cols[23], 'A1'), // Columna 23: Inglés
        estado: 'Graduado'
      };
    }
  } catch (error) {
    console.error('Error al cargar p1.xlsx - A.csv:', error.message);
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
      mensaje: 'La cedula consultada no se encontro en la base de datos p1.',
    });
  }

  res.json({
    encontrado: true,
    ...estudiante,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor activo. Leyendo base de datos: ${DATA_FILE}`);
});
