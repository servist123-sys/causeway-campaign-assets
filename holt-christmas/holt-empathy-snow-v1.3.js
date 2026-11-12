/* Holt Christmas / section 02 snowfall v1.3. Scoped to the image group only. */
(()=>{
  'use strict';
  const root=document.getElementById('holt-christmas-empathy');
  const visual=root?.querySelector('.hxc2-visual');
  if(!visual||visual.dataset.snowReady)return;
  visual.dataset.snowReady='1';
  const style=document.createElement('style');
  style.textContent=`
#holt-christmas-empathy .hxc2-visual{isolation:isolate}
#holt-christmas-empathy .hxc2-visual>figure{z-index:1}
#holt-christmas-empathy .hxc2-snowfall{position:absolute;inset:-65px -28px -70px -24px;z-index:0;overflow:hidden;pointer-events:none;user-select:none;-webkit-mask-image:linear-gradient(transparent,#000 13%,#000 83%,transparent);mask-image:linear-gradient(transparent,#000 13%,#000 83%,transparent)}
#holt-christmas-empathy .hxc2-fall{position:absolute;top:0;bottom:0;left:var(--x);width:var(--size);animation:hxc2-fall var(--fall) linear infinite;animation-delay:var(--delay);animation-play-state:paused}
#holt-christmas-empathy .hxc2-flake{display:block;width:var(--size);height:var(--size);border-radius:50%;background:#fffefa;box-shadow:0 1px 2.5px #776f5c48;filter:blur(var(--blur));animation:hxc2-wind var(--wind) ease-in-out infinite alternate;animation-delay:var(--delay);animation-play-state:paused}
#holt-christmas-empathy .hxc2-snowfall.is-snowing .hxc2-fall,#holt-christmas-empathy .hxc2-snowfall.is-snowing .hxc2-flake{animation-play-state:running}
@keyframes hxc2-fall{0%{transform:translateY(-18px);opacity:0}12%{opacity:var(--alpha)}82%{opacity:var(--alpha)}100%{transform:translateY(100%);opacity:0}}
@keyframes hxc2-wind{from{transform:translateX(calc(var(--sway) * -1))}to{transform:translateX(var(--sway))}}
@media(max-width:800px){#holt-christmas-empathy .hxc2-snowfall{inset:-38px -18px -45px}#holt-christmas-empathy .hxc2-fall:nth-child(n+6){display:none}}
@media(prefers-reduced-motion:reduce){#holt-christmas-empathy .hxc2-snowfall{display:none}}
`;
  root.append(style);
  const scene=document.createElement('div');
  scene.className='hxc2-snowfall';
  scene.setAttribute('aria-hidden','true');
  // Depth: diameter, fall time, opacity, blur and gentle wind amplitude.
  const depths=[[3.1,28,.48,.2,7],[5.0,19,.7,.45,11],[8.0,13,.82,1.15,15]];
  const positions=[2,53,97,23,94,54,1,98,48,65,54,97,73,99];
  positions.forEach((x,i)=>{
    const [size,time,alpha,blur,sway]=depths[i%3];
    const fall=document.createElement('span');
    fall.className='hxc2-fall';
    fall.dataset.depth=['far','mid','near'][i%3];
    fall.style.cssText=`--x:${x}%;--size:${size+(i%2)*.5}px;--fall:${time+i%4}s;--alpha:${alpha};--blur:${blur}px;--sway:${sway}px;--wind:${5.2+(i%4)*.85}s;--delay:-${(i*5.73+2.3).toFixed(2)}s`;
    const flake=document.createElement('i');
    flake.className='hxc2-flake';
    fall.append(flake);scene.append(fall);
  });
  visual.prepend(scene);
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let inView=!('IntersectionObserver'in window);
  const update=()=>scene.classList.toggle('is-snowing',inView&&!document.hidden&&!reduced.matches);
  if('IntersectionObserver'in window){
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update()},{threshold:0});
    observer.observe(visual);
  }
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
  update();
})();
