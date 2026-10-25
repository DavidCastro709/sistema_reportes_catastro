import ExcelJS from 'exceljs';

const money = (value) => Number(value || 0);

export async function buildReportExcel(report) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Gestión de Reportes - Catastro';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Reporte', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 } });
  sheet.columns = [{ width: 20 }, { width: 42 }, { width: 18 }, { width: 18 }];
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'GOBIERNO MUNICIPAL DE DURANGO · DIRECCIÓN DE CATASTRO';
  sheet.getCell('A1').font = { bold: true, size: 15, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
  sheet.mergeCells('A2:D2');
  sheet.getCell('A2').value = 'REPORTE OFICIAL · ' + report.title;
  sheet.getCell('A2').font = { bold: true, size: 13 };
  sheet.getCell('A4').value = 'Folio'; sheet.getCell('B4').value = report.folio;
  sheet.getCell('C4').value = 'Periodo'; sheet.getCell('D4').value = report.parameters?.period || 'No especificado';
  sheet.getCell('A5').value = 'Filtros'; sheet.mergeCells('B5:D5'); sheet.getCell('B5').value = JSON.stringify(report.parameters || {});
  sheet.addRow([]);
  const header = sheet.addRow(['Clave catastral', 'Descripción', 'Importe', 'Ingresos']);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  report.rows.forEach((row) => sheet.addRow([row.cadastralId, row.description, money(row.amount), money(row.income)]));
  const totalAmount = report.rows.reduce((sum, row) => sum + money(row.amount), 0);
  const totalIncome = report.rows.reduce((sum, row) => sum + money(row.income), 0);
  const totalRow = sheet.addRow(['', 'TOTALES', totalAmount, totalIncome]);
  totalRow.font = { bold: true };
  for (let i = 8; i < totalRow.number; i += 1) {
    sheet.getCell(`C${i}`).numFmt = '"$"#,##0.00';
    sheet.getCell(`D${i}`).numFmt = '"$"#,##0.00';
  }
  sheet.getCell(`C${totalRow.number}`).numFmt = '"$"#,##0.00';
  sheet.getCell(`D${totalRow.number}`).numFmt = '"$"#,##0.00';
  sheet.mergeCells('A' + (totalRow.number + 2) + ':D' + (totalRow.number + 2));
  sheet.getCell('A' + (totalRow.number + 2)).value = `Emitido: ${new Date().toLocaleString('es-MX')} · Folio: ${report.folio}`;
  sheet.getCell('A' + (totalRow.number + 2)).alignment = { horizontal: 'right' };
  return workbook.xlsx.writeBuffer();
}
