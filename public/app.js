import { whatsappUrl } from './report-share.js';
const form = document.querySelector('#report-form');
const dishes = document.querySelector('#dishes');
const status = document.querySelector('#status');
const saveButton = document.querySelector('#save');
let reports = [];
let dirty = false;
const fields = ['date','chef','service','covers','menu','overview','dietary','turndown','feedback','conclusion','notes'];
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDish(name = '', quantity = 1) {
  const row = document.createElement('div'); row.className = 'dish-row';
  const qty = document.createElement('input'); qty.type='number'; qty.min=1; qty.max=10000; qty.step=1; qty.required=true; qty.value=quantity; qty.setAttribute('aria-label','Dish quantity');
  const title = document.createElement('input'); title.required=true; title.maxLength=200; title.placeholder='Dish name'; title.value=name; title.setAttribute('aria-label','Dish name');
  const remove = document.createElement('button'); remove.type='button'; remove.className='remove'; remove.textContent='×'; remove.setAttribute('aria-label','Remove dish'); remove.onclick=()=>{ if(dishes.children.length>1){row.remove();dirty=true;} else {title.value='';qty.value=1;title.focus();dirty=true;} };
  row.append(qty,title,remove); dishes.append(row);
}
function serviceLabel(){document.querySelector('#covers-label').textContent=`${form.elements.service.value === 'Dinner' ? 'Dinner' : 'Guest'} covers`;}
function populate(report){for(const key of fields) form.elements[key].value=report[key]??'';dishes.replaceChildren();for(const dish of report.dishes || [{name:'',quantity:1}])addDish(dish.name,dish.quantity);serviceLabel();}
function mayReplace(){return !dirty || window.confirm('Replace the unsaved report currently in the form?');}
function reset(){form.reset();form.elements.date.value=today();dishes.replaceChildren();addDish();status.textContent='';dirty=false;serviceLabel();}
function renderReports(){
  document.querySelector('#report-count').textContent=reports.length;
  const list=document.querySelector('#report-list');list.replaceChildren();
  if(!reports.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Your first saved service will appear here.';list.append(empty);}
  for(const report of reports){
    const item=document.createElement('article');item.className='report-item';
    const heading=document.createElement('strong');heading.textContent=`${new Date(report.date+'T12:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})} · ${report.service}`;
    const detail=document.createElement('p');detail.textContent=`${report.chef} · ${report.covers} covers · ${report.menu}`;
    const view=document.createElement('button');view.type='button';view.textContent='View / reuse';view.onclick=()=>{if(mayReplace()){populate(report);dirty=false;status.textContent='Saved report loaded. Saving changes creates a new report.';form.scrollIntoView({behavior:'smooth'});}};
    const link=document.createElement('a');link.href=`/api/reports/${report.id}/pdf`;link.textContent='Download PDF ↗';link.setAttribute('download','');const share=document.createElement('a');share.href=whatsappUrl(report);share.target='_blank';share.rel='noopener noreferrer';share.textContent='Open WhatsApp ↗';share.className='share-link';item.append(heading,detail,view,link,share);list.append(item);
  }
}
form.addEventListener('input',()=>{dirty=true;});form.addEventListener('change',()=>{dirty=true;serviceLabel();});
document.querySelector('#add-dish').onclick=()=>{addDish();dirty=true;dishes.lastElementChild.children[1].focus();};
document.querySelector('#new-report').onclick=()=>{if(mayReplace())reset();};
form.onsubmit=async event=>{
  event.preventDefault();
  const whatsappWindow=window.open('about:blank','_blank');
  if(whatsappWindow){whatsappWindow.opener=null;whatsappWindow.document.title='Preparing your report';whatsappWindow.document.body.textContent='Saving your report before opening WhatsApp…';}
  saveButton.disabled=true;status.textContent='Saving your service report…';
  const report=Object.fromEntries(fields.map(key=>[key,form.elements[key].value]));report.covers=Number(report.covers);report.dishes=[...dishes.children].map(row=>({quantity:Number(row.children[0].value),name:row.children[1].value}));
  try{const response=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});const saved=await response.json();if(!response.ok)throw Error(saved.error);reports.unshift(saved);renderReports();dirty=false;status.textContent='Report saved. Press Send in WhatsApp to deliver it to +263 78 561 7589. Download and attach the PDF there. ';const link=document.createElement('a');link.href=`/api/reports/${saved.id}/pdf`;link.textContent='Download your PDF';link.download='';status.append(link);const share=document.createElement('a');share.href=whatsappUrl(saved);share.target='_blank';share.rel='noopener noreferrer';share.textContent='Open WhatsApp';share.className='share-link';status.append(share);if(whatsappWindow&&!whatsappWindow.closed)whatsappWindow.location.replace(share.href);}
  catch(error){if(whatsappWindow&&!whatsappWindow.closed)whatsappWindow.close();status.textContent=`Could not save: ${error.message}`;}finally{saveButton.disabled=false;}
};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
reset();
fetch('/api/reports').then(async response=>{if(!response.ok)throw Error();reports=await response.json();renderReports();}).catch(()=>{document.querySelector('#report-list').textContent='Could not load saved reports. Refresh to try again.';});
