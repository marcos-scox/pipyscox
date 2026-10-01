/* pipyscox · core/zip.js
   Geração e leitura de ZIP sem dependências + backups automáticos */
'use strict';
/* ===================== ZIP (sem dependências) ===================== */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC[(c^u8[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function makeZip(files){
  const enc=new TextEncoder();const chunks=[],central=[];let offset=0;
  for(const f of files){
    const name=enc.encode(f.path),crc=crc32(f.data),d=f.date||new Date();
    const time=(d.getHours()<<11)|(d.getMinutes()<<5)|Math.floor(d.getSeconds()/2);
    const date=((Math.max(1980,d.getFullYear())-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);lh.setUint16(10,time,true);lh.setUint16(12,date,true);
    lh.setUint32(14,crc,true);lh.setUint32(18,f.data.length,true);lh.setUint32(22,f.data.length,true);lh.setUint16(26,name.length,true);lh.setUint16(28,0,true);
    chunks.push(new Uint8Array(lh.buffer),name,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);ch.setUint16(12,time,true);ch.setUint16(14,date,true);
    ch.setUint32(16,crc,true);ch.setUint32(20,f.data.length,true);ch.setUint32(24,f.data.length,true);ch.setUint16(28,name.length,true);ch.setUint32(42,offset,true);
    central.push(new Uint8Array(ch.buffer),name);offset+=30+name.length+f.data.length;
  }
  const cdSize=central.reduce((a,b)=>a+b.length,0);const end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,offset,true);
  return new Blob([...chunks,...central,new Uint8Array(end.buffer)],{type:'application/zip'});
}
async function readZip(buf){
  const u8=new Uint8Array(buf),dv=new DataView(buf);let e=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-65558);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
  if(e<0)throw new Error('Arquivo ZIP inválido');
  const count=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const dec=new TextDecoder();const out=[];
  for(let i=0;i<count;i++){
    if(dv.getUint32(p,true)!==0x02014b50)throw new Error('ZIP corrompido');
    const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=dec.decode(u8.subarray(p+46,p+46+nl)).replace(/\\/g,'/');p+=46+nl+xl+cl;
    if(name.endsWith('/'))continue;
    const lnl=dv.getUint16(off+26,true),lxl=dv.getUint16(off+28,true),start=off+30+lnl+lxl;let data=u8.slice(start,start+csize);
    if(method===8)data=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else if(method!==0)throw new Error('Tipo de compressão não suportado');
    out.push({path:name,data});
  }
  if(!out.some(f=>f.path===DBFILE)){const hit=out.find(f=>f.path.endsWith('/'+DBFILE));if(hit){const pre=hit.path.slice(0,-DBFILE.length);out.forEach(f=>{if(f.path.startsWith(pre))f.path=f.path.slice(pre.length)})}}
  return out;
}
async function buildBackupZip(skipFlush){
  if(!skipFlush)await flush();const all=await walk(S.dir);const files=[];
  for(const e of all){if(e.path.startsWith('backups/'))continue;const f=await e.handle.getFile();files.push({path:e.path,data:new Uint8Array(await f.arrayBuffer()),date:new Date(f.lastModified)})}
  return makeZip(files);
}
function stamp(){const d=new Date(),z=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
async function backupToFolder(silent,kind='manual',skipFlush=false){const blob=await buildBackupZip(skipFlush);const name=`pipyscox-${kind==='auto'?'auto':'backup'}-${stamp()}.zip`;await writeFile('backups/'+name,blob);if(!silent)toast('Backup salvo em <b>backups/'+esc(name)+'</b>');return name}
async function maybeAutoBackup(){
  const ab=S.db?.settings.autoBackup;if(!ab||!ab.enabled||S.backingUp||S.conflict)return;
  const last=S.db.settings.lastAutoBackup?new Date(S.db.settings.lastAutoBackup).getTime():0;
  const due=ab.mode==='daily'?Date.now()-last>=864e5:S.changeCount>=Math.max(1,+ab.changes||30);
  if(!due)return;S.backingUp=true;
  try{await backupToFolder(true,'auto',true);S.changeCount=0;S.db.settings.lastAutoBackup=nowISO();
    const d=await dirAt(['backups'],false);const list=[];for await(const[n,h]of d.entries())if(h.kind==='file'&&n.startsWith('pipyscox-auto-'))list.push(n);
    list.sort().reverse().slice(Math.max(1,+ab.keep||10)).forEach(n=>removePath('backups/'+n));save();
  }catch(e){console.warn('backup automático falhou',e)}finally{S.backingUp=false}
}
