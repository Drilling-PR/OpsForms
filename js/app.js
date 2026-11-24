(function () {
  const {
    byId,
    value,
    setValue,
    fillSelect,
    fillCheckboxGroup
  } = window.OpsUtils;

  const {
    RIGS,
    PHASES,
    ACTIVITIES,
    EVENT_CATEGORIES,
    EVENT_IMPACTS,
    EVENT_APPLICABLE_TO
  } = window.OpsConfig;

  const { sitop, sitopSupervisor, sitopSondador, desvio, evento, comunicadoEvento } = window.OpsFormsModules;
  const storage = window.OpsStorage;

  const outputText = byId('outputText');
  const saveStatus = byId('saveStatus');
  const copyFeedback = [byId('copyTopFeedback'), byId('copyFeedback')].filter(Boolean);
  const copyButtons = [byId('copyTopBtn'), byId('copyBottomBtn')].filter(Boolean);
  const whatsAppLinks = [byId('whatsAppTopLink'), byId('whatsAppBottomLink')].filter(Boolean);
  let copying = false;
  let feedbackTimer;
  const themeSelect = byId('themeSelect');
  const THEME_KEY = 'formularios-operacionais-theme-v1';

  function applyTheme(theme) {
    const normalized = ['dark', 'light', 'pink80'].includes(theme) ? theme : 'dark';
    document.body.dataset.theme = normalized;
    if (themeSelect) themeSelect.value = normalized;
    localStorage.setItem(THEME_KEY, normalized);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);

    if (themeSelect) {
      themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));
    }
  }

  function getActiveFormType() {
    const checked = document.querySelector('input[name="formType"]:checked');
    return checked ? checked.value : 'sitop';
  }

  function setActiveFormType(type) {
    document.querySelectorAll('input[name="formType"]').forEach(input => {
      input.checked = input.value === type;
    });
  }

  function switchForm(type) {
    document.querySelectorAll('.form-view').forEach(view => view.classList.add('hidden'));
    const view = byId(`${type}Form`);
    if (view) view.classList.remove('hidden');
    updateOutput();
  }

  function buildOutput() {
    const type = getActiveFormType();
    if (type === 'sitop') return sitop.buildOutput();
    if (type === 'sitopSupervisor') return sitopSupervisor.buildOutput();
    if (type === 'sitopSondador') return sitopSondador.buildOutput();
    if (type === 'desvio') return desvio.buildOutput();
    if (type === 'comunicadoEvento') return comunicadoEvento.buildOutput();
    return evento.buildOutput();
  }

  function updateOutput() {
    sitopSupervisor.syncTurmasField();
    desvio.toggleComportamentoField();
    evento.toggleTimeFields();
    evento.toggleActionField();
    evento.updateCriticalityVisual();
    storage.updatePrefsFromFields();
    const text = buildOutput();
    if (text !== outputText.textContent) showCopyFeedback('');
    outputText.textContent = text;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    whatsAppLinks.forEach(link => { link.href = url; });
    storage.saveState(getActiveFormType());
    saveStatus.textContent = 'Salvo localmente';
  }

  function clearCurrent(group) {
    const type = getActiveFormType();

    document.querySelectorAll(`[data-form="${type}"][data-group="${group}"]`).forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
        return;
      }

      el.value = '';
    });

    if (type === 'sitop' && group === 'body') {
      sitop.clearBodyLists();
    }

    if (type === 'sitopSupervisor' && group === 'body') {
      sitopSupervisor.clearBodyLists();
    }

    if (type === 'sitopSondador' && group === 'body') {
      sitopSondador.clearBodyLists();
    }

    if (type === 'evento') {
      if (group === 'header') {
        evento.initialiseDefaults(false);
        storage.applyPrefsToEmptyHeaderFields();
      }
      if (group === 'body') {
        evento.resetBodyDefaults();
      }
    }

    if (type === 'comunicadoEvento' && group === 'header') {
      comunicadoEvento.initialiseDefaults(false);
      storage.applyPrefsToEmptyHeaderFields();
    }

    updateOutput();
  }

  function clearCurrentAll() {
    clearCurrent('header');
    clearCurrent('body');

    const type = getActiveFormType();
    if (type === 'sitop') {
      sitop.clearBodyLists();
    }

    if (type === 'sitopSupervisor') {
      sitopSupervisor.clearBodyLists();
    }

    if (type === 'sitopSondador') {
      sitopSondador.clearBodyLists();
    }

    updateOutput();
  }

  function showCopyFeedback(message, isError = false) {
    clearTimeout(feedbackTimer);
    copyFeedback.forEach(node => {
      node.textContent = message;
      node.dataset.error = String(isError);
    });
    if (message && !isError) {
      feedbackTimer = setTimeout(() => showCopyFeedback(''), 2200);
    }
  }

  function legacyCopy(text) {
    const previousFocus = document.activeElement;
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    try {
      temp.select();
      temp.setSelectionRange(0, text.length);
      return document.execCommand('copy') === true;
    } finally {
      temp.remove();
      if (previousFocus) previousFocus.focus({ preventScroll: true });
    }
  }

  function selectOutputForManualCopy() {
    outputText.focus();
    const range = document.createRange();
    range.selectNodeContents(outputText);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copyOutput() {
    if (copying) return;
    const text = outputText.textContent;
    copying = true;
    copyButtons.forEach(button => { button.disabled = true; });
    showCopyFeedback('Copiando texto…');
    let copied = false;
    try {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        try { copied = legacyCopy(text); } catch { copied = false; }
      }

      if (text !== outputText.textContent) {
        showCopyFeedback('O formulário mudou durante a cópia. Copie novamente o texto atual antes de colar.', true);
      } else if (copied) {
        showCopyFeedback('Texto copiado. Cole no WhatsApp, Teams ou onde preferir.');
      } else {
        selectOutputForManualCopy();
        showCopyFeedback('Não foi possível copiar automaticamente. O texto está selecionado na prévia: use Ctrl+C, ⌘C ou a opção Copiar do dispositivo.', true);
      }
    } finally {
      copying = false;
      copyButtons.forEach(button => { button.disabled = false; });
    }
  }

  function attachAutoHandlers(root = document) {
    root.querySelectorAll('input, select, textarea').forEach(el => {
      el.removeEventListener('input', updateOutput);
      el.removeEventListener('change', updateOutput);
      el.addEventListener('input', updateOutput);
      el.addEventListener('change', updateOutput);
    });
  }

  function initSelectsAndGroups() {
    fillSelect('sitop_sonda', RIGS);
    fillSelect('sup_sonda', RIGS);
    fillSelect('sond_sonda', RIGS);
    fillSelect('desvio_sonda', RIGS);
    fillSelect('evento_rig', RIGS);
    fillSelect('evento_phase', PHASES);
    fillSelect('evento_activity', ACTIVITIES);
    fillCheckboxGroup('evento_categoryGroup', 'evento_categories', EVENT_CATEGORIES, 'header');
    fillCheckboxGroup('evento_impactGroup', 'evento_impacts', EVENT_IMPACTS, 'body');
    fillCheckboxGroup('evento_applicableGroup', 'evento_applicableTo', EVENT_APPLICABLE_TO, 'body');
  }

  function initDefaults(loaded) {
    if (!loaded) {
      sitop.initialiseDefaults();
      sitopSupervisor.initialiseDefaults();
      sitopSondador.initialiseDefaults();
      desvio.initialiseDefaults();
      evento.initialiseDefaults();
      comunicadoEvento.initialiseDefaults();
      storage.applyPrefsToEmptyHeaderFields();
      return;
    }

    storage.applyPrefsToEmptyHeaderFields();
    if (byId('sitop_equipamento_list') && !byId('sitop_equipamento_list').children.length) sitop.addEquipment();
    if (byId('sitop_risco_decisao_list') && !byId('sitop_risco_decisao_list').children.length) sitop.addRiskDecision();
    if (byId('sitop_licao_list') && !byId('sitop_licao_list').children.length) sitop.addLesson();
    if (byId('sitop_npt_list') && !byId('sitop_npt_list').children.length) sitop.addNpt();
    if (byId('sitop_incident_list') && !byId('sitop_incident_list').children.length) sitop.addIncident();
    if (byId('sond_timeline_list') && !byId('sond_timeline_list').children.length) sitopSondador.addTimelineItem();
    sitopSupervisor.initialiseDefaults();
    sitopSondador.initialiseDefaults();
    desvio.initialiseDefaults();
    comunicadoEvento.initialiseDefaults();
  }

  function bindStaticButtons() {
    const bindClick = (id, handler) => {
      const el = byId(id);
      if (!el) return;
      el.addEventListener('click', handler);
    };

    document.querySelectorAll('input[name="formType"]').forEach(input => {
      input.addEventListener('change', () => switchForm(input.value));
    });

    bindClick('addEquipmentBtn', () => {
      sitop.addEquipment();
      updateOutput();
    });

    bindClick('addRiskDecisionBtn', () => {
      sitop.addRiskDecision();
      updateOutput();
    });

    bindClick('addLessonBtn', () => {
      sitop.addLesson();
      updateOutput();
    });

    bindClick('addNptBtn', () => {
      sitop.addNpt();
      updateOutput();
    });

    bindClick('addIncidentBtn', () => {
      sitop.addIncident();
      updateOutput();
    });

    bindClick('addSupervisorAtividadePrincipalBtn', () => {
      sitopSupervisor.addAtividadePrincipal();
      updateOutput();
    });

    bindClick('addSupervisorMovimentacaoCargaBtn', () => {
      sitopSupervisor.addMovimentacaoCarga();
      updateOutput();
    });

    bindClick('addSupervisorAtividadeParalelaBtn', () => {
      sitopSupervisor.addAtividadeParalela();
      updateOutput();
    });

    bindClick('addSupervisorPreventivaBtn', () => {
      sitopSupervisor.addPreventiva();
      updateOutput();
    });

    bindClick('addSupervisorFalhaBtn', () => {
      sitopSupervisor.addFalha();
      updateOutput();
    });

    bindClick('addSupervisorSubstituicaoBtn', () => {
      sitopSupervisor.addSubstituicao();
      updateOutput();
    });

    bindClick('addSupervisorProntoBtn', () => {
      sitopSupervisor.addPronto();
      updateOutput();
    });

    bindClick('addSupervisorIncidentBtn', () => {
      sitopSupervisor.addIncident();
      updateOutput();
    });

    const addSondadorTimelineAndFocus = () => {
      sitopSondador.addTimelineItem({}, { focus: true });
      updateOutput();
    };

    bindClick('addSondadorTimelineBtn', addSondadorTimelineAndFocus);
    bindClick('addSondadorTimelineBottomBtn', addSondadorTimelineAndFocus);

    bindClick('copyTopBtn', copyOutput);
    bindClick('copyBottomBtn', copyOutput);
    bindClick('clearHeaderBtn', () => clearCurrent('header'));
    bindClick('clearBodyBtn', () => clearCurrent('body'));
    bindClick('clearAllBtn', clearCurrentAll);
  }

  function init() {
    initTheme();
    sitop.setCallbacks({ attachAutoHandlers, updateOutput });
    sitopSupervisor.setCallbacks({ attachAutoHandlers, updateOutput });
    sitopSondador.setCallbacks({ attachAutoHandlers, updateOutput });

    initSelectsAndGroups();

    const loaded = storage.loadState(setActiveFormType);
    initDefaults(loaded);

    bindStaticButtons();
    attachAutoHandlers();
    sitopSupervisor.attachTurmasHandlers();

    switchForm(getActiveFormType());
    updateOutput();
  }

  init();
})();
