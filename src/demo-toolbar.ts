/**
 * Wires the demo toolbar UI to an mc-texture-viewer inside the same root element.
 * Used by index.html (full page) and wiki-embed-demo.html (embedded article).
 */
import type { McViewerElement } from './viewer/McViewerElement.js';
import type { TextureManifest } from './viewer/types.js';
import modelsList from '../models/models.json';

const LOG = '[mc-texture-viewer demo]';

interface ModelEntry {
  name: string;
  url: string;
  textureBaseUrl: string;
  manifestKey?: string;
}

function byId<T extends HTMLElement>(root: ParentNode, id: string): T | null {
  return root.querySelector('#' + id.replace(/^#/, '')) as T | null;
}

/** Prefix for root-relative URLs in models.json (e.g. `/testing` when hosted under a subpath). */
function getStaticAssetBase(host: HTMLElement): string {
  return (host.getAttribute('data-asset-base') || '').trim().replace(/\/$/, '');
}

function resolveStaticUrl(base: string, path: string): string {
  if (!base) return path;
  if (path.startsWith('/')) return base + path;
  return path;
}

export type DemoToolbarMode = 'page' | 'embed';

/**
 * @param root - Container with toolbar markup + `#viewer` (mc-texture-viewer)
 * @param mode - `page` = fills viewport (use with html.mc-page-demo); `embed` = bounded block
 */
export function initMcTextureViewerDemo(root: HTMLElement, mode: DemoToolbarMode = 'embed'): void {
  root.classList.add('mc-demo-toolbar-root', mode === 'page' ? 'mc-demo--page' : 'mc-demo--embed');
  const staticBase = getStaticAssetBase(root);

  const viewerEl = byId<McViewerElement>(root, 'viewer');
  const modelSelect = byId<HTMLSelectElement>(root, 'modelSelect');
  const modelPrevBtn = byId<HTMLButtonElement>(root, 'modelPrevBtn');
  const modelNextBtn = byId<HTMLButtonElement>(root, 'modelNextBtn');
  const modelNavDots = byId<HTMLDivElement>(root, 'modelNavDots');
  const texturePackSelect = byId<HTMLSelectElement>(root, 'texturePackSelect');
  const zipInput = byId<HTMLInputElement>(root, 'zipInput');
  const autoRotateSwitch = byId<HTMLDivElement>(root, 'autoRotateSwitch');
  const rotationSpeed = byId<HTMLInputElement>(root, 'rotationSpeed');
  const rotationSpeedValue = byId<HTMLSpanElement>(root, 'rotationSpeedValue');
  const sunSwitch = byId<HTMLDivElement>(root, 'sunSwitch');
  const sunAzimuth = byId<HTMLInputElement>(root, 'sunAzimuth');
  const sunAzimuthValue = byId<HTMLSpanElement>(root, 'sunAzimuthValue');
  const sunElevation = byId<HTMLInputElement>(root, 'sunElevation');
  const sunElevationValue = byId<HTMLSpanElement>(root, 'sunElevationValue');
  const sunIntensity = byId<HTMLInputElement>(root, 'sunIntensity');
  const sunIntensityValue = byId<HTMLSpanElement>(root, 'sunIntensityValue');
  const sunColor = byId<HTMLInputElement>(root, 'sunColor');
  const transitionSelect = byId<HTMLSelectElement>(root, 'transitionSelect');
  const snapshotBtn = byId<HTMLButtonElement>(root, 'snapshotBtn');
  const fullscreenBtn = byId<HTMLButtonElement>(root, 'fullscreenBtn');
  const fullscreenIcon = root.querySelector('#fullscreenIcon') as HTMLElement | null;
  const wireframeSwitch = byId<HTMLDivElement>(root, 'wireframeSwitch');
  const hemisphereSwitch = byId<HTMLDivElement>(root, 'hemisphereSwitch');
  const shadowCatcherSwitch = byId<HTMLDivElement>(root, 'shadowCatcherSwitch');
  const fogSwitch = byId<HTMLDivElement>(root, 'fogSwitch');
  const fogColor = byId<HTMLInputElement>(root, 'fogColor');
  const fogColorLabel = byId<HTMLLabelElement>(root, 'fogColorLabel');
  const bgColor = byId<HTMLInputElement>(root, 'bgColor');
  const bgTransparent = byId<HTMLInputElement>(root, 'bgTransparent');
  const camFrontBtn = byId<HTMLButtonElement>(root, 'camFrontBtn');
  const camSideBtn = byId<HTMLButtonElement>(root, 'camSideBtn');
  const camTopBtn = byId<HTMLButtonElement>(root, 'camTopBtn');
  const camIsoBtn = byId<HTMLButtonElement>(root, 'camIsoBtn');
  const resetAllBtn = byId<HTMLButtonElement>(root, 'resetAllBtn');

  if (
    !viewerEl ||
    !modelSelect ||
    !modelPrevBtn ||
    !modelNextBtn ||
    !modelNavDots ||
    !texturePackSelect ||
    !zipInput ||
    !autoRotateSwitch ||
    !rotationSpeed ||
    !rotationSpeedValue ||
    !sunSwitch ||
    !sunAzimuth ||
    !sunAzimuthValue ||
    !sunElevation ||
    !sunElevationValue ||
    !sunIntensity ||
    !sunIntensityValue ||
    !sunColor ||
    !transitionSelect ||
    !snapshotBtn ||
    !fullscreenBtn ||
    !fullscreenIcon ||
    !wireframeSwitch ||
    !hemisphereSwitch ||
    !shadowCatcherSwitch ||
    !fogSwitch ||
    !fogColor ||
    !fogColorLabel ||
    !bgColor ||
    !bgTransparent ||
    !camFrontBtn ||
    !camSideBtn ||
    !camTopBtn ||
    !camIsoBtn ||
    !resetAllBtn
  ) {
    console.error(LOG, 'Toolbar markup incomplete (missing controls)');
    return;
  }

  /** Bound UI refs (TS does not narrow outer `const` inside nested function bodies). */
  const ui = {
    viewer: viewerEl,
    modelSelect,
    modelPrevBtn,
    modelNextBtn,
    modelNavDots,
    texturePackSelect,
    zipInput,
    autoRotateSwitch,
    rotationSpeed,
    rotationSpeedValue,
    sunSwitch,
    sunAzimuth,
    sunAzimuthValue,
    sunElevation,
    sunElevationValue,
    sunIntensity,
    sunIntensityValue,
    sunColor,
    transitionSelect,
    snapshotBtn,
    fullscreenBtn,
    fullscreenIcon,
    wireframeSwitch,
    hemisphereSwitch,
    shadowCatcherSwitch,
    fogSwitch,
    fogColor,
    fogColorLabel,
    bgColor,
    bgTransparent,
    camFrontBtn,
    camSideBtn,
    camTopBtn,
    camIsoBtn,
    resetAllBtn,
  };

  const viewer = ui.viewer;
  const loadedPacks: { name: string; blob: Blob }[] = [];

  const MODELS = modelsList as ModelEntry[];
  let currentModelIdx = 0;
  let modelChanging = false;

  function updateModelNav(): void {
    ui.modelPrevBtn.disabled = currentModelIdx === 0;
    ui.modelNextBtn.disabled = currentModelIdx === MODELS.length - 1;
    ui.modelSelect.value = String(currentModelIdx);
    ui.modelNavDots.innerHTML = '';
    if (MODELS.length > 1 && MODELS.length <= 12) {
      MODELS.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'model-nav-dot' + (i === currentModelIdx ? ' active' : '');
        ui.modelNavDots.appendChild(dot);
      });
    }
  }

  function populateModelSelect(): void {
    ui.modelSelect.innerHTML = '';
    MODELS.forEach((m, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = m.name;
      ui.modelSelect.appendChild(opt);
    });
  }

  function applyModelSelection(): void {
    const m = MODELS[currentModelIdx];
    if (!m) return;
    viewer.setAttribute('model-url', resolveStaticUrl(staticBase, m.url));
    viewer.setAttribute('texture-base-url', resolveStaticUrl(staticBase, m.textureBaseUrl));
    const manifestKey = m.manifestKey;
    const M = window.McTextureViewer;
    if (manifestKey && M) {
      const man = (M as Record<string, TextureManifest | undefined>)[manifestKey];
      if (man) viewer.setTextureManifest(man);
    }
  }

  async function navigateModel(direction: 'prev' | 'next', targetIdx?: number): Promise<void> {
    if (modelChanging) return;
    const nextIdx =
      targetIdx !== undefined
        ? targetIdx
        : direction === 'next'
          ? currentModelIdx + 1
          : currentModelIdx - 1;
    if (nextIdx < 0 || nextIdx >= MODELS.length) return;
    if (nextIdx === currentModelIdx) return;

    const slideDir = nextIdx > currentModelIdx ? 'up' : 'down';
    modelChanging = true;
    ui.modelPrevBtn.disabled = true;
    ui.modelNextBtn.disabled = true;

    await viewer.slideOut(slideDir);
    currentModelIdx = nextIdx;
    updateModelNav();

    await new Promise<void>((resolve) => {
      function onLoaded(): void {
        viewer.removeEventListener('model-loaded', onLoaded);
        viewer.removeEventListener('error', onError);
        resolve();
      }
      function onError(): void {
        viewer.removeEventListener('model-loaded', onLoaded);
        viewer.removeEventListener('error', onError);
        resolve();
      }
      viewer.addEventListener('model-loaded', onLoaded);
      viewer.addEventListener('error', onError);
      viewer.skipTransitionForNextApply = true;
      applyModelSelection();
    });

    await viewer.slideIn(slideDir);
    modelChanging = false;
    updateModelNav();
  }

  ui.modelPrevBtn.addEventListener('click', () => void navigateModel('prev'));
  ui.modelNextBtn.addEventListener('click', () => void navigateModel('next'));
  ui.modelSelect.addEventListener('change', () => {
    const newIdx = parseInt(ui.modelSelect.value, 10);
    if (Number.isNaN(newIdx) || newIdx === currentModelIdx) return;
    void navigateModel(newIdx > currentModelIdx ? 'next' : 'prev', newIdx);
  });

  viewer.addEventListener('shortcut-prev-model', () => void navigateModel('prev'));
  viewer.addEventListener('shortcut-next-model', () => void navigateModel('next'));
  viewer.addEventListener('shortcut-autorotate', (e: Event) => {
    const ce = e as CustomEvent<boolean>;
    ui.autoRotateSwitch.classList.toggle('on', ce.detail);
    ui.autoRotateSwitch.setAttribute('aria-checked', String(ce.detail));
  });
  viewer.addEventListener('shortcut-wireframe', (e: Event) => {
    const ce = e as CustomEvent<boolean>;
    ui.wireframeSwitch.classList.toggle('on', ce.detail);
    ui.wireframeSwitch.setAttribute('aria-checked', String(ce.detail));
  });

  populateModelSelect();
  updateModelNav();
  if (MODELS.length) applyModelSelection();

  function populateTexturePackSelect(): void {
    ui.texturePackSelect.innerHTML = '';
    const van = document.createElement('option');
    van.value = 'vanilla';
    van.textContent = 'Vanilla';
    ui.texturePackSelect.appendChild(van);
    loadedPacks.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.name;
      ui.texturePackSelect.appendChild(opt);
    });
  }

  function applyTexturePackSelection(): void {
    const val = ui.texturePackSelect.value;
    if (val === 'vanilla') {
      void viewer.applyDefaultTextures();
    } else {
      const idx = parseInt(val, 10);
      if (!Number.isNaN(idx) && loadedPacks[idx]) void viewer.applyTextureZip(loadedPacks[idx].blob);
    }
  }

  populateTexturePackSelect();
  ui.texturePackSelect.addEventListener('change', applyTexturePackSelection);

  const DEFAULTS = {
    autoRotate: false,
    rotationSpeed: 1,
    sunEnabled: true,
    sunAzimuth: 30,
    sunElevation: 50,
    sunIntensity: 1.4,
    sunColor: '#fff0e0',
    bgColor: '#1a1a1a',
  };

  function applyParam(name: string): void {
    switch (name) {
      case 'autoRotate':
        viewer.autoRotate = DEFAULTS.autoRotate;
        ui.autoRotateSwitch.classList.toggle('on', DEFAULTS.autoRotate);
        ui.autoRotateSwitch.setAttribute('aria-checked', String(DEFAULTS.autoRotate));
        break;
      case 'rotationSpeed':
        viewer.rotationSpeedMultiplier = DEFAULTS.rotationSpeed;
        ui.rotationSpeed.value = String(DEFAULTS.rotationSpeed);
        ui.rotationSpeedValue.textContent = String(DEFAULTS.rotationSpeed);
        break;
      case 'sunEnabled':
        viewer.sunEnabled = DEFAULTS.sunEnabled;
        ui.sunSwitch.classList.toggle('on', DEFAULTS.sunEnabled);
        ui.sunSwitch.setAttribute('aria-checked', String(DEFAULTS.sunEnabled));
        break;
      case 'sunAzimuth':
        viewer.setSunDirection(DEFAULTS.sunAzimuth, parseInt(ui.sunElevation.value, 10));
        ui.sunAzimuth.value = String(DEFAULTS.sunAzimuth);
        ui.sunAzimuthValue.textContent = DEFAULTS.sunAzimuth + '°';
        break;
      case 'sunElevation':
        viewer.setSunDirection(parseInt(ui.sunAzimuth.value, 10), DEFAULTS.sunElevation);
        ui.sunElevation.value = String(DEFAULTS.sunElevation);
        ui.sunElevationValue.textContent = DEFAULTS.sunElevation + '°';
        break;
      case 'sunIntensity':
        viewer.setSunIntensity(DEFAULTS.sunIntensity);
        ui.sunIntensity.value = String(DEFAULTS.sunIntensity);
        ui.sunIntensityValue.textContent = String(DEFAULTS.sunIntensity);
        break;
      case 'sunColor':
        viewer.setSunColor(parseInt(DEFAULTS.sunColor.slice(1), 16));
        ui.sunColor.value = DEFAULTS.sunColor;
        break;
    }
  }

  function resetAll(): void {
    applyParam('autoRotate');
    applyParam('rotationSpeed');
    applyParam('sunEnabled');
    applyParam('sunAzimuth');
    applyParam('sunElevation');
    applyParam('sunIntensity');
    applyParam('sunColor');
    ui.bgTransparent.checked = false;
    ui.bgColor.disabled = false;
    ui.bgColor.value = DEFAULTS.bgColor;
    viewer.setBackground(parseInt(DEFAULTS.bgColor.slice(1), 16));
    void viewer.resetCamera();
  }

  ui.resetAllBtn.addEventListener('click', resetAll);
  root.querySelectorAll('.param-reset').forEach((el) => {
    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const param = el.getAttribute('data-reset');
      if (param) applyParam(param);
    });
  });

  function toggleSwitch(el: HTMLElement, setter: (on: boolean) => void): void {
    el.classList.toggle('on');
    const on = el.classList.contains('on');
    el.setAttribute('aria-checked', String(on));
    setter(on);
  }

  ui.autoRotateSwitch.addEventListener('click', () => {
    toggleSwitch(ui.autoRotateSwitch, (v) => { viewer.autoRotate = v; });
  });
  ui.autoRotateSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      ui.autoRotateSwitch.click();
    }
  });
  ui.rotationSpeed.addEventListener('input', () => {
    const v = parseFloat(ui.rotationSpeed.value);
    viewer.rotationSpeedMultiplier = v;
    ui.rotationSpeedValue.textContent = String(v);
  });

  ui.sunSwitch.addEventListener('click', () => {
    toggleSwitch(ui.sunSwitch, (v) => { viewer.sunEnabled = v; });
  });
  ui.sunSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      ui.sunSwitch.click();
    }
  });
  ui.sunAzimuth.addEventListener('input', () => {
    const az = parseInt(ui.sunAzimuth.value, 10);
    viewer.setSunDirection(az, parseInt(ui.sunElevation.value, 10));
    ui.sunAzimuthValue.textContent = az + '°';
  });
  ui.sunElevation.addEventListener('input', () => {
    const elv = parseInt(ui.sunElevation.value, 10);
    viewer.setSunDirection(parseInt(ui.sunAzimuth.value, 10), elv);
    ui.sunElevationValue.textContent = elv + '°';
  });
  ui.sunIntensity.addEventListener('input', () => {
    const v = parseFloat(ui.sunIntensity.value);
    viewer.setSunIntensity(v);
    ui.sunIntensityValue.textContent = String(v);
  });
  ui.sunColor.addEventListener('input', () => {
    viewer.setSunColor(parseInt(ui.sunColor.value.slice(1), 16));
  });

  function addWheelToRange(rangeInput: HTMLInputElement): void {
    const wrap = rangeInput.closest('label') || rangeInput.parentElement;
    if (!wrap) return;
    wrap.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const min = parseFloat(rangeInput.min);
        const max = parseFloat(rangeInput.max);
        const step = parseFloat(rangeInput.step) || 1;
        const cur = parseFloat(rangeInput.value);
        const delta = e.deltaY > 0 ? -step : step;
        const next = Math.min(max, Math.max(min, cur + delta));
        if (next === cur) return;
        rangeInput.value = String(next);
        rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
      },
      { passive: false }
    );
  }
  addWheelToRange(ui.rotationSpeed);
  addWheelToRange(ui.sunAzimuth);
  addWheelToRange(ui.sunElevation);
  addWheelToRange(ui.sunIntensity);

  ui.transitionSelect.addEventListener('change', () => {
    viewer.transitionType = ui.transitionSelect.value;
  });

  ui.zipInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    const nameEl = byId<HTMLSpanElement>(root, 'zipFileName');
    if (nameEl) nameEl.textContent = file ? file.name : '';
    if (file) {
      loadedPacks.push({ name: file.name, blob: file });
      populateTexturePackSelect();
      ui.texturePackSelect.value = String(loadedPacks.length - 1);
      void viewer.applyTextureZip(file);
    }
  });

  ui.snapshotBtn.addEventListener('click', () => {
    const dataUrl = viewer.snapshot();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.download = 'snapshot.png';
    a.href = dataUrl;
    a.click();
  });

  ui.fullscreenBtn.addEventListener('click', () => { viewer.toggleFullscreen(); });
  document.addEventListener('fullscreenchange', () => {
    const isFs = document.fullscreenElement != null;
    ui.fullscreenIcon.innerHTML = isFs
      ? '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>'
      : '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>';
  });

  ui.wireframeSwitch.addEventListener('click', () => {
    toggleSwitch(ui.wireframeSwitch, (v) => { viewer.wireframe = v; });
  });
  ui.wireframeSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      ui.wireframeSwitch.click();
    }
  });

  ui.hemisphereSwitch.addEventListener('click', () => {
    toggleSwitch(ui.hemisphereSwitch, (v) => { viewer.hemisphereEnabled = v; });
  });
  ui.hemisphereSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      ui.hemisphereSwitch.click();
    }
  });

  ui.shadowCatcherSwitch.addEventListener('click', () => {
    toggleSwitch(ui.shadowCatcherSwitch, (v) => { viewer.shadowCatcher = v; });
  });
  ui.shadowCatcherSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      ui.shadowCatcherSwitch.click();
    }
  });

  function applyFog(): void {
    const enabled = ui.fogSwitch.classList.contains('on');
    const color = parseInt(ui.fogColor.value.slice(1), 16);
    viewer.setFog(enabled, color);
    ui.fogColorLabel.style.display = enabled ? 'flex' : 'none';
  }

  ui.fogSwitch.addEventListener('click', () => {
    ui.fogSwitch.classList.toggle('on');
    ui.fogSwitch.setAttribute('aria-checked', String(ui.fogSwitch.classList.contains('on')));
    applyFog();
  });
  ui.fogSwitch.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      ui.fogSwitch.click();
    }
  });
  ui.fogColor.addEventListener('input', applyFog);

  function applyBackground(): void {
    if (ui.bgTransparent.checked) {
      viewer.setBackground('transparent');
      ui.bgColor.disabled = true;
    } else {
      ui.bgColor.disabled = false;
      viewer.setBackground(parseInt(ui.bgColor.value.slice(1), 16));
    }
  }

  ui.bgColor.addEventListener('input', applyBackground);
  ui.bgTransparent.addEventListener('change', applyBackground);

  ui.camFrontBtn.addEventListener('click', () => void viewer.setCameraPreset('front'));
  ui.camSideBtn.addEventListener('click', () => void viewer.setCameraPreset('side'));
  ui.camTopBtn.addEventListener('click', () => void viewer.setCameraPreset('top'));
  ui.camIsoBtn.addEventListener('click', () => void viewer.setCameraPreset('iso'));

  viewer.addEventListener('model-loaded', () => {
    if (ui.texturePackSelect.value !== 'vanilla') applyTexturePackSelection();
  });
  viewer.addEventListener('error', (e: Event) => {
    const detail = (e as CustomEvent<{ message?: string }>).detail;
    console.error(LOG, 'Viewer error:', detail);
  });
  viewer.addEventListener('texture-pack-applied', (e) => {
    const d = (e as CustomEvent<{ errors?: string[]; applied?: number; fromDefault?: number }>).detail;
    if (d?.errors?.length) {
      console.warn(LOG, 'Texture pack applied with errors:', d.errors);
    }
  });

  const toolbarExtra = byId<HTMLDivElement>(root, 'toolbarExtra');
  const toolbarExtraToggle = byId<HTMLButtonElement>(root, 'toolbarExtraToggle');
  if (toolbarExtra && toolbarExtraToggle) {
    const syncToggleLabel = (): void => {
      const expanded = !toolbarExtra.hidden;
      toolbarExtraToggle.setAttribute('aria-expanded', String(expanded));
      toolbarExtraToggle.textContent = expanded
        ? (toolbarExtraToggle.dataset.labelExpanded ?? 'Hide extras')
        : (toolbarExtraToggle.dataset.labelCollapsed ?? 'Show extras');
    };
    toolbarExtraToggle.addEventListener('click', () => {
      toolbarExtra.hidden = !toolbarExtra.hidden;
      syncToggleLabel();
      requestAnimationFrame(() => {
        viewer.updateLayout();
        requestAnimationFrame(() => viewer.updateLayout());
      });
    });
    syncToggleLabel();
  }
}
