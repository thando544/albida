import { whatsappUrl } from './report-share.js';
const form = document.querySelector('#report-form');
const dishes = document.querySelector('#dishes');
const status = document.querySelector('#status');
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
function mayReplace(){return !dirty || window.confirm('Replace the unsaved report currently in the form?');}
function reset(){form.reset();form.elements.date.value=today();dishes.replaceChildren();addDish();status.textContent='';dirty=false;serviceLabel();}
form.addEventListener('input',()=>{dirty=true;});form.addEventListener('change',()=>{dirty=true;serviceLabel();});
document.querySelector('#add-dish').onclick=()=>{addDish();dirty=true;dishes.lastElementChild.children[1].focus();};
document.querySelector('#new-report').onclick=()=>{if(mayReplace())reset();};
form.onsubmit=event=>{
  event.preventDefault();
  const report=Object.fromEntries(fields.map(key=>[key,form.elements[key].value.trim()]));
  report.covers=Number(report.covers);
  report.dishes=[...dishes.children].map(row=>({quantity:Number(row.children[0].value),name:row.children[1].value.trim()}));
  if (!report.chef || !report.overview || report.dishes.some(dish=>!dish.name)) {
    status.textContent='Enter the chef, service overview, and dish names before opening WhatsApp.';
    return;
  }
  const url=whatsappUrl(report);
  status.textContent='Press Send in WhatsApp to deliver your report to +263 78 561 7589. If WhatsApp did not open, use this link: ';
  const share=document.createElement('a');
  share.href=url;share.target='_blank';share.rel='noopener noreferrer';share.textContent='Open WhatsApp';
  status.append(share);
  window.open(url,'_blank','noopener,noreferrer');
};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
reset();
