
(function() {
  console.log('main.js loaded ✅');
  const app = document.getElementById('app');
  const exitBtn = document.getElementById('exitBtn');
  const audioToggle = document.getElementById('audioToggle');

  const state = { screen: 'title', testament: null, verse: null };

  // --- Simple & safe audio (user-initiated only) ---
  let bgm = null; let musicOn = false;
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      try {
        if (!bgm) { bgm = new Audio('assets/audio/title.mp3'); bgm.loop = true; }
        musicOn = !musicOn;
        audioToggle.textContent = musicOn ? '🎵 On' : '🎵 Off';
        if (musicOn) bgm.play(); else bgm.pause();
      } catch (e) { console.warn('Audio init/play failed:', e); }
    });
  }

  // --- Verse Library (KJV Public Domain) ---
  const LIB = {
    ot: [
      { ref: 'Genesis 1:1', text: 'In the beginning God created the heaven and the earth.' },
      { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
      { ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.' },
      { ref: 'Isaiah 40:31', text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.' },
    ],
    nt: [
      { ref: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
      { ref: 'Romans 8:28', text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
      { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
      { ref: 'Ephesians 2:8-9', text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: not of works, lest any man should boast.' },
    ],
  };

  // --- Local progress ---
  const STORAGE_KEY = 'bvm_progress_final_v1';
  const progressMap = loadProgress();
  function loadProgress(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } }
  function saveProgress(map){ localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); }
  function key(v){ return v?.ref || 'unknown'; }
  function getP(v){ return progressMap[key(v)] || { s1:false, s2:false, s3Best:0, mastered:false, attempts:0 }; }
  function setP(v,p){ progressMap[key(v)] = p; saveProgress(progressMap); }

  // --- Text helpers ---
  const PUNCT = /[\.,;:!\?"'\(\)\[\]\-]/g;
  function words(text){ return text.replace(PUNCT,'').split(/\s+/).filter(Boolean); }
  function normalize(t){ return t.toLowerCase().replace(PUNCT,'').replace(/\s+/g,' ').trim(); }
  const STOP = new Set(['the','a','an','and','or','of','to','in','on','for','is','be','that','with','by','not','as','are','ye','shall']);
  function randomBlankIndices(ws, count=1){
    const idx = ws.map((w,i)=>({w:w.toLowerCase(),i})).filter(x=>!STOP.has(x.w)&&x.w.length>2).map(x=>x.i);
    if (idx.length===0) idx.push(Math.floor(ws.length/2));
    const chosen=[]; while(chosen.length<count && idx.length){ const k=Math.floor(Math.random()*idx.length); chosen.push(idx.splice(k,1)[0]); }
    return chosen.sort((a,b)=>a-b);
  }
  function blanked(ws, blanks){ return ws.map((w,i)=> blanks.includes(i)?'<span class="mark">____</span>':w).join(' '); }
  function unique(ws){ return Array.from(new Set(ws.map(w=>w.toLowerCase()))); }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
  function pickOptions(correct, pool, n=3){
    const arr = pool.filter(w=>w.toLowerCase()!==correct.toLowerCase() && !STOP.has(w.toLowerCase()));
    const out=[]; while(out.length<n && arr.length){ const k=Math.floor(Math.random()*arr.length); out.push(arr.splice(k,1)[0]); }
    const fall=['faith','love','grace','hope','truth','spirit','light','life'];
    while(out.length<n) out.push(fall[out.length%fall.length]);
    return shuffle([correct,...out]);
  }
  function wordAccuracy(target, input){
    const tw=words(normalize(target)); const iw=words(normalize(input)); const len=Math.max(tw.length,1);
    let correct=0; for(let i=0;i<tw.length;i++){ if(iw[i] && iw[i]===tw[i]) correct++; }
    return Math.round((correct/len)*100);
  }

  // --- Navigation & flash reveal ---
  exitBtn.addEventListener('click', ()=>{ state.screen='title'; render(); });
  function flashThen(fn, duration = 450){
    const flash = document.querySelector('.screen-flash');
    flash.classList.add('show');
    setTimeout(() => { flash.classList.remove('show'); fn && fn(); }, duration);
  }

  function render(){
    app.innerHTML='';
    const panel = el('div',{class:'panel stack'}); app.appendChild(panel);
    const pbar = progressBar(); panel.appendChild(pbar.wrap);

    switch(state.screen){
      case 'title':
        panel.innerHTML = `
          <div class="center">
            <img src="assets/images/title-banner.svg" alt="Title" style="width:290px; max-width: 100%;" />
          </div>
          <h2 class="title">Bible Verse Memorization</h2>
          <p class="subtitle">Practice in three stages: Multiple Choice → Fill‑in → Full Typing</p>
          <div class="sep" aria-hidden="true"></div>
          <div class="center"><button id="startBtn" class="btn btn-primary glow">Press Start</button></div>
          <p class="small">Your progress is saved locally in your browser.</p>
        `;
        panel.appendChild(pbar.wrap);
        const sub = panel.querySelector('.subtitle'); // simple typewriter effect
        typewriter(sub, 'Practice in three stages: Multiple Choice → Fill‑in → Full Typing', 28);
        q('#startBtn').addEventListener('click', ()=> flashThen(() => { state.screen='testament'; render(); }));
        break;

      case 'testament':
        panel.innerHTML = `
          <h3>Select Testament</h3>
          <div class="grid cols-2">
            <button id="ot" class="btn">Old Testament</button>
            <button id="nt" class="btn">New Testament</button>
          </div>
        `;
        q('#ot').addEventListener('click', ()=> flashThen(() => { state.testament='ot'; state.screen='verses'; render(); }));
        q('#nt').addEventListener('click', ()=> flashThen(() => { state.testament='nt'; state.screen='verses'; render(); }));
        panel.appendChild(pbar.wrap);
        break;

      case 'verses':
        { const list = el('ul',{class:'list'}); const verses = LIB[state.testament]||[];
          panel.appendChild(el('h3',{},'Choose a verse to master'));
          verses.forEach(v=>{ const li=el('li'); const btn=el('button',{class:'btn'});
            const prog=getP(v); const status = prog.mastered ? `<span class="badge">Mastered</span>` : '';
            btn.innerHTML = `<strong>${v.ref}</strong> ${status}<br/><span class="small">${v.text}</span>`;
            btn.addEventListener('click', ()=> flashThen(() => { state.verse=v; state.screen='preview'; render(); }));
            li.appendChild(btn); list.appendChild(li); });
          panel.appendChild(list); panel.appendChild(pbar.wrap);
        }
        break;

      case 'preview':
        panel.innerHTML = `
          <div class="row">
            <img src="assets/images/icon-scroll.svg" alt="Scroll" style="width:24px; height:24px;" />
            <h3>${state.verse.ref}</h3>
          </div>
          <p class="card appear">${state.verse.text}</p>
          <div class="row">
            <button id="stage1Start" class="btn btn-primary glow">Move on to Stage 1</button>
            <button id="backVerses" class="btn">Back</button>
          </div>
        `;
        panel.appendChild(pbar.wrap);
        q('#stage1Start').addEventListener('click', ()=> flashThen(() => { state.screen='stage1'; render(); }));
        q('#backVerses').addEventListener('click', ()=> flashThen(() => { state.screen='verses'; render(); }));
        break;

      case 'stage1':
        { const ws = words(state.verse.text); const blankIndex = randomBlankIndices(ws,1)[0];
          const correct = ws[blankIndex]; const options = pickOptions(correct, unique(ws), 3);
          const qtext = blanked(ws,[blankIndex]);
          panel.innerHTML = `
            <h3>Stage 1: Multiple Choice — Fill in the blank</h3>
            <p class="small">Choose the missing word. You can retry for a new blank.</p>
            <p class="card appear">${qtext}</p>
            <div id="choices" class="grid cols-2"></div>
            <div id="result" class="small"></div>
            <div class="row">
              <button id="retry" class="btn">Try Again</button>
              <button id="next" class="btn btn-primary glow">Move on to Stage 2</button>
              <button id="back" class="btn">Back</button>
            </div>
          `;
          panel.appendChild(pbar.wrap);
          const choices = q('#choices');
          options.forEach(opt=>{ const b=el('button',{class:'btn'},opt);
            b.addEventListener('click', ()=>{ const res = q('#result');
              if (opt.toLowerCase()===correct.toLowerCase()) {
                res.innerHTML = '<span class="correct">✔ Correct!</span>';
                const p=getP(state.verse); p.s1=true; p.attempts++; setP(state.verse,p);
              } else {
                res.innerHTML = '<span class="incorrect">✖ Not quite. Try again!</span>';
                const p=getP(state.verse); p.attempts++; setP(state.verse,p);
              }
              pbar.update();
            }); choices.appendChild(b); });
          q('#retry').addEventListener('click', ()=> render());
          q('#back').addEventListener('click', ()=> flashThen(() => { state.screen='preview'; render(); }));
          q('#next').addEventListener('click', ()=> flashThen(() => { state.screen='stage2'; render(); }));
        }
        break;

      case 'stage2':
        { const ws = words(state.verse.text); const blanks = randomBlankIndices(ws,2);
          const qtext = blanked(ws,blanks);
          panel.innerHTML = `
            <h3>Stage 2: Type the missing words</h3>
            <p class="small">Enter the two blanked words from memory. Retry for different blanks anytime.</p>
            <p class="card appear">${qtext}</p>
            <div class="grid cols-2">
              <div>
                <label for="b1">Blank #1</label>
                <input id="b1" type="text" autocomplete="off" />
              </div>
              <div>
                <label for="b2">Blank #2</label>
                <input id="b2" type="text" autocomplete="off" />
              </div>
            </div>
            <div id="result" class="small"></div>
            <div class="row">
              <button id="check" class="btn btn-primary">Check</button>
              <button id="retry" class="btn">Try Again</button>
              <button id="next" class="btn btn-primary glow">Move on to Stage 3</button>
              <button id="back" class="btn">Back</button>
            </div>
          `;
          panel.appendChild(pbar.wrap);
          q('#check').addEventListener('click', ()=>{ const b1 = q('#b1').value.trim(); const b2 = q('#b2').value.trim();
            const [w1,w2] = [ws[blanks[0]], ws[blanks[1]]]; const res=q('#result');
            const ok1 = b1 && normalize(b1)===normalize(w1); const ok2 = b2 && normalize(b2)===normalize(w2);
            if (ok1 && ok2) { res.innerHTML = '<span class="correct">✔ Great job — both correct!</span>';
              const p=getP(state.verse); p.s2=true; p.attempts++; setP(state.verse,p);
            } else {
              let msg = 'Keep trying: '; msg += !ok1 ? `Blank #1 should be <span class="code">${w1}</span>. `:''; msg += !ok2 ? `Blank #2 should be <span class="code">${w2}</span>. `:'';
              res.innerHTML = `<span class="incorrect">✖ ${msg}</span>`; const p=getP(state.verse); p.attempts++; setP(state.verse,p);
            } pbar.update(); });
          q('#retry').addEventListener('click', ()=> render());
          q('#back').addEventListener('click', ()=> flashThen(() => { state.screen='stage1'; render(); }));
          q('#next').addEventListener('click', ()=> flashThen(() => { state.screen='stage3'; render(); }));
        }
        break;

      case 'stage3':
        panel.innerHTML = `
          <h3>Stage 3: Type the full verse from memory</h3>
          <p class="small">No verse is shown. Type it completely from memory, then check your accuracy.</p>
          <label for="full">Your typed verse</label>
          <textarea id="full" rows="5" placeholder="Type the verse here..."></textarea>
          <div id="accuracy" class="small"></div>
          <div class="row">
            <button id="check" class="btn btn-primary">Check Accuracy</button>
            <button id="retry" class="btn">Try Again</button>
            <button id="finish" class="btn btn-primary glow">Finish & Save</button>
            <button id="back" class="btn">Back</button>
          </div>
          <div class="card small">Target: <span class="code">${state.verse.ref}</span></div>
        `;
        panel.appendChild(pbar.wrap);
        const full = q('#full'); const accEl = q('#accuracy');
        function updateAcc(){ const acc=wordAccuracy(state.verse.text, full.value); accEl.innerHTML = `Accuracy: <span class="badge">${acc}%</span>`; const b=accEl.querySelector('.badge'); if (b){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } }
        full.addEventListener('input', updateAcc);
        q('#check').addEventListener('click', ()=> updateAcc());
        q('#retry').addEventListener('click', ()=>{ full.value=''; updateAcc(); });
        q('#back').addEventListener('click', ()=> flashThen(() => { state.screen='stage2'; render(); }));
        q('#finish').addEventListener('click', ()=>{ const acc = wordAccuracy(state.verse.text, full.value);
          const p=getP(state.verse); p.s3Best = Math.max(p.s3Best||0, acc); p.mastered = p.s1 && p.s2 && (p.s3Best >= 90); p.attempts++; setP(state.verse,p);
          flashThen(() => { state.screen='results'; render(); }); });
        break;

      case 'results':
        { const p=getP(state.verse);
          panel.innerHTML = `
            <h3>Results for ${state.verse.ref}</h3>
            <p>Stage 1: ${p.s1 ? '<span class="correct">✔ Complete</span>' : '<span class="incorrect">✖ Incomplete</span>'}</p>
            <p>Stage 2: ${p.s2 ? '<span class="correct">✔ Complete</span>' : '<span class="incorrect">✖ Incomplete</span>'}</p>
            <p>Stage 3 Best Accuracy: <span class="badge">${p.s3Best}%</span></p>
            <p>Status: ${p.mastered ? '<span class="badge">Mastered</span>' : '<span class="badge">Keep Practicing</span>'}</p>
            <div class="row">
              <button id="practice" class="btn">Practice Again</button>
              <button id="newVerse" class="btn btn-primary glow">Choose Another Verse</button>
              <button id="home" class="btn">Exit to Title</button>
            </div>
          `;
          panel.appendChild(pbar.wrap);
          q('#practice').addEventListener('click', ()=> flashThen(() => { state.screen='preview'; render(); }));
          q('#newVerse').addEventListener('click', ()=> flashThen(() => { state.screen='verses'; render(); }));
          q('#home').addEventListener('click', ()=> flashThen(() => { state.screen='title'; render(); }));
        }
        break;
    }

    // Apply ripple after each render
    addRipple('.btn');

    function progressBar(){ const wrap=el('div',{class:'progress'}); const fill=el('div'); wrap.appendChild(fill);
      function pct(){ const p=getP(state.verse); return p.mastered?100:((p.s1?33:0)+(p.s2?33:0)+Math.min(34,p.s3Best)); }
      function update(){ fill.style.width = pct()+'%'; }
      update(); return {wrap, update}; }
  }

  // Typewriter effect
  function typewriter(el, text, speed = 35) {
    if (!el) return; el.textContent = ""; let i = 0;
    (function tick(){ if (i <= text.length){ el.textContent = text.slice(0, i++); setTimeout(tick, speed); } })();
  }

  // Helpers
  function el(tag, attrs={}, html){ const e=document.createElement(tag); for(const k in attrs){ e.setAttribute(k, attrs[k]); } if(html!==undefined) e.innerHTML=html; return e; }
  function q(sel){ return document.querySelector(sel); }
  function addRipple(selector){ document.querySelectorAll(selector).forEach(btn => {
    btn.classList.add('ripple'); btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect(); const size = Math.max(rect.width, rect.height);
      const r = document.createElement('span'); r.className = '_rip';
      r.style.left = (e.clientX - rect.left - size/2) + 'px'; r.style.top  = (e.clientY - rect.top  - size/2) + 'px'; r.style.width = r.style.height = size + 'px';
      btn.appendChild(r); requestAnimationFrame(()=>{ r.style.transform = 'scale(1)'; r.style.opacity = '0'; }); setTimeout(()=> r.remove(), 650);
    }); }); }

  render();
})();
