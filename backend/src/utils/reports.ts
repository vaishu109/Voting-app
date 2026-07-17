import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export async function generatePDFReport(electionTitle: string, statistics: any, candidates: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Colors
    const primaryColor = '#0F172A';
    const secondaryColor = '#10B981';
    const goldColor = '#D97706';

    // Header
    doc.fillColor(primaryColor).fontSize(26).text('SecureVote Election Report', { align: 'center' });
    doc.moveDown(0.2);
    doc.fillColor('#64748B').fontSize(12).text('Secure Digital Democracy Portal', { align: 'center' });
    doc.moveDown(1.5);

    // Election Details
    doc.fillColor(primaryColor).fontSize(18).text(electionTitle, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#334155');
    doc.text(`Total Votes Cast: ${statistics.totalVotes}`);
    doc.text(`Voter Turnout Rate: ${statistics.turnoutRate}%`);
    doc.text(`Registered Voters: ${statistics.totalVoters}`);
    doc.text(`Active Participation: ${statistics.participationPercentage}%`);
    doc.text(`Report Generated At: ${new Date().toLocaleString()}`);
    doc.moveDown(1.5);

    // Table Header
    doc.fillColor(primaryColor).fontSize(14).text('Results Breakdown', { underline: false });
    doc.moveDown(0.5);

    const startY = doc.y;
    doc.fillColor('#F1F5F9').rect(50, startY, 500, 25).fill();
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
    doc.text('Candidate Name', 60, startY + 8);
    doc.text('Party', 220, startY + 8);
    doc.text('Votes Count', 380, startY + 8);
    doc.text('Percentage', 460, startY + 8);
    doc.moveDown(1);

    doc.font('Helvetica').fillColor('#334155');
    let currentY = startY + 25;

    candidates.forEach((candidate, index) => {
      // Alternating rows
      if (index % 2 === 1) {
        doc.fillColor('#F8FAFC').rect(50, currentY, 500, 20).fill();
      }
      doc.fillColor('#334155');
      doc.text(candidate.name, 60, currentY + 6);
      doc.text(candidate.party, 220, currentY + 6);
      doc.text(candidate.votes.toString(), 380, currentY + 6);
      doc.text(`${candidate.percentage}%`, 460, currentY + 6);
      currentY += 20;
    });

    // Signatures
    doc.moveDown(3);
    doc.fontSize(10).fillColor('#64748B').text('_________________________________', 50, 650);
    doc.text('Election Officer Signature', 50, 665);

    doc.text('_________________________________', 350, 650);
    doc.text('System Integrity Seal (SecureVote)', 350, 665);

    doc.end();
  });
}

export async function generateExcelReport(electionTitle: string, statistics: any, candidates: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Election Results');

  worksheet.columns = [
    { header: 'Candidate Name', key: 'name', width: 25 },
    { header: 'Party', key: 'party', width: 20 },
    { header: 'Votes Count', key: 'votes', width: 15 },
    { header: 'Percentage (%)', key: 'percentage', width: 15 }
  ];

  // Add styled title
  worksheet.insertRow(1, []);
  worksheet.insertRow(2, [`SecureVote - ${electionTitle}`]);
  worksheet.mergeCells('A2:D2');
  const titleRow = worksheet.getRow(2);
  titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: '0F172A' } };
  worksheet.insertRow(3, [`Report Generated: ${new Date().toLocaleString()}`]);
  worksheet.insertRow(4, [`Total Registered Voters: ${statistics.totalVoters}`]);
  worksheet.insertRow(5, [`Total Votes Cast: ${statistics.totalVotes}`]);
  worksheet.insertRow(6, [`Turnout Rate: ${statistics.turnoutRate}%`]);
  worksheet.insertRow(7, []);

  // Re-push column headers to custom location
  const headerRow = worksheet.addRow(['Candidate Name', 'Party', 'Votes Count', 'Percentage (%)']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F172A' }
  };

  candidates.forEach(c => {
    worksheet.addRow([c.name, c.party, c.votes, `${c.percentage}%`]);
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

export function generateCSVReport(electionTitle: string, statistics: any, candidates: any[]): string {
  let csv = `SecureVote Election Report,${electionTitle}\n`;
  csv += `Generated At,${new Date().toLocaleString()}\n`;
  csv += `Total Voters,${statistics.totalVoters}\n`;
  csv += `Total Votes Cast,${statistics.totalVotes}\n`;
  csv += `Turnout Rate,${statistics.turnoutRate}%\n\n`;
  csv += `Candidate Name,Party,Votes Count,Percentage\n`;

  candidates.forEach(c => {
    csv += `"${c.name.replace(/"/g, '""')}","${c.party.replace(/"/g, '""')}",${c.votes},${c.percentage}%\n`;
  });

  return csv;
}
