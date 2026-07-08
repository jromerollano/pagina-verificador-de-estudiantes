const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Buscamos cualquier archivo en la carpeta que contenga "p1" en su nombre
const archivos = fs.readdirSync(__dirname);
const archivoP1 = archivos.find(f => f.includes('p1'));
const DATA_FILE = path.join(__dirname, archivoP1); 
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
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const lineas = fileContent.split(/\r?\n/);

    for (let i = 1; i < lineas.length; i++) {
      if (!lineas[i].trim()) continue;
      
      const cols = lineas[i].split(',');
      const cedula = normalizarTexto(cols[1], ''); // Columna 1: Cedula

      if (!cedula || !/^\d+$/.test(cedula)) continue;

      estudiantes[cedula] = {
        cedula: cedula,
        nombre: capitalizar(cols[0]),          // Columna 0: Nombre
        programa: capitalizar(cols[2]),        // Columna 2: Programa
        diplomado: 'Diplomado en TICS',        // Valor fijo
        etdh: 'Registrado',                    // Valor fijo
        experto: normalizarTexto(cols[19], 'N/A'), // Columna 19: Curso
        nivelIngles: normalizarTexto(cols[23], 'A1'),
        estado: 'Graduado'                     // Valor fijo
      };
    }
  } catch (error) {
    console.error('Error leyendo la base de datos:', error.message);
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
      mensaje: 'La cedula consultada no se encontro en el sistema.',
    });
  }

  res.json({
    encontrado: true,
    ...estudiante,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado. Leyendo base de datos: ${archivoP1}`);
});
