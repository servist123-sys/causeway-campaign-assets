(()=>{
  'use strict';
  const root=document.getElementById('christmas-gifts');
  if(!root||root.dataset.cartReady)return;
  root.dataset.cartReady='1';
  const UNIT=10000,STORE='holt.christmas.gift-cart.v1';
  const products=[...root.querySelectorAll('.hcg-product')];
  const cards=new Map(products.map(el=>[el.dataset.gift,el]));
  const state=Object.fromEntries([...cards.keys()].map(key=>[key,0]));
  const slot=root.querySelector('.hcg-slot'),cart=root.querySelector('.hcg-cart');
  const list=root.querySelector('.hcg-items'),empty=root.querySelector('.hcg-empty');
  const checkout=root.querySelector('.hcg-checkout'),message=root.querySelector('.hcg-message');
  const live=root.querySelector('[data-live]'),dialog=root.querySelector('.hcg-dialog');
  const bar=root.querySelector('.hcg-bar'),opener=root.querySelector('.hcg-open');
  const mobile=matchMedia('(max-width:900px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const rows=new Map(),money=n=>n.toLocaleString('ko-KR')+'원';
  const total=()=>Object.values(state).reduce((a,b)=>a+b,0);
  let config={},savedOverflow='',lastFocus=null,scrollFrame=0;
  try{config=JSON.parse(document.getElementById('hcg-config').textContent)}catch{}
  try{const saved=JSON.parse(sessionStorage.getItem(STORE)||'{}');for(const key of cards.keys()){const value=saved?.[key];if(Number.isSafeInteger(value)&&value>0&&value%UNIT===0&&Number.isSafeInteger(total()+value))state[key]=value}}catch{}
  function make(tag,className,text){const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el}
  products.forEach(product=>{
    const key=product.dataset.gift,title=product.dataset.title;
    const li=make('li','hcg-row');li.dataset.row=key;
    const top=make('div','hcg-row-top'),name=make('p','hcg-row-name',title);
    const remove=make('button','hcg-remove','삭제');remove.type='button';remove.dataset.action='remove';remove.dataset.key=key;remove.setAttribute('aria-label',title+' 삭제');
    top.append(name,remove);
    const stepper=make('div','hcg-stepper');
    const minus=make('button','hcg-step','−'),plus=make('button','hcg-step','+');
    [minus,plus].forEach((button,i)=>{button.type='button';button.dataset.key=key;button.dataset.action=i?'plus':'minus';button.setAttribute('aria-label',title+' 선물금 10,000원 '+(i?'더하기':'줄이기'))});
    const amount=make('strong','hcg-row-amount');stepper.append(minus,amount,plus);li.append(top,stepper);list.append(li);rows.set(key,{li,amount});
  });
  function save(){try{sessionStorage.setItem(STORE,JSON.stringify(state))}catch{}}
  function updateBar(){const rect=root.getBoundingClientRect();bar.hidden=!mobile.matches||dialog.open||!(rect.top<innerHeight*.9&&(rect.bottom>0||total()>0))}
  function render(announcement=''){
    const sum=total(),focused=document.activeElement;
    for(const [key,product]of cards){const value=state[key],row=rows.get(key);product.classList.toggle('is-picked',value>0);product.querySelector('.hcg-picked').textContent=value?money(value)+' 담았어요':'';row.li.hidden=value===0;row.amount.textContent=money(value)}
    empty.hidden=sum>0;root.querySelectorAll('[data-total]').forEach(el=>el.textContent=money(sum));
    checkout.disabled=sum===0;checkout.textContent=sum?'총 '+money(sum)+' 선물 보내기':'선물을 먼저 담아주세요';
    message.textContent='';if(announcement)live.textContent=announcement+' 합계 '+money(sum)+'입니다.';
    if(focused&&list.contains(focused)&&focused.closest('.hcg-row')?.hidden){const next=[...rows.values()].find(row=>!row.li.hidden);(next?.li.querySelector('button')||root.querySelector('#hcg-cart-title')).focus()}
    save();updateBar();
  }
  function fly(product){
    if(reduced.matches)return;
    const source=product.querySelector('.hcg-art img');if(!source?.animate)return;
    const target=mobile.matches?opener:root.querySelector('.hcg-cart-icon');
    const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();if(!a.width||!b.width)return;
    const clone=source.cloneNode();clone.alt='';clone.setAttribute('aria-hidden','true');
    Object.assign(clone.style,{position:'fixed',left:(a.left+a.width/2-30)+'px',top:(a.top+a.height/2-30)+'px',width:'60px',height:'60px',objectFit:'contain',zIndex:'2147483100',pointerEvents:'none'});
    document.body.append(clone);const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+a.height/2);
    const animation=clone.animate([{transform:'translate(0,0) scale(1)',opacity:.95},{transform:`translate(${dx*.5}px,${dy*.4-40}px) scale(.8)`,opacity:.9},{transform:`translate(${dx}px,${dy}px) scale(.25)`,opacity:0}],{duration:650,easing:'cubic-bezier(.25,.7,.25,1)'});
    animation.finished.then(()=>clone.remove(),()=>clone.remove());
  }
  function change(key,action){
    if(!cards.has(key))return;
    const previous=state[key];
    if(action==='plus'){if(!Number.isSafeInteger(total()+UNIT))return;state[key]+=UNIT}
    else if(action==='minus')state[key]=Math.max(0,state[key]-UNIT);
    else if(action==='remove')state[key]=0;
    if(state[key]===previous)return;
    const title=cards.get(key).dataset.title;
    render(state[key]?title+' 선물금 '+money(state[key])+'을 담았습니다.':title+'을 장바구니에서 삭제했습니다.');
  }
  root.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>{change(button.dataset.add,'plus');fly(cards.get(button.dataset.add))}));
  list.addEventListener('click',event=>{const button=event.target.closest('button[data-action]');if(button)change(button.dataset.key,button.dataset.action)});
  function openCart(){if(!mobile.matches||dialog.open)return;lastFocus=opener;savedOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';updateBar()}
  function closeCart(){if(dialog.open)dialog.close()}
  opener.addEventListener('click',openCart);
  root.querySelector('.hcg-close').addEventListener('click',closeCart);
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeCart()});
  dialog.addEventListener('close',()=>{document.body.style.overflow=savedOverflow;updateBar();if(mobile.matches&&lastFocus?.isConnected)lastFocus.focus()});
  function layout(){if(mobile.matches){if(cart.parentElement!==dialog)dialog.append(cart)}else{closeCart();if(cart.parentElement!==slot)slot.append(cart)}updateBar()}
  mobile.addEventListener('change',layout);
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateBar()})},{passive:true});
  window.addEventListener('resize',updateBar,{passive:true});
  checkout.addEventListener('click',()=>{
    const sum=total();if(!sum)return;
    let url;
    try{const key=sum<=50000?String(sum):'other';url=new URL(config.paymentUrls?.[key]);if(url.protocol!=='https:')throw Error()}
    catch{message.textContent='후원 연결을 준비하고 있습니다. 잠시 후 다시 이용해주세요.';return}
    window.open(url.href,'_blank','noopener,noreferrer');
  });
  layout();render();
})();
