/* pipyscox · core/sample.js
   Criação de pipy e pipy de exemplo */
'use strict';
/* ===================== Criar pipy / exemplo ===================== */
function createPipe(name,example){
  const ph=(n,c,fields=[],automations=[])=>({id:uid(),name:n,color:c,fields,automations});
  const p={id:uid(),name,color:COLORS[S.db.pipes.length%COLORS.length],createdAt:nowISO(),phases:[],cards:[]};
  if(example){
    const fNome={...newField('text'),label:'Nome do colaborador',required:true};
    const fCargo={...newField('text'),label:'Cargo'};
    const fEnt=newField('date',{label:'Data de entrada'});
    const fSet={...newField('tag'),label:'Setor',multiple:false,options:[{id:uid(),label:'Administrativo',color:'#3399ff'},{id:uid(),label:'Operacional',color:'#f0ad1a'},{id:uid(),label:'Comercial',color:'#2eb85c'}]};
    const fResp=newField('resp');const fMail={...newField('email'),label:'E-mail'};
    const fDocs={...newField('file'),label:'Documentos'};const fOk={...newField('checkbox'),label:'Documentação conferida',required:true};
    const fPT=newField('phasetag');const fT1=newField('time');const fT2=newField('time');
    const fSal={...newField('currency'),label:'Salário proposto',showOnCard:false};
    const fObs={...newField('text'),label:'Observações',multiline:true,showOnCard:false};
    const fSt={...newField('tag'),label:'Status',options:[{id:uid(),label:'Pendente',color:'#e05555'},{id:uid(),label:'Validado',color:'#2eb85c'}]};
    const phases=[ph('Triagem','#5856d6',[fNome,fCargo,fSet,fResp,fMail,fPT,fEnt,fT1]),ph('Documentação','#3399ff',[fDocs,fOk,fSt,fT2,fObs]),ph('Em análise','#f0ad1a',[fSal]),ph('Concluído','#2eb85c',[])];
    phases[1].automations=[{id:uid(),trigger:'enter',action:'addTag',fieldId:fSt.id,optId:fSt.options[0].id},{id:uid(),trigger:'complete',action:'move',phaseId:phases[2].id}];
    phases[2].automations=[{id:uid(),trigger:'enter',action:'comment',text:'Card entrou em análise. Conferir proposta salarial.'}];
    p.phases=phases;
    const mk=(t,phi,daysAgo,vals)=>{const d=new Date(Date.now()-daysAgo*864e5).toISOString();
      const hist=[...p.phases.slice(0,phi).map((x,i)=>({phaseId:x.id,enteredAt:new Date(Date.now()-(daysAgo+phi-i)*864e5).toISOString(),leftAt:new Date(Date.now()-(daysAgo+phi-i-1)*864e5).toISOString()})),{phaseId:p.phases[phi].id,enteredAt:d,leftAt:null}];
      return normCard({id:uid(),title:t,phaseId:p.phases[phi].id,createdAt:hist[0].enteredAt,phaseEnteredAt:d,history:hist,values:vals,log:[{at:hist[0].enteredAt,by:S.user||'Exemplo',action:'Criou o card',detail:''}]})};
    p.cards=[mk('Colaborador exemplo A',0,1,{[fNome.id]:'Colaborador A',[fCargo.id]:'Assistente',[fSet.id]:[fSet.options[0].id],[fEnt.id]:todayLocal(),[fResp.id]:S.user}),
             mk('Colaborador exemplo B',0,4,{[fNome.id]:'Colaborador B',[fCargo.id]:'Técnico',[fSet.id]:[fSet.options[1].id],[fEnt.id]:todayLocal()}),
             mk('Colaborador exemplo C',1,9,{[fNome.id]:'Colaborador C',[fSet.id]:[fSet.options[2].id],[fSt.id]:[fSt.options[0].id]}),
             mk('Colaborador exemplo D',3,2,{[fNome.id]:'Colaborador D',[fSet.id]:[fSet.options[0].id],[fOk.id]:true,[fSt.id]:[fSt.options[1].id]})];
  } else p.phases=[ph('Caixa de entrada','#5856d6',[newField('date',{label:'Data de entrada'}),newField('resp')]),ph('Em andamento','#3399ff'),ph('Concluído','#2eb85c')];
  normPipe(p);S.db.pipes.push(p);save();return p;
}
