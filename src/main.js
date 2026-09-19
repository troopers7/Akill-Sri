import { projectsData } from './data/projectsData.js';
import { templeStylesData, templeAnatomyData } from './data/templeDesignData.js';
import { servicesData } from './data/servicesData.js';
import { aboutData } from './data/aboutData.js';
import { processStagesData } from './data/processData.js';
import { insightsData } from './data/insightsData.js';
import { sacredAudio } from './utils/audio.js';
import { escapeHtml, filterProjects } from './utils/planner.js';
import { createWizard } from './utils/wizard.js';

// State Management
const state = {
  activePage: 'home',
  selectedProjectId: projectsData[0].id,
  selectedAnatomyId: templeAnatomyData[1].id, // default to Vimana
  selectedProcessStep: '01',
  projectFilter: 'all',
  searchQuery: '',
  wizard: {
    currentStep: 1,
    totalSteps: 6,
    category: 'New Temple Complex',
    location: 'Domestic India (Tamil Nadu / Karnataka / AP)',
    acreage: '2.5 Acres',
    style: 'Imperial Chola Monolithic Granite',
    deity: 'Lord Shiva (Mahadeva)',
    footprint: '25,000 sq.ft Sanctum & Prakaram',
    stone: 'Dense Black Krishna Granite (Karunkal)',
    services: ['Architecture & Master Planning', 'Agama & Ayadi Calculations', 'Traditional Stone Craft & Masonry', 'Turnkey Consecration Execution'],
    patronName: '',
    trustName: '',
    email: '',
    phone: '',
    notes: '',
    uploadedFileName: ''
  }
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
  process: 'Our Process', insights: 'Heritage Journal', 'start-project': 'Project Planner'
};
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
  renderCurrentPage();
  document.title = `${pageNames[state.activePage]} | Sri Akil`;
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (routeInitialized) appView.focus({ preventScroll: true });
  routeInitialized = true;
  updateScrollUI();
}

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
            <div class="metric-value">1,000 Yrs</div>
            <div class="metric-label">Engineered Granite Lifespan</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">14</div>
            <div class="metric-label">Master Sthapathis & Architects</div>
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
              For almost 25 years, our studio has kept alive the granite building style. We avoid weak concrete that breaks in a few decades. Instead, we build sanctuaries with pure black Krishna granite (Karunkal), using dry stone joints and sacred Ayadi ratios.
            </p>
            <div style="margin-top: var(--space-4);">
              <a href="#about" class="btn btn-ghost">
                DISCOVER OUR HERITAGE & STHAPATHIS <span class="btn-arrow">→</span>
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
          <h2>The Monolithic Shiva Vimana</h2>
          <p>An Imperial Chola masterpiece constructed from 18,400 metric tonnes of virgin Krishna granite, consecrated in the sacred Kaveri delta.</p>
        </div>

        <div class="spotlight-card">
          <div class="spotlight-media">
            <img src="/assets/hero_temple.jpg" alt="${featuredProject.title}" class="spotlight-img">
            <span class="spotlight-badge">Consecrated 2024</span>
          </div>
          <div class="spotlight-info">
            <span class="section-tag">${featuredProject.subtitle}</span>
            <h3 style="font-size: 2rem; margin: var(--space-2) 0;">${featuredProject.title}</h3>
            <p style="color: var(--text-ivory-soft);">
              Built strictly to 10th-century Chola architectural canons codified in the Kamika Agama. Monolithic dry-stone interlocking joints with a 42-tonne capstone placed at an elevation of 108 feet.
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
            <img src="/assets/mandapam_hall.jpg" alt="Acoustic 100-Pillar Mandapam" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: var(--space-4); background: linear-gradient(to top, rgba(10,11,13,0.95), transparent);">
              <span class="section-tag">Acoustic Engineering</span>
              <p style="color: var(--text-ivory); font-weight: 500; margin: 0;">Colonnaded hypostyle hall with resonant columns and carved Yali figures.</p>
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
            An archival monograph of monumental Dravidian vimanas, sky-scraping rajagopurams, acoustic kalyana mandapams, and heritage lithic restorations.
          </p>
        </div>

        <!-- Filter Pills Bar & Search Bar -->
        <div class="projects-header-filter">
          <div class="filter-pills-bar">
            <button class="filter-pill ${state.projectFilter === 'all' ? 'active' : ''}" data-filter="all">All Sanctuaries (${projectsData.length})</button>
            <button class="filter-pill ${state.projectFilter === 'chola' ? 'active' : ''}" data-filter="chola">Imperial Chola Vimanas</button>
            <button class="filter-pill ${state.projectFilter === 'gopuram' ? 'active' : ''}" data-filter="gopuram">Rajagopurams</button>
            <button class="filter-pill ${state.projectFilter === 'mandapam' ? 'active' : ''}" data-filter="mandapam">Stone Mandapams</button>
            <button class="filter-pill ${state.projectFilter === 'private' ? 'active' : ''}" data-filter="private">Private Sanctums</button>
            <button class="filter-pill ${state.projectFilter === 'restoration' ? 'active' : ''}" data-filter="restoration">Heritage Restorations</button>
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
    appView.querySelectorAll('.project-card').forEach(card => { card.hidden = !ids.has(card.dataset.id); });
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
          An exhaustive architectural monograph detailing the sacred intent, Vastu Purusha Mandala geometry, monolithic quarrying, and hydraulic structural erection.
        </p>

        <!-- Key Metrics Matrix -->
        <div class="case-study-matrix">
          <div class="matrix-cell">
            <small>Granite Mass</small>
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
            Our multidisciplinary practice combines hereditary Shilpi guildmasters with internationally acclaimed architects from CEPT and Harvard GSD.
          </p>

          <div class="team-grid">
            ${aboutData.team.map(member => `
              <div class="team-card">
                <div class="team-card-role">${member.role}</div>
                <h3 style="font-size: 1.45rem; margin-bottom: 2px;">${member.name}</h3>
                <div class="team-credentials">${member.credentials}</div>
                <p style="font-size: 0.9rem; color: var(--text-ivory-soft); margin: 0;">${member.bio}</p>
              </div>
            `).join('')}
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

/* 9. START YOUR PROJECT (MULTI-STEP WIZARD) */
function renderStartProjectPage() {
  const { currentStep, totalSteps } = state.wizard;
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container">
        <div class="section-header" style="max-width: 820px;">
          <span class="section-tag">Sanctuary Commissioning Wizard</span>
          <h1>Start Your Sacred Project</h1>
          <p class="lead">
            A guided architectural discovery ledger to calibrate temple category, geographic coordinates, stone preferences, and sacred deity requirements.
          </p>
        </div>

        <div class="wizard-container">
          <!-- Main Form Step Panel -->
          <div class="wizard-main-panel">
            <!-- Progress Tracker -->
            <div class="wizard-progress-bar-container">
              <div class="wizard-steps-indicator">
                ${[1, 2, 3, 4, 5, 6].map(step => `
                  <div class="wizard-step-node ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}" data-goto-step="${step}">
                    <div class="wizard-step-circle">${step < currentStep ? '✓' : step}</div>
                    <span>Step 0${step}</span>
                  </div>
                `).join('')}
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${progressPercent}%;"></div>
              </div>
            </div>

            <!-- Dynamic Step Content Form -->
            <form id="wizard-form" onsubmit="event.preventDefault();">
              ${renderWizardStepContent(currentStep)}

              <!-- Navigation Controls -->
              <div class="wizard-nav-actions">
                ${currentStep > 1 ? `
                  <button type="button" class="btn btn-outline-gold" id="btn-wizard-prev">
                    ← Previous Step
                  </button>
                ` : `<div></div>`}

                ${currentStep < totalSteps ? `
                  <button type="button" class="btn btn-gold" id="btn-wizard-next">
                    Continue to Step 0${currentStep + 1} →
                  </button>
                ` : `
                  <button type="submit" class="btn btn-gold" id="btn-wizard-submit">
                    SUBMIT SACRED COMMISSION DOSSIER →
                  </button>
                `}
              </div>
            </form>
          </div>

          <!-- Live Dynamic Summary Sidebar -->
          <div class="wizard-summary-panel">
            <div class="summary-heading">
              <h4>COMMISSION DOSSIER SUMMARY</h4>
            </div>

            <div class="summary-item">
              <small>Temple Typology</small>
              <span>${state.wizard.category}</span>
            </div>

            <div class="summary-item">
              <small>Location & Terrain</small>
              <span>${state.wizard.location}</span>
            </div>

            <div class="summary-item">
              <small>Architectural Tradition</small>
              <span>${state.wizard.style}</span>
            </div>

            <div class="summary-item">
              <small>Presiding Deity</small>
              <span>${state.wizard.deity}</span>
            </div>

            <div class="summary-item">
              <small>Sanctum Footprint</small>
              <span>${state.wizard.footprint}</span>
            </div>

            <div class="summary-item">
              <small>Preferred Lithic Medium</small>
              <span>${state.wizard.stone.split('(')[0]}</span>
            </div>

            <div class="summary-item">
              <small>Disciplines Requested</small>
              <span style="font-size: 0.82rem; color: var(--gold-bright);">${state.wizard.services.length} Selected</span>
            </div>

            <div class="dossier-seal-badge">
              <span>✦</span>
              <span>Audited under Agama & Mayamata Standards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachWizardEventListeners();
}

function renderWizardStepContent(step) {
  switch (step) {
    case 1:
      return `
        <h3>01 / Select Sacred Project Category</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">What nature of sacred sanctuary are you planning to commission?</p>
        
        <div class="options-grid">
          ${[
            { title: 'New Temple Complex', desc: 'Monumental standalone temple campus with Vimana, Gopuram, and Prakarams.' },
            { title: 'Private Family Sanctum', desc: 'Intimate bespoke stone shrine for private estate or rural retreat.' },
            { title: 'Rajagopuram Gateway', desc: 'Towering multi-tier entrance gateway addition to an existing sanctuary.' },
            { title: 'Acoustic Stone Mandapam', desc: 'Pillared wedding pavilion or Carnatic music hall with musical columns.' },
            { title: 'Heritage Restoration', desc: 'Lithic conservation, salt desiccation, and structural stabilization.' },
            { title: 'Agama Master Planning Only', desc: 'Vastu Purusha Mandala layout and Ayadi calculations documentation.' }
          ].map(opt => `
            <div class="option-card ${state.wizard.category === opt.title ? 'selected' : ''}" data-select-category="${opt.title}">
              <h4>${opt.title}</h4>
              <p>${opt.desc}</p>
            </div>
          `).join('')}
        </div>
      `;

    case 2:
      return `
        <h3>02 / Geographic Location & Terrain</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Where is the sacred land situated?</p>
        
        <div class="form-group">
          <label class="form-label">Geographic Region</label>
          <select class="form-select" id="wizard-input-location">
            <option value="Domestic India (Tamil Nadu / Kaveri Delta)" ${state.wizard.location.includes('Tamil Nadu') ? 'selected' : ''}>Domestic India (Tamil Nadu / Kaveri Delta)</option>
            <option value="Domestic India (Karnataka / Andhra / Telangana)" ${state.wizard.location.includes('Karnataka') ? 'selected' : ''}>Domestic India (Karnataka / Andhra / Telangana)</option>
            <option value="Domestic India (Northern / Western States)" ${state.wizard.location.includes('Northern') ? 'selected' : ''}>Domestic India (Northern / Western States)</option>
            <option value="North America (USA & Canada)" ${state.wizard.location.includes('USA') ? 'selected' : ''}>North America (USA & Canada)</option>
            <option value="Europe & United Kingdom" ${state.wizard.location.includes('Europe') ? 'selected' : ''}>Europe & United Kingdom</option>
            <option value="Southeast Asia & Singapore" ${state.wizard.location.includes('Singapore') ? 'selected' : ''}>Southeast Asia & Singapore</option>
            <option value="Australia & Middle East" ${state.wizard.location.includes('Australia') ? 'selected' : ''}>Australia & Middle East</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Available Land Acreage / Plot Dimensions</label>
          <input type="text" class="form-input" id="wizard-input-acreage" placeholder="e.g. 5 Acres, or 120 x 180 feet" value="${state.wizard.acreage}">
        </div>
      `;

    case 3:
      return `
        <h3>03 / Architectural Tradition & Presiding Deity</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Specify the canonical style and sacred deity.</p>

        <div class="form-group">
          <label class="form-label">Architectural Dynasty & Tradition</label>
          <select class="form-select" id="wizard-input-style">
            <option value="Imperial Chola Monolithic Granite" ${state.wizard.style.includes('Chola') ? 'selected' : ''}>Imperial Chola (Monumental Granite Vimana, Brihadeeswara proportions)</option>
            <option value="Classical Dravidian" ${state.wizard.style.includes('Classical') ? 'selected' : ''}>Classical Dravidian (Octagonal Shikhara, Balanced Gopurams)</option>
            <option value="Later Pandya Style" ${state.wizard.style.includes('Pandya') ? 'selected' : ''}>Later Pandya (Sky-scraping Rajagopurams, curved roll cornices)</option>
            <option value="Vijayanagara & Nayaka Tradition" ${state.wizard.style.includes('Vijayanagara') ? 'selected' : ''}>Vijayanagara (Acoustic musical pillars, grand mandapams)</option>
            <option value="Contemporary Heritage Fusion" ${state.wizard.style.includes('Contemporary') ? 'selected' : ''}>Contemporary Heritage Fusion</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Presiding Deity (Moolavar)</label>
          <input type="text" class="form-input" id="wizard-input-deity" placeholder="e.g. Lord Shiva, Sri Venkateswara, Lord Murugan, Maha Devi, etc." value="${state.wizard.deity}">
        </div>
      `;

    case 4:
      return `
        <h3>04 / Sizing & Stone Medium</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Define the scale and sacred stone choice.</p>

        <div class="form-group">
          <label class="form-label">Estimated Built Footprint (sq. ft.)</label>
          <select class="form-select" id="wizard-input-footprint">
            <option value="Under 5,000 sq.ft (Private / Compact Shrine)" ${state.wizard.footprint.includes('Under 5,000') ? 'selected' : ''}>Under 5,000 sq.ft (Private / Compact Shrine)</option>
            <option value="5,000 – 15,000 sq.ft (Medium Community Sanctuary)" ${state.wizard.footprint.includes('5,000 – 15,000') ? 'selected' : ''}>5,000 – 15,000 sq.ft (Medium Community Sanctuary)</option>
            <option value="15,000 – 40,000 sq.ft (Monumental Temple Complex)" ${state.wizard.footprint.includes('15,000 – 40,000') ? 'selected' : ''}>15,000 – 40,000 sq.ft (Monumental Temple Complex)</option>
            <option value="Over 40,000 sq.ft (Grand Regional Pilgrimage Sanctuary)" ${state.wizard.footprint.includes('Over 40,000') ? 'selected' : ''}>Over 40,000 sq.ft (Grand Regional Pilgrimage Sanctuary)</option>
          </select>
        </div>

        <label class="form-label" style="margin-top: var(--space-4);">Preferred Stone Medium</label>
        <div class="options-grid">
          ${[
            { title: 'Black Krishna Granite (Karunkal)', desc: 'Supreme hardness (Mohs 7), acoustically resonant, 1,000-year durability.' },
            { title: 'Warm Golden Sandstone', desc: 'Warm ivory-gold hues, fine detail carving, ideal for arid climates.' },
            { title: 'Tawny Grey Granite', desc: 'Resilient plutonic stone, subtle crystalline flecks, ideal for mandapams.' },
            { title: 'White Teak Marble', desc: 'Pristine translucency for sanctum floor inlays and decorative screens.' }
          ].map(s => `
            <div class="option-card ${state.wizard.stone.includes(s.title.split('(')[0].trim()) ? 'selected' : ''}" data-select-stone="${s.title}">
              <h4>${s.title}</h4>
              <p>${s.desc}</p>
            </div>
          `).join('')}
        </div>
      `;

    case 5:
      return `
        <h3>05 / Scope of Architectural Services</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Select all disciplines you require from our studio.</p>

        <div class="options-grid">
          ${servicesData.map(serv => {
            const isSelected = state.wizard.services.includes(serv.title);
            return `
              <div class="option-card ${isSelected ? 'selected' : ''}" data-toggle-service="${serv.title}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h4>${serv.title}</h4>
                  <span style="color: var(--gold-bright); font-size: 0.9rem;">${isSelected ? '✓' : '+'}</span>
                </div>
                <p>${serv.subtitle}</p>
              </div>
            `;
          }).join('')}
        </div>
      `;

    case 6:
      return `
        <h3>06 / Patron Details & Reference Upload</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Complete your dossier for our Chief Sthapathi's initial review.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <div class="form-group">
            <label class="form-label">Patron / Trustee Name *</label>
            <input type="text" class="form-input" id="wizard-input-name" required placeholder="e.g. S. Ramanathan" value="${state.wizard.patronName}">
          </div>
          <div class="form-group">
            <label class="form-label">Trust / Foundation Name</label>
            <input type="text" class="form-input" id="wizard-input-trust" placeholder="e.g. Sri Venkateswara Temple Trust" value="${state.wizard.trustName}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" class="form-input" id="wizard-input-email" required placeholder="trustee@domain.org" value="${state.wizard.email}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone / WhatsApp *</label>
            <input type="tel" class="form-input" id="wizard-input-phone" required placeholder="+91 / +1 / +44 ..." value="${state.wizard.phone}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Sacred Vision & Specific Requirements</label>
          <textarea class="form-textarea" id="wizard-input-notes" placeholder="Tell us about specific Agama traditions, family lineage intentions, consecration target dates, or site terrain features...">${state.wizard.notes}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Architectural Blueprint / Survey / Reference Upload</label>
          <div class="file-dropzone" id="file-dropzone">
            <div class="dropzone-icon">⇪</div>
            <strong>Click or Drag Site Plans / CAD / PDF Files Here</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              Accepted formats: PDF, DWG, DXF, JPG, PNG (Max 50MB)
            </p>
            <input type="file" id="file-upload-input" style="display: none;" accept=".pdf,.dwg,.dxf,.jpg,.png,.jpeg">
            <div id="file-upload-status" style="margin-top: 8px; font-weight: 600; color: var(--gold-bright); font-size: 0.85rem;">
              ${state.wizard.uploadedFileName ? `Attached: ${state.wizard.uploadedFileName}` : ''}
            </div>
          </div>
        </div>
      `;
  }
}

function attachWizardEventListeners() {
  const form = document.getElementById('wizard-form');
  const prevBtn = document.getElementById('btn-wizard-prev');
  const nextBtn = document.getElementById('btn-wizard-next');

  // Step Indicators click
  document.querySelectorAll('[data-goto-step]').forEach(node => {
    node.addEventListener('click', () => {
      const step = parseInt(node.getAttribute('data-goto-step'), 10);
      if (step <= state.wizard.currentStep || step === state.wizard.currentStep + 1) {
        state.wizard.currentStep = step;
        renderStartProjectPage();
      }
    });
  });

  // Previous Step
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.wizard.currentStep > 1) {
        state.wizard.currentStep--;
        renderStartProjectPage();
      }
    });
  }

  // Next Step
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      saveWizardCurrentStepData();
      if (state.wizard.currentStep < state.wizard.totalSteps) {
        state.wizard.currentStep++;
        renderStartProjectPage();
      }
    });
  }

  // Category Selection (Step 1)
  document.querySelectorAll('[data-select-category]').forEach(card => {
    card.addEventListener('click', () => {
      state.wizard.category = card.getAttribute('data-select-category');
      renderStartProjectPage();
    });
  });

  // Stone Selection (Step 4)
  document.querySelectorAll('[data-select-stone]').forEach(card => {
    card.addEventListener('click', () => {
      state.wizard.stone = card.getAttribute('data-select-stone');
      renderStartProjectPage();
    });
  });

  // Services Toggle (Step 5)
  document.querySelectorAll('[data-toggle-service]').forEach(card => {
    card.addEventListener('click', () => {
      const service = card.getAttribute('data-toggle-service');
      const idx = state.wizard.services.indexOf(service);
      if (idx > -1) {
        state.wizard.services.splice(idx, 1);
      } else {
        state.wizard.services.push(service);
      }
      renderStartProjectPage();
    });
  });

  // Dropzone file upload handling (Step 6)
  const dropzone = document.getElementById('file-dropzone');
  const fileInput = document.getElementById('file-upload-input');
  const fileStatus = document.getElementById('file-upload-status');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        state.wizard.uploadedFileName = e.target.files[0].name;
        if (fileStatus) {
          fileStatus.textContent = `Attached: ${e.target.files[0].name} (${(e.target.files[0].size / 1024).toFixed(1)} KB)`;
        }
      }
    });
  }

  // Final Form Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveWizardCurrentStepData();
      showConfirmationDossier();
    });
  }
}

function saveWizardCurrentStepData() {
  const loc = document.getElementById('wizard-input-location');
  if (loc) state.wizard.location = loc.value;

  const acreage = document.getElementById('wizard-input-acreage');
  if (acreage) state.wizard.acreage = acreage.value;

  const style = document.getElementById('wizard-input-style');
  if (style) state.wizard.style = style.value;

  const deity = document.getElementById('wizard-input-deity');
  if (deity) state.wizard.deity = deity.value;

  const footprint = document.getElementById('wizard-input-footprint');
  if (footprint) state.wizard.footprint = footprint.value;

  const name = document.getElementById('wizard-input-name');
  if (name) state.wizard.patronName = name.value;

  const trust = document.getElementById('wizard-input-trust');
  if (trust) state.wizard.trustName = trust.value;

  const email = document.getElementById('wizard-input-email');
  if (email) state.wizard.email = email.value;

  const phone = document.getElementById('wizard-input-phone');
  if (phone) state.wizard.phone = phone.value;

  const notes = document.getElementById('wizard-input-notes');
  if (notes) state.wizard.notes = notes.value;
}

function showConfirmationDossier() {
  const dossierId = `STH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  appView.innerHTML = `
    <div class="section-spacing" style="padding-top: 140px;">
      <div class="container" style="max-width: 860px; text-align: center;">
        <div style="background: var(--bg-surface); border: 1px solid var(--gold-border); border-radius: 4px; padding: var(--space-10); box-shadow: var(--shadow-lg);">
          <span class="section-tag" style="background: rgba(197, 160, 89, 0.15);">Sacred Commission Received</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin: var(--space-3) 0;">Dossier Filed Under Sacred Seal</h1>
          <p class="lead" style="color: var(--gold-bright);">
            Dossier Reference ID: <strong>${dossierId}</strong>
          </p>
          <p style="color: var(--text-ivory-soft); max-width: 680px; margin: 0 auto var(--space-6);">
            Thank you, <strong>${state.wizard.patronName || 'Respected Patron'}</strong> ${state.wizard.trustName ? `of ${state.wizard.trustName}` : ''}. Your architectural intent for a <strong>${state.wizard.category}</strong> dedicated to <strong>${state.wizard.deity}</strong> in <strong>${state.wizard.location}</strong> has been transmitted directly to the desk of our Chief Sthapathi.
          </p>

          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: var(--space-6); border-radius: 4px; text-align: left; margin-bottom: var(--space-8);">
            <h4 style="font-size: 0.85rem; color: var(--gold-primary); letter-spacing: 0.15em; margin-bottom: var(--space-3);">
              CONSULTATION TIMELINE & NEXT PROCEDURES:
            </h4>
            <ol style="margin-left: var(--space-4); color: var(--text-ivory-soft); font-size: 0.92rem; display: flex; flex-direction: column; gap: 8px;">
              <li><strong>Astrological Terrain Alignment:</strong> Our Vedic astrologers will cross-reference your geographic coordinates with true cardinal equinoxes.</li>
              <li><strong>Preliminary Ayadi Ratio Sizing:</strong> We will draft the primary Manduka or Paramasayika sacred grid.</li>
              <li><strong>Chief Sthapathi Direct Call:</strong> Within 48 business hours, our Managing Director will reach out to ${state.wizard.email || 'your email'} to schedule a virtual or on-site sanctum presentation.</li>
            </ol>
          </div>

          <div style="display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap;">
            <a href="#home" class="btn btn-gold">
              Return To Sacred Home
            </a>
            <button class="btn btn-outline-gold" onclick="window.print()">
              Print / Save Sacred Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
