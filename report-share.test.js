import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappUrl, reportMessage } from './public/report-share.js';
import {createReportPdf} from './report-pdf.js';
const report={date:'2026-10-13',chef:'Munashe',service:'Dinner',covers:5,menu:'Zambezi Menu',overview:'Everything went well.',dishes:[{quantity:4,name:'Soup & bread'}],dietary:'Gluten free',turndown:'5 rooms',feedback:'Positive',conclusion:'High standard',notes:'Confirm breakfast'};
test('WhatsApp recipient and complete message survive URL encoding',()=>{
 const url=new URL(whatsappUrl(report));assert.equal(url.pathname,'/263785617589');assert.equal(url.searchParams.get('text'),reportMessage(report));assert.ok(reportMessage(report).includes('4 × Soup & bread'));assert.ok(reportMessage(report).includes('Confirm breakfast'));assert.ok(reportMessage(report).includes('\nDate: 2026-10-13\n'));assert.ok(!reportMessage(report).includes('\\n'));
});
test('short PDF stays on one page and long reports paginate',async()=>{
 for(const [input,min,max] of [[report,1,1],[{...report,overview:'Long service notes. '.repeat(250),dishes:Array.from({length:100},()=>({quantity:1,name:'Grilled lamb with seasonal vegetables'}))},4,20]]){
 const chunks=[];for await (const chunk of createReportPdf(input))chunks.push(chunk);
 const contents=Buffer.concat(chunks).toString('latin1');const pages=(contents.match(/\/Type \/Page\b/g)||[]).length;assert.ok(pages>=min&&pages<=max,`Unexpected page count: ${pages}`);
 }
});
