/* UI + quiz logic shared by AR page and viewer */
(function () {
  const CARDS = [
    { id: 'h2', f: 'H<sub>2</sub>', name: 'الهيدروجين', type: 'عنصر', atoms: 2,
      why: 'جزيء الهيدروجين فيه ذرتان من <b>النوع نفسه</b> (H فقط)، فهو مادة نقية لا تتجزأ إلى مواد أبسط: <b>عنصر</b>.' },
    { id: 'o2', f: 'O<sub>2</sub>', name: 'الأكسجين', type: 'عنصر', atoms: 2,
      why: 'ذرتا أكسجين متماثلتان (O فقط) — رمز عنصر واحد في الصيغة، إذن هو <b>عنصر</b>.' },
    { id: 'h2o', f: 'H<sub>2</sub>O', name: 'الماء', type: 'مركب', atoms: 3,
      why: 'يتكون من عنصرين <b>مختلفين</b> (H و O) متحدين كيميائياً بنسبة ثابتة: ذرتا هيدروجين لكل ذرة أكسجين — <b>مركب</b> يمكن فصله بالتحليل الكهربائي.' },
    { id: 'nacl', f: 'NaCl', name: 'كلوريد الصوديوم (ملح الطعام)', type: 'مركب', atoms: 2,
      why: 'يتكون من عنصرين مختلفين: الصوديوم Na والكلور Cl متحدين كيميائياً بنسبة 1 : 1 — <b>مركب</b>.' }
  ];
  const done = new Set();
  let cur = -1;
  const $ = (s) => document.querySelector(s);

  function render(i) {
    cur = i;
    const c = CARDS[i];
    const p = $('#panel');
    p.classList.add('show'); p.classList.remove('mini'); if ($('#mini')) $('#mini').textContent = '▾';
    $('#p-f').innerHTML = c.f;
    $('#p-name').textContent = c.name;
    $('#fb').className = 'fb'; $('#fb').innerHTML = '';
    document.querySelectorAll('.ans').forEach(b => { b.disabled = false; b.classList.remove('ok', 'no'); });
    $('#extra').innerHTML = '';
    if (c.id === 'h2o') {
      $('#extra').innerHTML = '<button class="act" id="elec">⚡ حلّلي كهربائياً</button><button class="act ghost" id="rst">↺ إعادة</button><div id="eq" class="eq"></div>';
      $('#elec').onclick = () => {
        $('#eq').innerHTML = 'يمر التيار الكهربائي… ⚡';
        $('#panel').classList.add('mini'); if ($('#mini')) $('#mini').textContent = '▴';
        window.AR_HOOKS && window.AR_HOOKS.electrolysis(() => {
          $('#eq').innerHTML = '<span dir="ltr">2H₂O → 2H₂ + O₂</span><br>جزيئا ماء أعطيا <b>جزيئي هيدروجين</b> و<b>جزيء أكسجين</b> — الهيدروجين ضعف الأكسجين (2 : 1)';
        });
      };
      $('#rst').onclick = () => { $('#eq').innerHTML = ''; window.AR_HOOKS && window.AR_HOOKS.resetWater(); };
    }
    if (c.id === 'nacl') {
      $('#extra').innerHTML = '<button class="act" id="lat">🧂 اعرضي البلورة</button><div id="eq" class="eq"></div>';
      let on = false;
      $('#lat').onclick = () => {
        on = !on; window.AR_HOOKS && window.AR_HOOKS.lattice(on);
        $('#lat').textContent = on ? '⚛ اعرضي وحدة الصيغة' : '🧂 اعرضي البلورة';
        $('#eq').innerHTML = on ? 'في بلورة الملح يتكرر <b>Na</b> و <b>Cl</b> بالتناوب بنسبة ثابتة 1 : 1' : '';
      };
    }
  }

  function answer(t, btn) {
    const c = CARDS[cur];
    const ok = t === c.type;
    btn.classList.add(ok ? 'ok' : 'no');
    const fb = $('#fb');
    if (ok) {
      document.querySelectorAll('.ans').forEach(b => b.disabled = true);
      fb.className = 'fb ok';
      fb.innerHTML = '✔ أحسنتِ! ' + c.why + `<br>عدد الذرات: <b>${c.atoms}</b>`;
      done.add(c.id);
      updateScore();
    } else {
      fb.className = 'fb no';
      fb.innerHTML = '✘ حاولي مرة أخرى… انظري إلى رموز العناصر في الصيغة: كم عنصراً <b>مختلفاً</b> ترين؟';
    }
  }

  function updateScore() {
    $('#score').textContent = `صنّفتِ ${done.size} / 4`;
    if (done.size === 4) {
      $('#win').classList.add('show');
    }
  }

  function hide() {
    $('#panel').classList.remove('show');
  }

  window.APP = { CARDS, render, hide, answer, updateScore, get cur() { return cur; } };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.ans').forEach(b => b.addEventListener('click', () => answer(b.dataset.t, b)));
    const m = $('#mini'); if (m) m.addEventListener('click', () => { const p = $('#panel'); p.classList.toggle('mini'); m.textContent = p.classList.contains('mini') ? '▴' : '▾'; });
    const w = $('#win'); if (w) w.addEventListener('click', () => w.classList.remove('show'));
    updateScore();
  });
})();
