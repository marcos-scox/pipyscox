/* pipyscox · views/settings.js
   Configurações */
'use strict';
/* ===================== Configurações ===================== */
function viewConfig(){
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:'Configurações'}]);const ab=S.db.settings.autoBackup;
  $('#content').innerHTML=`<div class="page-head"><h1 class="page">Configurações</h1></div><div class="cfg-grid">
  <div class="panel"><div class="panel-h">${ic('folder')}<h3>Pasta de dados</h3></div><div class="panel-b">
    <div class="kv"><span>Pasta atual</span><b>${esc(S.dir.name)}</b></div>
    <div class="kv"><span>Última gravação</span><span>${S.db.updatedAt?fmtDateTime(S.db.updatedAt):'-'}</span></div>
    <div class="kv" style="margin-bottom:16px"><span>Status</span><span style="color:var(--success)">● Conectada · verifica alterações externas a cada 4 s</span></div>
    <div class="row wrap"><button class="btn primary" data-act="changeFolder">${ic('folder')} Trocar pasta</button><button class="btn ghost" data-act="reloadData">${ic('refresh')} Recarregar da pasta</button></div>
    <p class="muted" style="font-size:12.5px;margin:14px 0 0">Se outra pessoa (ou outro computador sincronizado) alterar a mesma pasta, o pipyscox recarrega sozinho quando você não tem alterações pendentes. Se houver conflito, ele pergunta antes de gravar.</p></div></div>
  <div class="panel"><div class="panel-h">${ic('user')}<h3>Usuário e equipe</h3></div><div class="panel-b">
    <div class="kv" style="margin-bottom:14px"><span>Você está como</span><span class="row"><b>${esc(S.user)}</b><button class="btn ghost sm" data-act="changeUser">Trocar</button></span></div>
    <div class="fl">Equipe (aparece no campo Responsável)</div>
    <div class="files">${people().map(n=>`<div class="file"><span class="avatar xs">${esc(initials(n))}</span><span class="nm">${esc(n)}</span><button class="icon-btn" data-act="personRm" data-n="${esc(n)}" title="Remover">${ic('trash')}</button></div>`).join('')||'<span class="muted">Ninguém cadastrado.</span>'}</div>
    <div class="row"><input class="input" id="personIn" placeholder="Nome da pessoa"><button class="btn ghost" data-act="personAdd">${ic('plus')} Adicionar</button></div></div></div>
  <div class="panel"><div class="panel-h">${ic('archive')}<h3>Backup e compartilhamento</h3></div><div class="panel-b">
    <div class="row wrap" style="margin-bottom:12px"><button class="btn info" data-act="backupFolder">${ic('archive')} Salvar backup agora</button><button class="btn ghost" data-act="zipDownload">${ic('down')} Baixar ZIP</button><label class="btn ghost" style="cursor:pointer">${ic('up')} Importar ZIP<input type="file" accept=".zip" hidden data-ch="zipImport"></label></div>
    <p class="muted" style="font-size:12.5px;margin:0 0 14px">O ZIP contém tudo (dados e arquivos). Para compartilhar, envie o ZIP ou a própria pasta. Antes de importar ou restaurar, um backup automático é criado.</p>
    <div class="fsec" style="margin-bottom:14px"><label class="chk"><input type="checkbox" data-ch="abSet" data-k="enabled" ${ab.enabled?'checked':''}> <b>Backup automático</b></label>
      <div class="row wrap" style="gap:12px"><label class="f" style="margin:0;flex:1;min-width:150px"><span>Frequência</span><select class="input" data-ch="abSet" data-k="mode"><option value="daily" ${ab.mode==='daily'?'selected':''}>Uma vez por dia</option><option value="changes" ${ab.mode==='changes'?'selected':''}>A cada X alterações</option></select></label>
      ${ab.mode==='changes'?`<label class="f" style="margin:0;width:120px"><span>Alterações</span><input type="number" min="1" class="input" data-ch="abSet" data-k="changes" value="${ab.changes}"></label>`:''}
      <label class="f" style="margin:0;width:120px"><span>Manter últimos</span><input type="number" min="1" class="input" data-ch="abSet" data-k="keep" value="${ab.keep}"></label></div>
      <div class="muted" style="font-size:12px;margin-top:8px">Último automático: ${S.db.settings.lastAutoBackup?fmtDateTime(S.db.settings.lastAutoBackup):'nenhum ainda'}</div></div>
    <div class="fl">Backups na pasta <span class="muted" style="font-weight:400">(backups/)</span></div><div id="bkList" class="muted">Carregando...</div></div></div>
  <div class="panel"><div class="panel-h">${ic(S.theme==='dark'?'moon':'sun')}<h3>Aparência</h3></div><div class="panel-b"><div class="row"><button class="btn ${S.theme==='dark'?'primary':'ghost'}" data-act="setTheme" data-t="dark">${ic('moon')} Escuro</button><button class="btn ${S.theme==='light'?'primary':'ghost'}" data-act="setTheme" data-t="light">${ic('sun')} Claro</button></div><label class="chk" style="margin:16px 0 0"><input type="checkbox" data-ch="animSet" ${ANIM.on?'checked':''}> Animações na interface</label>${reduceMotion.matches?'<div class="muted" style="font-size:12px;margin-top:6px">Seu sistema pede movimento reduzido, então as animações ficam desligadas.</div>':''}</div></div>
  <div class="panel"><div class="panel-h">${ic('db')}<h3>Estrutura da pasta</h3></div><div class="panel-b"><div class="tree">${esc(S.dir.name)}/
├── pipyscox.json        ← pipys, fases, campos, cards, lixeira
├── arquivos/
│   └── &lt;pipy&gt;/&lt;card&gt;/   ← anexos dos cards
└── backups/             ← backups .zip (manuais e automáticos)</div></div></div>
  </div>`;
  loadBackups();
}
async function loadBackups(){const el=$('#bkList');if(!el)return;try{const d=await dirAt(['backups'],false);const list=[];for await(const[n,h]of d.entries())if(h.kind==='file'&&n.endsWith('.zip')){const f=await h.getFile();list.push({n,size:f.size,t:f.lastModified})}
  list.sort((a,b)=>b.t-a.t);el.innerHTML=list.length?`<div class="files">${list.map(b=>`<div class="file">${ic('archive')}<span class="nm">${esc(b.n)}</span><span class="muted">${fmtSize(b.size)}</span><button class="icon-btn" title="Baixar" data-act="bkDl" data-n="${esc(b.n)}">${ic('down')}</button><button class="icon-btn" title="Restaurar" data-act="bkRestore" data-n="${esc(b.n)}">${ic('refresh')}</button><button class="icon-btn" title="Excluir" data-act="bkRm" data-n="${esc(b.n)}">${ic('trash')}</button></div>`).join('')}</div>`:'Nenhum backup ainda.'}catch(e){el.textContent='Nenhum backup ainda.'}}
async function restoreZip(buf){
  const entries=await readZip(buf);const dbE=entries.find(e=>e.path===DBFILE);if(!dbE)throw new Error('O ZIP não contém pipyscox.json');
  JSON.parse(new TextDecoder().decode(dbE.data));
  await backupToFolder(true);await removePath('arquivos');
  for(const e of entries){if(e.path.startsWith('backups/')||e.path.includes('..'))continue;await writeFile(e.path,e.data)}
  await loadDb();S.route={v:'home'};renderAll();toast('Dados importados com sucesso. Um backup do estado anterior foi salvo em backups/.');
}
