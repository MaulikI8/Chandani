(() => {
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const rooms=window.CHANDANI_TRY_ROOMS, products=Object.fromEntries(window.CHANDANI_CATALOGUE.map(p=>[p.id,p]));
 const asset=n=>window.CHANDANI_ASSETS?.[n]||'assets/'+n;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const arrow='<svg class="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 14 14 4M4 4h10v10"/></svg>';
 const bookmark='<svg class="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3h8v12l-4-3-4 3z"/></svg>';
 const dialog=document.createElement('dialog');dialog.id='tryRoom';dialog.className='try-room-dialog';dialog.setAttribute('aria-labelledby','tryRoomTitle');
 dialog.innerHTML=`<header class="try-room-head"><div><span class="eyebrow">TRY THE ROOM</span><h2 id="tryRoomTitle">See what a piece changes.</h2></div><button class="icon-button" id="closeTryRoom" aria-label="Close Try the room">×</button></header><div class="try-room-body"><nav class="try-room-tabs" aria-label="Choose a room to try">${Object.entries(rooms).map(([id,r])=>`<button data-tr-room="${id}" aria-pressed="false">${r.label}</button>`).join('')}</nav><div class="try-workspace"><aside class="try-sidebar"><span class="eyebrow">CHOOSE WHAT TO TRY</span><div class="try-items" id="tryItems" aria-label="Choose a piece"></div><div class="try-selection" aria-live="polite"><h3 id="tryProductName"></h3><p id="tryProductDescription"></p></div><div class="try-colours" id="tryColours" aria-label="Carpet colour" hidden><button data-tr-colour="clay" aria-pressed="false"><i style="--colour:#9e4e2c"></i>Clay</button><button data-tr-colour="chalk" aria-pressed="true"><i style="--colour:#d4c4a8"></i>Chalk</button><button data-tr-colour="ink" aria-pressed="false"><i style="--colour:#3c3733"></i>Ink</button></div></aside><div class="try-preview"><div class="try-stage" id="tryStage" data-light="day"><div class="try-frame" id="tryFrame"><img id="tryBefore" alt=""><img id="tryAfter" class="try-after" alt=""><div class="try-divider" id="tryDivider" aria-hidden="true"><span>↔</span></div><input id="trySlider" type="range" min="0" max="100" value="50" aria-label="Room comparison: drag to reveal the selected piece" aria-valuetext="50 percent of the furnished view visible"><div class="try-image-labels"><span id="tryWithLabel"></span><span id="tryWithoutLabel"></span></div><button class="try-expand" id="tryExpand" aria-label="Expand room comparison">Expand ↗</button></div><div class="try-loading" id="tryLoading" role="status"><span id="tryLoadMessage">Loading comparison…</span><button id="tryRetry" hidden>Try again</button></div></div><div class="try-toolbar"><div class="try-views" aria-label="Comparison view"><button data-tr-view="100" aria-pressed="false">With piece</button><button data-tr-view="50" aria-pressed="true">Compare</button><button data-tr-view="0" aria-pressed="false">Without piece</button></div><div class="try-lights" aria-label="Preview lighting"><button data-tr-light="day" aria-pressed="true">Day</button><button data-tr-light="evening" aria-pressed="false">Evening</button></div></div><div class="try-actions"><button class="text-link" id="trySave" data-save="sofa"><span data-save-text>Save to shortlist</span>${bookmark}</button><button class="button" id="tryEnquire">Enquire about this piece ${arrow}</button></div><div class="try-help"><p>Drag the divider to compare with and without the selected piece. Illustrative room studies; lighting is a visual filter.</p><button id="tryReset">Reset view</button></div></div></div></div>`;
 document.body.append(dialog);
 let currentRoom='living',currentItem='sofa',colour='chalk',request=0,returnFocus=null,previousOverflow='',enquiryHandoff=false;
 const loaded=new Map();
 function item(){return rooms[currentRoom].items.find(i=>i.id===currentItem);}
 function productId(){return item().colours?colour:item().product;}
 function sync(){document.dispatchEvent(new CustomEvent('chandani:sync'));}
 function loadImage(name){if(loaded.has(name))return loaded.get(name);const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>{loaded.delete(name);reject(new Error('Image unavailable'));};image.src=asset(name);});loaded.set(name,promise);return promise;}
 function setSplit(value){const v=Math.min(100,Math.max(0,Number(value)));$('#trySlider').value=v;$('#tryStage').style.setProperty('--try-split',v+'%');$('#trySlider').setAttribute('aria-valuetext',v===100?'Full view with the selected piece':v===0?'Full view without the selected piece':v+' percent of the view with the piece visible');$('#tryDivider').hidden=v===0||v===100;$('#tryWithLabel').hidden=v===0;$('#tryWithoutLabel').hidden=v===100;$$('[data-tr-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trView==='50'?v>0&&v<100:Number(b.dataset.trView)===v)));}
 function setExpanded(on){dialog.classList.toggle('try-room-expanded',on);$('#tryExpand').textContent=on?'Close expanded view ↙':'Expand ↗';$('#tryExpand').setAttribute('aria-label',on?'Close expanded room comparison':'Expand room comparison');$('#tryExpand').setAttribute('aria-expanded',String(on));}
 function setLight(value){if(!['day','evening'].includes(value))return;$('#tryStage').dataset.light=value;$$('[data-tr-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trLight===value)));}
 async function renderItem(reset=true){
  const entry=item(),p=products[productId()],token=++request;
  $$('[data-tr-item]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trItem===currentItem)));
  $('#tryColours').hidden=!entry.colours;$$('[data-tr-colour]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trColour===colour)));
  $('#tryProductName').textContent=p?p.name:'Kitchen design';
  $('#tryProductDescription').textContent=p?p.text:'Compare the room before the kitchen installation with the finished design concept.';
  $('#trySave').hidden=!p;if(p)$('#trySave').dataset.save=p.id;
  $('#tryEnquire').innerHTML=(p?'Enquire about this piece':'Discuss your kitchen')+' '+arrow;
  $('#tryWithLabel').textContent=entry.withLabel;$('#tryWithoutLabel').textContent=entry.withoutLabel;
  $('[data-tr-view="100"]').textContent=entry.id==='kitchen'?'With design':'With piece';$('[data-tr-view="0"]').textContent=entry.id==='kitchen'?'Before design':'Without piece';
  $('#tryStage').style.setProperty('--try-ratio',entry.ratio);$('#tryStage').dataset.shape=entry.colours?'rug':'wide';
  $('#tryLoading').hidden=false;$('#tryLoadMessage').textContent='Loading comparison…';$('#tryRetry').hidden=true;$('#tryStage').setAttribute('aria-busy','true');$('#trySlider').disabled=true;
  if(reset){setSplit(entry.split??50);setLight('day');}
  sync();
  const after=entry.colours?'room-'+colour+'.webp':entry.after;
  try{await Promise.all([loadImage(entry.before),loadImage(after)]);if(token!==request)return;$('#tryBefore').src=asset(entry.before);$('#tryAfter').src=asset(after);$('#tryBefore').alt=rooms[currentRoom].label+' — '+entry.withoutLabel.toLowerCase();$('#tryAfter').alt=rooms[currentRoom].label+' — '+entry.withLabel.toLowerCase()+(entry.colours?' in '+colour:'');$('#tryLoading').hidden=true;$('#trySlider').disabled=false;$('#tryStage').setAttribute('aria-busy','false');}
  catch{if(token!==request)return;$('#tryLoadMessage').textContent='This room preview could not load. Please try again.';$('#tryRetry').hidden=false;$('#tryStage').setAttribute('aria-busy','false');}
 }
 function selectRoom(key,selected){if(!rooms[key])return;currentRoom=key;currentItem=rooms[key].items.some(i=>i.id===selected)?selected:rooms[key].items[0].id;$$('[data-tr-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.trRoom===key)));$('#tryItems').innerHTML=rooms[key].items.map(i=>'<button data-tr-item="'+i.id+'" aria-pressed="false"><span>'+escape(i.label)+'</span><span>↗</span></button>').join('');renderItem();}
 function openRoom(product,room){
  let targetRoom=rooms[room]?room:'living',selected;
  if(product){for(const [key,value]of Object.entries(rooms)){const found=value.items.find(i=>i.product===product||(i.colours&&['clay','chalk','ink'].includes(product)));if(found){targetRoom=key;selected=found.id;if(found.colours)colour=product;break;}}}
  if(!dialog.open){returnFocus=document.activeElement;previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';}
  selectRoom(targetRoom,selected);dialog.scrollTop=0;$('#closeTryRoom').focus({preventScroll:true});
 }
 dialog.addEventListener('cancel',e=>{if(dialog.classList.contains('try-room-expanded')){e.preventDefault();setExpanded(false);}});
 dialog.addEventListener('close',()=>{setExpanded(false);document.body.style.overflow=$('#drawer')?.open?'hidden':(previousOverflow==='hidden'?'':previousOverflow);if(!enquiryHandoff&&returnFocus?.isConnected&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true});enquiryHandoff=false;});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;
  if(b.matches('[data-try-room]')){e.preventDefault();return openRoom(null,b.dataset.tryRoom||$('[data-room][aria-pressed="true"]')?.dataset.room||'living');}
  if(b.matches('[data-try-product]')){e.preventDefault();return openRoom(b.dataset.tryProduct);}
  if(!dialog.contains(b))return;
  if(b.id==='closeTryRoom')return dialog.close();
  if(b.matches('[data-tr-room]'))return selectRoom(b.dataset.trRoom);
  if(b.matches('[data-tr-item]')){currentItem=b.dataset.trItem;return renderItem();}
  if(b.matches('[data-tr-colour]')){colour=b.dataset.trColour;return renderItem(false);}
  if(b.matches('[data-tr-view]'))return setSplit(b.dataset.trView==='50'?(item().split??50):b.dataset.trView);
  if(b.matches('[data-tr-light]'))return setLight(b.dataset.trLight);
  if(b.id==='tryReset'){setSplit(item().split??50);setLight('day');return;}
  if(b.id==='tryRetry')return renderItem(false);
  if(b.id==='tryExpand'){setExpanded(!dialog.classList.contains('try-room-expanded'));return;}
  if(b.id==='tryEnquire'){const interest=products[productId()]?.name||item().interest;enquiryHandoff=true;dialog.close();requestAnimationFrame(()=>document.dispatchEvent(new CustomEvent('chandani:enquire',{detail:{interest}})));}
 });
 $('#trySlider').addEventListener('input',e=>setSplit(e.target.value));

})();
