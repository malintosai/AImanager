(function(){
  const stage = document.getElementById('stage');
  const viewport = document.getElementById('viewport');
  const slides = Array.from(stage.querySelectorAll('.slide'));
  const counter = document.getElementById('counter');
  const bar = document.getElementById('bar');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const fsBtn = document.getElementById('fs');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = 0;
  const chatRuns = {};

  function fit(){
    const w = viewport.clientWidth, h = viewport.clientHeight;
    const s = Math.min(w / 1600, h / 900);
    stage.style.setProperty('--s', s);
  }
  window.addEventListener('resize', fit);
  fit();

  const pad = n => String(n).padStart(2, '0');

  function playChat(chat){
    if (!chat) return;
    const id = chat.id;
    const run = (chatRuns[id] = (chatRuns[id] || 0) + 1);
    const msgs = Array.from(chat.querySelectorAll('.m'));
    const typing = chat.querySelector('.typing');
    msgs.forEach(m => m.classList.remove('show'));
    typing.classList.remove('on');
    if (reduce){ msgs.forEach(m => m.classList.add('show')); return; }
    let t = 700;
    msgs.forEach((m, i) => {
      const isAI = m.classList.contains('a');
      if (isAI){
        const start = t;
        setTimeout(() => { if (chatRuns[id] === run){ typing.classList.add('on'); typing.parentNode.appendChild(typing); } }, start);
        t += 1100 + Math.min(m.textContent.length * 8, 900);
      } else {
        t += i === 0 ? 0 : 900;
      }
      setTimeout(() => {
        if (chatRuns[id] !== run) return;
        if (isAI) typing.classList.remove('on');
        m.classList.add('show');
      }, t);
      t += 250;
    });
  }

  function go(n){
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur && slides[n].classList.contains('active')) return;
    slides.forEach((s, i) => {
      s.classList.toggle('before', i < n);
      if (i !== n){ s.classList.remove('active','in','static'); }
    });
    const s = slides[n];
    s.classList.remove('in','static');
    void s.offsetWidth;
    s.classList.add('active','in');
    cur = n;
    stage.dataset.cur = n;
    counter.innerHTML = '<b>' + pad(n + 1) + '</b> / ' + pad(slides.length);
    bar.style.width = ((n + 1) / slides.length * 100) + '%';
    prevBtn.disabled = n === 0;
    nextBtn.disabled = n === slides.length - 1;
    s.querySelectorAll('.chat.play').forEach(playChat);
    try { history.replaceState(null, '', '#s' + (n + 1)); } catch(e) {}
  }

  prevBtn.addEventListener('click', () => go(cur - 1));
  nextBtn.addEventListener('click', () => go(cur + 1));
  document.querySelectorAll('[data-replay]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    playChat(document.getElementById(b.dataset.replay));
  }));

  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowRight','PageDown',' '].includes(e.key)){ e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft','PageUp'].includes(e.key)){ e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home'){ go(0); }
    else if (e.key === 'End'){ go(slides.length - 1); }
    else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А'){ toggleFs(); }
  });

  let tx = null, ty = null;
  viewport.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive:true});
  viewport.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    tx = ty = null;
  });

  function toggleFs(){
    const d = document;
    try {
      if (d.fullscreenElement){ d.exitFullscreen && d.exitFullscreen().catch(()=>{}); }
      else { const p = d.documentElement.requestFullscreen && d.documentElement.requestFullscreen(); p && p.catch && p.catch(()=>{}); }
    } catch(e) {}
  }
  fsBtn.addEventListener('click', toggleFs);
  document.addEventListener('fullscreenchange', () => setTimeout(fit, 60));

  // Initial slide: from #sN if present, else the first slide shown at rest
  const m = (location.hash || '').match(/^#s(\d{1,2})$/);
  const start = m ? Math.min(Math.max(parseInt(m[1], 10) - 1, 0), slides.length - 1) : 0;
  if (start !== 0) { go(start); }
  else {
    counter.innerHTML = '<b>01</b> / ' + pad(slides.length);
    bar.style.width = (100 / slides.length) + '%';
    prevBtn.disabled = true;
  }
})();
