const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const EXCEL_FILE = path.join(__dirname, 'prueba 1.xlsx');
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

function normalizarEstado(valor) {
  const estado = normalizarTexto(valor, 'Graduado');
  return estado.toLocaleLowerCase('es-CO') === 'activo' ? 'Graduado' : estado;
}

function crearCampos(estudiante) {
  return [
    { etiqueta: 'Nombre', valor: estudiante.nombre, destacado: true },
    { etiqueta: 'Programa', valor: estudiante.programa },
    { etiqueta: 'Semestre', valor: estudiante.semestre },
    { etiqueta: 'Jornada', valor: estudiante.jornada },
    { etiqueta: 'Estado', valor: estudiante.estado },
    { etiqueta: 'Cedula', valor: estudiante.cedula },
  ];
}

function cargarEstudiantes() {
  const workbook = xlsx.readFile(EXCEL_FILE);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const filas = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  const estudiantes = {};

  for (const fila of filas) {
    const cedula = normalizarTexto(fila[1], '');

    if (!cedula || !/^\d+$/.test(cedula)) continue;

    estudiantes[cedula] = {
      cedula,
      nombre: capitalizar(fila[0]),
      programa: capitalizar(fila[2]),
      semestre: normalizarTexto(fila[3]),
      jornada: normalizarTexto(fila[4]),
      estado: normalizarEstado(fila[5]),
    };
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
    campos: crearCampos(estudiante),
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
