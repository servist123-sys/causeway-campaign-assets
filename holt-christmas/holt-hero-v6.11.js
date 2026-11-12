/* Holt Christmas Hero v6.11 (v6.9 base). URL settings live in hch-config at the top of the HTML. */
(()=>{const root=document.getElementById('holt-christmas-hero'),nav=document.getElementById('holt-gift-nav');if(!root||root.dataset.hchConfigured)return;root.dataset.hchConfigured='1';let c={};try{c=JSON.parse(document.getElementById('hch-config').textContent)}catch{}function safe(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:''}catch{return ''}}const bg=safe(c.backgroundDesktop),mbg=safe(c.backgroundMobile)||bg;if(bg){root.style.setProperty('--hch-desktop-bg','url('+JSON.stringify(bg)+')');root.style.setProperty('--hch-mobile-bg','url('+JSON.stringify(mbg)+')');root.setAttribute('data-hch-bg','1')}const logo=safe(c.logoImage),home=safe(c.homepageUrl);if(logo)nav.querySelector('.hg-logo img').src=logo;if(home)nav.querySelector('.hg-logo').href=home;const nodes=[...root.querySelectorAll('.hb-hanger')],desktop=[370,205,126,155,330,505,465],positions={gift:[10,146],bell:[30,168],star:[50,114],tree:[70,164],candy:[90,144]},mobile=matchMedia('(max-width:900px)');nodes.forEach(node=>{const src=safe(c.objects?.[node.dataset.object]);if(src)node.dataset.src=src});let key='';function layout(){const next=mobile.matches?'m'+innerWidth:'d';if(next===key)return;key=next;const shift=Math.min(24,Math.max(0,(innerHeight-700)*.12)),size=Math.min(66,Math.max(50,innerWidth*.14));root.style.setProperty('--hch-content-top',(276+shift+size-55)+'px');nodes.forEach((node,i)=>{const p=positions[node.dataset.object];if(mobile.matches&&p){node.style.left=p[0]+'%';node.style.setProperty('--len',(p[1]+shift)+'px','important')}else{node.style.removeProperty('left');node.style.setProperty('--len',desktop[i]+'px','important')}})}layout();window.addEventListener('resize',layout,{passive:true})})();
(() => {
  'use strict';
  const root = document.getElementById('holt-christmas-hero');
  if (!root || root.dataset.motionReady) return;
  root.dataset.motionReady = '1';
  const stage = root.querySelector('.hb-stage');
  const nodes = [...stage.querySelectorAll('.hb-hanger')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 900px)');

  // Saro's hanging-rope model, ported from its Tc override to standalone SVG/JS.
  // The body uses a tension-only spring; the slack rope uses 16 Verlet segments.
  const CFG = {segments:16, gravity:2600, spring:360, damping:9, air:.7,
    ropeDrag:.96, iterations:12, wind:26, anchorLift:36};
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  let bodies = [], raf = 0, previous = 0, clock = 0, active = false;
  let inView = true, resizeTimer = 0, layout = '';

  function draw(b) {
    const p = b.points;
    let d = `M${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    if (mobile.matches) {
      // A smooth vertical tangent at the ornament avoids iOS SVG folds.
      const dy = b.y - b.ay;
      d += dy > 0
        ? ` C${b.ax.toFixed(2)} ${(b.ay+dy*.38).toFixed(2)} ${b.x.toFixed(2)} ${(b.y-Math.min(56,dy*.3)).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
        : ` L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    } else {
      // Retain the original desktop rope physics and appearance.
      for (let i = 1; i < CFG.segments; i++) {
        const k = i * 2;
        d += ` Q${p[k].toFixed(2)} ${p[k+1].toFixed(2)} ${((p[k]+p[k+2])/2).toFixed(2)} ${((p[k+1]+p[k+3])/2).toFixed(2)}`;
      }
      d += ` L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    }
    b.path.setAttribute('d', d);
    b.object.style.visibility = "visible";
    b.object.style.transform = `translate3d(${(b.x-90).toFixed(2)}px,${b.y.toFixed(2)}px,0) rotate(${b.rotation.toFixed(3)}deg)`;
    b.dot.setAttribute('cx', b.x.toFixed(2));
    b.dot.setAttribute('cy', b.y.toFixed(2));
  }

  function advance(b, dt) {
    if (!b.started) {
      if (clock < b.delay) return;
      b.started = true;
    }
    // Same four body substeps and spring/air values as the reference.
    const h = dt / 4;
    for (let i = 0; i < 4; i++) {
      let fx = Math.sin(clock*.8 + b.phase) * CFG.wind;
      let fy = CFG.gravity;
      const dx = b.x-b.ax, dy = b.y-b.ay;
      const distance = Math.hypot(dx,dy) || 1;
      const nx = dx/distance, ny = dy/distance;
      if (distance > b.rest) {
        const tension = CFG.spring*(distance-b.rest) + CFG.damping*(b.vx*nx+b.vy*ny);
        fx -= tension*nx;
        fy -= tension*ny;
      }
      b.vx = (b.vx+fx*h)*(1-CFG.air*h);
      b.vy = (b.vy+fy*h)*(1-CFG.air*h);
      b.x += b.vx*h;
      b.y += b.vy*h;
      const rx = b.x-b.ax, ry = b.y-b.ay;
      const radius = Math.hypot(rx,ry) || 1;
      const limit = b.rest*1.2+40;
      if (radius > limit) {
        b.x = b.ax+rx/radius*limit;
        b.y = b.ay+ry/radius*limit;
        const speed = (b.vx*rx+b.vy*ry)/radius;
        if (speed > 0) {
          b.vx -= 1.4*speed*rx/radius;
          b.vy -= 1.4*speed*ry/radius;
        }
      }
    }

    const n = CFG.segments, p = b.points, old = b.previous;
    p[0] = b.ax; p[1] = b.ay;
    p[n*2] = b.x; p[n*2+1] = b.y;
    for (let i = 1; i < n; i++) {
      const k = i*2, vx = (p[k]-old[k])*CFG.ropeDrag;
      const vy = (p[k+1]-old[k+1])*CFG.ropeDrag;
      old[k] = p[k]; old[k+1] = p[k+1];
      p[k] += vx;
      p[k+1] += vy + CFG.gravity*.6*dt*dt;
    }
    const distance = Math.hypot(b.x-b.ax,b.y-b.ay);
    const segment = (distance >= b.rest ? distance*.992 : b.rest)/n;
    const constrain = i => {
      const k=i*2, j=k+2, dx=p[j]-p[k], dy=p[j+1]-p[k+1];
      const length=Math.hypot(dx,dy)||1, error=(length-segment)/length;
      const a=i===0?0:i+1===n?1:.5, z=i+1===n?0:i===0?1:.5;
      p[k]+=dx*error*a; p[k+1]+=dy*error*a;
      p[j]-=dx*error*z; p[j+1]-=dy*error*z;
    };
    for (let pass=0; pass<CFG.iterations; pass++) {
      for (let i=0; i<n; i++) constrain(i);
      for (let i=n-1; i>=0; i--) constrain(i);
    }
    if (distance >= b.rest) {
      const straightening = Math.min(1,(distance-b.rest)/8)*.3;
      for (let i=1; i<n; i++) {
        const t=i/n;
        p[i*2]+=(b.ax+(b.x-b.ax)*t-p[i*2])*straightening;
        p[i*2+1]+=(b.ay+(b.y-b.ay)*t-p[i*2+1])*straightening;
      }
    }
    const tangent = -Math.atan2(b.x-p[(n-2)*2], Math.max(4,b.y-p[(n-2)*2+1]));
    const overall = -Math.atan2(b.x-b.ax, Math.max(4,b.y-b.ay));
    let target = (tangent*.45+overall*.55)*180/Math.PI;
    target = clamp(target+clamp(-b.vx*.004,-10,10),-55,55);
    b.angularVelocity += ((target-b.rotation)*110-b.angularVelocity*13)*dt;
    b.rotation = clamp(b.rotation+b.angularVelocity*dt,-70,70);
  }

  function signature() {
    return nodes.map(el=>{
      const css=getComputedStyle(el);
      return `${css.display}:${css.getPropertyValue('--len')}`;
    }).join('|');
  }
  function canRun() { return active && inView && !document.hidden && !reduced.matches; }
  function resume() {
    cancelAnimationFrame(raf);
    raf=0;
    if (canRun()) { previous=performance.now(); raf=requestAnimationFrame(frame); }
  }
  function frame(now) {
    raf=0;
    if (!canRun()) return;
    const dt=clamp((now-previous)/1000,.001,.033);
    previous=now;
    clock+=dt;
    for (const b of bodies) { advance(b,dt); draw(b); }
    raf=requestAnimationFrame(frame);
  }
  function setup() {
    root.classList.remove('hch-motion-ready');
    cancelAnimationFrame(raf);
    raf=0; bodies=[]; clock=0; layout=signature();
    const stageWidth=stage.getBoundingClientRect().width || 1320;
    nodes.forEach((el,index)=>{
      const css=getComputedStyle(el);
      if (css.display==='none') return;
      const length=parseFloat(css.getPropertyValue('--len'))||300;
      const object=el.querySelector('.hb-object');
      if (el.dataset.src && !object.querySelector('img')) {
        const img=document.createElement('img');
        img.src=el.dataset.src; img.alt=''; img.decoding='async';
        object.replaceChildren(img);
      }
      const svg=el.querySelector('.hb-rope');
      // One SVG unit equals one CSS pixel at every breakpoint.
      svg.setAttribute('viewBox',`0 0 180 ${root.clientHeight+180}`);
      svg.style.height=`${root.clientHeight+180}px`;
      let dot=svg.querySelector('.hb-knot');
      if (!dot) {
        dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
        dot.setAttribute('class','hb-knot'); dot.setAttribute('r','1.8');
        dot.setAttribute('fill','#9d9d92'); svg.appendChild(dot);
      }
      const b={path:svg.querySelector('path'),object,dot,ax:90,ay:-CFG.anchorLift,
        rest:Math.max(20,length+CFG.anchorLift-CFG.gravity/CFG.spring),
        x:90+(parseFloat(el.dataset.side)||1)*(14+index%3*4),y:-180,
        vx:0,vy:0,rotation:0,angularVelocity:0,phase:index*2.39996,
        // The reference releases the central objects first, then the outer ones.
        delay:.25+Math.abs(el.offsetLeft/stageWidth-.5)*1.3,
        started:reduced.matches,points:new Float32Array(34),previous:null};
      if (reduced.matches) {b.x=b.ax; b.y=length;}
      for (let i=0;i<=CFG.segments;i++) {
        const t=i/CFG.segments;
        b.points[i*2]=b.ax+(b.x-b.ax)*t;
        b.points[i*2+1]=b.ay+(b.y-b.ay)*t;
      }
      b.previous=b.points.slice(); bodies.push(b); draw(b);
    });
    active=true; root.classList.add('hch-motion-ready'); resume();
  }
  root.querySelector('.hb-replay')?.addEventListener('click',setup);
  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{if (signature()!==layout) setup();},160);
  },{passive:true});
  document.addEventListener('visibilitychange',resume);
  reduced.addEventListener('change',setup);
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(([entry])=>{
      inView=entry.isIntersecting;
      if (!active && inView) setup(); else resume();
    },{threshold:0});
    observer.observe(root);
  } else setup();
})();

(()=>{const nav=document.getElementById('holt-gift-nav'),root=document.getElementById('holt-christmas-hero');if(!nav||!root)return;const update=()=>nav.classList.toggle('is-scrolled',window.scrollY>32);update();window.addEventListener('scroll',update,{passive:true});const line=root.querySelector('.hb-underline');const draw=()=>{line?.classList.remove('is-drawn');requestAnimationFrame(()=>requestAnimationFrame(()=>line?.classList.add('is-drawn')))};if('IntersectionObserver'in window){const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){draw();observer.disconnect()}},{threshold:.2});observer.observe(root)}else draw();root.querySelector('.hb-replay')?.addEventListener('click',draw)})();


(()=>{const nav=document.getElementById('holt-gift-nav'),root=document.getElementById('holt-christmas-hero');if(!nav||nav.dataset.ready)return;nav.dataset.ready='1';document.body.appendChild(nav);const toggle=nav.querySelector('button');function close(){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','캠페인 메뉴 열기')}toggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'캠페인 메뉴 닫기':'캠페인 메뉴 열기')});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){close();toggle.focus()}});document.addEventListener('click',e=>{if(!nav.contains(e.target))close();const a=e.target.closest('a[href^="#"]');if(!a||(!nav.contains(a)&&!root.contains(a)))return;const href=a.getAttribute('href'),target=document.getElementById(href.slice(1));if(!target)return;e.preventDefault();e.stopImmediatePropagation();close();const offset=nav.getBoundingClientRect().bottom+18;window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+scrollY-offset),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});history.replaceState(null,'',href)},true)})();
