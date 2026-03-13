import {
  Box3,
  Vector3,
  Plane,
  type Group,
  type Mesh,
  type Material,
  type MeshStandardMaterial,
  type MeshPhongMaterial,
  type MeshLambertMaterial,
  type MeshBasicMaterial,
  type WebGLRenderer,
  type Scene,
} from 'three';
import type { TransitionType } from '../types.js';

export class TransitionManager {
  private _type: TransitionType = 'spin';
  private _overlay: HTMLDivElement | null = null;

  constructor(
    private readonly renderer: WebGLRenderer,
    private readonly scene: Scene,
  ) {}

  set type(t: TransitionType) { this._type = t; }
  get type(): TransitionType { return this._type; }

  private getMaterials(group: Group): (MeshStandardMaterial | MeshPhongMaterial | MeshLambertMaterial | MeshBasicMaterial)[] {
    const mats: (MeshStandardMaterial | MeshPhongMaterial | MeshLambertMaterial | MeshBasicMaterial)[] = [];
    const seen = new Set<Material>();
    group.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of arr) {
        if (!seen.has(m)) {
          seen.add(m);
          mats.push(m as MeshStandardMaterial);
        }
      }
    });
    return mats;
  }

  /**
   * Linear interpolation helper. Resolves after `duration` ms, calling `tick(t)` with t in [0,1]
   * each frame. t follows an ease-in-out curve.
   */
  animate(duration: number, tick: (t: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now: number) => {
        const raw = Math.min((now - start) / duration, 1);
        const t = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;
        tick(t);
        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }

  private ensureOverlay(): HTMLDivElement {
    if (this._overlay) return this._overlay;
    const canvas = this.renderer.domElement;
    const parent = canvas.parentElement;
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      'opacity:0',
      'z-index:10',
      'border-radius:inherit',
    ].join(';');
    if (parent) {
      const ps = getComputedStyle(parent).position;
      if (ps === 'static') parent.style.position = 'relative';
      parent.appendChild(overlay);
    } else {
      overlay.style.position = 'fixed';
      document.body.appendChild(overlay);
    }
    this._overlay = overlay;
    return overlay;
  }

  removeOverlay(): void {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }

  private static readonly ZOOM_FINAL_SCALE = 0.92;

  private async transitionZoom(group: Group, applyTextures: () => Promise<void>): Promise<void> {
    const mats = this.getMaterials(group);
    const origTransparent = mats.map((m) => (m as { transparent?: boolean }).transparent ?? false);
    for (const m of mats) { (m as { transparent: boolean }).transparent = true; m.needsUpdate = true; }

    await this.animate(380, (t) => {
      const scale = 1 - t * (1 - TransitionManager.ZOOM_FINAL_SCALE);
      group.scale.set(scale, scale, scale);
      for (const m of mats) { (m as { opacity: number }).opacity = 1 - t; m.needsUpdate = true; }
    });
    await applyTextures();
    await this.animate(380, (t) => {
      group.scale.set(TransitionManager.ZOOM_FINAL_SCALE, TransitionManager.ZOOM_FINAL_SCALE, TransitionManager.ZOOM_FINAL_SCALE);
      for (const m of mats) { (m as { opacity: number }).opacity = t; m.needsUpdate = true; }
    });

    group.scale.set(TransitionManager.ZOOM_FINAL_SCALE, TransitionManager.ZOOM_FINAL_SCALE, TransitionManager.ZOOM_FINAL_SCALE);
    for (let i = 0; i < mats.length; i++) {
      (mats[i] as { opacity: number }).opacity = 1;
      (mats[i] as { transparent: boolean }).transparent = origTransparent[i];
      mats[i].needsUpdate = true;
    }
  }

  private async transitionBrush(group: Group, applyTextures: () => Promise<void>): Promise<void> {
    const box = new Box3().setFromObject(group);
    const minX = box.min.x;
    const maxX = box.max.x;
    const width = maxX - minX || 1;
    const mats = this.getMaterials(group);

    this.renderer.clippingPlanes = [new Plane(new Vector3(1, 0, 0), -maxX)];
    this.renderer.localClippingEnabled = true;

    await this.animate(500, (t) => {
      this.renderer.clippingPlanes = [new Plane(new Vector3(1, 0, 0), -(minX + width * t))];
    });
    await applyTextures();
    await this.animate(500, (t) => {
      this.renderer.clippingPlanes = [new Plane(new Vector3(1, 0, 0), -(minX + width * (1 - t)))];
    });

    this.renderer.clippingPlanes = [];
    this.renderer.localClippingEnabled = false;
    void mats;
  }

  private async transitionSpin(group: Group, applyTextures: () => Promise<void>): Promise<void> {
    const startRotY = group.rotation.y;
    const mats = this.getMaterials(group);
    const origTransparent = mats.map((m) => (m as { transparent?: boolean }).transparent ?? false);
    let texturesSwapped = false;

    for (const m of mats) { (m as { transparent: boolean }).transparent = true; m.needsUpdate = true; }

    await this.animate(900, (t) => {
      group.rotation.y = startRotY + 2 * Math.PI * t;
      const opacity = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2;
      for (const m of mats) { (m as { opacity: number }).opacity = opacity; m.needsUpdate = true; }
      if (!texturesSwapped && t >= 0.5) {
        texturesSwapped = true;
        void applyTextures();
      }
    });

    if (!texturesSwapped) await applyTextures();

    group.rotation.y = startRotY;
    for (let i = 0; i < mats.length; i++) {
      (mats[i] as { opacity: number }).opacity = 1;
      (mats[i] as { transparent: boolean }).transparent = origTransparent[i];
      mats[i].needsUpdate = true;
    }
  }

  async runWithTransition(group: Group | null, applyTextures: () => Promise<void>): Promise<void> {
    if (!group) { await applyTextures(); return; }
    switch (this._type) {
      case 'zoom':  await this.transitionZoom(group, applyTextures); break;
      case 'brush': await this.transitionBrush(group, applyTextures); break;
      case 'spin':  await this.transitionSpin(group, applyTextures); break;
      default:      await applyTextures(); break;
    }
  }

  async slideOut(group: Group, direction: 'up' | 'down'): Promise<void> {
    const box = new Box3().setFromObject(group);
    const size = new Vector3(); box.getSize(size);
    const slideY = size.y * 3 + 10;
    const sign = direction === 'up' ? 1 : -1;
    const startY = group.position.y;
    await this.animate(340, (t) => { group.position.y = startY + sign * slideY * t; });
    group.position.y = startY + sign * slideY;
  }

  async slideIn(group: Group, direction: 'up' | 'down'): Promise<void> {
    const box = new Box3().setFromObject(group);
    const size = new Vector3(); box.getSize(size);
    const slideY = size.y * 3 + 10;
    const sign = direction === 'up' ? -1 : 1;
    const targetY = group.position.y;
    group.position.y = targetY + sign * slideY;
    await this.animate(340, (t) => { group.position.y = targetY + sign * slideY * (1 - t); });
    group.position.y = targetY;
  }

  dispose(): void {
    this.removeOverlay();
    this.renderer.clippingPlanes = [];
    this.renderer.localClippingEnabled = false;
    void this.scene;
  }
}
