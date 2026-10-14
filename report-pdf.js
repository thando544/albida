import PDFDocument from 'pdfkit';

// Vector rendering of the supplied circular A mark; remains sharp in the PDF.
function logo(doc, x, y, size) {
  doc.save().translate(x, y).scale(size / 100);
  doc.circle(50, 50, 49).fill('#24211f');
  doc.path('M 50 11 L 20 74 Q 18 78 13 78 L 13 80 L 36 80 L 36 78 Q 27 78 31 69 L 49 29 L 67 70 Q 71 78 62 78 L 62 80 L 84 80 L 84 78 Q 79 78 77 72 L 52 11 Z').fill('#ffffff');
  doc.circle(50, 61, 6).fill('#ffffff');
  doc.restore();
}
export function createReportPdf(report) {
  const doc = new PDFDocument({size:'A4', margins:{top:140,bottom:64,left:48,right:48},bufferPages:true,info:{Title:`ALBIDA Kitchen — ${report.date}`,Author:'ALBIDA Kitchen'}});
  const width=499;
  const date=new Date(report.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  function header(){
    logo(doc,48,34,66);
    doc.fillColor('#24211f').font('Times-Roman').fontSize(26).text('ALBIDA KITCHEN',132,42,{width:415});
    doc.font('Helvetica').fontSize(9).fillColor('#756e65').text("CHEF’S SERVICE REPORT",133,77,{characterSpacing:2,width:410});
    doc.moveTo(48,119).lineTo(547,119).strokeColor('#dedbd5').stroke();
    doc.x=48;doc.y=140;
  }
  header();doc.on('pageAdded',header);
  function room(height){if(doc.y+height>doc.page.height-70)doc.addPage();}
  function text(value,options={}){doc.font('Helvetica').fontSize(10).fillColor('#24211f').text(value,48,doc.y,{width,lineGap:4,...options});}
  function section(title,value){
    room(58);
    doc.y+=12;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#756e65').text(title.toUpperCase(),48,doc.y,{width,characterSpacing:1});
    doc.y+=7;text(value || 'None recorded');doc.y+=4;
  }
  doc.font('Times-Roman').fontSize(20).fillColor('#24211f').text(`${report.service} service`,48,doc.y,{width});
  doc.y+=9;text(date);doc.y+=10;
  text(`Chef on duty: ${report.chef}`);text(`Guest covers: ${report.covers}     |     Menu: ${report.menu}`);
  section('01  Service overview',report.overview);
  room(70);doc.y+=14;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#756e65').text('02  DISHES SERVED',48,doc.y,{width,characterSpacing:1});doc.y+=10;
  function tableHeader(){const y=doc.y;doc.rect(48,y,width,25).fill('#eeece7');doc.font('Helvetica-Bold').fontSize(8).fillColor('#24211f').text('QTY',60,y+8,{width:45}).text('DISH',113,y+8,{width:420});doc.y=y+25;}
  tableHeader();
  for(const dish of report.dishes){
    doc.font('Helvetica').fontSize(10);
    const height=Math.max(30,doc.heightOfString(dish.name,{width:420,lineGap:3})+16);
    if(doc.y+height>doc.page.height-70){doc.addPage();tableHeader();}
    const y=doc.y;doc.fillColor('#24211f').font('Helvetica-Bold').text(String(dish.quantity),60,y+8,{width:45});
    doc.font('Helvetica').text(dish.name,113,y+8,{width:420,lineGap:3});
    doc.moveTo(48,y+height).lineTo(547,y+height).strokeColor('#e5e1da').stroke();doc.y=y+height;
  }
  for(const [title,value] of [['03  Dietary requirements',report.dietary],['04  Turndown service',report.turndown],['05  Guest feedback',report.feedback],['06  Conclusion',report.conclusion],['07  Additional notes',report.notes]])section(title,value);
  const range=doc.bufferedPageRange();
  for(let page=range.start;page<range.start+range.count;page++){
    doc.switchToPage(page);doc.page.margins.bottom=0;const y=doc.page.height-43;
    doc.moveTo(48,y-10).lineTo(547,y-10).strokeColor('#dedbd5').stroke();
    doc.font('Helvetica').fontSize(8).fillColor('#756e65').text('ALBIDA KITCHEN  ·  Care in every detail.',48,y,{width:390,lineBreak:false});
    doc.text(`${page+1} / ${range.count}`,497,y,{width:50,align:'right',lineBreak:false});
  }
  doc.end();return doc;
}
