/* pipyscox · views/phase-config.js
   Construtor de campos e automações da fase */
'use strict';
/* ===================== Configuração da fase (construtor + automações) ===================== */
function viewPhase(){
  const p=pipeById(S.route.id),ph=phaseOf(p,S.route.ph);
  crumbs([{t:'Home',attrs:'data-v="home"'},{t:p.name,attrs:`data-v="pipe" data-id="${p.id}"`},{t:'Configurar card: '+ph.name}]);
  $('#content').innerHTML=`<div class="page-head"><h1 class="page">Configuração do card</h1><div class="sp"></div><button class="btn primary" data-act="go" data-v="pipe" data-id="${p.id}">${ic('check')} Concluir e voltar ao quadro</button></div>
  <div class="tabs" id="phTabs"></div>
  <div class="panel" style="margin-bottom:20px"><div class="panel-b row wrap" style="gap:24px">
    <label class="f" style="margin:0;flex:1;min-width:220px"><span>Nome da fase</span><input class="input" data-in="phName" value="${esc(ph.name)}"></label>
    <div><span class="fl">Cor da fase</span><div class="swatches">${COLORS.map(c=>`<button class="sw ${c===ph.color?'on':''}" style="background:${c}" data-act="phColor" data-ph="${ph.id}" data-c="${c}"></button>`).join('')}<input type="color" class="sw" value="${ph.color}" data-ch="phColorCustom" data-ph="${ph.id}"></div></div>
  </div></div>
  <div class="builder">
    <div class="panel"><div class="panel-h"><h3 style="font-size:15px">Campos disponíveis</h3></div><div class="panel-b palette" style="padding:12px">
      ${PALETTE.map(it=>{const t=FT[it.t];return`<div class="pal-item" draggable="true" data-ftype="${it.k}" data-act="addField" data-t="${it.k}" title="Arraste para o card ou clique para adicionar">${fic(it.t)}<div><b>${esc(it.label||t.label)}</b><small>${esc(it.desc||t.desc)}</small></div></div>`}).join('')}
      <div class="muted" style="font-size:12px;margin-top:8px">Arraste para o card ao lado ou clique para adicionar no final.</div></div></div>
    <div><div class="fb-card"><div class="row" style="margin-bottom:12px"><b style="flex:1">Campos do card nesta fase</b><span class="muted" style="font-size:12px">arraste para reordenar</span></div>
      <div class="fb-title">${ic('text')} Título do card <span class="muted">(sempre presente)</span></div>
      <div class="fb-list" id="fbList"></div></div>
      <div style="margin-top:20px"><div class="muted" style="font-size:12.5px;margin-bottom:8px">Prévia no quadro</div><div id="fbMini" style="max-width:290px"></div></div></div>
    <div class="panel" id="fbProps"></div>
  </div>
  <div class="panel" style="margin-top:20px"><div class="panel-h"><span style="color:var(--warning);display:flex">${ic('zap')}</span><h3>Automações da fase</h3><span class="muted" style="font-size:13px">regras executadas automaticamente</span></div><div class="panel-b" id="autoPanel"></div></div>`;
  renderFbAll();renderAutoPanel();
}
function phaseCtx(){const p=pipeById(S.route.id);return{p,ph:phaseOf(p,S.route.ph)}}
function renderFbAll(){renderFbList();renderFbMini();renderFbProps();const{p,ph}=phaseCtx();const t=$('#phTabs');if(t)t.innerHTML=p.phases.map(x=>`<button class="tab ${x.id===ph.id?'on':''}" data-act="go" data-v="phase" data-id="${p.id}" data-ph="${x.id}"><span class="dot" style="background:${x.color}"></span><span class="tn">${esc(x.name)}</span> <span class="muted">${x.fields.length}</span>${x.automations.length?`<span style="color:var(--warning);display:flex">${ic('zap')}</span>`:''}</button>`).join('')}
function renderFbList(){const{ph}=phaseCtx();const el=$('#fbList');if(!el)return;
  el.innerHTML=ph.fields.length?ph.fields.map(f=>`<div class="fb-item ${S.selField===f.id?'sel':''}" draggable="true" data-fid="${f.id}" data-act="selField" data-id="${f.id}"><span class="grip">${ic('grip')}</span>${fic(f.type)}<span class="nm"><b>${esc(f.label)}${f.required?' <span class="req">*</span>':''}</b><small>${FT[f.type].label}${f.type==='date'&&f.autoFill?' (auto)':''}${f.showOnCard?' · aparece no quadro':''}</small></span><button class="icon-btn" data-act="rmField" data-id="${f.id}" title="Remover campo">${ic('trash')}</button></div>`).join('')
  :`<div class="fb-empty">${ic('layout')}<div style="margin-top:8px">Arraste campos aqui para montar o card desta fase</div></div>`}
function renderFbMini(){const{p,ph}=phaseCtx();const el=$('#fbMini');if(!el)return;
  const ent=new Date(Date.now()-26*36e5).toISOString();const idx=p.phases.indexOf(ph);
  const fake=normCard({id:'preview',title:'Exemplo de card',phaseId:ph.id,createdAt:new Date(Date.now()-2*864e5).toISOString(),phaseEnteredAt:ent,history:[...p.phases.slice(0,idx).map(x=>({phaseId:x.id,enteredAt:ent,leftAt:ent})),{phaseId:ph.id,enteredAt:ent,leftAt:null}],values:{}});
  const sample={text:'Texto de exemplo',number:'42',currency:'2500',email:'nome@empresa.com.br',phone:'(98) 99999-0000',cpf:'529.982.247-25',date:todayLocal(),checkbox:true,resp:S.user||'Fulano'};
  ph.fields.forEach(f=>{fake.values[f.id]=f.type==='tag'?(f.options||[]).slice(0,1).map(o=>o.id):f.type==='select'?(f.options||[])[0]?.id:f.type==='file'?[{name:'documento.pdf'}]:sample[f.type]});
  el.innerHTML=miniCard({...p,phases:p.phases.map(x=>x===ph?x:{...x,fields:[]})},fake,true)}
function optEditor(f,withColor){return`<div class="fl" style="margin:6px 0 8px">Opções</div>${(f.options||[]).map(o=>`<div class="opt-row">${withColor?`<input type="color" class="sw" value="${o.color}" data-ch="optColor" data-o="${o.id}">`:''}<input class="input" data-in="optName" data-o="${o.id}" value="${esc(o.label)}"><button class="icon-btn" data-act="optRm" data-o="${o.id}">${ic('trash')}</button></div>`).join('')}<button class="btn ghost sm" data-act="optAdd" style="margin-top:4px">${ic('plus')} Adicionar opção</button>`}
function renderFbProps(){const{ph}=phaseCtx();const el=$('#fbProps');if(!el)return;const f=ph.fields.find(x=>x.id===S.selField);
  if(!f){el.innerHTML=`<div class="panel-h"><h3 style="font-size:15px">Propriedades</h3></div><div class="panel-b muted">Selecione um campo no card para editar nome, obrigatoriedade e opções.</div>`;return}
  const b=(k,l)=>`<label class="chk"><input type="checkbox" data-ch="fPropB" data-k="${k}" ${f[k]?'checked':''}> ${l}</label>`;
  const note=t=>`<div class="muted" style="font-size:12.5px">${t}</div>`;let extra='';
  switch(f.type){
    case'text':extra=b('multiline','Texto longo (várias linhas)')+`<label class="f"><span>Texto de ajuda (placeholder)</span><input class="input" data-in="fProp" data-k="placeholder" value="${esc(f.placeholder||'')}"></label>`;break;
    case'date':extra=b('autoFill','Preencher automaticamente com a data em que o card entra nesta fase');break;
    case'file':extra=`<label class="f"><span>Tipos aceitos (opcional)</span><input class="input" data-in="fProp" data-k="accept" value="${esc(f.accept||'')}" placeholder="ex.: .pdf,.jpg,.png"></label>`+note('Os arquivos são gravados em <code>arquivos/</code> dentro da pasta de dados.');break;
    case'time':extra=note('Calculado automaticamente: mostra há quanto tempo o card está nesta fase (e quanto tempo ficou, depois que sair).');break;
    case'phasetag':extra=b('includeCurrent','Incluir a fase atual')+note('Automático: o card recebe uma tag com o nome e a cor de cada fase por onde passou, sem repetir.');break;
    case'tag':extra=b('multiple','Permitir várias tags')+optEditor(f,true);break;
    case'select':extra=optEditor(f,false);break;
    case'cpf':extra=note('Valida os dígitos verificadores. No quadro, o CPF aparece mascarado (***.456.789-**). CPF é dado pessoal: use apenas quando necessário (LGPD).');break;
    case'email':extra=note('Valida o formato do e-mail.');break;
    case'phone':extra=note('Aplica a máscara (DD) 99999-9999 automaticamente.');break;
    case'resp':extra=note('As pessoas da lista vêm de <b>Configurações → Equipe</b>. Use o filtro do quadro para ver os cards de cada responsável.');break;
    case'checkbox':extra=note('Se for obrigatório, o card só sai da fase com a caixa marcada (bom para checklists).');break;
  }
  el.innerHTML=`<div class="panel-h">${fic(f.type)}<h3 style="font-size:15px;flex:1">${FT[f.type].label}</h3></div><div class="panel-b">
  <label class="f"><span>Nome do campo</span><input class="input" data-in="fProp" data-k="label" value="${esc(f.label)}"></label>
  ${!['time','phasetag'].includes(f.type)?b('required','Obrigatório para sair da fase'):''}${b('showOnCard','Mostrar no card do quadro')}<div style="height:6px"></div>${extra}
  <button class="btn ghost sm" style="margin-top:16px;color:var(--danger)" data-act="rmField" data-id="${f.id}">${ic('trash')} Remover campo</button></div>`}
const selF=()=>{const{ph}=phaseCtx();return ph.fields.find(x=>x.id===S.selField)};
function renderAutoPanel(){
  const{p,ph}=phaseCtx();const el=$('#autoPanel');if(!el)return;
  const A0=S.ad||(S.ad={trigger:'enter',action:'addTag',fieldId:'',optId:'',value:'',phaseId:'',text:''});
  const tagFields=allFields(p).filter(({f})=>f.type==='tag').map(x=>x.f);
  const setFields=allFields(p).filter(({f})=>!['file','time','phasetag','tag'].includes(f.type)).map(x=>x.f);
  const sel=(k,opts,ph2='Selecione...')=>`<select class="input" data-ch="adSet" data-k="${k}">${ph2?`<option value="">${ph2}</option>`:''}${opts.map(o=>`<option value="${o.v}" ${String(A0[k])===String(o.v)?'selected':''}>${esc(o.l)}</option>`).join('')}</select>`;
  let params='';
  if(A0.action==='addTag'||A0.action==='removeTag'){const f=tagFields.find(x=>x.id===A0.fieldId);
    params=`<label class="f"><span>Campo de tag</span>${sel('fieldId',tagFields.map(x=>({v:x.id,l:x.label})))}</label>`+(f?`<label class="f"><span>Tag</span>${sel('optId',f.options.map(o=>({v:o.id,l:o.label})))}</label>`:'');
    if(!tagFields.length)params=`<div class="muted" style="font-size:13px">Adicione um campo do tipo <b>Tag</b> em alguma fase para usar esta ação.</div>`}
  else if(A0.action==='setField'){const f=setFields.find(x=>x.id===A0.fieldId);let val='';
    if(f){if(f.type==='select')val=sel('value',f.options.map(o=>({v:o.id,l:o.label})));
      else if(f.type==='resp')val=sel('value',people().map(n=>({v:n,l:n})));
      else if(f.type==='checkbox')val=sel('value',[{v:'sim',l:'Marcado'},{v:'não',l:'Desmarcado'}]);
      else val=`<input class="input" data-in="adSet" data-k="value" value="${esc(A0.value)}" placeholder="${f.type==='date'?'hoje ou dd/mm/aaaa':'Valor'}">`}
    params=`<label class="f"><span>Campo</span>${sel('fieldId',setFields.map(x=>({v:x.id,l:x.label+' ('+FT[x.type].label+')'})))}</label>`+(f?`<label class="f"><span>Valor</span>${val}</label>`:'')}
  else if(A0.action==='move')params=`<label class="f"><span>Fase de destino</span>${sel('phaseId',p.phases.filter(x=>x.id!==ph.id).map(x=>({v:x.id,l:x.name})))}</label>`;
  else if(A0.action==='comment')params=`<label class="f" style="grid-column:span 2"><span>Texto do comentário</span><input class="input" data-in="adSet" data-k="text" value="${esc(A0.text)}" placeholder="Ex.: Lembrar de conferir os documentos"></label>`;
  const noReq=A0.trigger==='complete'&&!ph.fields.some(f=>f.required);
  el.innerHTML=(ph.automations.length?ph.automations.map(a=>`<div class="auto-item"><span class="zap">${ic('zap')}</span><div style="flex:1">${describeAuto(p,a)}</div><button class="icon-btn" data-act="adRm" data-id="${a.id}" title="Remover automação">${ic('trash')}</button></div>`).join(''):'<div class="muted" style="margin-bottom:4px">Nenhuma automação nesta fase.</div>')+
  `<div class="auto-form"><label class="f"><span>Quando</span>${sel('trigger',Object.entries(TRIG).map(([v,l])=>({v,l})),'')}</label>
   <label class="f"><span>Fazer</span>${sel('action',Object.entries(ACTS).map(([v,l])=>({v,l})),'')}</label>${params}
   <button class="btn primary" data-act="adAdd">${ic('plus')} Adicionar automação</button></div>
   ${noReq?'<div style="font-size:12.5px;margin-top:8px;color:var(--warning)">Esta fase não tem campos obrigatórios: o gatilho "campos obrigatórios preenchidos" só funciona quando houver pelo menos um.</div>':''}
   <div class="muted" style="font-size:12.5px;margin-top:10px">Dica: para checklists, crie campos <b>Checkbox</b> obrigatórios e a regra "campos obrigatórios preenchidos → mover para a fase".</div>`;
}
