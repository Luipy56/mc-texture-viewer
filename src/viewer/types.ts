/**
 * Available texture-swap transition animations.
 * - 'none'  : instant swap, no animation.
 * - 'zoom'  : model shrinks + fades out, then grows + fades in with new textures (ends slightly smaller).
 * - 'brush' : a horizontal wipe sweeps across the model revealing new textures.
 * - 'spin'  : model spins 360° on Y while crossfading textures mid-rotation.
 */
export type TransitionType = 'none' | 'zoom' | 'brush' | 'spin';

/**
 * Slot in the texture manifest: maps a logical name to a filename and material.
 */
export interface TextureManifestSlot {
  /** Logical key (e.g. "body", "wheels") */
  key: string;
  /** Expected filename (e.g. "body.png") */
  filename: string;
  /** Material name in the GLB to apply this texture to */
  materialName?: string;
}

/**
 * Manifest describing expected textures for a model.
 */
export interface TextureManifest {
  slots: TextureManifestSlot[];
}
