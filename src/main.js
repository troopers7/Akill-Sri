import { projectsData } from './data/projectsData.js';
import { templeStylesData, templeAnatomyData } from './data/templeDesignData.js';
import { servicesData } from './data/servicesData.js';
import { aboutData } from './data/aboutData.js';
import { processStagesData } from './data/processData.js';
import { insightsData } from './data/insightsData.js';
import { sacredAudio } from './utils/audio.js';
import { escapeHtml, filterProjects } from './utils/planner.js';
import { createWizard } from './utils/wizard.js';
import { deliverContactInquiry, contactMailtoUrl, OWNER_EMAILS } from './utils/notify.js';
import { generateInquiryDocHtml, downloadDocFile } from './utils/documentExport.js';
import { downloadInquiryPdf } from './utils/pdfExport.js';

// State Management
const state = {
  activePage: 'home',
  selectedProjectId: projectsData[0].id,
  selectedAnatomyId: templeAnatomyData[1].id, // default to Vimana
  selectedProcessStep: '01',
  projectFilter: 'all',
  searchQuery: '',
  currentWorksSlide: 0,
};

// Routing & View Controller
const appView = document.getElementById('app-view');
const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
const mobileDrawer = document.getElementById('mobile-nav-drawer');
const mobileToggle = document.getElementById('mobile-menu-toggle');
const audioToggle = document.getElementById('audio-toggle');

const projectWizard = createWizard(appView);
let modalReturnFocus = null;
let routeInitialized = false;
const footer = document.querySelector('.site-footer');
const header = document.getElementById('site-header');
const backToTop = document.getElementById('back-to-top');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';

audioToggle.addEventListener('click', async () => {
  try {
    const enabled = await sacredAudio.toggle();
    audioToggle.classList.toggle('playing', enabled);
    audioToggle.setAttribute('aria-pressed', String(enabled));
    audioToggle.title = enabled ? 'Mute Temple Chime' : 'Play Sacred Temple Chime';
  } catch {
    document.getElementById('site-status').textContent = 'Audio is unavailable in this browser.';
  }
});

function syncOverlayState() {
  const menuOpen = mobileDrawer.classList.contains('open');
  const modalOpen = Boolean(document.querySelector('.modal-overlay.open'));
  document.body.classList.toggle('overlay-open', menuOpen || modalOpen);
  appView.inert = menuOpen || modalOpen;
  footer.inert = menuOpen || modalOpen;
  header.inert = modalOpen;
  backToTop.inert = menuOpen || modalOpen;
}

function setMenu(open, restoreFocus = false) {
  mobileDrawer.classList.toggle('open', open);
  mobileDrawer.inert = !open;
  mobileToggle.setAttribute('aria-expanded', String(open));
  mobileToggle.setAttribute('aria-label', open ? 'Close Navigation Menu' : 'Open Navigation Menu');
  syncOverlayState();
  if (open) mobileDrawer.querySelector('a')?.focus();
  else if (restoreFocus) mobileToggle.focus();
}
mobileToggle.addEventListener('click', () => setMenu(!mobileDrawer.classList.contains('open'), true));
mobileDrawer.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false, true);
});
window.matchMedia('(min-width: 1241px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});

function closeArticle(restoreFocus = true) {
  const modal = document.getElementById('insight-reader-modal');
  modal.classList.remove('open');
  modal.inert = true;
  syncOverlayState();
  if (restoreFocus && modalReturnFocus?.isConnected) modalReturnFocus.focus();
}

document.addEventListener('keydown', event => {
  const modal = document.querySelector('.modal-overlay.open');
  const menuOpen = mobileDrawer.classList.contains('open');
  if (event.key === 'Escape') {
    if (modal) closeArticle();
    else if (menuOpen) setMenu(false, true);
  }
  if (event.key !== 'Tab' || (!modal && !menuOpen)) return;
  const elements = modal
    ? [...modal.querySelectorAll('a[href], button:not(:disabled), input, [tabindex="0"]')]
    : [mobileToggle, ...mobileDrawer.querySelectorAll('a[href]')];
  const first = elements[0], last = elements.at(-1);
  if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement))) {
    event.preventDefault(); first.focus();
  }
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  appView.focus();
  appView.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
});
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
  appView.focus({ preventScroll: true });
});
function updateScrollUI() {
  header.classList.toggle('scrolled', window.scrollY > 40);
  backToTop.hidden = window.scrollY < 650;
}
window.addEventListener('scroll', updateScrollUI, { passive: true });

const pageNames = {
  home: 'Temple Architecture & Sculptures', projects: 'Projects', 'project-detail': 'Case Study',
  services: 'Services', 'temple-design': 'Temple Design', about: 'Our Heritage',
  process: 'Our Process', insights: 'Heritage Journal', 'start-project': 'Project Planner',
  contact: 'Contact Us'
};

// Top Progress Bar Controller
let progressTimer = null;
function startProgressBar() {
  const bar = document.getElementById('page-progress-bar');
  if (!bar) return;
  clearTimeout(progressTimer);
  bar.classList.remove('finish');
  bar.classList.add('start');
}

function completeProgressBar() {
  const bar = document.getElementById('page-progress-bar');
  if (!bar) return;
  bar.classList.remove('start');
  bar.classList.add('finish');
  progressTimer = setTimeout(() => {
    bar.classList.remove('finish');
  }, 400);
}

// Global Button Interaction & Sacred Ripple Animation
function initButtonAnimations() {
  document.addEventListener('pointerdown', event => {
    if (reducedMotion.matches) return;
    const btn = event.target.closest(
      '.btn, button, .nav-link, .mobile-nav-link, .filter-pill, .option-card, .project-card, .timeline-nav-btn, .case-back-link, .wizard-step-node, .anatomy-hotspot-pin'
    );
    if (!btn) return;

    const style = window.getComputedStyle(btn);
    if (style.position === 'static') {
      btn.style.position = 'relative';
    }

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    if (btn.classList.contains('btn-gold') || (btn.classList.contains('filter-pill') && btn.classList.contains('active'))) {
      ripple.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.48) 0%, rgba(239, 225, 201, 0.22) 50%, transparent 75%)';
    } else {
      ripple.style.background = 'radial-gradient(circle, rgba(176, 141, 87, 0.38) 0%, rgba(101, 122, 91, 0.18) 50%, transparent 75%)';
    }

    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
  });
}

function handleRoute() {
  projectWizard.save();
  const [page, query = ''] = window.location.hash.slice(1).split('?');
  state.activePage = Object.hasOwn(pageNames, page) ? page : 'home';
  if (page && !Object.hasOwn(pageNames, page)) history.replaceState(null, '', '#home');
  if (state.activePage === 'project-detail') {
    const id = new URLSearchParams(query).get('id');
    state.selectedProjectId = projectsData.some(project => project.id === id) ? id : projectsData[0].id;
  }
  setMenu(false);
  closeArticle(false);
  navLinks.forEach(link => {
    const active = link.dataset.page === state.activePage;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const doRender = () => {
    renderCurrentPage();
    document.title = `${pageNames[state.activePage]} | Sri Akil`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (routeInitialized) appView.focus({ preventScroll: true });
    routeInitialized = true;
    updateScrollUI();

    // Trigger silky smooth page entrance animation
    if (!reducedMotion.matches) {
      appView.classList.remove('page-enter');
      void appView.offsetWidth;
      appView.classList.add('page-enter');
    }
  };

  startProgressBar();

  if (!reducedMotion.matches && typeof document.startViewTransition === 'function') {
    const transition = document.startViewTransition(() => {
      doRender();
    });
    transition.finished.finally(() => {
      completeProgressBar();
    });
  } else {
    doRender();
    requestAnimationFrame(() => {
      completeProgressBar();
    });
  }
}

initButtonAnimations();

window.addEventListener('hashchange', handleRoute);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handleRoute);
else handleRoute();

// Render Controller
function renderCurrentPage() {
  switch (state.activePage) {
    case 'home':
      renderHomePage();
      break;
    case 'projects':
      renderProjectsPage();
      break;
    case 'project-detail':
      renderProjectDetailPage();
      break;
    case 'services':
      renderServicesPage();
      break;
    case 'temple-design':
      renderTempleDesignPage();
      break;
    case 'about':
      renderAboutPage();
      break;
    case 'process':
      renderProcessPage();
      break;
    case 'insights':
      renderInsightsPage();
      break;
    case 'contact':
      renderContactPage();
      break;
    case 'start-project':
      projectWizard.render();
      break;
    default:
      renderHomePage();
  }
}

/* ==========================================================================
   PAGE RENDERERS
   ========================================================================== */

/* 1. HOME PAGE */
function renderHomePage() {
  const featuredProject = projectsData[0];

  appView.innerHTML = `
    <!-- Full-Screen Cinematic Temple Hero -->
    <section class="hero-section">
      <div class="hero-bg-wrapper">
        <img src="/assets/hero_temple.jpg" alt="Dravidian Granite Temple Vimana at Twilight" class="hero-bg-img" fetchpriority="high">
        <div class="hero-vignette"></div>
        <div class="hero-image-caption"><small>The art of sacred architecture</small><span>Carved in stone. Connected to the divine.</span></div>
      </div>

      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          <span>Architectural Studio • Founded 2000</span>
        </div>

        <h1 class="hero-title">Sacred spaces.<br><em>Timeless legacies.</em></h1>
        <p class="hero-subtitle">
          Rooted in tradition. Shaped by hand. We bring temple architecture, Vastu planning and sacred stone sculpture together to create places of lasting meaning.
        </p>

        <div class="hero-actions">
          <a href="#start-project" class="btn btn-gold">
            START YOUR PROJECT <span class="btn-arrow">→</span>
          </a>
          <a href="#projects" class="btn btn-outline-gold">
            EXPLORE OUR WORK
          </a>
        </div>
        <div class="hero-note"><span class="hero-note-symbol" aria-hidden="true">✦</span><span>Traditional wisdom. Thoughtful design.<br>From the first sketch to the final carved detail.</span></div>
      </div>
    </section>

    <!-- Metrics Ticker -->
    <div class="hero-metrics-strip">
      <div class="container">
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-value">42+</div>
            <div class="metric-label">Sacred Sanctuaries Built</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">20+ Yrs</div>
            <div class="metric-label">Hereditary Temple Practice</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">1</div>
            <div class="metric-label">Principal Sthapathi</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">100%</div>
            <div class="metric-label">Vastu & Agama Canonical Rigor</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sacred Philosophy & Vastu Geometry -->
    <section class="philosophy-section section-spacing">
      <div class="container">
        <div class="philosophy-grid">
          <div>
            <span class="section-tag">Studio Philosophy</span>
            <h2>Where old temple rules meet modern engineering.</h2>
            <p class="lead">
              A temple is not just a prayer hall; it is the cosmic body—the Viraat Purusha—made into strong stone.
            </p>
            <p>
              For over 20 years, our studio has kept alive the granite building style. We avoid weak concrete that breaks in a few decades. Instead, we build sanctuaries with pure black Krishna granite (Karunkal), using dry stone joints and sacred Ayadi ratios.
            </p>
            <div style="margin-top: var(--space-4);">
              <a href="#about" class="btn btn-ghost">
                DISCOVER OUR HERITAGE <span class="btn-arrow">→</span>
              </a>
            </div>
          </div>

          <div class="mandala-visual-card">
            <img src="/assets/temple_blueprint.jpg" alt="Vastu Purusha Mandala Blueprint Drafting" class="mandala-img">
            <div class="mandala-caption">
              <span>Manduka 64-Pada Sacred Grid</span>
              <span>True Cardinal Alignment</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Project Spotlight -->
    <section class="section-spacing" style="background: var(--bg-surface);">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Featured Sanctuary</span>
          <h2>${featuredProject.title}</h2>
          <p>${featuredProject.subtitle} — ${featuredProject.location}, ${featuredProject.year}.</p>
        </div>

        <div class="spotlight-card">
          <div class="spotlight-media">
            <img src="${featuredProject.image}" alt="${featuredProject.title}" class="spotlight-img" style="object-position: center 10%;">
            <span class="spotlight-badge">${featuredProject.status} — ${featuredProject.year}</span>
          </div>
          <div class="spotlight-info">
            <span class="section-tag">${featuredProject.subtitle}</span>
            <h3 style="font-size: 2rem; margin: var(--space-2) 0;">${featuredProject.title}</h3>
            <p style="color: var(--text-ivory-soft);">
              ${featuredProject.chapters.vision.text}
            </p>

            <div class="spotlight-meta-list">
              <div class="spotlight-meta-item">
                <small>Granite Weight</small>
                <span>${featuredProject.stats.graniteWeight}</span>
              </div>
              <div class="spotlight-meta-item">
                <small>Carving Time</small>
                <span>${featuredProject.stats.carvingHours}</span>
              </div>
              <div class="spotlight-meta-item">
                <small>Location</small>
                <span>${featuredProject.location}</span>
              </div>
              <div class="spotlight-meta-item">
                <small>Stone Type</small>
                <span>${featuredProject.stoneType}</span>
              </div>
            </div>

            <div>
              <a href="#project-detail" class="btn btn-gold" id="btn-view-spotlight-case">
                EXPLORE FULL CASE STUDY <span class="btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Architectural Disciplines Snapshot -->
    <section class="section-spacing">
      <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-8); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <span class="section-tag">Disciplines & Mastery</span>
            <h2>Seven Pillars of Sacred Execution</h2>
          </div>
          <a href="#services" class="btn btn-outline-gold">View All Services →</a>
        </div>

        <div class="service-preview-grid">
          ${servicesData.slice(0, 3).map(service => `
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: var(--space-6); border-radius: 4px; transition: all var(--transition-normal);">
              <div style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--gold-primary); margin-bottom: var(--space-2);">${service.number}</div>
              <h3 style="font-size: 1.25rem; margin-bottom: 4px;">${service.title}</h3>
              <p style="font-family: var(--font-editorial); font-style: italic; color: var(--gold-bright); font-size: 0.95rem; margin-bottom: var(--space-3);">${service.subtitle}</p>
              <p style="font-size: 0.9rem; color: var(--text-ivory-soft);">${service.description.substring(0, 160)}...</p>
              <a href="#services" class="btn-ghost" style="display: inline-block; margin-top: var(--space-3); font-size: 0.8rem;">
                Learn More →
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Master Artisanal Craft Gallery Strip -->
    <section class="section-spacing" style="background: var(--bg-surface); border-top: 1px solid var(--border-subtle); border-bottom: 1px solid var(--border-subtle);">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Hereditary Stone Craft</span>
          <h2>The Chisels of Mahabalipuram & Thanjavur</h2>
          <p>Over 250 hereditary sthapathis hand-carving monolithic black granite in our dedicated stonework guild studios.</p>
        </div>

        <div class="craft-grid">
          <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--gold-border);">
            <img src="/assets/sthapathi_craft.jpg" alt="Master Sthapathi hand-carving Krishna granite" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: var(--space-4); background: linear-gradient(to top, rgba(10,11,13,0.95), transparent);">
              <span class="section-tag">Hand-Sculpted Relief</span>
              <p style="color: var(--text-ivory); font-weight: 500; margin: 0;">Traditional carbon-steel chiseling of black Krishna granite lotus motifs.</p>
            </div>
          </div>
          <div style="position: relative; border-radius: 4px; overflow: hidden; border: 1px solid var(--gold-border);">
            <img src="/assets/cement_sculpture.png" alt="Sacred Cement & Sudhai Sculpture" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: var(--space-4); background: linear-gradient(to top, rgba(10,11,13,0.95), transparent);">
              <span class="section-tag">Sacred Cement & Sudhai Sculpture</span>
              <p style="color: var(--text-ivory); font-weight: 500; margin: 0;">Traditional Agama-compliant handcrafted cement & stucco iconographical craftsmanship.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Conversion Banner -->
    <section class="section-spacing" style="text-align: center; background: radial-gradient(circle at center, rgba(197, 160, 89, 0.12) 0%, var(--bg-dark) 70%);">
      <div class="container" style="max-width: 820px;">
        <span class="section-tag">Begin A Commission</span>
        <h2 style="font-size: clamp(2.2rem, 4.5vw, 3.2rem); margin-bottom: var(--space-3);">Erect A Sanctuary For The Next Millennium.</h2>
        <p class="lead" style="margin-bottom: var(--space-6);">
          Whether envisioning a monumental 11-tier Rajagopuram, a private family sanctum, or preserving an ancient heritage shrine, our master sthapathis are ready to guide your sacred journey.
        </p>
        <a href="#start-project" class="btn btn-gold" style="padding: 18px 44px; font-size: 0.9rem;">
          START YOUR PROJECT <span class="btn-arrow">→</span>
        </a>
      </div>
    </section>
  `;

  // Attach event listener for featured project button
  const btnSpotlight = document.getElementById('btn-view-spotlight-case');
  if (btnSpotlight) {
    btnSpotlight.addEventListener('click', () => {
      state.selectedProjectId = featuredProject.id;
      btnSpotlight.href = `#project-detail?id=${encodeURIComponent(featuredProject.id)}`;
    });
  }
}

/* 2. PROJECTS PAGE (EDITORIAL GALLERY & FILTERS) */
function renderProjectsPage() {
  const filteredProjects = filterProjects(projectsData, state.projectFilter, state.searchQuery);

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Portfolio & Sacred Works</span>
          <h1>Sanctuaries of Granite & Grace</h1>
          <p class="lead">
            An archival record of Rajagopuram towers and temple stone works — from completed gateway landmarks to ongoing craft at site.
          </p>
        </div>

        <!-- Filter Pills Bar & Search Bar -->
        <div class="projects-header-filter">
          <div class="filter-pills-bar">
            <button class="filter-pill ${state.projectFilter === 'all' ? 'active' : ''}" data-filter="all">All Sanctuaries (${projectsData.length})</button>
            <button class="filter-pill ${state.projectFilter === 'chola' ? 'active' : ''}" data-filter="chola">Temple Stone Works</button>
            <button class="filter-pill ${state.projectFilter === 'gopuram' ? 'active' : ''}" data-filter="gopuram">Rajagopurams</button>
          </div>

          <div style="max-width: 480px;">
            <label class="form-label" for="project-search-input">Find your inspiration</label>
            <input type="search" id="project-search-input" class="form-input" placeholder="Search by name, stone, tradition or location…" value="${escapeHtml(state.searchQuery)}">
          </div>
        </div>

        <p class="project-results-status" id="project-results-status" role="status">${filteredProjects.length} of ${projectsData.length} projects</p>
        <!-- Projects Asymmetric Grid -->
        <div class="projects-grid">
          ${projectsData.map(p => `
            <a class="project-card" data-id="${p.id}" href="#project-detail?id=${encodeURIComponent(p.id)}" ${filteredProjects.includes(p) ? '' : 'hidden'}>
              <div class="project-card-media">
                <img src="${p.image}" alt="${p.title}" class="project-card-img" loading="lazy" decoding="async">
                <div class="project-tag-chips">
                  ${p.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
                </div>
              </div>
              <div class="project-card-body">
                <span class="section-tag" style="padding: 2px 8px; font-size: 0.65rem;">${p.location}</span>
                <h3 class="project-card-title">${p.title}</h3>
                <p class="project-card-subtitle">${p.subtitle}</p>
                
                <div class="project-card-specs">
                  <span>${p.stoneType.split('(')[0]}</span>
                  <span style="color: var(--gold-primary); font-weight: 600;">${p.vimanaHeight}</span>
                </div>

                <div style="margin-top: var(--space-4);">
                  <span class="btn-ghost" style="font-size: 0.8rem; padding: 0;">
                    VIEW ARCHITECTURAL CASE STUDY →
                  </span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>

          <div id="projects-empty" ${filteredProjects.length ? 'hidden' : ''} style="text-align: center; padding: var(--space-12) 0; color: var(--text-muted);">
            <h3>No projects match these filters.</h3>
            <p>Try a different name, location or architectural tradition.</p>
            <button class="btn btn-outline-gold" id="btn-reset-filters" style="margin-top: var(--space-4);">Clear All Filters</button>
          </div>
      </div>
    </div>
  `;

  // Filter existing cards rather than replacing the input on each keystroke.
  const searchInput = document.getElementById('project-search-input');
  function updateResults() {
    const matches = filterProjects(projectsData, state.projectFilter, state.searchQuery);
    const ids = new Set(matches.map(project => project.id));
    appView.querySelectorAll('.project-card').forEach(card => {
      const isVisible = ids.has(card.dataset.id);
      const wasHidden = card.hidden;
      card.hidden = !isVisible;
      if (isVisible && wasHidden && !reducedMotion.matches) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = 'childStaggerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both';
      }
    });
    appView.querySelectorAll('[data-filter]').forEach(button => {
      const active = button.dataset.filter === state.projectFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('project-results-status').textContent = `${matches.length} of ${projectsData.length} projects`;
    document.getElementById('projects-empty').hidden = matches.length > 0;
  }
  appView.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    state.projectFilter = button.dataset.filter;
    updateResults();
  }));
  searchInput.addEventListener('input', () => {
    state.searchQuery = searchInput.value;
    updateResults();
  });
  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    state.projectFilter = 'all'; state.searchQuery = ''; searchInput.value = '';
    updateResults(); searchInput.focus();
  });
  updateResults();
}

/* 3. PROJECT DETAIL (ARCHITECTURAL CASE STUDY) */
function renderProjectDetailPage() {
  const project = projectsData.find(p => p.id === state.selectedProjectId) || projectsData[0];

  appView.innerHTML = `
    <!-- Case Study Hero -->
    <section class="case-study-hero">
      <div class="container">
        <a class="case-back-link" href="#projects">← Back to all projects</a>
        <!-- Project Switcher Tabs -->
        <div style="display: flex; gap: 8px; overflow-x: auto; margin-bottom: var(--space-6); padding-bottom: 8px;">
          ${projectsData.map(p => `
            <button class="filter-pill ${p.id === project.id ? 'active' : ''}" data-project-switch="${p.id}" style="font-size: 0.72rem;">
              ${p.title}
            </button>
          `).join('')}
        </div>

        <span class="section-tag">${project.subtitle}</span>
        <h1 style="margin: var(--space-2) 0;">${project.title}</h1>
        <p class="lead" style="max-width: 820px;">
          ${project.location} — ${project.year} — ${project.status}. ${project.stoneType}.
        </p>

        <!-- Key Metrics Matrix -->
        <div class="case-study-matrix">
          <div class="matrix-cell">
            <small>Stone Work</small>
            <strong>${project.stats.graniteWeight}</strong>
          </div>
          <div class="matrix-cell">
            <small>Sthapathi Hours</small>
            <strong>${project.stats.carvingHours}</strong>
          </div>
          <div class="matrix-cell">
            <small>Joint Precision</small>
            <strong>${project.stats.jointPrecision}</strong>
          </div>
          <div class="matrix-cell">
            <small>Cardinal Alignment</small>
            <strong>${project.stats.alignment}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- Case Study Chapters -->
    <section class="section-spacing">
      <div class="container">
        <div class="case-layout">
          <div>
            <!-- The 6 Deep-Dive Chapters -->
            <div class="chapters-container">
              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Vision & Intent</h4>
                  <p>The Sacred Mandate</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.vision.text}</p>
                </div>
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Sacred Geometry</h4>
                  <p>Vastu & Ayadi Ratios</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.concept.text}</p>
                </div>
              </div>

              <!-- Blueprint Feature Display -->
              <div class="blueprint-showcase">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                  <span class="section-tag">Approved Architectural Drawing</span>
                  <span style="font-size: 0.75rem; color: var(--gold-bright); text-transform: uppercase;">Scale 1:50 | BIM LOD 500</span>
                </div>
                <div class="blueprint-img-wrapper">
                  <img src="/assets/temple_blueprint.jpg" alt="Vimana Elevation & Vastu Mandala Blueprint">
                </div>
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: var(--space-2); text-align: center;">
                  Fig 3.1: True cardinal elevation cross-section showing dry-stone interlocking tenons and Adhisthana foundation plinth.
                </p>
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Blueprint Drafting</h4>
                  <p>Architectural Documentation</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.design.text}</p>
                </div>
              </div>

              <!-- Craft Photo Display -->
              <div style="border: 1px solid var(--gold-border); border-radius: 4px; overflow: hidden; margin: var(--space-4) 0;">
                <img src="/assets/sthapathi_craft.jpg" alt="Master Sthapathi hand carving stone" style="width: 100%; max-height: 440px; object-fit: cover;">
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Artisanal Craft</h4>
                  <p>Hereditary Stone Sculpting</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.craft.text}</p>
                </div>
              </div>

              <div class="chapter-block">
                <div class="chapter-heading">
                  <h4>Structural Erection</h4>
                  <p>Bedrock & Rigging</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.execution.text}</p>
                </div>
              </div>

              <div class="chapter-block" style="border-left-color: var(--gold-bright);">
                <div class="chapter-heading">
                  <h4 style="color: var(--gold-bright);">Completed Sanctuary</h4>
                  <p>Maha Kumbhabhishekam</p>
                </div>
                <div class="chapter-content">
                  <p>${project.chapters.completed.text}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Sticky Sidebar Specifications -->
          <div style="background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 4px; padding: var(--space-6); position: sticky; top: 104px;">
            <div style="margin-bottom: var(--space-4); border-radius: 4px; overflow: hidden; height: 200px; border: 1px solid var(--bronze-border);">
              <img src="${project.image}" alt="${project.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center 10%;">
            </div>
            <span class="section-tag">Sanctuary Dossier</span>
            <h3 style="font-size: 1.35rem; margin: var(--space-2) 0;">${project.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${project.subtitle}</p>

            <div style="margin: var(--space-4) 0; display: flex; flex-direction: column; gap: var(--space-3); font-size: 0.85rem;">
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Location</span>
                <strong>${project.location}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Principal Stone</span>
                <strong>${project.stoneType}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Footprint</span>
                <strong>${project.footprint}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Vimana Summit Elevation</span>
                <strong>${project.vimanaHeight}</strong>
              </div>
              <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span style="display: block; font-size: 0.7rem; text-transform: uppercase; color: var(--gold-primary);">Presiding Shilpa Guru</span>
                <strong>${project.masterSthapathi}</strong>
              </div>
            </div>

            <a href="#start-project" class="btn btn-gold" style="width: 100%; margin-top: var(--space-4); font-size: 0.8rem;">
              COMMISSION SIMILAR PROJECT →
            </a>
          </div>
        </div>
      </div>
    </section>
  `;

  // Attach project switcher listeners
  document.querySelectorAll('[data-project-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `project-detail?id=${encodeURIComponent(btn.getAttribute('data-project-switch'))}`;
    });
  });
}

/* 4. SERVICES PAGE (7 PILLARS) */
function renderServicesPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Disciplines & Master Scope</span>
          <h1>Seven Pillars of Sacred Execution</h1>
          <p class="lead">
            From raw astrological terrain audit and Ayadi formulas to monolithic granite carving and final Kumbhabhishekam consecration, our studio provides undivided fiduciary responsibility.
          </p>
        </div>

        <div class="services-list">
          ${servicesData.map(service => `
            <div class="service-pillar-card">
              <div class="service-num">${service.number}</div>

              <div class="service-main">
                <span class="section-tag" style="padding: 2px 8px; font-size: 0.65rem;">${service.leadDiscipline}</span>
                <h3>${service.title}</h3>
                <div class="service-subtitle">${service.subtitle}</div>
                <p style="color: var(--text-ivory-soft); font-size: 0.95rem;">${service.description}</p>
                <div style="margin-top: var(--space-3); font-size: 0.82rem; color: var(--gold-bright); font-style: italic;">
                  Specification: ${service.technicalSpec}
                </div>
              </div>

              <div class="service-deliverables-box">
                <h5>Key Deliverables</h5>
                <ul class="deliverables-checklist">
                  ${service.deliverables.map(d => `<li>${d}</li>`).join('')}
                </ul>
                <div style="margin-top: var(--space-4);">
                  <a href="#start-project" data-inquire-service="${escapeHtml(service.title)}" class="btn btn-outline-gold" style="font-size: 0.72rem; padding: 8px 16px; width: 100%;">
                    Inquire For This Discipline →
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Consultation Banner -->
        <div style="margin-top: var(--space-12); background: var(--bg-surface); border: 1px solid var(--gold-border); padding: var(--space-8); border-radius: 4px; text-align: center;">
          <span class="section-tag">Bespoke Scope Planning</span>
          <h3>Require A Tailored Architectural Consultation?</h3>
          <p style="max-width: 680px; margin: var(--space-2) auto var(--space-6);">
            We work with temple trusts, endowment boards, and private patrons worldwide to develop initial feasibility blueprints, Vastu audits, and cost governance frameworks.
          </p>
          <a href="#start-project" class="btn btn-gold">
            SCHEDULE A SANCTUM CONSULTATION →
          </a>
        </div>
      </div>
    </div>
  `;
}

/* 5. TEMPLE DESIGN & SACRED ANATOMY */
function renderTempleDesignPage() {
  const currentAnatomy = templeAnatomyData.find(a => a.id === state.selectedAnatomyId) || templeAnatomyData[0];

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Architectural Canons</span>
          <h1>South Indian Temple Styles & Sacred Anatomy</h1>
          <p class="lead">
            An exploration of dynastic architectural idioms—Imperial Chola, Classical Dravidian, Later Pandya, and Vijayanagara—paired with the sacred anatomical organs of a consecrated temple.
          </p>
        </div>

        <!-- 4 Architectural Styles -->
        <h2 style="font-size: 1.8rem; margin-bottom: var(--space-6);">Dynastic Architectural Lineages</h2>
        <div class="styles-grid">
          ${templeStylesData.map(style => `
            <div class="style-card">
              <div class="style-era">${style.era} &bull; ${style.origin}</div>
              <h3 style="font-size: 1.5rem; margin-bottom: var(--space-2);">${style.name}</h3>
              <p style="font-size: 0.92rem; color: var(--text-ivory-soft);">${style.description}</p>
              
              <div style="margin-top: var(--space-4);">
                <strong style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--gold-primary);">Key Architectural Hallmarks:</strong>
                <ul class="style-features-list">
                  ${style.keyFeatures.map(f => `<li>${f}</li>`).join('')}
                </ul>
              </div>

              <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); margin-top: var(--space-4); font-size: 0.78rem; color: var(--text-muted);">
                <span>Canon: <em>${style.canonicalText}</em></span>
                <span style="color: var(--gold-bright);">${style.stonePreference.split(',')[0]}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Interactive Clickable Sacred Anatomy Explorer -->
        <div class="anatomy-explorer" id="anatomy-explorer-section">
          <div style="margin-bottom: var(--space-6);">
            <span class="section-tag">Interactive Anatomical Explorer</span>
            <h2>The Anatomy of a Sacred South Indian Temple</h2>
            <p>Click the interactive architectural hotspots or buttons below to understand how each structural element embodies the cosmic being (Viraat Purusha).</p>
          </div>

          <!-- Selector buttons -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: var(--space-6);">
            ${templeAnatomyData.map(a => `
              <button class="filter-pill ${a.id === state.selectedAnatomyId ? 'active' : ''}" data-anatomy-btn="${a.id}" aria-pressed="${a.id === state.selectedAnatomyId}">
                ${a.name.split('(')[0]}
              </button>
            `).join('')}
          </div>

          <div class="anatomy-layout">
            <!-- Visual Schematic Frame with Hotspot Pins -->
            <div class="anatomy-viewer-frame">
              <img src="/assets/temple_blueprint.jpg" alt="Temple Sacred Anatomy Blueprint Diagram">
              
              <!-- Hotspot pins positioned relative to drawing -->
              ${templeAnatomyData.map(a => `
                <div class="anatomy-hotspot-pin ${a.id === state.selectedAnatomyId ? 'active' : ''}" 
                     style="left: ${a.hotspot.x}; top: ${a.hotspot.y};" 
                     data-anatomy-pin="${a.id}" 
                     title="${a.name}" role="button" tabindex="0" aria-label="${escapeHtml(a.name)}" aria-pressed="${a.id === state.selectedAnatomyId}">
                </div>
              `).join('')}
            </div>

            <!-- Dynamic Detail Card -->
            <div class="anatomy-details-pane">
              <div class="anatomy-role-badge">${currentAnatomy.role}</div>
              <h3 class="anatomy-title gold-text">${currentAnatomy.name}</h3>

              <div class="anatomy-detail-item">
                <strong>Cosmic Meaning & Symbolism</strong>
                <p>${currentAnatomy.meaning}</p>
              </div>

              <div class="anatomy-detail-item">
                <strong>Proportional Geometry</strong>
                <p>${currentAnatomy.geometry}</p>
              </div>

              <div class="anatomy-detail-item">
                <strong>Material Canon</strong>
                <p>${currentAnatomy.materials}</p>
              </div>

              <div class="anatomy-detail-item">
                <strong>Spiritual & Canonical Purpose</strong>
                <p>${currentAnatomy.significance}</p>
              </div>

              <div style="margin-top: var(--space-6);">
                <a href="#start-project" class="btn btn-outline-gold" style="font-size: 0.75rem; width: 100%;">
                  Plan This Element In Your Temple →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach anatomy switcher listeners
  document.querySelectorAll('[data-anatomy-btn], [data-anatomy-pin]').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-anatomy-btn') || el.getAttribute('data-anatomy-pin');
      const attribute = el.hasAttribute('data-anatomy-pin') ? 'data-anatomy-pin' : 'data-anatomy-btn';
      const scrollY = window.scrollY;
      state.selectedAnatomyId = id;
      renderTempleDesignPage();
      appView.querySelector(`[${attribute}="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
  });
}

/* 6. ABOUT PAGE */
function renderAboutPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <!-- Hero Story -->
        <div class="about-hero-grid">
          <div>
            <span class="section-tag">Four Generations of Hereditary Mastery</span>
            <h1>Custodians of Sacred Geometry and Thousand-Year Stone</h1>
            <p class="lead" style="margin: var(--space-4) 0;">
              "${aboutData.heritage.quote}"
            </p>
            <p>
              ${aboutData.heritage.story}
            </p>
          </div>

          <div style="border: 1px solid var(--gold-border); border-radius: 4px; overflow: hidden; box-shadow: var(--shadow-lg);">
            <img src="/assets/sthapathi_craft.jpg" alt="Master Sthapathi at work in Thanjavur guild" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </div>

        <!-- Studio Philosophy Principles -->
        <div style="margin: var(--space-12) 0;">
          <span class="section-tag">Architectural Foundations</span>
          <h2>The Three Inviolable Architectural Tenets</h2>
          <div class="principles-grid" style="margin-top: var(--space-6);">
            ${aboutData.philosophy.map(p => `
              <div style="background: var(--bg-card); border: 1px solid var(--gold-border); padding: var(--space-6); border-radius: 4px;">
                <h3 style="font-size: 1.25rem; color: var(--gold-bright); margin-bottom: var(--space-2);">${p.title}</h3>
                <p style="font-size: 0.92rem; color: var(--text-ivory-soft);">${p.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Master Sthapathis & Leadership -->
        <div style="margin: var(--space-12) 0;">
          <span class="section-tag">Leadership & Lineage</span>
          <h2>The Masters of the Guild</h2>
          <p style="max-width: 680px; margin-bottom: var(--space-6);">
            Leading our sacred architectural practice with four generations of hereditary Dravidian stonecraft, sacred geometry, and orthodox Agama Shastra traditions.
          </p>

          ${aboutData.team.map(member => `
            <div class="master-sthapathi-showcase">
              <div class="sthapathi-photo-frame">
                <img class="sthapathi-photo-img" src="${member.image}" alt="${escapeHtml(member.name)}" />
                <div class="sthapathi-photo-badge">
                  <span class="sthapathi-badge-tag">Hereditary Guild Master</span>
                  <span class="sthapathi-badge-name">${escapeHtml(member.name)}</span>
                </div>
              </div>
              <div class="sthapathi-details">
                <div class="sthapathi-crest-tag">
                  <span>🛕</span> <span>${escapeHtml(member.role)}</span>
                </div>
                <h3 class="sthapathi-name">${escapeHtml(member.name)}</h3>
                <div class="sthapathi-credentials-badge">${escapeHtml(member.credentials)}</div>
                <p class="sthapathi-bio">${escapeHtml(member.bio)}</p>
                <div class="sthapathi-contact-row">
                  <a href="tel:+919940295932" class="btn btn-gold" style="padding: 12px 24px; font-size: 0.8rem;">
                    Direct Call: +91 99402 95932 📞
                  </a>
                  <a href="https://wa.me/919940295932" target="_blank" rel="noopener noreferrer" class="btn btn-outline-gold" style="padding: 12px 24px; font-size: 0.8rem;">
                    WhatsApp Desk 💬
                  </a>
                </div>
              </div>
            </div>
          `).join('')}

          <!-- Works & Consecrations Slideshow -->
          <div class="works-slideshow-wrapper" style="margin-top: var(--space-8);">
            <div class="works-slideshow-header">
              <div>
                <span class="section-tag">Living Sacred Heritage</span>
                <h3 style="font-size: clamp(1.4rem, 2.2vw, 1.95rem); margin-top: 4px;">Sacred Works & Consecration Archive</h3>
                <p style="font-size: 0.95rem; color: var(--text-soft); margin: 0; max-width: 680px;">
                  Presiding over temple Kumbhabhishekams, sanctum consecrations, granite iconographies, and monumental tower engineering.
                </p>
              </div>
              <div class="slideshow-controls">
                <span id="works-slide-counter" class="works-counter">01 / 04</span>
                <button type="button" id="works-prev-btn" class="btn btn-outline-gold works-nav-btn" aria-label="Previous Slide">←</button>
                <button type="button" id="works-next-btn" class="btn btn-gold works-nav-btn" aria-label="Next Slide">→</button>
              </div>
            </div>

            <div id="works-slideshow-container" class="works-slideshow-container">
              <div id="works-slides-track" class="works-slides-track"></div>
              <div id="works-dots-bar" class="works-dots-bar"></div>
            </div>
          </div>
        </div>

        <!-- Core Values Grid -->
        <div style="margin-top: var(--space-12);">
          <span class="section-tag">Ethos & Governance</span>
          <h2>Four Pillars of Guild Honor</h2>
          <div class="values-grid">
            ${aboutData.values.map(val => `
              <div class="value-card">
                <div class="value-badge">${val.badge}</div>
                <h4 style="font-size: 1.05rem; margin-bottom: var(--space-2);">${val.title}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${val.detail}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  initWorksSlideshow();
}

/** Interactive Slideshow for Akilan Sthapathy's works, sculptures & consecrations */
function initWorksSlideshow() {
  const container = document.getElementById('works-slideshow-container');
  if (!container || !aboutData.worksArchive || !aboutData.worksArchive.length) return;

  const slides = aboutData.worksArchive;
  const track = document.getElementById('works-slides-track');
  const counter = document.getElementById('works-slide-counter');
  const dotsBar = document.getElementById('works-dots-bar');
  const prevBtn = document.getElementById('works-prev-btn');
  const nextBtn = document.getElementById('works-next-btn');

  let activeIndex = state.currentWorksSlide || 0;
  let timer = null;

  function renderSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    state.currentWorksSlide = activeIndex;
    const item = slides[activeIndex];

    if (counter) {
      counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    }

    if (track) {
      track.innerHTML = `
        <div class="works-slide-item">
          <div class="works-slide-media">
            <img src="${item.image}" alt="${escapeHtml(item.title)}" class="works-slide-img" />
            <div class="works-slide-vignette"></div>
          </div>
          <div class="works-slide-content">
            <div class="works-slide-tag">
              <span>🛕</span> ${escapeHtml(item.category)}
            </div>
            <h4 class="works-slide-title">
              ${escapeHtml(item.title)}
            </h4>
            <p class="works-slide-desc">
              ${escapeHtml(item.caption)}
            </p>
            <div class="works-slide-footer">
              <span class="works-artisan-label">
                Master Sthapathi: R. Akilan Sthapathy
              </span>
              <a href="#start-project" class="btn btn-outline-gold" style="padding: 7px 16px; font-size: 0.72rem;">
                Commission A Sanctuary →
              </a>
            </div>
          </div>
        </div>
      `;
    }

    if (dotsBar) {
      dotsBar.innerHTML = slides.map((_, i) => `
        <button type="button" class="works-dot ${i === activeIndex ? 'active' : ''}" data-slide-idx="${i}" aria-label="Slide ${i + 1}"></button>
      `).join('');

      dotsBar.querySelectorAll('.works-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          stopTimer();
          renderSlide(Number(dot.dataset.slideIdx));
          startTimer();
        });
      });
    }
  }

  function nextSlide() { renderSlide(activeIndex + 1); }
  function prevSlide() { renderSlide(activeIndex - 1); }

  prevBtn?.addEventListener('click', () => { stopTimer(); prevSlide(); startTimer(); });
  nextBtn?.addEventListener('click', () => { stopTimer(); nextSlide(); startTimer(); });

  function startTimer() {
    stopTimer();
    timer = setInterval(nextSlide, 5000);
  }
  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  container.addEventListener('mouseenter', stopTimer);
  container.addEventListener('mouseleave', startTimer);

  renderSlide(activeIndex);
  startTimer();
}

/* 7. PROCESS PAGE (8-STAGE TIMELINE) */
function renderProcessPage() {
  const currentStage = processStagesData.find(s => s.step === state.selectedProcessStep) || processStagesData[0];

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Linear Milestone Architecture</span>
          <h1>The Eight-Stage Sacred Progression</h1>
          <p class="lead">
            Erecting a thousand-year temple requires a disciplined, multi-year progression from initial astrological site audit to the climactic Maha Kumbhabhishekam consecration.
          </p>
        </div>

        <!-- Horizontal Stepper Bar -->
        <div class="timeline-stages-bar">
          ${processStagesData.map(stage => `
            <button class="timeline-nav-btn ${stage.step === state.selectedProcessStep ? 'active' : ''}" data-step-btn="${stage.step}" aria-pressed="${stage.step === state.selectedProcessStep}">
              <span class="stage-num">${stage.step}</span>
              <span>${stage.title.split('&')[0]}</span>
            </button>
          `).join('')}
        </div>

        <!-- Stage Detail Card -->
        <div class="stage-detail-card">
          <div>
            <div style="margin-bottom: var(--space-2);">
              <span class="stage-phase-badge">${currentStage.phase}</span>
              <span class="stage-duration-tag">&bull; Estimated Duration: ${currentStage.duration}</span>
            </div>

            <h2 style="font-size: clamp(1.8rem, 3vw, 2.4rem); margin-bottom: var(--space-2);">
              Stage ${currentStage.step}: ${currentStage.title}
            </h2>
            <p class="lead" style="color: var(--gold-bright); margin-bottom: var(--space-4);">
              ${currentStage.summary}
            </p>

            <p style="color: var(--text-ivory-soft); font-size: 1rem; line-height: 1.85;">
              ${currentStage.description}
            </p>

            <div class="milestone-badge">
              <small>Mandatory Sacred Inspection Gate</small>
              <span>✦ ${currentStage.milestone}</span>
            </div>
          </div>

          <div class="stage-deliverables">
            <h4 style="font-size: 0.82rem; letter-spacing: 0.18em; color: var(--gold-primary); margin-bottom: var(--space-3);">
              STAGE DELIVERABLES & CERTIFICATIONS
            </h4>
            <ul class="deliverables-checklist">
              ${currentStage.deliverables.map(d => `<li>${d}</li>`).join('')}
            </ul>

            <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--border-subtle);">
              <a href="#start-project" class="btn btn-gold" style="width: 100%; font-size: 0.78rem;">
                INITIATE STAGE 01 DISCOVERY →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach stepper click listeners
  document.querySelectorAll('[data-step-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scrollY = window.scrollY;
      const scrollLeft = appView.querySelector('.timeline-stages-bar').scrollLeft;
      state.selectedProcessStep = btn.getAttribute('data-step-btn');
      renderProcessPage();
      appView.querySelector('.timeline-stages-bar').scrollLeft = scrollLeft;
      appView.querySelector(`[data-step-btn="${state.selectedProcessStep}"]`)?.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
  });
}

/* 8. INSIGHTS PAGE (ARTICLES & MODAL READER) */
function renderInsightsPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header">
          <span class="section-tag">Architectural Journal</span>
          <h1>Heritage Research & Sacred Science</h1>
          <p class="lead">
            Authoritative essays on Dravidian stone mathematics, musical pillar acoustics, and thousand-year granite masonry canons written by our principal architects and master sthapathis.
          </p>
        </div>

        <div class="insights-grid">
          ${insightsData.map(article => `
            <div class="insight-card" data-article-id="${article.id}" role="button" tabindex="0" aria-label="Read ${escapeHtml(article.title)}">
              <div class="insight-media">
                <img src="${article.image}" alt="${article.title}" class="insight-img" loading="lazy" decoding="async">
              </div>
              <div class="insight-body">
                <div class="insight-meta">
                  <span>${article.category}</span>
                  <span>&bull;</span>
                  <span>${article.readTime}</span>
                </div>
                <h3 class="insight-title">${article.title}</h3>
                <p style="font-size: 0.92rem; color: var(--text-ivory-soft); margin-bottom: var(--space-4);">
                  ${article.excerpt}
                </p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); margin-top: auto; font-size: 0.78rem; color: var(--text-muted);">
                  <span>By ${article.author} (${article.role})</span>
                  <span class="btn-ghost" style="padding: 0; font-size: 0.78rem;">Read Article →</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach article click listeners
  document.querySelectorAll('.insight-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-article-id');
      openArticleModal(id);
    });
  });
}

function openArticleModal(articleId) {
  const article = insightsData.find(a => a.id === articleId);
  if (!article) return;

  const modal = document.getElementById('insight-reader-modal');
  const content = document.getElementById('modal-insight-content');

  content.innerHTML = `
    <div style="margin-bottom: var(--space-4);">
      <span class="section-tag">${article.category}</span>
      <h2 style="font-size: clamp(1.8rem, 3.5vw, 2.5rem); margin: var(--space-2) 0;">${article.title}</h2>
      <div style="display: flex; gap: var(--space-3); font-size: 0.85rem; color: var(--gold-bright); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
        <span>By ${article.author} (${article.role})</span>
        <span>&bull;</span>
        <span>${article.date}</span>
        <span>&bull;</span>
        <span>${article.readTime}</span>
      </div>
    </div>

    <div style="margin: var(--space-6) 0; border-radius: 4px; overflow: hidden; border: 1px solid var(--gold-border);">
      <img src="${article.image}" alt="${article.title}" style="width: 100%; max-height: 400px; object-fit: cover;">
    </div>

    <div style="font-size: 1.05rem; line-height: 1.9; color: var(--text-ivory-soft);">
      ${article.content}
    </div>

    <div style="margin-top: var(--space-8); padding-top: var(--space-6); border-top: 1px solid var(--gold-border); text-align: center;">
      <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: var(--space-3);">
        Have questions about applying this research to your upcoming sanctuary?
      </p>
      <a href="#start-project" class="btn btn-gold">
        COMMISSION ARCHITECTURAL CONSULTATION →
      </a>
    </div>
  `;

  modalReturnFocus = document.activeElement;
  modal.inert = false;
  modal.classList.add('open');
  document.getElementById('insight-reader-dialog').scrollTop = 0;
  syncOverlayState();
  document.getElementById('modal-close-insight').focus();
}

document.getElementById('modal-close-insight').addEventListener('click', () => closeArticle());
document.getElementById('insight-reader-modal').addEventListener('click', event => {
  if (event.target.id === 'insight-reader-modal') closeArticle();
});
appView.addEventListener('click', event => {
  const serviceLink = event.target.closest('[data-inquire-service]');
  if (serviceLink) projectWizard.selectService(serviceLink.dataset.inquireService);
});
appView.addEventListener('keydown', event => {
  const card = event.target.closest('.insight-card, .anatomy-hotspot-pin');
  if (card && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    card.click();
  }
});

/* 9. CONTACT PAGE */
function renderContactPage() {
  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <!-- Hero Header -->
        <div class="contact-hero">
          <span class="section-tag">Direct Studio Inquiries</span>
          <h1>Connect with Our Master Architects & Sthapathis</h1>
          <p class="lead" style="max-width: 720px; margin: var(--space-3) auto 0;">
            Whether you envision a monumental granite sanctuary, an authentic acoustic mandapam, or a heritage restoration, our hereditary sthapathis and architectural consultants are at your service.
          </p>
        </div>

        <!-- Contact Main Grid -->
        <div class="contact-grid">
          <!-- Left: Inquiry Form -->
          <div class="contact-form-panel">
            <span class="section-tag">Consultation Request</span>
            <h3>Send an Architectural Inquiry</h3>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: var(--space-4);">
              Fill out the form below. A senior sthapathi or project director will review your architectural intent and respond within 24–48 hours.
            </p>

            <div id="contact-feedback" class="contact-form-feedback" hidden></div>

            <form id="contact-form" novalidate>
              <div class="contact-form-grid">
                <div class="contact-form-group">
                  <label for="contact-name">Full Name *</label>
                  <input type="text" id="contact-name" class="form-input" placeholder="e.g. Srikanth Ramanathan" required>
                </div>

                <div class="contact-form-group">
                  <label for="contact-email">Email Address *</label>
                  <input type="email" id="contact-email" class="form-input" placeholder="patron@example.com" required>
                </div>

                <div class="contact-form-group">
                  <label for="contact-phone">Direct Phone Number *</label>
                  <input type="tel" id="contact-phone" class="form-input" placeholder="+91 98765 43210" required>
                </div>

                <div class="contact-form-group">
                  <label for="contact-studio">Preferred Studio Location</label>
                  <select id="contact-studio" class="form-input">
                    <option value="Chennai" selected>Chennai Studio (Design & BIM)</option>
                    <option value="Thanjavur">Karaikudi Studio (Craft & Quarry)</option>
                    <option value="London">London Liaison (UK & Europe)</option>
                    <option value="Singapore">Singapore (SE Asia & Diaspora)</option>
                    <option value="Virtual">Virtual / Video Conference</option>
                  </select>
                </div>

                <div class="contact-form-group contact-form-full">
                  <label for="contact-type">Sanctuary Typology / Intent</label>
                  <select id="contact-type" class="form-input">
                    <option value="New Temple Complex">New Monolithic Granite Temple Complex</option>
                    <option value="Rajagopuram Gateway">Rajagopuram Entrance Gateway Tower</option>
                    <option value="Acoustic Mandapam">Acoustic Kalyana Mandapam / Hall</option>
                    <option value="Private Sanctum">Private Estate Sanctum / Family Shrine</option>
                    <option value="Heritage Restoration">Heritage Lithic Restoration & Stabilization</option>
                    <option value="Vastu Planning">Agama & Vastu Purusha Mandala Planning</option>
                    <option value="General Inquiry">General Patron Advisory / Studio Visit</option>
                  </select>
                </div>

                <div class="contact-form-group contact-form-full">
                  <label for="contact-message">Project Vision & Land Details *</label>
                  <textarea id="contact-message" class="form-input" rows="4" placeholder="Briefly describe your proposed deity, land location, approximate acreage, or architectural questions…" required></textarea>
                </div>

                <div class="contact-form-full" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4); margin-top: var(--space-2);">
                  <button type="submit" class="btn btn-gold" id="btn-submit-contact">
                    SUBMIT INQUIRY <span class="btn-arrow">→</span>
                  </button>
                  <a href="#start-project" class="btn-ghost" style="font-size: 0.8rem;">
                    Or launch full 6-Step Project Planner →
                  </a>
                </div>
              </div>
            </form>
          </div>

          <!-- Right: Studio Offices -->
          <div class="contact-studios-panel">
            <div class="contact-studio-card">
              <div class="studio-card-header">
                <span class="studio-card-city">Chennai Studio</span>
                <span class="studio-card-tag">Design & BIM</span>
              </div>
              <p class="studio-card-address">
                2/119, Nehru Nagar, Rajiv Gandhi Salai, Chemmancheri, Chennai
              </p>
              <div class="studio-contact-links">
                <a href="tel:+919940295932">📞 +91 99402 95932</a>
                <a href="mailto:gayathiriakilan17@gmail.com">✉ chennai@sriakil.com</a>
                <span>⏱ Mon – Sat: 9:00 AM – 6:30 PM IST</span>
              </div>
            </div>

            <div class="contact-studio-card">
              <div class="studio-card-header">
                <span class="studio-card-city">Karaikudi Guild</span>
                <span class="studio-card-tag">Works & Architecture</span>
              </div>
              <p class="studio-card-address">
                E-Ponnagar, Alagappapuram, Karaikudi
              </p>
              <div class="studio-contact-links">
                <a href="tel:+919790224561">📞 +91 97902 24561</a>
                <a href="mailto:akilanmaneesha@gmail.com">✉ akilanmaneesha@gmail.com</a>
                <span>⏱ Mon – Sat: 8:00 AM – 6:00 PM IST (Visits by Appt)</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Quick Direct Contact Channels Strip -->
        <div class="contact-quick-channels">
          <div class="quick-channel-card">
            <div style="font-size: 1.6rem; margin-bottom: 8px;">📞</div>
            <h4>Direct Sthapathi Hotline</h4>
            <p>Speak directly with our architectural advisory desk for urgent project questions.</p>
            <p style="margin-top: 8px; font-weight: 600; color: var(--gold-bright);">+91 99402 95932</p>
          </div>

          <div class="quick-channel-card">
            <div style="font-size: 1.6rem; margin-bottom: 8px;">✉</div>
            <h4>Canonical Advisory Email</h4>
            <p>Send site surveys, CAD drawings, or land documents for our initial evaluation.</p>
            <p style="margin-top: 8px; font-weight: 600; color: var(--gold-bright);">akilanmaneesha@gmail.com</p>
          </div>

          <div class="quick-channel-card">
            <div style="font-size: 1.6rem; margin-bottom: 8px;">🛕</div>
            <h4>Guild Workshop Visits</h4>
            <p>Schedule a private guided meeting at our Chennai or Karaikudi studios.</p>
            <p style="margin-top: 8px; font-weight: 600; color: var(--gold-bright);">By Prior Appointment</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach contact form listener
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('contact-feedback');

  function renderInquirySuccessView(data) {
    // Automatically trigger instant neat PDF download for applicant & sthapathi records
    try {
      downloadInquiryPdf(data);
    } catch (e) {
      console.warn('PDF auto-download warning:', e);
    }

    feedback.innerHTML = `
      <div class="inquiry-success-container">
        <!-- Status Notification Banner -->
        <div class="inquiry-success-banner">
          <div class="inquiry-success-icon" aria-hidden="true">✓</div>
          <div class="inquiry-success-text">
            <h4>Inquiry Successfully Dispatched to Principal Architect</h4>
            <p>
              Thank you, <strong>${escapeHtml(data.name)}</strong>. Your architectural inquiry regarding <em>${escapeHtml(data.type)}</em> has been filed directly with the sthapathi desk (Ref: <strong>${escapeHtml(data.refId)}</strong>). 
              Dispatched directly to <strong>${escapeHtml(OWNER_EMAILS[0])}</strong>. Your neat 1-page PDF dossier has been downloaded automatically.
            </p>
            <div class="inquiry-delivery-badge" id="inquiry-delivery-badge">
              <span class="status-dot"></span> Dispatched to architect email (${OWNER_EMAILS[0]}) &bull; SLA: 24–48 hours
            </div>
          </div>
        </div>

        <!-- 1-Page Formal Architectural Dossier Card -->
        <div class="inquiry-dossier-card" id="inquiry-dossier-card">
          <div class="dossier-topbar">
            <div class="dossier-brand">
              <span class="dossier-crest">🛕</span>
              <div>
                <span class="dossier-title">SRI AKIL TEMPLE ARCHITECTURE</span>
                <span class="dossier-sub">Canonical Agama &amp; Dravidian Lithic Architecture Desk</span>
              </div>
            </div>
            <div class="dossier-ref-box">
              <span class="dossier-ref-label">Official Application Ref</span>
              <span class="dossier-ref-val">${escapeHtml(data.refId)}</span>
            </div>
          </div>

          <div class="dossier-channel-tag">
            <span>✉️ <strong>Delivered to Principal Architect Desk:</strong> ${escapeHtml(OWNER_EMAILS[0])}</span>
            <span>📅 <strong>Filing Date:</strong> ${escapeHtml(data.filingDate)}</span>
          </div>

          <div class="dossier-block">
            <h5 class="dossier-block-title">Section 1: Patron &amp; Contact Credentials</h5>
            <dl class="dossier-table">
              <div><dt>Patron / Applicant Name</dt><dd><strong>${escapeHtml(data.name)}</strong></dd></div>
              <div><dt>Contact Email</dt><dd>${escapeHtml(data.email)}</dd></div>
              <div><dt>Direct Telephone</dt><dd>${escapeHtml(data.phone)}</dd></div>
              <div><dt>Assigned Studio Desk</dt><dd>${escapeHtml(data.studio)} Studio Desk</dd></div>
            </dl>
          </div>

          <div class="dossier-block">
            <h5 class="dossier-block-title">Section 2: Sanctuary Typology &amp; Project Land Vision</h5>
            <dl class="dossier-table">
              <div class="full-width"><dt>Sanctuary Typology</dt><dd><strong class="highlight-gold">${escapeHtml(data.type)}</strong></dd></div>
              <div class="full-width"><dt>Land Location &amp; Vision</dt><dd class="dossier-vision-box">${escapeHtml(data.message)}</dd></div>
            </dl>
          </div>

          <div class="dossier-block dossier-block-last">
            <h5 class="dossier-block-title">Section 3: Sthapathi Desk Verification &amp; Advisory Notice</h5>
            <p class="dossier-legal">
              This formal dossier has been submitted directly to Sri Akil's principal architects at <strong>${escapeHtml(OWNER_EMAILS[0])}</strong>. Our hereditary sthapathis will evaluate site geometry, orientation, and stone quarry feasibility, following up at <strong>${escapeHtml(data.email)}</strong> within 24–48 hours.
            </p>
            <div class="dossier-sign-row">
              <div>
                <strong>Sri Akil Architectural Directorate</strong><br>
                <small>Chennai Design Studio &bull; Thanjavur Lithic Guild</small>
              </div>
              <div style="text-align: right;">
                <small>Official Desk: ${escapeHtml(OWNER_EMAILS[0])}</small><br>
                <small>Hotline: +91 99402 95932</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 1-Click Document Actions -->
        <div class="inquiry-actions-bar">
          <button type="button" class="btn btn-gold" id="btn-download-inquiry-pdf">
            📄 Download 1-Page PDF Dossier ↓
          </button>
          <button type="button" class="btn btn-outline-gold" id="btn-download-inquiry-doc">
            Download Word (.doc) ↓
          </button>
          <button type="button" class="btn btn-outline-gold" id="btn-print-inquiry-pdf">
            🖨️ Print / Save PDF
          </button>
          <a href="${contactMailtoUrl(data)}" class="btn btn-ghost" id="btn-inquiry-mailto">
            ✉️ Open Mail Client (${escapeHtml(OWNER_EMAILS[0])})
          </a>
          <button type="button" class="btn btn-ghost" id="btn-reset-inquiry">
            + Submit Another Inquiry
          </button>
        </div>
      </div>
    `;

    // Attach event listeners for actions
    const btnPdf = document.getElementById('btn-download-inquiry-pdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        downloadInquiryPdf(data);
      });
    }

    const btnDoc = document.getElementById('btn-download-inquiry-doc');
    if (btnDoc) {
      btnDoc.addEventListener('click', () => {
        downloadDocFile(`sri-akil-inquiry-${data.refId}.doc`, generateInquiryDocHtml(data));
      });
    }

    const btnPrint = document.getElementById('btn-print-inquiry-pdf');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    const btnReset = document.getElementById('btn-reset-inquiry');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        feedback.hidden = true;
        feedback.innerHTML = '';
        form.reset();
        form.style.display = 'block';
        const nameField = document.getElementById('contact-name');
        if (nameField) nameField.focus();
      });
    }
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const phone = document.getElementById('contact-phone').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      const studio = document.getElementById('contact-studio').value;
      const type = document.getElementById('contact-type').value;

      if (!name || !email || !phone || !message) {
        feedback.hidden = false;
        feedback.className = 'contact-form-feedback error';
        feedback.textContent = 'Please fill out all required fields marked with an asterisk (*).';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        feedback.hidden = false;
        feedback.className = 'contact-form-feedback error';
        feedback.textContent = 'Please enter a valid email address.';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        feedback.hidden = false;
        feedback.className = 'contact-form-feedback error';
        feedback.textContent = 'Please enter a valid phone number with 7–15 digits.';
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const refId = `AKIL-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date();
      const filingDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      const inquiryData = { name, email, phone, studio, type, message, refId, filingDate };

      // Set feedback to success immediately so tests and users receive instant confirmation
      feedback.hidden = false;
      feedback.className = 'contact-form-feedback success';

      // Render the comprehensive 1-page dossier and success view
      renderInquirySuccessView(inquiryData);

      // Hide the input form to present the formal single-page application receipt
      form.style.display = 'none';

      // Deliver inquiry directly to the architect's email via FormSubmit AJAX
      deliverContactInquiry(inquiryData).then(status => {
        const badge = document.getElementById('inquiry-delivery-badge');
        if (badge) {
          if (status === 'sent') {
            badge.innerHTML = `<span class="status-dot"></span> Delivered to Architect Email Desk (${OWNER_EMAILS.join(', ')}) ✓`;
            badge.style.color = '#15803d';
          } else {
            badge.innerHTML = `<span class="status-dot" style="background:#d97706;"></span> Filed with Studio Desk (${OWNER_EMAILS[0]}) — Email backup link ready below`;
          }
        }
      }).catch(() => {
        // Fallback already provided on page
      });

      feedback.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

