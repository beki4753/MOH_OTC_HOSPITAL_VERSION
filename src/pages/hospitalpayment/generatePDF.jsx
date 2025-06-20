import { jsPDF } from "jspdf";
import "jspdf-autotable"; // For table generation

const generatePDF = (data) => {
  const doc = new jsPDF();

  // --- Top Section ---
  let yPos = 20;
  const margin = 20; // Left and right margins
  const center = doc.internal.pageSize.getWidth() / 2; // Center of the page
  const pageWidth = doc.internal.pageSize.getWidth();

  // Receipt Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', center, yPos, { align: 'center' });
  yPos += 10;

  // Company Name
  doc.setFontSize(14);
  doc.text('COMPANY NAME', center, yPos, { align: 'center' });
  yPos += 10;

  //Separator Line (Dashed)
  const dashLength = 3;
  let x = margin;
  while (x < pageWidth - margin) {
      doc.line(x, yPos, x + dashLength, yPos);
      x += 2 * dashLength;
  }
  yPos += 10;

  // Address, Date, Manager
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Address: Lorem Ipsum 8/24', margin, yPos);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, center, yPos, { align: 'center' });
  doc.text('Manager: Lorem Ipsum', pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // --- Table Section ---
  yPos += 5; // Add some space before the table
  //  const items = data.items || [];
   const items = [
    { description: 'Orange Juice', price: 2.15 },
    { description: 'Apples', price: 3.50 },

  ];
   const tableData = items.map((item) => [
       item.description,
       `$${item.price ? item.price.toFixed(2) : '0.00'}`
   ]);

   // AutoTable
   doc.autoTable({
       startY: yPos,
       head: [['Description', 'Price']],
       body: tableData,
       margin: { left: margin, right: margin },
       styles: {
           font: 'helvetica',
           fontSize: 10,
           overflow: 'linebreak',
           cellWidth: 'auto', // or 'wrap'
           minCellHeight: 8,
       },
       columnStyles: {
           0: { halign: 'left' },
           1: { halign: 'right' }
       },
       headStyles: {
           fillColor: [0, 0, 0],
           textColor: [255, 255, 255],
           fontStyle: 'bold',
           halign: 'center'
       },
        didParseCell: function(data) {
        var rows = data.table.body;
        if (data.row.index === rows.length - 1) {
          yPos = data.cell.y + data.cell.height + 10; // Adjust for total position
        }
      },
   });

   const finalY = doc.autoTable.previous.finalY; // Get the final Y position after the table


  // --- Bottom Section ---

    // Calculate Tax and Total (example values)
    const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const taxRate = 0.05; // 5% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;


    yPos = finalY + 10; // Position after the table

    //Tax and Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tax:`, margin, yPos);
    doc.text(`$${tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`TOTAL:`, margin, yPos);
    doc.text(`$${total.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

  // "Thank You"
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('THANK YOU', center, yPos, { align: 'center' });
  yPos += 10;

  // Barcode (Placeholder) -  Implement barcode generation library
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
    let barcodeText = '123456778963578021'; //Example Barcode Text
    doc.text(barcodeText, center, yPos, { align: 'center' });
  yPos += 5;


  // Save the PDF
  doc.save('receipt.pdf');
};

export default generatePDF;
