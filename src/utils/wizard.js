import { servicesData } from '../data/servicesData.js';
import { escapeHtml as esc, validateWizard, validateReferenceFile, briefEntries, createBriefText } from './planner.js';

const categories = [
  ['New Temple Complex', 'A complete temple campus with sanctum, gateway and courtyards.'],
  ['Private Family Sanctum', 'An intimate stone shrine for a family estate or retreat.'],
  ['Rajagopuram Gateway', 'A traditional entrance gateway for an existing sanctuary.'],
  ['Acoustic Stone Mandapam', 'A pillared pavilion for celebrations, music and gathering.'],
  ['Heritage Restoration', 'Conservation and structural care for an existing temple.'],
  ['Agama Master Planning Only', 'Sacred geometry, site planning and architectural documentation.']
];
const regions = ['Domestic India (Tamil Nadu / Kaveri Delta)', 'Domestic India (Karnataka / Andhra / Telangana)',
  'Domestic India (Northern / Western States)', 'North America (USA & Canada)', 'Europe & United Kingdom',
  'Southeast Asia & Singapore', 'Australia & Middle East'];
const traditions = ['Imperial Chola Monolithic Granite', 'Classical Dravidian', 'Later Pandya Style',
  'Vijayanagara & Nayaka Tradition', 'Contemporary Heritage Fusion'];
const footprints = ['Under 5,000 sq.ft (Private / Compact Shrine)', '5,000 – 15,000 sq.ft (Medium Community Sanctuary)',
  '15,000 – 40,000 sq.ft (Monumental Temple Complex)', 'Over 40,000 sq.ft (Grand Regional Pilgrimage Sanctuary)'];
const stones = [
  ['Black Krishna Granite (Karunkal)', 'Deep tones and traditional hand-carved detail.'],
  ['Warm Golden Sandstone', 'Warm hues and fine ornamental carving.'],
  ['Tawny Grey Granite', 'Subtle crystalline texture for pillars and pavilions.'],
  ['White Teak Marble', 'Light-toned surfaces and decorative detailing.']
];
const stepNames = ['Category', 'Location', 'Tradition', 'Materials', 'Services', 'Your details'];
const defaults = () => ({
  currentStep: 1, category: categories[0][0], location: regions[0], acreage: '',
  style: traditions[0], deity: '', footprint: footprints[0], stone: stones[0][0],
  services: [servicesData[0].title], patronName: '', trustName: '', email: '', phone: '', notes: '', uploadedFileName: ''
});

export function createWizard(view) {
  // Personal information is kept in memory only; it is never silently persisted or sent.
  let draft = defaults();
  let reviewed = false;
  let referenceFile = null;
  let error = '';

  const field = (key, label, placeholder = '', type = 'text', required = false) => `
    <div class="form-group">
      <label class="form-label" for="wizard-${key}">${label}${required ? ' *' : ''}</label>
      <input class="form-input" id="wizard-${key}" name="${key}" type="${type}"
        value="${esc(draft[key])}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}
        maxlength="${key === 'email' ? 254 : 200}" ${key === 'phone' ? 'autocomplete="tel"' : ''}
        ${key === 'email' ? 'autocomplete="email"' : ''} ${key === 'patronName' ? 'autocomplete="name"' : ''}>
    </div>`;
  const select = (key, label, options) => `
    <div class="form-group"><label class="form-label" for="wizard-${key}">${label}</label>
      <select class="form-select" id="wizard-${key}" name="${key}">
        ${options.map(value => `<option value="${esc(value)}" ${draft[key] === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}
      </select>
    </div>`;
  const choices = (key, options, multiple = false) => `
    <div class="options-grid" role="group" aria-label="${key}">
      ${options.map(([title, description]) => {
        const selected = multiple ? draft[key].includes(title) : draft[key] === title;
        return `<button type="button" class="option-card ${selected ? 'selected' : ''}" data-choice="${key}"
          data-value="${esc(title)}" aria-pressed="${selected}">
          <h4>${esc(title)} ${selected ? '✓' : ''}</h4><p>${esc(description)}</p></button>`;
      }).join('')}
    </div>`;

  function stepContent() {
    switch (draft.currentStep) {
      case 1: return `<h3>What would you like to create?</h3><p>Choose the starting point for your sacred project.</p>${choices('category', categories)}`;
      case 2: return `<h3>A sense of place.</h3><p>Tell us where the project will take shape.</p>
        ${select('location', 'Geographic region', regions)}
        ${field('acreage', 'Available land / plot dimensions', 'e.g. 2.5 acres or 120 × 180 feet', 'text', true)}`;
      case 3: return `<h3>Rooted in your tradition.</h3><p>Define the architectural language and presiding deity.</p>
        ${select('style', 'Architectural tradition', traditions)}
        ${field('deity', 'Presiding deity (Moolavar)', 'e.g. Lord Shiva, Sri Venkateswara, Lord Murugan', 'text', true)}`;
      case 4: return `<h3>Scale, texture & permanence.</h3><p>These initial preferences can be refined with the studio.</p>
        ${select('footprint', 'Estimated built footprint', footprints)}
        <p class="form-label">Preferred stone medium</p>${choices('stone', stones)}`;
      case 5: return `<h3>The right expertise for your vision.</h3><p>Select one or more services. Your summary updates as you choose.</p>
        ${choices('services', servicesData.map(s => [s.title, s.subtitle]), true)}`;
      case 6: return `<h3>A few details to complete your brief.</h3>
        <p>Your information stays in this page until you download or print it. Refreshing clears the draft.</p>
        <div class="form-row">${field('patronName', 'Patron / trustee name', 'Your full name', 'text', true)}
          ${field('trustName', 'Trust / foundation', 'Optional')}</div>
        <div class="form-row">${field('email', 'Email address', 'you@example.com', 'email', true)}
          ${field('phone', 'Phone / WhatsApp', '+91 ...', 'tel', true)}</div>
        <div class="form-group"><label class="form-label" for="wizard-notes">Your vision & requirements</label>
          <textarea id="wizard-notes" name="notes" class="form-textarea" maxlength="5000"
            placeholder="Tell us about the site, traditions, timeline or design ideas.">${esc(draft.notes)}</textarea></div>
        <div class="form-group">
          <label class="form-label" for="reference-file">Optional reference file</label>
          <div class="file-dropzone" id="reference-dropzone">
            <div class="dropzone-icon" aria-hidden="true">⇪</div>
            <strong>Choose a file or drop it here</strong>
            <p>PDF, DWG, DXF, JPG or PNG · up to 50 MB</p>
            <input type="file" id="reference-file" accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png">
            <p id="reference-status" role="status">${esc(draft.uploadedFileName || 'No reference selected.')}</p>
            ${referenceFile ? '<button class="btn btn-ghost" type="button" id="remove-reference">Remove reference</button>' : ''}
          </div>
          <p class="form-notice">No file is uploaded. Your brief includes its filename only; share the actual reference separately.</p>
        </div>`;
      default: return '';
    }
  }

  function summary() {
    return briefEntries(draft).slice(0, 8).map(([label, value]) => `
      <div class="summary-item"><small>${esc(label)}</small><span>${esc(value || 'To be decided')}</span></div>`).join('');
  }

  function saveFields() {
    const form = view.querySelector('#wizard-form');
    if (!form) return;
    new FormData(form).forEach((value, key) => {
      if (Object.hasOwn(draft, key) && typeof value === 'string') draft[key] = value;
    });
    const summaryView = view.querySelector('#wizard-summary');
    if (summaryView) summaryView.innerHTML = summary();
  }

  function setError(message) {
    error = message;
    const el = view.querySelector('#wizard-error');
    if (el) {
      el.textContent = message;
      el.hidden = !message;
      if (message) el.focus({ preventScroll: true });
    }
  }

  function goTo(step) {
    saveFields();
    if (step > draft.currentStep) {
      const message = validateWizard(draft);
      if (message) return setError(message);
      if (!view.querySelector('#wizard-form').reportValidity()) return;
    }
    draft.currentStep = Math.max(1, Math.min(6, step));
    error = '';
    render();
    view.querySelector('#wizard-step-title').focus({ preventScroll: true });
    view.querySelector('.wizard-main-panel').scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function chooseFile(file) {
    const message = validateReferenceFile(file);
    if (message) {
      setError(message);
      view.querySelector('#reference-file').value = '';
      return;
    }
    saveFields();
    referenceFile = file;
    draft.uploadedFileName = file.name;
    error = '';
    render();
    view.querySelector('#reference-file').focus({ preventScroll: true });
  }

  function render() {
    if (reviewed) return renderReview();
    view.innerHTML = `
      <section class="section-spacing page-section">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Your vision, thoughtfully planned</span>
            <h1>Every legacy begins<br>with a conversation.</h1>
            <p class="lead">A simple six-step planner to bring your sacred project into focus.</p>
          </div>
          <div class="wizard-container">
            <div class="wizard-main-panel">
              <div class="wizard-progress-bar-container">
                <div class="wizard-steps-indicator">
                  ${stepNames.map((name, i) => `<button type="button" data-step="${i + 1}"
                    class="wizard-step-node ${i + 1 === draft.currentStep ? 'active' : ''} ${i + 1 < draft.currentStep ? 'completed' : ''}"
                    ${i + 1 > draft.currentStep + 1 ? 'disabled' : ''}
                    ${i + 1 === draft.currentStep ? 'aria-current="step"' : ''} aria-label="Step ${i + 1}: ${name}">
                    <span class="wizard-step-circle">${i + 1 < draft.currentStep ? '✓' : i + 1}</span><span>${name}</span>
                  </button>`).join('')}
                </div>
                <div class="progress-track" role="progressbar" aria-valuemin="1" aria-valuemax="6" aria-valuenow="${draft.currentStep}" aria-label="Project planner progress">
                  <div class="progress-fill" style="width:${draft.currentStep / 6 * 100}%"></div>
                </div>
              </div>
              <div id="wizard-step-title" tabindex="-1"><span class="section-tag">Step ${draft.currentStep} of 6 · ${stepNames[draft.currentStep - 1]}</span></div>
              <form id="wizard-form" novalidate>
                ${stepContent()}
                <p id="wizard-error" class="form-error" role="alert" tabindex="-1" ${error ? '' : 'hidden'}>${esc(error)}</p>
                <div class="wizard-nav-actions">
                  ${draft.currentStep > 1 ? '<button type="button" class="btn btn-outline-gold" id="wizard-prev">← Previous</button>' : '<span></span>'}
                  <button class="btn btn-gold" type="submit">${draft.currentStep === 6 ? 'Review my project brief' : 'Continue'} →</button>
                </div>
              </form>
            </div>
            <aside class="wizard-summary-panel" aria-label="Live project summary">
              <div class="summary-heading"><h4>Your project at a glance</h4></div>
              <div id="wizard-summary">${summary()}</div>
              <p class="form-notice">A planning brief, not a quote or a submitted commission. Details stay in this page only.</p>
            </aside>
          </div>
        </div>
      </section>`;
    const form = view.querySelector('#wizard-form');
    form.addEventListener('input', saveFields);
    form.addEventListener('change', saveFields);
    form.addEventListener('submit', event => {
      event.preventDefault();
      saveFields();
      if (draft.currentStep < 6) return goTo(draft.currentStep + 1);
      for (let step = 1; step <= 6; step++) {
        const message = validateWizard(draft, step);
        if (message) {
          draft.currentStep = step;
          error = message;
          render();
          return setError(message);
        }
      }
      reviewed = true;
      renderReview();
      view.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    view.querySelector('#wizard-prev')?.addEventListener('click', () => goTo(draft.currentStep - 1));
    view.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.step))));
    view.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
      saveFields();
      const { choice, value } = button.dataset;
      if (choice === 'services') {
        draft.services = draft.services.includes(value) ? draft.services.filter(s => s !== value) : [...draft.services, value];
      } else draft[choice] = value;
      error = '';
      const index = [...view.querySelectorAll('[data-choice]')].indexOf(button);
      render();
      view.querySelectorAll('[data-choice]')[index]?.focus({ preventScroll: true });
    }));
    const fileInput = view.querySelector('#reference-file');
    const dropzone = view.querySelector('#reference-dropzone');
    fileInput?.addEventListener('change', () => { if (fileInput.files[0]) chooseFile(fileInput.files[0]); });
    dropzone?.addEventListener('dragover', event => { event.preventDefault(); dropzone.classList.add('dragging'); });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
    dropzone?.addEventListener('drop', event => {
      event.preventDefault();
      dropzone.classList.remove('dragging');
      if (event.dataTransfer.files.length !== 1) return setError('Choose one reference file at a time.');
      chooseFile(event.dataTransfer.files[0]);
    });
    view.querySelector('#remove-reference')?.addEventListener('click', () => {
      saveFields(); referenceFile = null; draft.uploadedFileName = ''; render();
    });
  }

  function renderReview() {
    view.innerHTML = `<section class="section-spacing page-section">
      <div class="container" style="max-width:960px">
        <div class="confirmation-card">
          <span class="section-tag">Ready for your next step</span>
          <h1>Your vision.<br>A considered beginning.</h1>
          <p class="lead">Your project brief is ready to review and keep.</p>
          <p class="form-notice"><strong>Prepared locally — not submitted.</strong> No information or files have been sent to the studio. Download or print your brief and share it through your confirmed studio contact.</p>
          <dl class="brief-review">${briefEntries(draft).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
          <div class="brief-actions">
            <button type="button" id="download-brief" class="btn btn-gold">Download brief ↓</button>
            <button type="button" id="print-brief" class="btn btn-outline-gold">Print / Save PDF</button>
            <button type="button" id="edit-brief" class="btn btn-outline-gold">Edit details</button>
            <button type="button" id="reset-brief" class="btn btn-ghost">Clear & start again</button>
          </div>
        </div>
      </div></section>`;
    view.querySelector('#download-brief').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([createBriefText(draft)], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'sri-akil-project-brief.txt'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    view.querySelector('#print-brief').addEventListener('click', () => window.print());
    view.querySelector('#edit-brief').addEventListener('click', () => { reviewed = false; render(); });
    view.querySelector('#reset-brief').addEventListener('click', () => {
      if (!window.confirm('Clear this project brief and all entered details?')) return;
      draft = defaults(); reviewed = false; referenceFile = null; error = ''; render();
    });
  }

  return {
    render,
    save: saveFields,
    selectService(title) {
      if (!servicesData.some(service => service.title === title)) return;
      saveFields();
      if (!draft.services.includes(title)) draft.services.push(title);
      reviewed = false;
    }
  };
}