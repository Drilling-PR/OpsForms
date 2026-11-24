#!/usr/bin/env python3
"""Run static-app checks in fresh Chromium profiles; never contact WhatsApp.

Usage: python3 tests/run_export_checks.py [--baseline COMMIT]
Chromium and Git must be available. No npm/Python dependencies are required.
The baseline is the pre-change commit by default. All form data is synthetic.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--baseline', default='d920e5ddda033952a45f53749312dfe614ae568b')
p.add_argument('--chromium', default=shutil.which('chromium'))
a = p.parse_args()
if not a.chromium:
    raise SystemExit('Chromium unavailable; browser verification not run.')

def source(name, baseline):
    if baseline:
        return subprocess.check_output(['git', 'show', f'{a.baseline}:{name}'], cwd=ROOT).decode()
    return (ROOT / name).read_text()

# The only intended serializer change is the optional Pump 3 line in SITOP Sondador.
for path in list((ROOT / 'js/forms').glob('*.js')) + [ROOT / f'js/{name}.js' for name in ['config', 'utils', 'storage']]:
    name = path.relative_to(ROOT).as_posix()
    if name != 'js/forms/sitop-sondador.js':
        assert path.read_bytes() == source(name, True).encode(), f'Unexpected generator/shared-data change: {name}'

bootstrap = '''
window.__pageErrors = [];
window.addEventListener('error', e => window.__pageErrors.push(e.message));
window.addEventListener('unhandledrejection', e => window.__pageErrors.push(String(e.reason)));
const NativeDate = Date;
window.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : ['2026-11-24T12:00:00Z'])); } static now() { return 1795521600000; } };
localStorage.clear();
'''

def run(baseline=False, expected=None, pump_draft=None):
    page = source('index.html', baseline)
    page = page.replace('<head>', '<head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; connect-src \'none\'">', 1)
    page = page.replace('<link rel="stylesheet" href="css/style.css" />', '<style>' + source('css/style.css', baseline) + '</style>')
    # Preserve script order and exercise the actual app's entry point.
    page = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>' + source(m[1], baseline) + '</script>', page)
    test_setup = '\nwindow.__baseline = ' + json.dumps(expected, ensure_ascii=False) + ';\n'
    test_setup += 'window.__pumpDraft = ' + json.dumps(pump_draft, ensure_ascii=False) + ';\n'
    if pump_draft is not None:
        test_setup += 'localStorage.setItem(window.__pumpDraft.key, window.__pumpDraft.state);\n'
    page = page.replace('<script>', '<script>' + bootstrap + test_setup + '</script><script>', 1)
    page = page.replace('</body>', '<script>' + (ROOT / 'tests/export_flow.js').read_text() + '</script></body>')
    with tempfile.TemporaryDirectory(prefix='opsforms-export-test-') as tmp:
        tmp = Path(tmp)
        html = tmp / 'test.html'; html.write_text(page)
        command = [a.chromium, '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--disable-background-networking', '--no-proxy-server', '--host-resolver-rules=MAP * ~NOTFOUND', '--allow-file-access-from-files', '--user-data-dir=' + str(tmp / 'profile'), '--virtual-time-budget=10000', '--dump-dom', html.as_uri()]
        proc = subprocess.run(command, capture_output=True, text=True, timeout=45, env={**os.environ, 'TZ': 'UTC'})
        match = re.search(r'<script id="test-result" type="application/json">(.*?)</script>', proc.stdout, re.S)
        if not match:
            raise RuntimeError('Browser checks did not complete: ' + proc.stderr[-2000:])
        data = json.loads(match[1])
        if not data['ok']:
            raise AssertionError(data.get('error', data))
        return data

baseline = run(True)
current = run(expected=baseline)
restored = run(pump_draft=current['pumpDraft'])
legacy = json.loads(current['pumpDraft']['state'])
for key in ('sond_b3_status', 'sond_b3_horas'):
    del legacy['fields'][key]
restored_legacy = run(pump_draft={**current['pumpDraft'], 'state': json.dumps(legacy, ensure_ascii=False),
                                  'legacy': True})
for name, text in baseline['outputs'].items():
    assert text.encode('utf-8') == current['outputs'][name].encode('utf-8'), name
print(json.dumps({'ok': True, 'baseline': a.baseline, 'browser_checks': sum(len(run['checks']) for run in [current, restored, restored_legacy]), 'unchanged_report_outputs': len(current['outputs']), 'field_elements': len(current['fields']), 'output_sha256': {name: hashlib.sha256(text.encode()).hexdigest() for name, text in current['outputs'].items()}, 'limitations': 'Clipboard API and legacy copy are substituted. No external WhatsApp navigation or actual message delivery is performed. Chromium uses isolated file:// pages and synthetic fields.'}, indent=2, ensure_ascii=False))
