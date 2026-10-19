(() => {
  const bar=document.createElement('aside');
  bar.className='ux-preview-bar';
  bar.setAttribute('aria-label','Sobre esta demonstração');
  bar.innerHTML='<div><strong>Versão de teste</strong><span>Experimente à vontade. Dados fictícios; seus testes ficam neste navegador.</span></div><button type="button" id="ux-feedback-open">Dar feedback</button>';
  const version=document.querySelector('meta[name="criasom-preview-version"]')?.content||'prévia';
  const sourceRevision=document.querySelector('meta[name="criasom-preview-source"]')?.content||'';
  const updatedAt=document.querySelector('meta[name="criasom-preview-date"]')?.content||'';
  const stamp=document.createElement('small');stamp.className='ux-version';stamp.textContent='Atualizada em '+updatedAt+' · '+version.slice(0,6)+(sourceRevision&&sourceRevision!=='local'?' · principal '+sourceRevision.slice(0,7):'');bar.firstElementChild.append(stamp);
  document.body.prepend(bar);
  const dialog=document.createElement('dialog');
  dialog.className='ux-feedback-dialog';
  dialog.setAttribute('aria-labelledby','ux-feedback-title');
  dialog.innerHTML='<div class="ux-feedback-head"><h2 id="ux-feedback-title">O que você achou?</h2><button type="button" id="ux-feedback-close" aria-label="Fechar feedback">×</button></div><p>Conte o que ficou fácil, o que confundiu ou o que você mudaria. Não inclua senhas ou dados pessoais.</p><label for="ux-feedback-message">Sua opinião</label><textarea id="ux-feedback-message" rows="5" maxlength="4000" placeholder="Eu tentei… e senti falta de…"></textarea><p class="ux-feedback-help">Copie a mensagem e cole no grupo de testes. Nada é enviado automaticamente.</p><button type="button" id="ux-feedback-copy">Copiar feedback</button><p id="ux-feedback-status" role="status"></p><textarea id="ux-feedback-result" aria-label="Feedback pronto para copiar" rows="7" readonly hidden></textarea>';
  document.body.append(dialog);
  const open=document.getElementById('ux-feedback-open');
  open.addEventListener('click',()=>{document.getElementById('ux-feedback-status').textContent='';dialog.showModal();document.getElementById('ux-feedback-message').focus();});
  document.getElementById('ux-feedback-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>open.focus());
  document.getElementById('ux-feedback-copy').addEventListener('click',async()=>{
    const message=document.getElementById('ux-feedback-message').value.trim();
    const status=document.getElementById('ux-feedback-status');
    if(!message){status.textContent='Escreva sua opinião antes de copiar.';document.getElementById('ux-feedback-message').focus();return;}
    const result=document.getElementById('ux-feedback-result');
    // Include only this app's screen, never local records, account data or browsing history.
    result.value='Feedback — Criasom\nVersão: '+version+' ('+updatedAt+')\nTela: '+document.title+'\nCaminho: '+location.pathname+location.hash+'\n\n'+message;
    result.hidden=false;
    try{await navigator.clipboard.writeText(result.value);status.textContent='Copiado! Agora cole no grupo de testes.';}
    catch{status.textContent='Selecione e copie a mensagem abaixo para o grupo de testes.';result.focus();result.select();}
  });
})();
