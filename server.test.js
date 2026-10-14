import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';

test('report validation, persistence, PDF export and static routes', async () => {
  const directory=await mkdtemp(path.join(os.tmpdir(),'albida-test-'));
  let child;
  async function start(){
    child=spawn(process.execPath,['server.js'],{cwd:import.meta.dirname,env:{...process.env,PORT:'3197',ALBIDA_DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
    await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited');}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Server startup timed out')),5000);timer.unref();})]);
  }
  async function stop(){const exited=once(child,'exit');child.kill();await exited;}
  const base='http://127.0.0.1:3197';
  const report={date:'2026-10-13',chef:'Munashe',service:'Dinner',covers:5,menu:'Zambezi Menu',overview:'Everything went well.',dishes:[{name:'Mushroom soup',quantity:4}],dietary:'1 × Gluten free',turndown:'5 rooms serviced',feedback:'Positive',conclusion:'High standard maintained',notes:''};
  const post=body=>fetch(base+'/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    await start();
    assert.equal((await fetch(base)).status,200);
    assert.equal((await fetch(base+'/app.js')).status,200);
    assert.equal((await post({...report,covers:-1})).status,400);
    assert.equal((await post({...report,date:'2026-02-30'})).status,400);
    assert.equal((await post({...report,dishes:[]})).status,400);
    const response=await post(report);assert.equal(response.status,201);const saved=await response.json();
    const pdf=await fetch(`${base}/api/reports/${saved.id}/pdf`);assert.equal(pdf.headers.get('content-type'),'application/pdf');const bytes=Buffer.from(await pdf.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>1000);
    assert.equal((await fetch(base+'/api/reports/missing/pdf')).status,404);
    await stop();await start();
    const list=await (await fetch(base+'/api/reports')).json();assert.equal(list.length,1);assert.equal(list[0].chef,'Munashe');assert.equal(list[0].id,saved.id);
    const results=await Promise.all([post(report),post(report),post(report)]);assert.ok(results.every(r=>r.status===201));assert.equal((await (await fetch(base+'/api/reports')).json()).length,4);
  }finally{if(child && child.exitCode===null)await stop();await rm(directory,{recursive:true,force:true});}
});
