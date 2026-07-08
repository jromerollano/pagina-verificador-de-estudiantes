const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// PON AQUÍ EL NOMBRE EXACTO DE TU ARCHIVO (ej: A.xlsx o A.csv)
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

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Busca cualquier archivo que contenga "p1" en el nombre para mayor flexibilidad
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
    const workbook = xlsx.readFile(DATA_FILE);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const filas = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

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

      // MODIFICACIÓN AQUÍ:
      // Intentamos obtener el diplomado de la columna 16, 
      // si está vacío, intentamos buscar en otras columnas relevantes si fuera necesario.
      let diplomado = normalizarTexto(fila[16], 'No registra');
      
      estudiantes[cedula] = {
        cedula,
        nombre: capitalizar(fila[0]),
        programa: capitalizar(fila[2]),
        diplomado: diplomado === 'No registra' ? 'Sin diplomado registrado' : capitalizar(diplomado),
        experto: capitalizar(fila[19]),
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
