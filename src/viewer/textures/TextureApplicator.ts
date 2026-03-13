import {
  TextureLoader,
  RGBAFormat,
  NearestFilter,
  DoubleSide,
  FrontSide,
  type Material,
  type Texture,
} from 'three';
import type { TextureManifest } from '../types.js';
import type { LoadedModel } from '../SceneManager.js';

export interface TexturePackResult {
  applied: number;
  fromDefault: number;
  errors: string[];
}

/** Apply pixel-art style: no blur, crisp texels (Minecraft-style). */
export function setTexturePixelFilter(texture: Texture): void {
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
}

/** True if the texture image has any alpha channel below 255 (used to apply DoubleSide only to foliage). */
export function textureHasAlpha(texture: Texture): boolean {
  const img = texture.image as HTMLImageElement | undefined;
  if (!img?.complete || img.naturalWidth === 0) return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(img.naturalWidth, 64);
    canvas.height = Math.min(img.naturalHeight, 64);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
    return false;
  } catch {
    return false;
  }
}

export class TextureApplicator {
  private readonly textureLoader = new TextureLoader();
  private readonly _currentTextures = new Map<Material, Texture>();
  private _manifest: TextureManifest | null = null;
  private _defaultBaseUrl = '';

  setManifest(manifest: TextureManifest | null): void {
    this._manifest = manifest;
  }

  setDefaultBaseUrl(url: string): void {
    this._defaultBaseUrl = url.replace(/\/?$/, '/');
  }

  get defaultBaseUrl(): string {
    return this._defaultBaseUrl;
  }

  get manifest(): TextureManifest | null {
    return this._manifest;
  }

  private load(url: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(url, resolve, undefined, reject);
    });
  }

  async applyDefaultTextures(model: LoadedModel, skipTransition = false): Promise<TexturePackResult> {
    void skipTransition;
    if (!this._manifest || !this._defaultBaseUrl) {
      return { applied: 0, fromDefault: 0, errors: ['No manifest or base URL'] };
    }
    const urlMap: Record<string, string> = {};
    for (const slot of this._manifest.slots) {
      urlMap[slot.filename] = this._defaultBaseUrl + slot.filename;
      urlMap[slot.key] = urlMap[slot.filename];
    }
    return this.applyTexturePack(model, urlMap);
  }

  async applyTexturePack(model: LoadedModel, urlMap: Record<string, string>): Promise<TexturePackResult> {
    const result: TexturePackResult = { applied: 0, fromDefault: 0, errors: [] };
    if (!this._manifest) {
      result.errors.push('No texture manifest loaded');
      return result;
    }
    const base = this._defaultBaseUrl;
    for (const slot of this._manifest.slots) {
      const fromZip = urlMap[slot.filename] ?? urlMap[slot.key];
      const url = fromZip ?? (base ? base + slot.filename : '');
      const source = fromZip ? 'ZIP' : base ? 'default' : 'none';
      if (!url) {
        const msg = `No texture for "${slot.key}" (${slot.filename}) and no default base URL`;
        result.errors.push(msg);
        console.warn('[mc-texture-viewer] applyTexturePack: skip', slot.key, '-', msg);
        continue;
      }
      const material = slot.materialName
        ? model.materials.find((m) => m.name === slot.materialName)
        : model.materials[0];
      if (!material) {
        const msg = `Material "${slot.materialName ?? 'default'}" not found for slot "${slot.key}"`;
        result.errors.push(msg);
        continue;
      }
      const mat = material as Material & { map?: Texture };
      const old = this._currentTextures.get(material);
      if (old) {
        old.dispose();
        this._currentTextures.delete(material);
      }
      try {
        console.log('[mc-texture-viewer] loading', slot.key, 'from', source, '→', url.slice(0, 60));
        const texture = await this.load(url);
        texture.format = RGBAFormat;
        texture.colorSpace = 'srgb';
        setTexturePixelFilter(texture);
        mat.map = texture;
        const m = material as Material & { transparent?: boolean; alphaTest?: number; depthWrite?: boolean; side?: number };
        if (textureHasAlpha(texture)) {
          m.transparent = true;
          m.alphaTest = 0.01;
          m.depthWrite = true;
          m.side = DoubleSide;
        } else {
          m.transparent = false;
          m.alphaTest = 0;
          m.side = FrontSide;
        }
        this._currentTextures.set(material, texture);
        result.applied++;
        if (!fromZip) result.fromDefault++;
      } catch (err) {
        const msg = `Failed to load "${slot.key}" (${slot.filename}): ${err instanceof Error ? err.message : String(err)}`;
        result.errors.push(msg);
        console.error('[mc-texture-viewer]', msg);
      }
    }
    return result;
  }

  applyWireframe(model: LoadedModel | null, value: boolean): void {
    if (!model) return;
    for (const mat of model.materials) {
      (mat as Material & { wireframe?: boolean }).wireframe = value;
      mat.needsUpdate = true;
    }
  }

  disposeAll(): void {
    for (const tex of this._currentTextures.values()) tex.dispose();
    this._currentTextures.clear();
  }
}
