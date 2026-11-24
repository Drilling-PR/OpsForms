/* Browser regression checks. Clipboard is substituted; WhatsApp navigation is prevented. */
(async () => {
  const result = { checks: [], outputs: {}, fields: [] };
  const assert = (ok, label) => { if (!ok) throw new Error(label); result.checks.push(label); };
  const byId = id => document.getElementById(id);
  const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
  const choose = type => document.querySelector(`input[name="formType"][value="${type}"]`).click();
  const types = ['sitop', 'sitopSupervisor', 'sitopSondador', 'desvio', 'comunicadoEvento', 'evento'];
  const pump3Ids = new Set(['sond_b3_status', 'sond_b3_horas']);
  const setField = (id, value) => {
    const el = byId(id);
    el.value = value;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };
  const snapshot = label => {
    for (const type of types) {
      choose(type);
      result.outputs[`${label}:${type}`] = byId('outputText').textContent;
    }
  };
  let clipboardCalls = [], openCalls = [];
  window.open = (...args) => { openCalls.push(args); throw new Error('External popup is forbidden in tests'); };
  let writeText = async text => { clipboardCalls.push(text); };
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => writeText(text) } });
  const clickCopy = async id => { byId(id).click(); await settle(); };
  const feedback = () => byId('copyFeedback').textContent;
  const assertLinks = text => {
    for (const id of ['whatsAppTopLink', 'whatsAppBottomLink']) {
      const link = byId(id), url = new URL(link.href);
      assert(link.tagName === 'A' && link.target === '_blank' && link.rel.includes('noopener'), `${id}: native safe link`);
      assert(url.origin === 'https://wa.me' && url.searchParams.get('text') === text, `${id}: exact canonical text`);
      link.addEventListener('click', event => event.preventDefault(), { once: true });
      const before = clipboardCalls.length;
      link.click();
      assert(clipboardCalls.length === before && !openCalls.length, `${id}: independent from clipboard and popup`);
    }
  };
  async function checkRestoredDraft() {
      const { text, legacy } = window.__pumpDraft;
      const expected = legacy ? text.replace(/^Bomba 3: .*\n/m, '') : text;
      assert(document.querySelector('input[name="formType"]:checked').value === 'sitopSondador', 'SITOP Sondador reopens from draft');
      assert(byId('sond_b3_status').value === (legacy ? '' : 'Em manutenção') && byId('sond_b3_horas').value === (legacy ? '' : '4,5 h'), 'Pump 3 values restore; legacy drafts remain blank');
      assert(byId('outputText').textContent === expected, 'restored draft has exact expected preview');
      assertLinks(expected);
      await clickCopy('copyBottomBtn');
      assert(clipboardCalls.at(-1) === expected, 'restored draft copies the exact expected text');
  }
  try {
    assert(window.__pageErrors.length === 0, 'application initialized without errors');
    if (window.__pumpDraft) {
      await checkRestoredDraft();
      result.ok = true;
    } else {
      snapshot('initial');
      document.querySelectorAll('input[data-form], select[data-form], textarea[data-form]').forEach(el => {
        if (pump3Ids.has(el.id)) return;
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = true;
        else if (el.tagName === 'SELECT') el.selectedIndex = el.options.length - 1;
        else if (el.type === 'date') el.value = '2026-11-24';
        else if (el.type === 'time') el.value = '06:15';
        else if (el.type === 'datetime-local') el.value = '2026-11-24T06:15';
        else if (el.type === 'range' || el.type === 'number') el.value = '3';
        else el.value = el.tagName === 'TEXTAREA' ? 'AÇÃO & revisão + 50% # 🙂\nLinha 2 *texto* <teste>' : 'Teste sintético & 50% + # 🙂';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      result.fields = [...document.querySelectorAll('[data-form]')].map(el => [el.tagName, el.id, el.name, el.type, el.dataset.form, el.dataset.group, el.value, el.checked]);
      snapshot('populated');
      if (!window.__baseline) {
        result.ok = true;
      } else {
        assert(JSON.stringify(result.outputs) === JSON.stringify(window.__baseline.outputs), 'all six initial/populated report outputs match baseline byte-for-byte in UTF-8');
        const existingFields = result.fields.filter(field => !pump3Ids.has(field[1]));
        assert(JSON.stringify(existingFields) === JSON.stringify(window.__baseline.fields), 'all existing form fields and synthetic values match baseline');
        assert(result.fields.length === existingFields.length + pump3Ids.size, 'exactly two new fields');
        for (const type of types) {
          choose(type);
          const text = byId('outputText').textContent;
          const stateBefore = JSON.stringify(localStorage);
          for (const id of ['copyTopBtn', 'copyBottomBtn']) {
            await clickCopy(id);
            assert(clipboardCalls.at(-1) === text, `${type}: ${id} copies exact preview`);
            assert(feedback().startsWith('Texto copiado.'), `${type}: copy success is confirmed`);
            assert(byId('copyTopFeedback').textContent === feedback(), `${type}: feedback available at both actions`);
          }
          assertLinks(text);
          assert(JSON.stringify(localStorage) === stateBefore, `${type}: exporting does not mutate stored drafts`);
        }
        assert(openCalls.length === 0, 'copying never opens an application');
        choose('sitopSondador');
        const status = byId('sond_b3_status'), hours = byId('sond_b3_horas');
        assert(status.closest('.form-view').id === 'sitopSondadorForm' && hours.closest('.form-view').id === 'sitopSondadorForm', 'Pump 3 is exclusive to SITOP Sondador');
        assert(JSON.stringify([...status.options].map(option => option.value)) === JSON.stringify([...byId('sond_b2_status').options].map(option => option.value)), 'Pump 3 shares existing status choices');
        assert(hours.inputMode === byId('sond_b2_horas').inputMode, 'Pump 3 shares existing decimal input mode');
        const withoutPump3 = byId('outputText').textContent;
        const withPump3 = line => withoutPump3.replace('\nObs bombas:', '\n' + line + '\nObs bombas:');
        setField('sond_b3_horas', '  ');
        assert(byId('outputText').textContent === withoutPump3, 'whitespace-only Pump 3 does not change report');
        setField('sond_b3_horas', '0');
        assert(byId('outputText').textContent === withPump3('Bomba 3: - | 0'), 'hours-only Pump 3 keeps zero and uses existing separator');
        setField('sond_b3_horas', '');
        setField('sond_b3_status', 'Em manutenção');
        assert(byId('outputText').textContent === withPump3('Bomba 3: Em manutenção | -'), 'status-only Pump 3 keeps existing placeholder');
        setField('sond_b3_horas', '4,5 h');
        const pumpText = withPump3('Bomba 3: Em manutenção | 4,5 h');
        assert(byId('outputText').textContent === pumpText, 'populated report changes only to insert the Pump 3 line');
        assertLinks(pumpText);
        await clickCopy('copyTopBtn');
        assert(clipboardCalls.at(-1) === pumpText, 'Pump 3 copies the complete canonical output');
        const key = window.OpsConfig.STORAGE_KEY;
        result.pumpDraft = { key, state: localStorage.getItem(key), text: pumpText };
        const persistedFields = JSON.parse(result.pumpDraft.state).fields;
        assert(persistedFields.sond_b3_status === 'Em manutenção' && persistedFields.sond_b3_horas === '4,5 h', 'both Pump 3 fields are persisted');
        byId('clearHeaderBtn').click();
        assert(status.value === 'Em manutenção' && hours.value === '4,5 h', 'clearing header keeps Pump 3 body fields');
        byId('clearBodyBtn').click();
        assert(status.value === '' && hours.value === '' && !byId('outputText').textContent.includes('Bomba 3:'), 'clearing body removes both Pump 3 values and output line');
        assert(JSON.parse(localStorage.getItem(key)).fields.sond_b3_status === '' && JSON.parse(localStorage.getItem(key)).fields.sond_b3_horas === '', 'clearing body persists both empty values');
        assertLinks(byId('outputText').textContent);
        setField('sond_b3_status', 'Stand-by');
        setField('sond_b3_horas', '2');
        byId('clearAllBtn').click();
        assert(status.value === '' && hours.value === '' && !byId('outputText').textContent.includes('Bomba 3:'), 'clearing all removes Pump 3');
        // Rejected clipboard falls back only when the legacy API confirms success.
        writeText = async () => { throw new Error('clipboard denied'); };
        let legacyText, legacyCalls = 0;
        document.execCommand = command => {
          legacyCalls++;
          const temp = [...document.querySelectorAll('textarea')].find(el => el.readOnly);
          legacyText = temp.value;
          return command === 'copy';
        };
        const textareaCount = document.querySelectorAll('textarea').length;
        await clickCopy('copyTopBtn');
        assert(legacyCalls === 1 && legacyText === byId('outputText').textContent && feedback().startsWith('Texto copiado.'), 'legacy fallback copies exact text and confirms true result');
        assert(document.querySelectorAll('textarea').length === textareaCount, 'temporary clipboard textarea removed');
        for (const failingLegacy of [() => false, () => { throw new Error('legacy denied'); }]) {
          document.execCommand = failingLegacy;
          await clickCopy('copyBottomBtn');
          assert(feedback().startsWith('Não foi possível copiar automaticamente.'), 'legacy false/throw never reports copied');
          assert(window.getSelection().toString() === byId('outputText').textContent, 'failed copy selects full canonical preview for manual copy');
          assert(!byId('copyTopBtn').disabled && !byId('copyBottomBtn').disabled, 'copy buttons recover after failure');
          assert(document.querySelectorAll('textarea').length === textareaCount, 'legacy failure removes temporary element');
        }
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
        document.execCommand = () => true;
        await clickCopy('copyTopBtn');
        assert(feedback().startsWith('Texto copiado.'), 'absent Clipboard API uses confirmed legacy copy');
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => writeText(text) } });
        // A partial fix can copy the previous form and incorrectly claim the current one.
        choose('sitop');
        let finish;
        writeText = text => new Promise(resolve => { clipboardCalls.push(text); finish = resolve; });
        byId('copyTopBtn').click();
        assert(byId('copyTopBtn').disabled && byId('copyBottomBtn').disabled, 'pending copy disables both copy actions');
        const pendingCalls = clipboardCalls.length;
        byId('copyBottomBtn').click();
        assert(clipboardCalls.length === pendingCalls, 'duplicate copy does not race pending clipboard write');
        choose('evento');
        assertLinks(byId('outputText').textContent);
        finish(); await settle();
        assert(feedback().includes('mudou durante a cópia') && !feedback().startsWith('Texto copiado.'), 'superseded copy asks to copy current form again');
        // No arbitrary WhatsApp length cap or silent truncation.
        choose('sitop');
        byId('sitop_situacao').value = 'Longo 🙂 & + 50% #\n'.repeat(4000);
        byId('sitop_situacao').dispatchEvent(new Event('input', { bubbles: true }));
        const longText = byId('outputText').textContent;
        assert(longText.length > 60000, 'long-message fixture is substantial');
        writeText = async text => { clipboardCalls.push(text); };
        await clickCopy('copyBottomBtn');
        assert(clipboardCalls.at(-1) === longText, 'long message remains complete on clipboard');
        assertLinks(longText);
        assert(byId('exportHelp').textContent.includes('cole manualmente'), 'manual fallback for long messages remains discoverable');
        assert(window.__pageErrors.length === 0, 'no page or asynchronous errors');
        result.ok = true;
      }
    }
  } catch (error) { result.ok = false; result.error = error.stack; }
  const output = document.createElement('script');
  output.id = 'test-result'; output.type = 'application/json';
  output.textContent = JSON.stringify(result); document.body.append(output);
})();
