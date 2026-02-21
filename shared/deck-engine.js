/* shared/deck-engine.js
 * Reusable slide engine: nav, fullscreen, progress, KaTeX render, confetti, CSV/JSON export, popover glossary.
 */
(function(){
  function id(x){ return document.getElementById(x); }
  function q(sel, root=document){ return root.querySelector(sel); }
  function qa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

  // Apply BRAND colors if present
  (function applyBrandToDeck(){
    if(!window.BRAND || !window.BRAND.colors) return;
    const c = window.BRAND.colors;
    const root = document.documentElement.style;
    root.setProperty('--primary',  c.primary  || '#6C1D45');
    root.setProperty('--primary2', c.primary2 || '#8B2450');
    root.setProperty('--accent',   c.accent   || '#C7A34F');
    root.setProperty('--accent2',  c.accent2  || '#E4D4A8');
  })();

  // KaTeX auto-render
  function renderMath(root=document.body){
    if(!window.renderMathInElement) return;
    window.renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }

  // Confetti
  function confetti(x=window.innerWidth/2, y=window.innerHeight/2){
    const colors = [
      (getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#6C1D45').trim(),
      (getComputedStyle(document.documentElement).getPropertyValue('--accent')  || '#C7A34F').trim(),
      '#E8D5B7','#8a3d64'
    ];
    for(let k=0;k<18;k++){
      const d=document.createElement('div'); d.className='confetti';
      d.style.left=x+'px'; d.style.top=y+'px';
      d.style.width='8px'; d.style.height='8px';
      d.style.background=colors[k%colors.length];
      document.body.appendChild(d);
      const dx=(Math.random()*2-1)*240, dy=(Math.random()*-1-0.3)*300, rot=Math.random()*720;
      d.animate(
        [{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${dx}px,${dy}px) rotate(${rot}deg)`,opacity:0}],
        {duration:900+Math.random()*700,easing:'cubic-bezier(.2,.8,.2,1)'}
      ).onfinish=()=>d.remove();
    }
  }

  // Downloads
  function downloadJSON(filename, data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function downloadCSV(filename, rows){
    const csv=rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // Fullscreen
  function toggleFS(){
    const el=id('slides');
    if(!document.fullscreenElement){
      (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document);
    }
  }

  // Deck init
  function initDeck(opts={}){
    const slides = qa('.slide');
    const prev = id('prev'), next = id('next'), counter = id('counter'), prog = id('progress'), fsBtn = id('fs');
    const deckTitle = opts.deckTitle || 'deck';
    let i = 0;

    function show(k){
      i = (k + slides.length) % slides.length;
      slides.forEach((s,idx)=>s.classList.toggle('active', idx===i));
      if(counter) counter.textContent = (i+1) + ' / ' + slides.length;
      if(prog) prog.style.width = ((i+1)/slides.length*100)+'%';
      renderMath(slides[i]);
      if(typeof opts.onSlideChange === 'function') opts.onSlideChange(i, slides[i]);
    }

    if(prev) prev.addEventListener('click',()=>show(i-1));
    if(next) next.addEventListener('click',()=>show(i+1));
    document.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight') show(i+1);
      if(e.key==='ArrowLeft') show(i-1);
      if(e.key.toLowerCase()==='f') toggleFS();
    });
    if(fsBtn) fsBtn.addEventListener('click', toggleFS);

    // Glossary popover (optional)
    const POP = id('pop'), POP_BODY = id('popBody');
    if(POP && POP_BODY){
      const close = q('#pop .close');
      if(close) close.addEventListener('click', ()=>POP.style.display='none');

      document.addEventListener('click', e=>{
        const el = e.target.closest('.chip[data-key]');
        if(!el || !opts.glossary) return;
        const key = el.dataset.key;
        if(!opts.glossary[key]) return;
        POP_BODY.innerHTML = opts.glossary[key];
        POP.style.display='block';
        const r = el.getBoundingClientRect();
        POP.style.left = Math.min(r.left, window.innerWidth - POP.offsetWidth - 20) + 'px';
        POP.style.bottom = (window.innerHeight - r.top + 10) + 'px';
        renderMath(POP_BODY);
      });
    }

    // First render
    renderMath(document.body);
    show(0);

    // Expose utilities for lesson pages
    return {
      show,
      get index(){ return i; },
      count: slides.length,
      confetti,
      renderMath,
      downloadCSV: (name, rows)=>downloadCSV(name, rows),
      downloadJSON: (name, data)=>downloadJSON(name, data),
      deckTitle
    };
  }

  // Export globally
  window.DeckEngine = { initDeck, renderMath, confetti, downloadCSV, downloadJSON, toggleFS };
})();
