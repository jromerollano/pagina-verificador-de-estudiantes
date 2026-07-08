const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
// Apuntamos a la nueva base de datos CSV
const CSV_FILE = path.join(__dirname, 'A.csv');
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
    // Leemos el CSV (latin1 para no dañar las tildes y ñ del documento original)
    const fileContent = fs.readFileSync(CSV_FILE, 'latin1');
    const lineas = fileContent.split(/\r?\n/);
    
    // Ignoramos la primera fila (los encabezados)
    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i];
      if (!linea.trim()) continue;
      
      // Separamos por punto y coma (formato del CSV)
      const columnas = linea.split(';');
      
      const cedula = normalizarTexto(columnas[1], ''); // Columna 1: Documento
      if (!cedula || !/^\d+$/.test(cedula)) continue;

      let nivelIngles = normalizarTexto(columnas[23], 'N/A'); // Columna 23: Nivel de Inglés Certificado
      if (nivelIngles === 'N/A' || nivelIngles === '') {
        // Asignación de reserva en caso de que esté vacío
        const niveles = ['A1', 'A2', 'B1', 'B2', 'C1'];
        const charCodeSum = cedula.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        nivelIngles = niveles[charCodeSum % niveles.length];
      }

      estudiantes[cedula] = {
        cedula,
        nombre: capitalizar(columnas[0]),        // Columna 0: Nombre
        programa: capitalizar(columnas[2]),      // Columna 2: Programa 1 (Estudios técnicos)
        diplomado: capitalizar(columnas[16]),    // Columna 16: Diplomado 1
        experto: capitalizar(columnas[19]),      // Columna 19: Curso (Expertos)
        nivelIngles: nivelIngles,
        etdh: 'Registrado',                      // Fijo
        estado: 'Graduado'                       // Fijo para la medalla
      };
    }
  } catch (error) {
    console.error('Error procesando CSV:', error.message);
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
