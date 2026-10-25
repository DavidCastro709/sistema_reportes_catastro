export function notFound(_req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

export function errorHandler(error, _req, res, _next) {
  if (error?.name === 'ZodError') {
    return res.status(400).json({ error: 'Datos inválidos', details: error.issues });
  }
  if (error?.code === 'P2002') return res.status(409).json({ error: 'El registro ya existe' });
  if (error?.code === 'P2003') return res.status(400).json({ error: 'Una referencia relacionada no es válida' });
  if (error?.code === 'P2025') return res.status(404).json({ error: 'Registro no encontrado' });
  console.error(error);
  return res.status(error.status || 500).json({ error: error.status ? error.message : 'Error interno del servidor' });
}
