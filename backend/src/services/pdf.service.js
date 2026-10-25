import PDFDocument from 'pdfkit';

const formatMoney = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value || 0));

export function streamReportPdf(report, res) {
  const doc = new PDFDocument({ size: 'LETTER', layout: 'landscape', margins: { top: 46, bottom: 50, left: 42, right: 42 }, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${report.folio}.pdf"`);
  doc.pipe(res);
  const left = 42; const right = 750;
  const footerText = `Emitido: ${new Date().toLocaleString('es-MX')} · Folio: ${report.folio}`;
  const drawHeader = () => {
    doc.font('Helvetica-Bold').fontSize(15).fillColor('#17365D').text('GOBIERNO MUNICIPAL DE DURANGO', left, 42, { align: 'center', width: right - left });
    doc.fontSize(10).fillColor('#333333').text('DIRECCIÓN MUNICIPAL DE ADMINISTRACIÓN Y CATASTRO', left, 63, { align: 'center', width: right - left });
    doc.moveTo(left, 84).lineTo(right, 84).strokeColor('#17365D').lineWidth(1.5).stroke();
    doc.font('Helvetica-Bold').fontSize(13).text(report.title, left, 98);
    doc.font('Helvetica').fontSize(9).text(`Folio: ${report.folio}    Periodo: ${report.parameters?.period || 'No especificado'}`, left, 118);
    doc.text(`Parámetros / filtros: ${JSON.stringify(report.parameters || {})}`, left, 133, { width: right - left });
  };
  const widths = [125, 340, 120, 120];
  const labels = ['Clave catastral', 'Descripción', 'Importe', 'Ingresos'];
  const drawTableHeader = (y) => {
    doc.rect(left, y, right - left, 24).fill('#4472C4');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF');
    let x = left;
    labels.forEach((label, index) => { doc.text(label, x + 5, y + 7, { width: widths[index] - 10, align: index > 1 ? 'right' : 'left' }); x += widths[index]; });
    return y + 24;
  };
  let y = 166;
  drawHeader();
  y = drawTableHeader(y);
  let totalAmount = 0; let totalIncome = 0;
  for (const row of report.rows) {
    if (y > 510) { doc.addPage(); drawHeader(); y = drawTableHeader(166); }
    totalAmount += Number(row.amount); totalIncome += Number(row.income);
    const values = [row.cadastralId, row.description, formatMoney(row.amount), formatMoney(row.income)];
    doc.font('Helvetica').fontSize(8).fillColor('#222222');
    let x = left;
    values.forEach((value, index) => { doc.text(String(value), x + 5, y + 6, { width: widths[index] - 10, height: 16, ellipsis: true, align: index > 1 ? 'right' : 'left' }); x += widths[index]; });
    doc.moveTo(left, y + 20).lineTo(right, y + 20).strokeColor('#D7DEE8').lineWidth(0.5).stroke();
    y += 20;
  }
  if (y > 520) { doc.addPage(); drawHeader(); y = drawTableHeader(166); }
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#222222');
  doc.text('TOTALES', left + widths[0] + 5, y + 6, { width: widths[1] - 10 });
  doc.text(formatMoney(totalAmount), left + widths[0] + widths[1] + 5, y + 6, { width: widths[2] - 10, align: 'right' });
  doc.text(formatMoney(totalIncome), left + widths[0] + widths[1] + widths[2] + 5, y + 6, { width: widths[3] - 10, align: 'right' });
  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page += 1) {
    doc.switchToPage(page);
    doc.font('Helvetica').fontSize(8).fillColor('#555555').text(footerText, left, 558, { width: right - left - 70, align: 'left' });
    doc.text(`Página ${page + 1} de ${range.count}`, right - 70, 558, { width: 70, align: 'right' });
  }
  doc.end();
}
