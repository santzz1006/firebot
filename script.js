/**
 * ============================================================
 *  FIREBOT — Plataforma Self-Service
 *  script.js · Production Grade · Staff Engineer Level
 *
 *  Módulos:
 *   1. Bootstrap & Feature Detection
 *   2. DynamicBackground (Canvas Cartesiano + Ondas de Energia)
 *   3. MouseGlow (LERP com Inércia)
 *   4. NavbarController (Scroll + Mobile Menu)
 *   5. ScrollReveal (IntersectionObserver bidirecional)
 *   6. HeroCountUp (Animação de contadores)
 *   7. DashboardTabs (Alternância de abas com fade)
 *   8. NeuralCanvas (Mini animação bento card)
 *   9. FloatingChatWidget (FAB + stagger de mensagens)
 *  10. CopyButton (Clipboard API)
 *  11. AccordionController
 *  12. SmoothScroll & ActiveSection
 *  13. RippleEffect (Micro-interação global)
 *  14. Init Orchestrator
 * ============================================================
 */

'use strict';

/* ============================================================
   1. BOOTSTRAP — Feature Detection & Reduced Motion Guard
   ============================================================ */

/**
 * Detecta preferência de redução de movimento do SO.
 * Todos os módulos de animação consultam esta flag antes de iniciar.
 * @type {boolean}
 */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Verifica suporte a IntersectionObserver (IE fallback safety).
 * @type {boolean}
 */
const HAS_IO = typeof IntersectionObserver !== 'undefined';

/**
 * Verifica suporte a ResizeObserver.
 * @type {boolean}
 */
const HAS_RO = typeof ResizeObserver !== 'undefined';

/**
 * Utilitário de seletor — retorna um único elemento.
 * @param {string} sel
 * @param {Element} [root=document]
 * @returns {Element|null}
 */
const $ = (sel, root = document) => root.querySelector(sel);

/**
 * Utilitário de seletor — retorna NodeList como Array.
 * @param {string} sel
 * @param {Element} [root=document]
 * @returns {Element[]}
 */
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Cria um elemento HTML com atributos opcionais.
 * @param {string} tag
 * @param {Object} [attrs={}]
 * @param {string} [innerHTML='']
 * @returns {Element}
 */
function createElement(tag, attrs = {}, innerHTML = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

/* ============================================================
   2. MÓDULO: DynamicBackground
   Canvas Cartesiano (grid estático) + Animações de Células Minimalistas + Ondas
   ============================================================ */

class DynamicBackground {
  /**
   * @param {string} canvasId - ID do elemento canvas
   */
  constructor(canvasId) {
    /** @type {HTMLCanvasElement|null} */
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    /** @type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.getContext('2d');

    /** Timestamp acumulado para animação */
    this.time = 0;

    /** ID do requestAnimationFrame em curso */
    this.rafId = null;

    /** Dimensões internas (atualizadas pelo ResizeObserver) */
    this.width  = 0;
    this.height = 0;

    /**
     * Configuração das ondas de energia (Mantido EXATAMENTE como você configurou)
     */
    this.waves = [
      { amplitude: 28, wavelength: 0.008,  speed: 0.0000017, opacity: 0.55, yOffset: 0.38 },
      { amplitude: 18, wavelength: 0.012,  speed: 0.0000006, opacity: 0.35, yOffset: 0.50 },
      { amplitude: 38, wavelength: 0.005,  speed: 0.0000009, opacity: 0.22, yOffset: 0.62 },
      { amplitude: 12, wavelength: 0.018,  speed: 0.0000010, opacity: 0.18, yOffset: 0.44 },
    ];

    /** Cor da onda */
    this.waveColor = '#FF4F00';

    /** Cor do grid cartesiano (Mantido o seu ajuste) */
    this.gridColor = 'rgba(0,0,0,0.030)';

    /** Espaçamento do grid em pixels (Mantido o seu ajuste) */
    this.gridSpacing = 96;

    // ==========================================================
    // SISTEMA COMPLEXO DE ANIMAÇÃO DE BLOCOS, TEXTOS E MATRIZES
    // ==========================================================
    this.activeCells = []; 
    
    // Palavras que vão aparecer nos quadrados
    this.techWords = ['SYS', 'OK', 'DATA', 'AI', 'NET', '0x1A', 'RAW', '200', 'GET', 'API', 'NODE', 'NULL'];
    
    // Configurações finas do comportamento das animações
    this.cellConfig = {
      spawnChance: 0.08,        // Chance de nascer um novo bloco por frame
      minSpeed: 0.004,          // Velocidade mínima do fade
      maxSpeed: 0.012,          // Velocidade máxima do fade
      baseColorRGB: '100, 100, 100', // Base da cor Cinza para blocos de fundo
      textColorRGB: '80, 80, 80',    // Base da cor Cinza para textos e mini grids
    };
    // ==========================================================

    this._bindResize();
    this._resize();
    this._startLoop();
  }

  /** Conecta ResizeObserver para redimensionar o canvas sem distorções */
  _bindResize() {
    if (HAS_RO) {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(document.documentElement);
    } else {
      window.addEventListener('resize', () => this._resize(), { passive: true });
    }
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = window.innerWidth;
    const h   = window.innerHeight;

    this.width  = w;
    this.height = h;

    this.canvas.width  = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width  = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  _drawGrid() {
    const { ctx, width, height, gridSpacing, gridColor } = this;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth   = 1.5;

    for (let x = 0; x <= width; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }

  // ==========================================================
  // LÓGICA DE RENDERIZAÇÃO DOS EFEITOS
  // ==========================================================
  _drawCellAnimations() {
    // Sorteio para criar novas animações
    if (Math.random() < this.cellConfig.spawnChance) {
      this._spawnCellAnimation();
    }

    const { ctx, gridSpacing } = this;

    // Itera de trás para frente para poder remover concluídas
    for (let i = this.activeCells.length - 1; i >= 0; i--) {
      const cell = this.activeCells[i];
      cell.progress += cell.decaySpeed;

      if (cell.progress >= 1) {
        this.activeCells.splice(i, 1);
        continue;
      }

      const x = cell.col * gridSpacing;
      const y = cell.row * gridSpacing;
      const cx = x + gridSpacing / 2;
      const cy = y + gridSpacing / 2;

      // Curva de sino para fade in/out perfeito
      const alpha = Math.sin(cell.progress * Math.PI);

      ctx.save();

      // --- 1. BLOCO CINZA PURO ---
      if (cell.type === 'block') {
        ctx.fillStyle = `rgba(${this.cellConfig.baseColorRGB}, ${alpha * 0.06})`;
        ctx.fillRect(x + 1, y + 1, gridSpacing - 2, gridSpacing - 2);
      } 
      // --- 2. APENAS TEXTO ---
      else if (cell.type === 'text') {
        ctx.fillStyle = `rgba(${this.cellConfig.textColorRGB}, ${alpha * 0.5})`;
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.word, cx, cy);
      } 
      // --- 3. BLOCO + TEXTO ---
      else if (cell.type === 'text_block') {
        ctx.fillStyle = `rgba(${this.cellConfig.baseColorRGB}, ${alpha * 0.04})`;
        ctx.fillRect(x + 1, y + 1, gridSpacing - 2, gridSpacing - 2);

        ctx.fillStyle = `rgba(${this.cellConfig.textColorRGB}, ${alpha * 0.6})`;
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.word, cx, cy);
      }
      // --- 4. NOVO: MATRIZ 3x3 DE MINI QUADRADOS (Referência Firecrawl) ---
      else if (cell.type === 'mini_grid') {
        // Fundo sutil para destacar a matriz
        ctx.fillStyle = `rgba(${this.cellConfig.baseColorRGB}, ${alpha * 0.03})`;
        ctx.fillRect(x + 1, y + 1, gridSpacing - 2, gridSpacing - 2);

        // Configuração da matriz
        const sqSize = 12; // Tamanho de cada quadradinho
        const gap = 5;    // Espaço entre eles
        const matrixSize = (sqSize * 3) + (gap * 2);
        const startX = cx - (matrixSize / 2) + (sqSize / 2);
        const startY = cy - (matrixSize / 2) + (sqSize / 2);

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            // Cria um ruído para que os quadrados pisquem de forma assíncrona (efeito tecnológico)
            const noise = Math.sin((cell.progress * 18) + (r * 2.5) + (c * 1.5));
            const dotAlpha = alpha * (0.3 + 0.7 * Math.abs(noise));

            ctx.fillStyle = `rgba(${this.cellConfig.textColorRGB}, ${dotAlpha})`;
            ctx.fillRect(
              startX + (c * (sqSize + gap)) - sqSize / 2,
              startY + (r * (sqSize + gap)) - sqSize / 2,
              sqSize,
              sqSize
            );
          }
        }
      }

      ctx.restore();
    }
  }

  _spawnCellAnimation() {
    const cols = Math.floor(this.width / this.gridSpacing);
    const rows = Math.floor(this.height / this.gridSpacing);
    
    if (cols <= 0 || rows <= 0) return;

    const col = Math.floor(Math.random() * cols);
    const row = Math.floor(Math.random() * rows);

    // Impede animações sobrepostas no mesmo quadrado simultaneamente
    const isOccupied = this.activeCells.some(c => c.col === col && c.row === row);
    if (isOccupied) return;

    // Sorteia o tipo (adicionamos o 'mini_grid' aqui!)
    // Coloquei 'block' duas vezes para ser o mais comum (minimalista)
    const types = ['block', 'block', 'text', 'text_block', 'mini_grid'];
    const type = types[Math.floor(Math.random() * types.length)];

    const word = this.techWords[Math.floor(Math.random() * this.techWords.length)];
    const decaySpeed = this.cellConfig.minSpeed + Math.random() * (this.cellConfig.maxSpeed - this.cellConfig.minSpeed);

    this.activeCells.push({
      col,
      row,
      type,
      word,
      progress: 0,
      decaySpeed
    });
  }
  // ==========================================================

  _drawWave(wave) {
    const { ctx, width, height, time, waveColor } = this;
    const { amplitude, wavelength, speed, opacity, yOffset } = wave;
    const yBase = height * yOffset;
    const phase = time * speed * 1000;

    ctx.beginPath();
    const y0 = yBase + amplitude * Math.sin(phase);
    ctx.moveTo(0, y0);

    for (let x = 2; x <= width; x += 2) {
      const y = yBase + amplitude * Math.sin(wavelength * x + phase);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height + 10);
    ctx.lineTo(0, height + 10);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, yBase - amplitude, 0, yBase + amplitude * 3);
    grad.addColorStop(0,   `rgba(255,79,0,${opacity * 0.9})`);
    grad.addColorStop(0.5, `rgba(255,79,0,${opacity * 0.2})`);
    grad.addColorStop(1,   'rgba(255,79,0,0)');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 2; x <= width; x += 2) {
      const y = yBase + amplitude * Math.sin(wavelength * x + phase);
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = `rgba(255,79,0,${opacity})`;
    ctx.lineWidth   = 1.2;
    ctx.stroke();
  }

  _frame(timestamp) {
    this.time = timestamp;
    const { ctx, width, height } = this;

    ctx.clearRect(0, 0, width, height);

    // 1. Grid estático
    this._drawGrid();

    // 2. Blocos, Textos e Mini Grids
    this._drawCellAnimations();

    // 3. Ondas com multiply
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    for (const wave of this.waves) {
      this._drawWave(wave);
    }

    ctx.restore();

    this.rafId = requestAnimationFrame((ts) => this._frame(ts));
  }

  _startLoop() {
    this.rafId = requestAnimationFrame((ts) => this._frame(ts));
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._ro) this._ro.disconnect();
  }
}

/* ============================================================
   3. MÓDULO: MouseGlow
   Efeito de glow que segue o cursor com interpolação LERP.
   LERP (Linear Interpolation) dá sensação de peso e inércia.
   ============================================================ */

class MouseGlow {
  /**
   * @param {string} glowId - ID do elemento de glow
   */
  constructor(glowId) {
    /** @type {HTMLElement|null} */
    this.el = document.getElementById(glowId);
    if (!this.el) return;

    /** Posição atual do glow (interpolada) */
    this.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    /** Posição alvo do glow (posição real do mouse) */
    this.target  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    /**
     * Fator de interpolação LERP.
     * Valor entre 0 (sem movimento) e 1 (movimento imediato).
     * 0.08 = leve atraso com sensação de peso e fluidez.
     */
    this.lerpFactor = 0.08;

    /** Se o mouse está na página */
    this.isActive = false;

    /** Flag de visibilidade */
    this.isVisible = false;

    /** ID do rAF */
    this.rafId = null;

    this._bindEvents();
    this._startLoop();
  }

  /** Registra os event listeners de mouse */
  _bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;

      if (!this.isVisible) {
        // Teletransporta o glow para a posição atual na primeira aparição
        this.current.x = e.clientX;
        this.current.y = e.clientY;
        this.isVisible = true;
        this.el.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.isVisible = false;
      // Fade out suave ao sair da janela
      this.el.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      this.isVisible = true;
      this.el.style.opacity = '1';
    });
  }

  /**
   * Interpolação Linear (LERP).
   * Calcula o próximo valor entre 'a' e 'b' com fator t.
   * Resultado: a + (b - a) * t
   *
   * @param {number} a - Valor atual
   * @param {number} b - Valor alvo
   * @param {number} t - Fator [0..1]
   * @returns {number}
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Frame de animação — aplica LERP e posiciona o elemento.
   * O uso de transform ao invés de left/top garante
   * aceleração de hardware (GPU) e 60fps consistentes.
   */
  _frame() {
    // Interpola suavemente a posição atual em direção ao alvo
    this.current.x = this._lerp(this.current.x, this.target.x, this.lerpFactor);
    this.current.y = this._lerp(this.current.y, this.target.y, this.lerpFactor);

    // Aplica posição via transform (GPU-accelerated, zero layout thrashing)
    this.el.style.transform = `translate(${this.current.x}px, ${this.current.y}px) translate(-50%, -50%)`;

    this.rafId = requestAnimationFrame(() => this._frame());
  }

  /** Inicia o loop */
  _startLoop() {
    this.rafId = requestAnimationFrame(() => this._frame());
  }

  /** Para o loop e libera recursos */
  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

/* ============================================================
   4. MÓDULO: NavbarController
   Scroll sticky com blur + menu mobile hamburger.
   ============================================================ */

class NavbarController {
  constructor() {
    /** @type {HTMLElement|null} */
    this.navbar    = document.getElementById('navbar');
    this.hamburger = $('.nav-hamburger');
    this.mobileMenu = document.getElementById('mobile-menu');

    if (!this.navbar) return;

    /** Limiar de scroll para ativar o estado "scrolled" */
    this.scrollThreshold = 20;

    this._bindScroll();
    this._bindHamburger();
    this._bindMobileLinks();
    this._onScroll(); // Estado inicial
  }

  /** Observa o scroll da página para aplicar classe .is-scrolled */
  _bindScroll() {
    window.addEventListener('scroll', () => this._onScroll(), { passive: true });
  }

  _onScroll() {
    const scrolled = window.scrollY > this.scrollThreshold;
    this.navbar.classList.toggle('is-scrolled', scrolled);
  }

  /** Controla abertura/fechamento do menu mobile */
  _bindHamburger() {
    if (!this.hamburger || !this.mobileMenu) return;

    this.hamburger.addEventListener('click', () => {
      const isOpen = this.mobileMenu.classList.contains('is-open');
      this._setMobileMenu(!isOpen);
    });

    // Fecha ao clicar fora do menu
    document.addEventListener('click', (e) => {
      if (
        this.mobileMenu.classList.contains('is-open') &&
        !this.navbar.contains(e.target)
      ) {
        this._setMobileMenu(false);
      }
    });
  }

  /**
   * Abre ou fecha o menu mobile com acessibilidade (aria).
   * @param {boolean} open
   */
  _setMobileMenu(open) {
    this.hamburger.classList.toggle('is-open', open);
    this.mobileMenu.classList.toggle('is-open', open);
    this.hamburger.setAttribute('aria-expanded', String(open));
    this.mobileMenu.setAttribute('aria-hidden', String(!open));
  }

  /** Fecha o menu mobile ao clicar em qualquer link interno */
  _bindMobileLinks() {
    if (!this.mobileMenu) return;
    $$('a', this.mobileMenu).forEach((link) => {
      link.addEventListener('click', () => this._setMobileMenu(false));
    });
  }
}

/* ============================================================
   5. MÓDULO: ScrollReveal
   IntersectionObserver bidirecional de alta performance.
   Anima elementos na entrada E saída da viewport,
   criando uma experiência de navegação contínua e imersiva.
   ============================================================ */

class ScrollReveal {
  constructor() {
    if (!HAS_IO) {
      // Fallback: torna tudo visível imediatamente
      this._showAll();
      return;
    }

    /**
     * Threshold de 15% de visibilidade para disparar a animação.
     * Valor menor = animação dispara mais cedo.
     */
    this.threshold = 0.15;

    /**
     * Seletores de elementos a monitorar.
     * Inclui todas as classes de reveal definidas no CSS.
     */
    this.selector = [
      '.fade-up',
      '.reveal-up',
      '.reveal-down',
      '.reveal-scale-in',
      '.reveal-scale-out',
      '.reveal-left',
      '.reveal-right',
      '.reveal-blur',
      '.reveal-fade',
    ].join(', ');

    /** Cache de delay para stagger baseado em data-delay */
    this._delayCache = new WeakMap();

    this._setupObserver();
    this._observe();
  }

  /**
   * Configura o IntersectionObserver principal.
   * rootMargin negativo garante que o elemento esteja realmente visível.
   */
  _setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => this._handleEntries(entries),
      {
        root:       null,         // viewport
        rootMargin: '0px 0px -60px 0px', // offset inferior para entrada mais suave
        threshold:  [0, this.threshold, 1.0],
      }
    );
  }

  /**
   * Processa as entradas do observer.
   * - Elemento visível (intersecting > threshold) → adiciona .is-visible
   * - Elemento fora da viewport (intersecting = 0) → remove .is-visible (re-animação)
   *
   * @param {IntersectionObserverEntry[]} entries
   */
  _handleEntries(entries) {
    entries.forEach((entry) => {
      const el = entry.target;
      const ratio = entry.intersectionRatio;

      if (ratio >= this.threshold) {
        // ENTRADA: elemento entrou na viewport
        const delay = this._getDelay(el);
        el.style.transitionDelay = delay > 0 ? `${delay}ms` : '';
        el.classList.remove('is-exiting');
        el.classList.add('is-visible');

      } else if (ratio === 0) {
        // SAÍDA: elemento saiu completamente da viewport
        // Remove is-visible para re-animar no próximo scroll
        el.style.transitionDelay = '';
        el.classList.remove('is-visible');
        el.classList.remove('is-exiting');
      }
    });
  }

  /**
   * Obtém o delay de transição do atributo data-delay.
   * Usa WeakMap como cache para evitar leituras repetidas do DOM.
   *
   * @param {Element} el
   * @returns {number} Delay em ms
   */
  _getDelay(el) {
    if (!this._delayCache.has(el)) {
      const raw = el.getAttribute('data-delay');
      this._delayCache.set(el, raw ? parseInt(raw, 10) : 0);
    }
    return this._delayCache.get(el);
  }

  /** Registra todos os elementos correspondentes ao seletor */
  _observe() {
    $$(this.selector).forEach((el) => this.observer.observe(el));
  }

  /** Fallback: torna todos os elementos visíveis sem animação */
  _showAll() {
    $$(this.selector).forEach((el) => el.classList.add('is-visible'));
  }

  /** Destrói o observer */
  destroy() {
    if (this.observer) this.observer.disconnect();
  }
}

/* ============================================================
   6. MÓDULO: HeroCountUp
   Animação de contadores numéricos no mini-dashboard hero.
   Usa easing ease-out-cubic para desaceleração natural.
   ============================================================ */

class HeroCountUp {
  constructor() {
    /** @type {Element[]} */
    this.counters = $$('[data-count]');
    if (!this.counters.length || !HAS_IO) return;

    this._setupObserver();
  }

  _setupObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this._animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    this.counters.forEach((el) => observer.observe(el));
  }

  /**
   * Anima um único contador de 0 até o valor alvo.
   *
   * @param {Element} el - Elemento com data-count e data-suffix
   */
  _animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-count'), 10);
    const suffix   = el.getAttribute('data-suffix') || '';
    const duration = 1600; // ms
    const startTs  = performance.now();

    const step = (now) => {
      const elapsed  = now - startTs;
      const progress = Math.min(elapsed / duration, 1);

      // Easing ease-out-cubic: desacelera no final
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);

      el.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Flash de cor ao finalizar (keyframe count-flash do CSS)
        el.style.animation = 'count-flash 0.6s ease forwards';
      }
    };

    requestAnimationFrame(step);
  }
}

/* ============================================================
   7. MÓDULO: DashboardTabs
   Alternância de abas de código no dashboard preview.
   Troca de conteúdo com fade rápido para transição suave.
   ============================================================ */

class DashboardTabs {
  constructor() {
    /**
     * Busca todos os grupos de tabs na página.
     * Um grupo é identificado pelo atributo data-tabs-group.
     */
    this.groups = $$('[data-tabs-group]');

    if (!this.groups.length) {
      // Busca fallback genérico para qualquer tab-trigger
      this._bindGenericTabs();
      return;
    }

    this.groups.forEach((group) => this._bindGroup(group));
  }

  /**
   * Vincula lógica de tabs a um grupo específico.
   * @param {Element} group
   */
  _bindGroup(group) {
    const triggers = $$('[data-tab]', group);
    const panels   = $$('[data-tab-panel]', group);

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const target = trigger.getAttribute('data-tab');
        this._switchTab(triggers, panels, target);
      });
    });
  }

  /**
   * Realiza a troca de aba com efeito de fade.
   *
   * @param {Element[]} triggers
   * @param {Element[]} panels
   * @param {string} target
   */
  _switchTab(triggers, panels, target) {
    // Atualiza estado dos triggers
    triggers.forEach((t) => {
      const isActive = t.getAttribute('data-tab') === target;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });

    // Troca o painel visível com fade
    panels.forEach((panel) => {
      const isActive = panel.getAttribute('data-tab-panel') === target;

      if (isActive) {
        panel.style.opacity = '0';
        panel.style.display = 'block';

        // Micro-delay para o browser registrar display:block antes do fade
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            panel.style.opacity = '1';
          });
        });
      } else {
        panel.style.opacity = '0';
        // Remove do fluxo após a transição
        const onTransEnd = () => {
          if (panel.style.opacity === '0') panel.style.display = 'none';
          panel.removeEventListener('transitionend', onTransEnd);
        };
        panel.addEventListener('transitionend', onTransEnd);
      }
    });
  }

  /**
   * Fallback genérico para elementos com classe .tab-trigger e .tab-panel.
   * Usado quando data-tabs-group não está presente no HTML.
   */
  _bindGenericTabs() {
    $$('.code-tabs, .dash-tabs').forEach((container) => {
      const triggers = $$('.tab-btn, .code-tab-btn', container);
      const panels   = $$('.tab-panel, .code-panel', container);

      if (!triggers.length) return;

      triggers.forEach((trigger, i) => {
        trigger.addEventListener('click', () => {
          triggers.forEach((t, j) => {
            t.classList.toggle('is-active', j === i);
            t.setAttribute('aria-selected', String(j === i));
          });
          panels.forEach((p, j) => {
            if (j === i) {
              p.style.transition = 'opacity 0.2s ease';
              p.style.opacity    = '0';
              p.style.display    = 'block';
              requestAnimationFrame(() => requestAnimationFrame(() => {
                p.style.opacity = '1';
              }));
            } else {
              p.style.opacity = '0';
              setTimeout(() => { p.style.display = 'none'; }, 200);
            }
          });
        });
      });
    });
  }
}

/* ============================================================
   8. MÓDULO: NeuralCanvas
   Mini animação de rede neural no card bento "IA Semântica".
   Desenha nós interconectados com pulsos de sinal viajando
   pelas arestas para simular processamento de dados.
   ============================================================ */

class NeuralCanvas {
  constructor() {
    /** @type {HTMLCanvasElement[]} */
    this.canvases = $$('canvas.neural-canvas');
    if (!this.canvases.length) return;

    this.canvases.forEach((canvas) => this._init(canvas));
  }

  /**
   * Inicializa uma instância de canvas neural.
   * @param {HTMLCanvasElement} canvas
   */
  _init(canvas) {
    const ctx  = canvas.getContext('2d');
    const w    = canvas.width  || 300;
    const h    = canvas.height || 80;

    /**
     * Topologia da rede: 3 camadas (input, hidden, output).
     * Cada nó tem posição (x, y) e pulso de ativação.
     */
    const layers = [
      [{ x: 30,  y: 20 }, { x: 30,  y: 40 }, { x: 30,  y: 60 }],       // Input
      [{ x: 110, y: 15 }, { x: 110, y: 30 }, { x: 110, y: 45 }, { x: 110, y: 65 }], // Hidden 1
      [{ x: 190, y: 25 }, { x: 190, y: 45 }, { x: 190, y: 65 }],       // Hidden 2
      [{ x: 270, y: 35 }, { x: 270, y: 55 }],                            // Output
    ];

    /** Pulsos viajando pelas arestas */
    const pulses = [];

    /** Conexões entre camadas adjacentes */
    const connections = [];
    for (let l = 0; l < layers.length - 1; l++) {
      for (const a of layers[l]) {
        for (const b of layers[l + 1]) {
          connections.push({ from: a, to: b });
        }
      }
    }

    let time    = 0;
    let rafId   = null;
    let started = false;

    /** Inicia quando o elemento entra na viewport */
    if (HAS_IO) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          loop();
        }
      }, { threshold: 0.3 });
      io.observe(canvas);
    } else {
      loop();
    }

    /** Loop de animação da rede neural */
    function loop() {
      time++;

      ctx.clearRect(0, 0, w, h);

      // Emite novos pulsos periodicamente (a cada ~35 frames)
      if (time % 35 === 0 && connections.length) {
        const conn = connections[Math.floor(Math.random() * connections.length)];
        pulses.push({ conn, progress: 0 });
      }

      // Desenha arestas (conexões)
      ctx.lineWidth   = 0.6;
      ctx.strokeStyle = 'rgba(255,79,0,0.12)';
      connections.forEach(({ from, to }) => {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });

      // Atualiza e desenha pulsos
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += 0.025; // Velocidade do pulso

        if (p.progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }

        // Posição interpolada do pulso ao longo da aresta
        const px = p.conn.from.x + (p.conn.to.x - p.conn.from.x) * p.progress;
        const py = p.conn.from.y + (p.conn.to.y - p.conn.from.y) * p.progress;

        // Opacidade em sino: sobe e desce ao longo do trajeto
        const alpha = Math.sin(p.progress * Math.PI);

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,79,0,${alpha * 0.9})`;
        ctx.fill();
      }

      // Desenha nós da rede
      layers.flat().forEach((node, idx) => {
        // Pulsação suave baseada no tempo e índice (assincronia)
        const pulse  = 0.5 + 0.5 * Math.sin(time * 0.04 + idx * 0.7);
        const radius = 3.5 + pulse * 1.5;
        const alpha  = 0.4 + pulse * 0.55;

        // Anel externo (glow)
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,79,0,${alpha * 0.25})`;
        ctx.fill();

        // Núcleo do nó
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,79,0,${alpha})`;
        ctx.fill();
      });

      rafId = requestAnimationFrame(loop);
    }
  }
}

/* ============================================================
   9. MÓDULO: FloatingChatWidget
   FAB que abre/fecha a janela de chat com animação.
   Ao abrir, simula o bot "digitando" e exibe mensagens
   em sequência com efeito stagger.
   ============================================================ */

class FloatingChatWidget {
  constructor() {
    this.fab        = document.getElementById('widget-fab');
    this.chatWindow = document.getElementById('chat-window');
    this.closeBtn   = document.getElementById('chat-close');
    this.messagesEl = $('.chat-messages', this.chatWindow || document);
    this.chatInput  = $('.chat-input',   this.chatWindow || document);
    this.sendBtn    = $('.chat-send',    this.chatWindow || document);

    if (!this.fab || !this.chatWindow) return;

    /** Estado do chat */
    this.isOpen = false;

    /** Se o stagger inicial já foi executado */
    this.demoPlayed = false;

    /** Ícones do FAB */
    this.iconChat  = $('.fab-icon-chat',  this.fab);
    this.iconClose = $('.fab-icon-close', this.fab);

    /**
     * Mensagens de demonstração do bot.
     * Exibidas em sequência com typing indicator entre elas.
     */
    this.demoMessages = [
      { type: 'bot',  text: 'Olá! Sou o FireBot 🔥 Posso ajudar com dúvidas sobre a plataforma. Como configurar, ativar canais ou qualquer coisa que precisar!', delay: 0 },
      { type: 'user', text: 'Quanto tempo leva para configurar?', delay: 1800 },
      { type: 'bot',  text: 'Menos de 5 minutos! ⚡ Você cria a conta, sobe sua base de conhecimento e ativa o widget. Nada de código ou DevOps.', delay: 3400 },
      { type: 'user', text: 'Funciona no WhatsApp também?', delay: 5400 },
      { type: 'bot',  text: 'Sim! 🟢 Widget no site + WhatsApp numa única plataforma. Você conecta via QR Code e pronto.', delay: 7000 },
    ];

    this._bindEvents();
  }

  /** Registra todos os event listeners do widget */
  _bindEvents() {
    this.fab.addEventListener('click', () => this._toggle());

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this._close());
    }

    // Envio de mensagem via botão
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this._sendUserMessage());
    }

    // Envio de mensagem via Enter
    if (this.chatInput) {
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this._sendUserMessage();
        }
      });
    }
  }

  /** Alterna estado do chat */
  _toggle() {
    this.isOpen ? this._close() : this._open();
  }

  /** Abre a janela de chat */
  _open() {
    this.isOpen = true;
    this.chatWindow.classList.add('is-open');
    this.chatWindow.setAttribute('aria-hidden', 'false');
    this.fab.setAttribute('aria-expanded', 'true');

    // Troca os ícones do FAB
    if (this.iconChat)  this.iconChat.style.display  = 'none';
    if (this.iconClose) this.iconClose.style.display = 'block';

    // Executa o stagger de demo apenas na primeira abertura
    if (!this.demoPlayed) {
      this.demoPlayed = true;
      this._clearMessages();
      this._playDemoStagger();
    } else {
      // Em aberturas subsequentes, foca no input
      this._focusInput();
    }
  }

  /** Fecha a janela de chat */
  _close() {
    this.isOpen = false;
    this.chatWindow.classList.remove('is-open');
    this.chatWindow.setAttribute('aria-hidden', 'true');
    this.fab.setAttribute('aria-expanded', 'false');

    if (this.iconChat)  this.iconChat.style.display  = 'block';
    if (this.iconClose) this.iconClose.style.display = 'none';
  }

  /** Remove todas as mensagens existentes */
  _clearMessages() {
    if (this.messagesEl) this.messagesEl.innerHTML = '';
  }

  /**
   * Executa as mensagens de demo em sequência (stagger).
   * Cada mensagem é precedida por um typing indicator
   * que simula o tempo de digitação do bot.
   */
  _playDemoStagger() {
    if (!this.messagesEl) return;

    this.demoMessages.forEach((msg) => {
      setTimeout(() => {
        if (msg.type === 'bot') {
          // Mostra typing indicator antes da mensagem do bot
          const typing = this._createTypingIndicator();
          this.messagesEl.appendChild(typing);
          this._scrollToBottom();

          // Remove o typing e exibe a mensagem após 900ms
          setTimeout(() => {
            typing.remove();
            this._appendBubble(msg.type, msg.text);
          }, 900);

        } else {
          // Mensagens do usuário aparecem diretamente
          this._appendBubble(msg.type, msg.text);
        }
      }, msg.delay);
    });
  }

  /**
   * Cria e retorna o elemento de typing indicator (três pontos pulsantes).
   * @returns {Element}
   */
  _createTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.setAttribute('aria-label', 'Bot digitando');
    typing.innerHTML = `
      <div class="chat-typing-dot"></div>
      <div class="chat-typing-dot"></div>
      <div class="chat-typing-dot"></div>
    `;
    return typing;
  }

  /**
   * Cria e appenda um balão de mensagem ao chat.
   *
   * @param {'bot'|'user'} type
   * @param {string} text
   */
  _appendBubble(type, text) {
    if (!this.messagesEl) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble-${type}`;
    bubble.setAttribute('role', 'article');

    // Horário simulado
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    bubble.innerHTML = `
      <p>${this._escapeHTML(text)}</p>
      <span class="chat-time">${timeStr}</span>
    `;

    // Animação de entrada via CSS
    bubble.style.opacity   = '0';
    bubble.style.transform = 'translateY(8px) scale(0.96)';
    bubble.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    this.messagesEl.appendChild(bubble);
    this._scrollToBottom();

    // Trigger da animação no próximo frame
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bubble.style.opacity   = '1';
      bubble.style.transform = 'translateY(0) scale(1)';
    }));
  }

  /**
   * Captura o texto do input, envia a mensagem do usuário
   * e gera uma resposta automática do bot.
   */
  _sendUserMessage() {
    if (!this.chatInput) return;
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = '';
    this._appendBubble('user', text);

    // Resposta automática após delay
    setTimeout(() => {
      const typing = this._createTypingIndicator();
      this.messagesEl.appendChild(typing);
      this._scrollToBottom();

      setTimeout(() => {
        typing.remove();
        const reply = this._getAutoReply(text);
        this._appendBubble('bot', reply);
      }, 1000 + Math.random() * 500);
    }, 400);
  }

  /**
   * Gera uma resposta automática simples baseada em palavras-chave.
   * @param {string} text
   * @returns {string}
   */
  _getAutoReply(text) {
    const lower = text.toLowerCase();

    if (lower.includes('preço') || lower.includes('plano') || lower.includes('custo')) {
      return 'Temos planos a partir de R$ 0 (gratuito)! 🎉 Para mais detalhes sobre os planos, acesse nossa página de preços ou fale com nossa equipe.';
    }
    if (lower.includes('api') || lower.includes('integr')) {
      return 'Sim, temos API REST completa com documentação interativa. Você pode integrar o FireBot em qualquer sistema em poucos minutos! 🔌';
    }
    if (lower.includes('whatsapp')) {
      return 'A integração com WhatsApp é feita via QR Code em menos de 2 minutos. Basta acessar Canais → WhatsApp no painel. 📱';
    }
    if (lower.includes('widget') || lower.includes('site')) {
      return 'O widget é instalado com uma única linha de script. Funciona em qualquer site ou plataforma (WordPress, Shopify, React, etc.) 🚀';
    }
    if (lower.includes('suporte') || lower.includes('ajuda')) {
      return 'Estou aqui para ajudar! 😊 Você pode abrir um ticket no painel ou entrar em contato pelo email contato@firebot.io.';
    }
    return 'Entendido! Nossa equipe pode te ajudar melhor com isso. Quer que eu abra um ticket de suporte? 🎯';
  }

  /** Rola o chat até o final das mensagens */
  _scrollToBottom() {
    if (!this.messagesEl) return;
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }

  /** Foca no input de mensagem */
  _focusInput() {
    if (this.chatInput) {
      setTimeout(() => this.chatInput.focus(), 350);
    }
  }

  /**
   * Sanitiza texto para inserção segura no innerHTML.
   * @param {string} str
   * @returns {string}
   */
  _escapeHTML(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }
}

/* ============================================================
   10. MÓDULO: CopyButton
   Botão de copiar código com feedback visual (Clipboard API).
   ============================================================ */

class CopyButton {
  constructor() {
    this._bindAll();
  }

  _bindAll() {
    // Buttons com data-copy-target apontam para o ID do elemento a copiar
    $$('[data-copy-target]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.getAttribute('data-copy-target');
        const source   = document.getElementById(targetId);
        if (!source) return;

        await this._copy(btn, source.textContent.trim());
      });
    });

    // Buttons com data-copy-text copiam um texto literal
    $$('[data-copy-text]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await this._copy(btn, btn.getAttribute('data-copy-text'));
      });
    });

    // Classe .code-panel-copy → copia o code block irmão
    $$('.code-panel-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const panel = btn.closest('.code-panel, .code-block, .bento-code-snippet');
        if (!panel) return;
        const code = $('code, pre, .code-line', panel);
        const text = code ? code.textContent.trim() : '';
        if (text) await this._copy(btn, text);
      });
    });
  }

  /**
   * Executa a cópia e exibe feedback visual.
   * @param {Element} btn
   * @param {string} text
   */
  async _copy(btn, text) {
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('is-copied', 'copied');

      // Atualiza aria-label para acessibilidade
      const prevLabel = btn.getAttribute('aria-label');
      btn.setAttribute('aria-label', 'Copiado!');

      // Reseta após 2.5s
      setTimeout(() => {
        btn.classList.remove('is-copied', 'copied');
        if (prevLabel) btn.setAttribute('aria-label', prevLabel);
      }, 2500);

    } catch {
      // Fallback para navegadores sem Clipboard API
      this._legacyCopy(text);
    }
  }

  /**
   * Fallback de cópia para ambientes sem Clipboard API.
   * @param {string} text
   */
  _legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
  }
}

/* ============================================================
   11. MÓDULO: AccordionController
   Accordion acessível com animação de altura fluida.
   Usa a técnica de transição de height com scrollHeight.
   ============================================================ */

class AccordionController {
  constructor() {
    this.items = $$('.accordion-item');
    if (!this.items.length) return;

    this.items.forEach((item) => this._bind(item));
  }

  /**
   * Vincula o toggle a um item de accordion.
   * @param {Element} item
   */
  _bind(item) {
    const trigger = $('.accordion-trigger', item);
    const content = $('.accordion-content', item);

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      this._closeAll();
      if (!isOpen) this._open(item, content);
    });
  }

  /**
   * Abre um item com animação de altura.
   * @param {Element} item
   * @param {Element} content
   */
  _open(item, content) {
    item.classList.add('is-open');
    content.style.height = content.scrollHeight + 'px';

    const trigger = $('.accordion-trigger', item);
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  /**
   * Fecha todos os itens abertos.
   */
  _closeAll() {
    this.items.forEach((item) => {
      if (item.classList.contains('is-open')) {
        item.classList.remove('is-open');
        const content = $('.accordion-content', item);
        if (content) content.style.height = '0';
        const trigger = $('.accordion-trigger', item);
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/* ============================================================
   12. MÓDULO: SmoothScroll & ActiveSection
   Scroll suave para âncoras internas + destaque do nav-link ativo.
   ============================================================ */

class SmoothScrollNav {
  constructor() {
    this._bindAnchorLinks();
    this._bindActiveSections();
  }

  /**
   * Intercepta cliques em âncoras internas e aplica scroll suave.
   * Compensa a altura fixa da navbar.
   */
  _bindAnchorLinks() {
    const NAVBAR_HEIGHT = 72;

    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /**
   * Observa as seções principais para destacar o nav-link correspondente.
   * Usa IntersectionObserver com threshold de 40% de visibilidade.
   */
  _bindActiveSections() {
    if (!HAS_IO) return;

    const navLinks = $$('.nav-link');
    if (!navLinks.length) return;

    const sections = $$('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach((link) => {
              const linkTarget = link.getAttribute('href')?.replace('#', '');
              link.classList.toggle('is-active', linkTarget === id);
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }
}

/* ============================================================
   13. MÓDULO: RippleEffect
   Micro-interação de onda em botões ao clique.
   Efeito visual de toque/clique que irradia a partir do ponto exato.
   ============================================================ */

class RippleEffect {
  constructor() {
    this._bindGlobal();
  }

  /** Delega o evento de clique para todos os botões futuros e presentes */
  _bindGlobal() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn, .bento-card, .step-card, .tech-stack-card');
      if (!target) return;

      this._createRipple(target, e);
    });
  }

  /**
   * Cria e anima o elemento de ripple.
   * @param {Element} container
   * @param {MouseEvent} event
   */
  _createRipple(container, event) {
    // Remove ripples anteriores para evitar acúmulo
    $$('.ripple-el', container).forEach((r) => r.remove());

    const rect    = container.getBoundingClientRect();
    const size    = Math.max(rect.width, rect.height) * 2;
    const x       = event.clientX - rect.left - size / 2;
    const y       = event.clientY - rect.top  - size / 2;

    const ripple  = createElement('span', {
      class: 'ripple-el',
      style: [
        `width:${size}px`,
        `height:${size}px`,
        `left:${x}px`,
        `top:${y}px`,
        'position:absolute',
        'border-radius:50%',
        'background:rgba(255,79,0,0.12)',
        'pointer-events:none',
        'transform:scale(0)',
        'animation:ripple 0.6s var(--ease-default) forwards',
        'z-index:0',
      ].join(';'),
    });

    // Garante position:relative no container
    const currentPos = getComputedStyle(container).position;
    if (currentPos === 'static') container.style.position = 'relative';
    container.style.overflow = 'hidden';

    container.appendChild(ripple);

    // Remove após a animação
    ripple.addEventListener('animationend', () => ripple.remove());
  }
}

/* ============================================================
   14. MÓDULO: HeroVisualFloat
   Animação de flutuação suave do mockup do dashboard no hero.
   Usa CSS animation via classe, disparada após o reveal.
   ============================================================ */

class HeroVisualFloat {
  constructor() {
    this.visual = $('.hero-visual-chrome');
    if (!this.visual || REDUCED_MOTION) return;

    // Dispara a animação de float após o delay de reveal
    setTimeout(() => {
      this.visual.style.animation = 'float-gentle 7s ease-in-out infinite';
    }, 1200);
  }
}

/* ============================================================
   15. MÓDULO: MiniBarChart
   Animação dos mini gráficos de barras SVG no hero.
   Simula a chegada de dados em tempo real.
   ============================================================ */

class MiniBarChart {
  constructor() {
    this.bars = $$('.mini-bar');
    if (!this.bars.length || REDUCED_MOTION) return;

    this._animate();
  }

  /** Anima as barras com um delay em cascata (stagger) */
  _animate() {
    this.bars.forEach((bar, i) => {
      // Delay escalonado por barra
      setTimeout(() => {
        const origY = bar.getAttribute('y');
        const origH = bar.getAttribute('height');

        if (!origY || !origH) return;

        // Inicia colapsada e expande até o tamanho original
        bar.setAttribute('height', '0');
        bar.setAttribute('y', String(parseFloat(origY) + parseFloat(origH)));

        // Transição SVG via SMIL (compatível com todos os browsers modernos)
        const duration = 0.5 + Math.random() * 0.3;

        bar.style.transition = `height ${duration}s cubic-bezier(0.16,1,0.3,1), y ${duration}s cubic-bezier(0.16,1,0.3,1)`;

        requestAnimationFrame(() => {
          bar.setAttribute('height', origH);
          bar.setAttribute('y', origY);
        });

      }, 300 + i * 80);
    });
  }
}

/* ============================================================
   16. MÓDULO: StatusPulse
   Mantém pulsação dos indicadores de status "online" do dashboard.
   Gerencia a animação CSS automaticamente.
   ============================================================ */

class StatusPulse {
  constructor() {
    // Os elementos .mini-online-dot e .online-dot já têm animação
    // via CSS (pulse-dot keyframe). Este módulo adiciona atualização
    // dinâmica do texto de status para simular atividade real.
    this.statusPills = $$('.mini-status-pill, .dash-action-pill');
    if (!this.statusPills.length) return;

    this._startCycle();
  }

  /** Cicla os status "Ativo" e "Processando" para simular atividade */
  _startCycle() {
    const labels = ['Bot Ativo', 'Processando...', 'Bot Ativo', 'Respondendo...'];
    let idx = 0;

    setInterval(() => {
      idx = (idx + 1) % labels.length;
      this.statusPills.forEach((pill) => {
        const text = pill.lastChild;
        if (text && text.nodeType === Node.TEXT_NODE) {
          // Fade rápido na troca
          pill.style.opacity = '0.5';
          setTimeout(() => {
            text.textContent = labels[idx];
            pill.style.opacity = '1';
          }, 200);
        }
      });
    }, 4000);
  }
}

/* ============================================================
   17. MÓDULO: DashboardKPI
   Simula atualização ao vivo dos KPIs no dashboard preview.
   Pequenas variações nos números criam a ilusão de dados reais.
   ============================================================ */

class DashboardKPI {
  constructor() {
    /** @type {Element[]} */
    this.kpiValues = $$('.dash-kpi-value, .mini-stat-value');
    if (!this.kpiValues.length) return;

    // Só ativa quando o dashboard entra na viewport
    if (!HAS_IO) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this._startLiveUpdates();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    const dashboard = document.getElementById('dashboard');
    if (dashboard) observer.observe(dashboard);
  }

  /** Inicia micro-atualizações periódicas nos valores de KPI */
  _startLiveUpdates() {
    // Mapa de valores base por elemento
    const baseValues = new Map();

    this.kpiValues.forEach((el) => {
      const text = el.textContent.trim();
      if (/^\d+$/.test(text)) {
        baseValues.set(el, parseInt(text, 10));
      }
    });

    setInterval(() => {
      baseValues.forEach((base, el) => {
        // Variação aleatória de ±1 a ±5 para simular atividade
        const delta = Math.floor(Math.random() * 5) + 1;
        const sign  = Math.random() > 0.35 ? 1 : -1; // Tendência de alta
        const newVal = Math.max(0, base + delta * sign);

        baseValues.set(el, newVal);

        // Transição numérica suave
        el.style.transition = 'color 0.3s ease';
        el.style.color = sign > 0 ? '#16A34A' : '#EF4444';
        el.textContent = String(newVal);

        setTimeout(() => {
          el.style.color = '';
        }, 800);
      });
    }, 3500);
  }
}

/* ============================================================
   18. MÓDULO: PageTransition
   Fade suave na entrada da página (elimina FOUC).
   ============================================================ */

class PageTransition {
  constructor() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease';

    // Aguarda fontes carregarem antes de revelar
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => this._reveal());
    } else {
      // Fallback imediato
      requestAnimationFrame(() => this._reveal());
    }
  }

  _reveal() {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  }
}

/* ============================================================
   19. MÓDULO: ThrottledScroll
   Utilitário para throttle de eventos de scroll.
   Evita que múltiplos módulos registrem handlers de scroll
   independentemente, reduzindo o overhead total.
   ============================================================ */

class ThrottledScroll {
  constructor() {
    /** @type {Function[]} Callbacks registrados */
    this.listeners  = [];
    this._ticking   = false;
    this._lastScroll = 0;

    window.addEventListener('scroll', () => this._onScroll(), { passive: true });
  }

  /**
   * Registra um callback para ser chamado a cada scroll throttleado.
   * @param {Function} fn
   */
  add(fn) {
    this.listeners.push(fn);
  }

  _onScroll() {
    this._lastScroll = window.scrollY;

    if (!this._ticking) {
      requestAnimationFrame(() => {
        this.listeners.forEach((fn) => fn(this._lastScroll));
        this._ticking = false;
      });
      this._ticking = true;
    }
  }
}

/* ============================================================
   20. MÓDULO: NavScrollProgress
   Barra de progresso de leitura no topo da navbar.
   Indica visualmente quanto do conteúdo foi rolado.
   ============================================================ */

class NavScrollProgress {
  constructor(throttledScroll) {
    this.progressBar = null;
    this._createBar();

    throttledScroll.add((scrollY) => this._update(scrollY));
  }

  /** Cria a barra de progresso e insere na navbar */
  _createBar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    this.progressBar = createElement('div', {
      class: 'scroll-progress-bar',
      style: [
        'position:absolute',
        'bottom:0',
        'left:0',
        'height:2px',
        'width:0%',
        'background:linear-gradient(90deg,var(--heat-100),var(--heat-200))',
        'transition:width 0.1s linear',
        'z-index:1',
        'border-radius:0 2px 2px 0',
      ].join(';'),
      'aria-hidden': 'true',
    });

    navbar.style.position = 'fixed';
    navbar.appendChild(this.progressBar);
  }

  /**
   * Atualiza a largura da barra com base no progresso de scroll.
   * @param {number} scrollY
   */
  _update(scrollY) {
    if (!this.progressBar) return;

    const docH    = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docH > 0 ? Math.min((scrollY / docH) * 100, 100) : 0;
    this.progressBar.style.width = `${percent}%`;
  }
}

/* ============================================================
   14. INIT ORCHESTRATOR
   Ponto central de inicialização.
   Todos os módulos são instanciados aqui dentro do DOMContentLoaded.
   A ordem de inicialização respeita dependências entre módulos.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Fade de entrada da página ──────────────────────────── */
  new PageTransition();

  /* ── Scroll throttlado (compartilhado entre módulos) ────── */
  const scrollBus = new ThrottledScroll();

  /* ── Background Canvas (somente se motion é permitido) ──── */
  if (!REDUCED_MOTION) {
    new DynamicBackground('bg-canvas');
  } else {
    // Esconde o canvas se reduced-motion estiver ativo
    const bgCanvas = document.getElementById('bg-canvas');
    if (bgCanvas) bgCanvas.style.display = 'none';
  }

  /* ── Glow do Mouse (somente desktop, somente motion) ────── */
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  if (!REDUCED_MOTION && !isTouchDevice) {
    new MouseGlow('mouse-glow');
  } else {
    // Esconde o elemento de glow em touch devices
    const glow = document.getElementById('mouse-glow');
    if (glow) glow.style.display = 'none';
  }

  /* ── Navbar ─────────────────────────────────────────────── */
  new NavbarController();

  /* ── Barra de progresso de scroll ──────────────────────── */
  new NavScrollProgress(scrollBus);

  /* ── Scroll Reveal bidirecional ─────────────────────────── */
  new ScrollReveal();

  /* ── Smooth Scroll + Active Sections ────────────────────── */
  new SmoothScrollNav();

  /* ── Contadores do mini-dashboard ───────────────────────── */
  new HeroCountUp();

  /* ── Tabs de código/dashboard ───────────────────────────── */
  new DashboardTabs();

  /* ── Neural Canvas (card bento) ─────────────────────────── */
  if (!REDUCED_MOTION) {
    new NeuralCanvas();
  }

  /* ── Floating Chat Widget ───────────────────────────────── */
  new FloatingChatWidget();

  /* ── Botões de copiar código ────────────────────────────── */
  new CopyButton();

  /* ── Accordion ──────────────────────────────────────────── */
  new AccordionController();

  /* ── Ripple Effect (micro-interação global) ─────────────── */
  new RippleEffect();

  /* ── Hero Visual Float ──────────────────────────────────── */
  new HeroVisualFloat();

  /* ── Mini Bar Chart (hero) ──────────────────────────────── */
  if (!REDUCED_MOTION) {
    new MiniBarChart();
  }

  /* ── Dashboard KPI Live Updates ─────────────────────────── */
  new DashboardKPI();

  /* ── Status Pulse ───────────────────────────────────────── */
  new StatusPulse();

  /* ── Hero fade-up imediato (sem observer) ───────────────── */
  _initHeroFadeUp();

  /* ── Lazy images / assets ───────────────────────────────── */
  _initLazyLoad();

  /* ── Global error boundary ──────────────────────────────── */
  _setupErrorBoundary();

});

/* ============================================================
   FUNÇÕES AUXILIARES DE INICIALIZAÇÃO
   ============================================================ */

/**
 * Dispara os elementos fade-up do hero com delay escalonado
 * imediatamente (sem depender do IntersectionObserver),
 * já que o hero é always-visible no carregamento inicial.
 */
function _initHeroFadeUp() {
  const heroSection = document.getElementById('hero');
  if (!heroSection) return;

  const elements = $$('.fade-up, .reveal-up', heroSection);

  elements.forEach((el) => {
    const rawDelay = parseInt(el.getAttribute('data-delay') || '0', 10);

    setTimeout(() => {
      el.style.transitionDelay = '';
      el.classList.add('is-visible');
    }, 200 + rawDelay);
  });
}

/**
 * Configura o Lazy Loading nativo para imagens.
 * Adiciona loading="lazy" em imagens que não o possuem.
 */
function _initLazyLoad() {
  $$('img:not([loading])').forEach((img) => {
    // Não aplica lazy ao logo e imagens above-the-fold
    const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;
    if (!isAboveFold) {
      img.setAttribute('loading', 'lazy');
    }
  });
}

/**
 * Error boundary global — captura erros JS não tratados
 * e evita que quebrem a experiência do usuário.
 * Em produção, enviaria para um serviço de monitoramento.
 */
function _setupErrorBoundary() {
  window.addEventListener('error', (event) => {
    // Silencia erros de terceiros (extensões de browser, etc.)
    if (!event.filename || event.filename.includes(window.location.origin)) {
      console.warn('[FireBot] Erro capturado:', event.message);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[FireBot] Promise rejeitada:', event.reason);
    event.preventDefault();
  });
}

/**
 * Utilitário de debounce — limita a taxa de chamadas de uma função.
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Utilitário de throttle — garante execução no máximo a cada N ms.
 * @param {Function} fn
 * @param {number} limit - ms
 * @returns {Function}
 */
function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Verifica se uma cor CSS custom property está disponível.
 * Usado para garantir que o canvas usa a cor correta do tema.
 * @param {string} varName
 * @returns {string}
 */
function getCSSVar(varName) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/* ── Expõe utilitários globais opcionais para debugging ── */
if (typeof window !== 'undefined') {
  window.__FireBot = {
    version:     '1.0.0',
    reducedMotion: REDUCED_MOTION,
    utils:       { debounce, throttle, getCSSVar },
  };
}
document.addEventListener('DOMContentLoaded', () => {
    // 1. Encontra os elementos que precisamos
    const pill = document.querySelector('.js-interactive-pill');
    if (!pill) return; // Segurança: se o elemento não existir, para aqui.

    const dot = pill.querySelector('.eyebrow-dot');
    const textSpan = pill.querySelector('.eyebrow-text');
    const fullText = textSpan.innerText; // Pega o texto completo original
    let typingIntervalId = null; // Guardar o ID do intervalo para limpar depois

    // 2. Adiciona o ouvinte de clique no botão
    pill.addEventListener('click', () => {
        // --- Reset do estado (para re-trigar a animação) ---
        clearInterval(typingIntervalId); // para qualquer digitação em andamento
        textSpan.innerText = ''; // limpa o texto
        pill.classList.remove('is-typing'); // remove o cursor
        dot.classList.remove('is-flashing'); // remove a classe de animação da bolinha

        // Força um "reflow" para o navegador entender que a classe foi removida
        // antes de adicioná-la novamente para reiniciar a animação
        void dot.offsetWidth;

        // --- Sequência da Animação ---

        // Fase 1: Ponto Piscando (começa imediatamente)
        dot.classList.add('is-flashing');

        // Fase 2 e 3: Digitação (começa depois da bolinha piscar)
        setTimeout(() => {
            pill.classList.add('is-typing'); // Mostra o cursor piscando
            startTypingEffect(fullText, textSpan);
        }, 600); // 0.6s é a duração da animação flash-dot no CSS
    });

    // Função que faz a digitação letra por letra
    function startTypingEffect(text, element) {
        let currentIndex = 0;
        
        // Define um intervalo para adicionar uma letra a cada 40ms
        typingIntervalId = setInterval(() => {
            if (currentIndex < text.length) {
                // Adiciona a próxima letra
                element.innerText += text.charAt(currentIndex);
                currentIndex++;
            } else {
                // Digitação terminou
                clearInterval(typingIntervalId); 
                
                // Opcional: Remover o cursor após a digitação terminar
                setTimeout(() => {
                    pill.classList.remove('is-typing');
                }, 1000);
            }
        }, 40); // Velocidade da digitação (ms por caractere)
    }
});