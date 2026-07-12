const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const exportToCsvOrXlsx = async (res, format, title, headers, rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  worksheet.addRow(headers);
  rows.forEach(row => worksheet.addRow(row));

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}.csv`);
    await workbook.csv.write(res);
  } else {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}.xlsx`);
    await workbook.xlsx.write(res);
  }
  res.end();
};

const exportToPdf = (res, title, headers, rows) => {
  const doc = new PDFDocument({ margin: 30 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${title.toLowerCase().replace(/ /g, '_')}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text(title, { align: 'center' });
  doc.moveDown();

  const columnCount = headers.length;
  const colWidth = (doc.page.width - 60) / columnCount;
  
  let currentY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold');
  headers.forEach((header, index) => {
    doc.text(String(header), 30 + index * colWidth, currentY, { width: colWidth - 10, align: 'left' });
  });

  doc.moveDown();
  doc.font('Helvetica').fontSize(9);
  
  rows.forEach(row => {
    currentY = doc.y;
    if (currentY > doc.page.height - 50) {
      doc.addPage();
      currentY = doc.y;
    }
    
    row.forEach((cell, index) => {
      doc.text(String(cell !== undefined ? cell : ''), 30 + index * colWidth, currentY, { width: colWidth - 10, align: 'left' });
    });
    doc.moveDown(0.5);
  });

  doc.end();
};

module.exports = {
  exportToCsvOrXlsx,
  exportToPdf
};
