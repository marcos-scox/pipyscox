/* pipyscox · core/storage.js
   Pasta local: IndexedDB, File System Access, leitura/gravação e detecção de conflito */
'use strict';
/* ===================== IndexedDB (referência da pasta) ===================== */
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('pipyscox',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function kvGet(k){try{const d=await idb();return await new Promise(res=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(undefined)})}catch(e){return undefined}}
async function kvSet(k,v){try{const d=await idb();await new Promise(res=>{const tx=d.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=res;tx.onerror=res})}catch(e){}}

/* ===================== Sistema de arquivos ===================== */
async function dirAt(parts,create,root=S.dir){let d=root;for(const p of parts){if(!p)continue;d=await d.getDirectoryHandle(p,{create})}return d}
async function writeFile(path,data,root=S.dir){const parts=path.split('/');const name=parts.pop();const d=await dirAt(parts,true,root);const fh=await d.getFileHandle(name,{create:true});const w=await fh.createWritable();await w.write(data);await w.close()}
async function readFile(path,root=S.dir){const parts=path.split('/');const name=parts.pop();const d=await dirAt(parts,false,root);const fh=await d.getFileHandle(name);return fh.getFile()}
async function removePath(path,root=S.dir){try{const parts=path.split('/');const name=parts.pop();const d=await dirAt(parts,false,root);await d.removeEntry(name,{recursive:true})}catch(e){}}
async function walk(dir,prefix='',out=[]){for await(const[name,h]of dir.entries()){const p=prefix+name;if(h.kind==='file')out.push({path:p,handle:h});else await walk(h,p+'/',out)}return out}
async function verifyPerm(h,ask){if(!h.queryPermission)return true;const o={mode:'readwrite'};if(await h.queryPermission(o)==='granted')return true;if(ask&&await h.requestPermission(o)==='granted')return true;return false}

function normalize(db){
  db=db&&typeof db==='object'?db:{};
  db.app='pipyscox';db.version=2;db.createdAt=db.createdAt||nowISO();
  db.pipes=Array.isArray(db.pipes)?db.pipes:[];db.trash=Array.isArray(db.trash)?db.trash:[];
  db.settings=db.settings||{};db.settings.people=Array.isArray(db.settings.people)?db.settings.people:[];
  db.settings.autoBackup=Object.assign({enabled:true,mode:'daily',changes:30,keep:10},db.settings.autoBackup||{});
  db.pipes.forEach(normPipe);return db;
}
function normPipe(p){p.id=p.id||uid();p.color=p.color||COLORS[0];p.phases=Array.isArray(p.phases)?p.phases:[];p.cards=Array.isArray(p.cards)?p.cards:[];
  p.form=Object.assign({enabled:false,phaseId:'',title:'',desc:'',titleLabel:'Nome completo',consent:true,consentText:'Autorizo o uso dos dados informados exclusivamente para esta finalidade, conforme a LGPD (Lei 13.709/2018).'},p.form||{});
  p.imported=Array.isArray(p.imported)?p.imported:[];
  p.phases.forEach(ph=>{ph.id=ph.id||uid();ph.color=ph.color||COLORS[1];ph.fields=Array.isArray(ph.fields)?ph.fields:[];ph.automations=Array.isArray(ph.automations)?ph.automations:[];
    ph.fields.forEach(f=>{f.id=f.id||uid();if(f.type==='tag'||f.type==='select')f.options=f.options||[]})});
  p.cards.forEach(normCard);return p}
function normCard(c){c.values=c.values||{};c.createdAt=c.createdAt||nowISO();c.phaseEnteredAt=c.phaseEnteredAt||c.createdAt;
  c.history=Array.isArray(c.history)&&c.history.length?c.history:[{phaseId:c.phaseId,enteredAt:c.phaseEnteredAt,leftAt:null}];
  c.comments=Array.isArray(c.comments)?c.comments:[];c.log=Array.isArray(c.log)?c.log:[];return c}

/* ===================== Leitura / gravação com detecção de alteração externa ===================== */
async function loadDb(){
  try{const f=await readFile(DBFILE);S.db=normalize(JSON.parse(await f.text()));S.lastMod=f.lastModified}
  catch(e){
    if(e.name==='NotFoundError'||e.name==='TypeMismatchError'){S.db=normalize({});await writeFile(DBFILE,JSON.stringify(S.db,null,2));S.lastMod=(await readFile(DBFILE)).lastModified}
    else if(e instanceof SyntaxError){
      try{const f=await readFile(DBFILE);await writeFile(`pipyscox.corrompido-${Date.now()}.json`,await f.text())}catch(_){}
      S.db=normalize({});await writeFile(DBFILE,JSON.stringify(S.db,null,2));S.lastMod=(await readFile(DBFILE)).lastModified;
      toast('O arquivo de dados estava corrompido. Uma cópia foi guardada e um novo foi criado.','warn',6000)
    } else throw e;
  }
  S.conflict=false;
}
function setSaveState(st){const el=$('#saveSt');el.className='save-st '+(st==='saving'?'saving':st==='err'?'err':'');el.querySelector('.tx').textContent=st==='saving'?'Salvando...':st==='err'?(S.conflict?'Conflito de versões':'Erro ao salvar'):'Salvo na pasta'}
function save(){if(!S.db)return;clearTimeout(S.saveT);setSaveState('saving');S.saveT=setTimeout(()=>flush(),350)}
async function flush(force){
  clearTimeout(S.saveT);S.saveT=null;if(!S.dir||!S.db)return;if(S.conflict&&!force)return;
  S.saving=true;
  try{
    if(!force&&S.lastMod){let ext=0;try{ext=(await readFile(DBFILE)).lastModified}catch(e){}
      if(ext&&ext!==S.lastMod){S.conflict=true;setSaveState('err');showConflict();return}}
    S.db.updatedAt=nowISO();await writeFile(DBFILE,JSON.stringify(S.db,null,2));
    S.lastMod=(await readFile(DBFILE)).lastModified;S.conflict=false;setSaveState('ok');S.changeCount++;
    setTimeout(maybeAutoBackup,50);
  }catch(e){console.error(e);setSaveState('err');toast('Não foi possível salvar na pasta: '+esc(e.message),'err',6000)}
  finally{S.saving=false}
}
function showConflict(){
  openModal(`<div class="modal-h"><h3>Os dados da pasta foram alterados</h3></div><div class="modal-b" style="color:var(--text-2)">
  O arquivo <b>pipyscox.json</b> foi modificado fora desta janela (outro computador, outra aba ou sincronização da pasta) depois da sua última gravação.<br><br>
  Para não perder nada, escolha o que fazer:</div>
  <div class="modal-f" style="flex-wrap:wrap"><button class="btn ghost" data-act="conflictReload">${ic('refresh')} Recarregar da pasta (descartar as minhas alterações)</button>
  <button class="btn primary" data-act="conflictOverwrite">${ic('archive')} Manter as minhas (com backup da outra versão)</button></div>`,'md');
}
window.addEventListener('beforeunload',e=>{if(S.saveT||S.saving){flush();e.preventDefault();e.returnValue=''}});
