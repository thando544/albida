import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { whatsappUrl } from './public/report-share.js';

test('form opens the complete report directly without network or storage access', async () => {
  function element() {
    return {children:[], value:'', textContent:'', setAttribute(){}, addEventListener(){}, append(...items){this.children.push(...items);}, replaceChildren(){this.children=[];}};
  }
  const fields=['date','chef','service','covers','menu','overview','dietary','turndown','feedback','conclusion','notes'];
  const form=element();form.elements=Object.fromEntries(fields.map(key=>[key,element()]));form.reset=()=>{};
  const nodes=Object.fromEntries(['#dishes','#status','#covers-label','#add-dish','#new-report'].map(key=>[key,element()]));nodes['#report-form']=form;
  const opened=[];
  const context={whatsappUrl,document:{querySelector:selector=>nodes[selector],createElement:element},window:{addEventListener(){},open(...args){opened.push(args);}}};
  const source=(await readFile(new URL('./public/app.js',import.meta.url),'utf8')).replace(/^import .*\n/,'');
  vm.runInNewContext(source,context);
  Object.assign(form.elements.chef,{value:'Chef Test'});form.elements.overview.value='Lunch & dinner';form.elements.covers.value='5';form.elements.service.value='Dinner';form.elements.menu.value='Zambezi Menu';
  nodes['#dishes'].children[0].children[1].value='Soup';
  form.onsubmit({preventDefault(){}});
  assert.equal(opened.length,1);
  const url=new URL(opened[0][0]);
  assert.equal(url.pathname,'/263785617589');
  assert.match(url.searchParams.get('text'),/Chef on duty: Chef Test/);
  assert.match(url.searchParams.get('text'),/1 × Soup/);
  assert.equal(new URL(nodes['#status'].children[0].href).href,url.href);
  assert.match(nodes['#status'].textContent,/Press Send/);
});
