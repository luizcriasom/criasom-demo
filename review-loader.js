// The access key is carried only by the invitation fragment, never by a network request.
const main=document.getElementById('main');
const storageKey='criasom.ux-review.access.v1';
const version=document.querySelector('meta[name="criasom-preview-version"]')?.content||'';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const placeholder=new URL('./review-image.svg',import.meta.url);
// A valid silent sample avoids an audio error while the encrypted track loads.
const audioPlaceholder='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==';
let manifest,cryptoKey,catalog,observer;
const chunkCache=new Map(),imageCache=new Map();
const hex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
function keyBytes(value){if(!/^[A-Za-z0-9_-]{43}$/.test(value))throw Error('Use o link completo de teste enviado pelo Luiz.');const s=atob(value.replaceAll('-','+').replaceAll('_','/')+'=');return Uint8Array.from(s,c=>c.charCodeAt(0));}
async function fileBytes(file){
  const spec=manifest.files[file];if(!spec)throw Error('Arquivo ausente na edição de teste.');
  const response=await fetch(new URL('./protected/'+file+'?v='+spec.sha256,import.meta.url),{credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Não foi possível carregar o material. Tente novamente.');
  const b=await response.arrayBuffer();if(b.byteLength!==spec.bytes||hex(await crypto.subtle.digest('SHA-256',b))!==spec.sha256)throw Error('O material está sendo atualizado. Recarregue a página.');
  return crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12),additionalData:encoder.encode(`criasom-review/1|${manifest.edition}|${file}`)},cryptoKey,b.slice(12));
}
function chunk(file){if(!chunkCache.has(file)){chunkCache.set(file,fileBytes(file).catch(e=>{chunkCache.delete(file);throw e;}));if(chunkCache.size>4)chunkCache.delete(chunkCache.keys().next().value);}return chunkCache.get(file);}
async function imageUrl(name){
  if(imageCache.has(name))return imageCache.get(name);
  const spec=catalog.assets[name];if(!spec)throw Error('Imagem ausente na edição.');
  const pending=chunk(spec.file).then(b=>URL.createObjectURL(new Blob([b.slice(spec.offset,spec.offset+spec.length)],{type:spec.mime}))).catch(e=>{imageCache.delete(name);throw e;});
  imageCache.set(name,pending);return pending;
}
function mountImages(){
  const load=img=>{
    const raw=img.getAttribute('src');if(!raw)return;const u=new URL(raw,location.href);
    const isPlaceholder=(u.origin===placeholder.origin&&u.pathname===placeholder.pathname)||raw.startsWith(audioPlaceholder+'#');
    if(!isPlaceholder||!u.hash)return;
    const name=decodeURIComponent(u.hash.slice(1));if(!catalog.assets[name])return;
    imageUrl(name).then(url=>{if(img.getAttribute('src')===raw){img.src=url;img.removeAttribute('aria-busy');if(img.tagName==='AUDIO')img.load();}}).catch(()=>{
      if(img.getAttribute('src')!==raw||img.nextElementSibling?.classList.contains('review-retry'))return;
      const button=document.createElement('button');button.className='button review-retry';button.textContent=img.tagName==='AUDIO'?'Tentar carregar o áudio novamente':'Tentar carregar a imagem novamente';
      button.onclick=()=>{button.remove();load(img);};img.after(button);
    });img.setAttribute('aria-busy','true');
  };
  observer=new MutationObserver(records=>{for(const r of records){if(r.type==='attributes')load(r.target);else for(const n of r.addedNodes){if(n.nodeType!==1)continue;if(['IMG','AUDIO'].includes(n.tagName))load(n);n.querySelectorAll?.('img,audio').forEach(load);}}});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});document.querySelectorAll('img,audio').forEach(load);
}
function gate(message='Abra o link completo que o Luiz enviou ao grupo de testes.'){
  main.innerHTML='<section class="card review-gate"><p class="eyebrow">Teste do Criasom</p><h1>Seu convite para experimentar.</h1><p id="review-gate-message"></p><form id="review-access-form"><label for="review-access">Link ou código de acesso</label><input id="review-access" type="password" autocomplete="off" spellcheck="false" required><button class="button primary" type="submit">Abrir teste completo</button></form><p class="small muted">O convite dá acesso aos materiais dos cursos. Compartilhe somente com o grupo de testes.</p></section>';
  document.getElementById('review-gate-message').textContent=message;
  document.getElementById('review-access-form').addEventListener('submit',event=>{event.preventDefault();const value=document.getElementById('review-access').value.trim();const key=value.includes('#acesso=')?new URLSearchParams(value.split('#')[1]).get('acesso'):value;open(key).catch(e=>gate(e.message));});
}
async function open(value){
  const bytes=keyBytes(value);cryptoKey=await crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['decrypt']);
  main.innerHTML='<p class="loading" role="status">Preparando os cursos e as práticas…</p>';
  const response=await fetch(new URL('./protected/manifest.json?v='+version,import.meta.url),{credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('Não foi possível abrir o teste. Tente novamente.');manifest=await response.json();
  if(manifest.schema!=='criasom-review/1')throw Error('Atualize o link de teste.');
  try{catalog=JSON.parse(decoder.decode(await fileBytes('catalog.bin')));}catch{throw Error('Não foi possível abrir os materiais. Confira o link completo ou tente novamente.');}
  if(catalog.schema!=='criasom-review-content/1'||!catalog.data?.modules?.length)throw Error('Conteúdo de teste inválido.');
  try{sessionStorage.setItem(storageKey,value);}catch{}
  window.CRIASOM_DATA=catalog.data;
  window.CRIASOM_ASSET=name=>catalog.assets[name]?(catalog.assets[name].mime.startsWith('audio/')?audioPlaceholder:placeholder.href)+'#'+encodeURIComponent(name):name;
  window.CRIASOM_REVIEW={edition:manifest.edition,coverage:manifest.coverage};
  mountImages();
  const label=document.querySelector('.ux-preview-bar span');if(label)label.textContent='Cursos e materiais atuais. Seus registros de teste ficam neste navegador.';
  const stamp=document.querySelector('.ux-version');if(stamp)stamp.textContent+=' · conteúdo '+manifest.edition.slice(0,6);
  await import('./app.js?v='+version);
}
const fragment=new URLSearchParams(location.hash.slice(1));
let access=fragment.get('acesso');
if(access)history.replaceState(null,'',location.pathname+location.search+'#hoje');
else try{access=sessionStorage.getItem(storageKey);}catch{}
if(access)open(access).catch(e=>gate(e.message));else gate();
