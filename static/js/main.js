(function () {
  'use strict';

  let CONTENIDO = null;
  let SPEAKERS = [];

  // ============================================================
  //  Utilidades
  // ============================================================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg, kind) {
    const toast = $('#toast');
    const msgEl = $('#toastMsg');
    if (!toast || !msgEl) return;
    msgEl.textContent = msg;
    toast.querySelector('i').className =
      kind === 'error'
        ? 'fa-solid fa-triangle-exclamation'
        : 'fa-solid fa-circle-check';
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  // ============================================================
  //  Fetch contenido + render
  // ============================================================
  async function loadContent() {
    try {
      const res = await fetch('/api/contenido', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar el contenido (' + res.status + ')');
      CONTENIDO = await res.json();
      renderAll();
    } catch (err) {
      console.error('[contenido]', err);
      showToast('Error cargando contenido del sitio', 'error');
    }
  }

  function renderAll() {
    renderHero();
    renderEjes();
    renderCanvasSection();
    renderSpeakers();
    renderModules();
    renderProgram();
    renderCta();
    renderFooter();
    initCanvas();
  }

  function renderHero() {
    const h = CONTENIDO.hero || {};
    const ev = CONTENIDO.evento || {};
    setText('#heroEtiqueta', h.etiqueta);
    setText('#heroTitulo1', h.titulo_linea_1);
    setText('#heroTitulo2', h.titulo_linea_2);
    setText('#heroDesc', h.descripcion);
    setText('#heroFecha', ev.fecha);
    setText('#heroCiudad', ev.ciudad);
  }

  function renderEjes() {
    const ul = $('#ejesList');
    if (!ul) return;
    const ejes = (CONTENIDO.hero && CONTENIDO.hero.ejes) || [];
    ul.innerHTML = ejes.map(e => `
      <li>
        <span class="eje-icon ${escapeHtml(e.color)}"><i class="fa-solid fa-${escapeHtml(e.icono)}" aria-hidden="true"></i></span>
        <span>${escapeHtml(e.titulo)}</span>
      </li>
    `).join('');
  }

  function renderCanvasSection() {
    const ec = CONTENIDO.ecosistema_canvas || {};
    setText('#canvasDesc', ec.descripcion);
  }

  function renderSpeakers() {
    SPEAKERS = (CONTENIDO.ponentes || []).slice();

    const sel = $('#searchCountry');
    if (sel) {
      const countries = Array.from(new Set(SPEAKERS.map(s => s.pais))).sort();
      const current = sel.value;
      sel.innerHTML = '<option value="">Cualquier país</option>' +
        countries.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      sel.value = current;
    }

    paintSpeakers(SPEAKERS);
  }

  function paintSpeakers(list) {
    const grid = $('#speakersGrid');
    const empty = $('#noResults');
    if (!grid || !empty) return;

    if (list.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = list.map(s => `
      <article class="speaker">
        <header class="speaker__head">
          <div class="speaker__avatar" aria-hidden="true">${escapeHtml(s.iniciales || initialsFrom(s.nombre))}</div>
          <div>
            <h3 class="speaker__name">${escapeHtml(s.nombre)}</h3>
            <span class="speaker__role">${escapeHtml(s.rol)}</span>
          </div>
        </header>
        <div class="speaker__body">
          <div>
            <span class="speaker__field-label">País</span>
            <span class="speaker__field-value">${escapeHtml(s.pais)}</span>
          </div>
          <div>
            <span class="speaker__field-label">Institución</span>
            <span class="speaker__field-value">${escapeHtml(s.institucion)}</span>
          </div>
          <div>
            <span class="speaker__field-label">Especialidad</span>
            <span class="speaker__field-value">${escapeHtml(s.especialidad)}</span>
          </div>
        </div>
        <button type="button" class="speaker__cta" data-speaker="${escapeHtml(s.nombre)}">
          Ver perfil
        </button>
      </article>
    `).join('');

    $$('.speaker__cta', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        showToast('Perfil de ' + btn.dataset.speaker + ' (vista demo)');
      });
    });
  }

  function initialsFrom(name) {
    if (!name) return '?';
    const parts = name.replace(/(Dr|Dra|Msc|Prof)\.?/gi, '').trim().split(/\s+/);
    return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || '');
  }

  function filterSpeakers() {
    const name = ($('#searchName').value || '').toLowerCase().trim();
    const spec = ($('#searchSpecialty').value || '').toLowerCase().trim();
    const country = $('#searchCountry').value || '';
    const filtered = SPEAKERS.filter(s =>
      (!name || s.nombre.toLowerCase().includes(name)) &&
      (!spec || (s.especialidad || '').toLowerCase().includes(spec)) &&
      (!country || s.pais === country)
    );
    paintSpeakers(filtered);
  }

  function clearFilters() {
    $('#searchName').value = '';
    $('#searchSpecialty').value = '';
    $('#searchCountry').value = '';
    paintSpeakers(SPEAKERS);
  }

  function renderModules() {
    const grid = $('#modulesGrid');
    if (!grid) return;
    const mods = CONTENIDO.modulos || [];
    grid.innerHTML = mods.map(m => `
      <article class="module">
        <div class="module__icon ${escapeHtml(m.color)}"><i class="fa-solid fa-${escapeHtml(m.icono)}" aria-hidden="true"></i></div>
        <h4 class="module__title">${escapeHtml(m.titulo)}</h4>
        <p class="module__desc">${escapeHtml(m.descripcion)}</p>
      </article>
    `).join('');
  }

  function renderProgram() {
    const list = $('#programList');
    if (!list) return;
    const items = CONTENIDO.programa || [];
    list.innerHTML = items.map(b => `
      <li class="program__item">
        <div class="program__time">
          <span class="program__hour">${escapeHtml(b.horario)}</span>
          <span class="program__tz">(${escapeHtml(b.zona)})</span>
        </div>
        <div>
          <span class="program__block">${escapeHtml(b.bloque)}</span>
          <h3 class="program__title">${escapeHtml(b.titulo)}</h3>
          <p class="program__desc">${escapeHtml(b.descripcion)}</p>
        </div>
      </li>
    `).join('');
  }

  function renderCta() {
    const c = CONTENIDO.cta || {};
    const ev = CONTENIDO.evento || {};
    setText('#ctaTitle', c.titulo);
    setText('#ctaDesc', c.descripcion);
    const email = $('#ctaEmail');
    if (email && ev.correo_contacto) {
      email.href = 'mailto:' + ev.correo_contacto;
      email.textContent = ev.correo_contacto;
    }
  }

  function renderFooter() {
    const f = CONTENIDO.footer || {};
    setText('#footerLema', f.lema);
    setText('#footerCopy', f.copyright);
  }

  function setText(sel, value) {
    const el = $(sel);
    if (el && value != null) el.textContent = value;
  }

  // ============================================================
  //  Canvas — Mapa / Red IA
  // ============================================================
  const canvasState = {
    mode: 'map',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    didDrag: false,
    startX: 0, startY: 0,
    selected: null,
    hover: null,
    mapNodes: [],
    netNodes: [],
    netEdges: [],
    activeNodes: [],
    refMap: {},
    canvas: null,
    ctx: null,
  };

  function initCanvas() {
    const canvas = $('#interactiveCanvas');
    if (!canvas) return;

    canvasState.canvas = canvas;
    canvasState.ctx = canvas.getContext('2d');

    const ec = CONTENIDO.ecosistema_canvas || {};
    canvasState.mapNodes = (ec.nodos_mapa || []).map(n => Object.assign({}, n));
    canvasState.refMap = {};
    canvasState.mapNodes.forEach(n => { canvasState.refMap[n.id] = n; });

    canvasState.netNodes = (ec.nodos_red || []).map(n => {
      const cp = Object.assign({}, n);
      if (n.ref_id != null && canvasState.refMap[n.ref_id]) {
        cp.ref = canvasState.refMap[n.ref_id];
      }
      return cp;
    });
    canvasState.netEdges = ec.conexiones_red || [];
    canvasState.activeNodes = canvasState.mapNodes;

    $('#btnMap').addEventListener('click', () => setCanvasMode('map'));
    $('#btnNet').addEventListener('click', () => setCanvasMode('network'));

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('mouseleave', () => { canvasState.hover = null; drawCanvas(); });
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('click', onCanvasClick);

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onPointerUp);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomCanvas(factor);
    }, { passive: false });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    $('#btnConnectNode').addEventListener('click', openModal);
  }

  function resizeCanvas() {
    const c = canvasState.canvas;
    if (!c) return;
    const rect = c.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    c.style.width = rect.width + 'px';
    c.style.height = rect.height + 'px';
    canvasState.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvasState.offsetX = rect.width / 2;
    canvasState.offsetY = rect.height / 2;
    drawCanvas();
  }

  function setCanvasMode(mode) {
    canvasState.mode = mode;
    canvasState.activeNodes = mode === 'map' ? canvasState.mapNodes : canvasState.netNodes;
    canvasState.selected = null;
    updateSidebar();

    $('#btnMap').classList.toggle('seg-control__btn--active', mode === 'map');
    $('#btnMap').setAttribute('aria-selected', mode === 'map');
    $('#btnNet').classList.toggle('seg-control__btn--active', mode === 'network');
    $('#btnNet').setAttribute('aria-selected', mode === 'network');

    resetCanvas();
  }

  function drawCanvas() {
    const c = canvasState.canvas;
    const ctx = canvasState.ctx;
    if (!c || !ctx) return;

    const w = parseFloat(c.style.width) || c.width;
    const h = parseFloat(c.style.height) || c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(canvasState.offsetX, canvasState.offsetY);
    ctx.scale(canvasState.scale, canvasState.scale);

    // Edges
    ctx.lineWidth = 1.5;
    if (canvasState.mode === 'map') {
      const center = canvasState.activeNodes.find(n => n.id === 1);
      if (center) {
        canvasState.activeNodes.forEach(n => {
          if (n.id === 1) return;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(232, 119, 34, 0.35)';
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        });
      }
    } else {
      canvasState.netEdges.forEach(edge => {
        const src = canvasState.activeNodes.find(n => n.id === edge.source);
        const tgt = canvasState.activeNodes.find(n => n.id === edge.target);
        if (src && tgt) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          ctx.stroke();
        }
      });
    }

    // Nodos
    canvasState.activeNodes.forEach(node => {
      const isSel = canvasState.selected && canvasState.selected.id === node.id;
      const isHov = canvasState.hover && canvasState.hover.id === node.id;
      const r = node.r || (isSel ? 20 : 15);

      // halo
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + (isHov ? 7 : 4), 0, Math.PI * 2);
      ctx.fillStyle = node.color === '#ffffff' || node.color === '#fff'
        ? 'rgba(255,255,255,0.18)'
        : node.color + '55';
      ctx.fill();

      // base
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // borde
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.strokeStyle = isSel
        ? '#fff'
        : (node.color === '#ffffff' || node.color === '#fff' ? '#E87722' : 'rgba(255,255,255,0.55)');
      ctx.stroke();

      // label
      ctx.fillStyle = '#fff';
      ctx.font = (isHov ? 'bold 12px ' : '11px ') + "'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + r + 6);
    });

    ctx.restore();
  }

  function getPointerPos(e) {
    const rect = canvasState.canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  }
  function toWorld(p) {
    return { x: (p.x - canvasState.offsetX) / canvasState.scale, y: (p.y - canvasState.offsetY) / canvasState.scale };
  }
  function nodeAt(world, extra = 6) {
    let found = null;
    canvasState.activeNodes.forEach(n => {
      const r = n.r || 15;
      const dx = world.x - n.x, dy = world.y - n.y;
      if (Math.sqrt(dx * dx + dy * dy) <= r + extra) found = n;
    });
    return found;
  }

  function onPointerDown(e) {
    const p = getPointerPos(e);
    canvasState.isDragging = true;
    canvasState.didDrag = false;
    canvasState.startX = p.x - canvasState.offsetX;
    canvasState.startY = p.y - canvasState.offsetY;
  }
  function onPointerMove(e) {
    const p = getPointerPos(e);
    if (canvasState.isDragging) {
      const nx = p.x - canvasState.startX;
      const ny = p.y - canvasState.startY;
      if (Math.abs(nx - canvasState.offsetX) > 2 || Math.abs(ny - canvasState.offsetY) > 2) {
        canvasState.didDrag = true;
      }
      canvasState.offsetX = nx;
      canvasState.offsetY = ny;
      drawCanvas();
    } else {
      const hov = nodeAt(toWorld(p));
      if (hov !== canvasState.hover) {
        canvasState.hover = hov;
        canvasState.canvas.style.cursor = hov ? 'pointer' : '';
        drawCanvas();
      }
    }
  }
  function onPointerUp() {
    canvasState.isDragging = false;
  }
  function onCanvasClick(e) {
    if (canvasState.didDrag) return;
    const p = getPointerPos(e);
    const hit = nodeAt(toWorld(p), 4);
    if (hit) {
      canvasState.selected = hit;
      updateSidebar();
      drawCanvas();
    }
  }
  function onTouchStart(e) {
    if (e.touches.length > 1) return;
    onPointerDown(e);
    const p = getPointerPos(e);
    const hit = nodeAt(toWorld(p), 14);
    if (hit) {
      canvasState.selected = hit;
      updateSidebar();
      drawCanvas();
    }
  }
  function onTouchMove(e) {
    if (!canvasState.isDragging || e.touches.length > 1) return;
    e.preventDefault();
    onPointerMove(e);
  }

  window.zoomCanvas = function (factor) {
    canvasState.scale = Math.max(0.4, Math.min(3, canvasState.scale * factor));
    drawCanvas();
  };
  window.resetCanvas = function () {
    canvasState.scale = 1;
    const rect = canvasState.canvas.parentElement.getBoundingClientRect();
    canvasState.offsetX = rect.width / 2;
    canvasState.offsetY = rect.height / 2;
    drawCanvas();
  };

  function updateSidebar() {
    const empty = $('#nodeInfoEmpty');
    const content = $('#nodeInfoContent');
    const sel = canvasState.selected;
    if (!sel) {
      empty.hidden = false;
      content.hidden = true;
      return;
    }
    empty.hidden = true;
    content.hidden = false;

    const data = sel.type === 'person' && sel.ref ? sel.ref : sel;
    const niCountry = $('#niCountry');
    niCountry.textContent = data.country || 'Global';
    const tagBg = (data.color === '#ffffff' || data.color === '#fff')
      ? '#E87722' : (data.color || '#0055A5');
    niCountry.style.backgroundColor = tagBg;
    $('#niTitle').textContent = sel.label;
    $('#niLeader').textContent = data.leader || '—';
    $('#niLine').textContent = data.line || 'General';
    $('#niProject').textContent = data.proj || 'Sin descripción activa.';
  }

  // ============================================================
  //  Modal de inscripción
  // ============================================================
  function openModal() {
    const m = $('#registerModal');
    if (!m) return;
    m.hidden = false;
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setTimeout(() => {
      const first = $('#regName');
      if (first) first.focus();
    }, 30);
  }
  function closeModal() {
    const m = $('#registerModal');
    if (!m) return;
    m.hidden = true;
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setTimeout(resetModalContent, 250);
  }

  function resetModalContent() {
    const body = $('#modalBody');
    const title = $('#modalTitle');
    const sub = $('#modalSubtitle');
    if (title) {
      title.textContent = 'Registro de participantes';
      title.classList.remove('modal__success-title');
    }
    if (sub) sub.textContent = 'Completa la siguiente información.';

    body.innerHTML = `
      <form id="registrationForm" class="form" novalidate>
        <div class="form__row">
          <label for="regName">Nombre completo *</label>
          <div class="form__input">
            <i class="fa-solid fa-user" aria-hidden="true"></i>
            <input type="text" id="regName" name="nombre" required minlength="2" maxlength="120" autocomplete="name">
          </div>
        </div>
        <div class="form__row">
          <label for="regInstitucion">Institución *</label>
          <div class="form__input">
            <i class="fa-solid fa-building-columns" aria-hidden="true"></i>
            <input type="text" id="regInstitucion" name="institucion" required minlength="2" maxlength="200" autocomplete="organization">
          </div>
        </div>
        <div class="form__row form__row--split">
          <div>
            <label for="regPais">País *</label>
            <div class="form__input">
              <i class="fa-solid fa-globe" aria-hidden="true"></i>
              <input type="text" id="regPais" name="pais" required minlength="2" maxlength="80" autocomplete="country-name">
            </div>
          </div>
          <div>
            <label for="regRol">Rol *</label>
            <div class="form__input form__input--select">
              <i class="fa-solid fa-id-badge" aria-hidden="true"></i>
              <select id="regRol" name="rol" required>
                <option value="">Selecciona…</option>
                <option value="Estudiante">Estudiante</option>
                <option value="Docente / Investigador">Docente / Investigador</option>
                <option value="Representante Institucional">Representante Institucional</option>
                <option value="Ponente">Ponente</option>
                <option value="Asistente General">Asistente General</option>
              </select>
              <i class="fa-solid fa-chevron-down field__chev" aria-hidden="true"></i>
            </div>
          </div>
        </div>
        <div class="form__row">
          <label for="regEmail">Correo electrónico *</label>
          <div class="form__input">
            <i class="fa-solid fa-envelope" aria-hidden="true"></i>
            <input type="email" id="regEmail" name="correo" required autocomplete="email">
          </div>
        </div>
        <label class="form__check">
          <input type="checkbox" id="regAccept" required>
          <span>Acepto el tratamiento de mis datos personales según la <a href="#" id="linkPolitica">Política de Privacidad</a>.</span>
        </label>
        <div class="form__note">
          <i class="fa-solid fa-info-circle" aria-hidden="true"></i>
          Esta es una demo pública: los registros se guardan localmente y no se envía correo.
        </div>
        <div class="form__error" id="formError" hidden></div>
        <button type="submit" id="btnSubmit" class="btn btn--primary btn--full btn--xl" disabled>
          Registrarme
        </button>
      </form>
    `;
    wireForm();
  }

  function wireForm() {
    const form = $('#registrationForm');
    if (!form) return;
    form.addEventListener('input', validateForm);
    form.addEventListener('change', validateForm);
    form.addEventListener('submit', onSubmitForm);
  }

  function validateForm() {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nombre = ($('#regName').value || '').trim();
    const inst = ($('#regInstitucion').value || '').trim();
    const pais = ($('#regPais').value || '').trim();
    const rol = ($('#regRol').value || '').trim();
    const correo = ($('#regEmail').value || '').trim();
    const accept = $('#regAccept').checked;
    const ok = nombre.length >= 2 && inst.length >= 2 && pais.length >= 2 && rol &&
               re.test(correo) && accept;
    $('#btnSubmit').disabled = !ok;
    return ok;
  }

  async function onSubmitForm(e) {
    e.preventDefault();
    if (!validateForm()) return;
    const btn = $('#btnSubmit');
    const errBox = $('#formError');
    errBox.hidden = true; errBox.textContent = '';

    btn.disabled = true; btn.textContent = 'Enviando…';

    const payload = {
      nombre: $('#regName').value.trim(),
      institucion: $('#regInstitucion').value.trim(),
      pais: $('#regPais').value.trim(),
      correo: $('#regEmail').value.trim(),
      rol: $('#regRol').value,
    };

    try {
      const res = await fetch('/api/inscripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = data.detail
          ? (Array.isArray(data.detail) ? data.detail.map(d => d.msg).join('; ') : String(data.detail))
          : 'No se pudo completar la inscripción';
        throw new Error(detail);
      }
      const data = await res.json();
      showSuccess(data.id);
    } catch (err) {
      errBox.textContent = err.message || 'Error en el envío';
      errBox.hidden = false;
      btn.disabled = false; btn.textContent = 'Registrarme';
    }
  }

  function showSuccess(id) {
    $('#modalTitle').textContent = 'Registro exitoso';
    $('#modalTitle').classList.add('modal__success-title');
    $('#modalSubtitle').textContent = 'Tu inscripción fue registrada en el sistema.';
    $('#modalBody').innerHTML = `
      <div style="text-align:center; padding: 20px 4px 12px;">
        <i class="fa-solid fa-circle-check" style="font-size: 56px; color:#10b981; margin-bottom:14px;" aria-hidden="true"></i>
        <p style="font-size:14px; color: var(--slate-600); margin-bottom: 6px;">¡Gracias por registrarte al II Diálogo Iberoamericano!</p>
        <p style="font-size:12px; color: var(--slate-500); margin-bottom: 22px;">Tu código de confirmación es:</p>
        <code style="display:inline-block; background:#f1f5f9; color:#0f172a; font-family: ui-monospace, monospace; font-size: 12px; padding: 8px 12px; border-radius: 8px; border:1px solid #e2e8f0;">${escapeHtml(id)}</code>
        <div style="margin-top: 24px;">
          <button type="button" class="btn btn--primary btn--xl" id="btnCloseSuccess">Cerrar</button>
        </div>
      </div>
    `;
    $('#btnCloseSuccess').addEventListener('click', closeModal);
    showToast('Inscripción enviada correctamente');
  }

  // ============================================================
  //  Nav móvil + bindings globales
  // ============================================================
  function initBindings() {
    const open = () => openModal();
    ['#btnOpenModalHeader', '#btnOpenModalHero', '#btnOpenModalMobile', '#btnOpenModalCta']
      .forEach(sel => { const el = $(sel); if (el) el.addEventListener('click', open); });

    $$('[data-close]').forEach(el => el.addEventListener('click', closeModal));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#registerModal').hidden) closeModal();
    });

    const toggle = $('#navToggle');
    const navM = $('#navMobile');
    if (toggle && navM) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        navM.hidden = expanded;
      });
      $$('a', navM).forEach(a => a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        navM.hidden = true;
      }));
    }

    $('#searchName').addEventListener('input', filterSpeakers);
    $('#searchSpecialty').addEventListener('input', filterSpeakers);
    $('#searchCountry').addEventListener('change', filterSpeakers);
    $('#btnClearFilters').addEventListener('click', clearFilters);

    $('#btnCalendar').addEventListener('click', () => showToast('Evento añadido a tu calendario (demo)'));
    $('#btnReminder').addEventListener('click', () => showToast('Recordatorios automáticos activados (demo)'));

    wireForm();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initBindings();
    loadContent();
  });
})();
