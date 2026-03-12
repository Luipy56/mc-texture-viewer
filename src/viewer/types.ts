/**
 * Available texture-swap transition animations.
 * - 'none'     : instant swap, no animation.
 * - 'dissolve' : model dissolves into noise/particles, new textures materialize.
 * - 'flash'    : white overlay flash covers model, reveals new textures underneath.
 * - 'zoom'     : model shrinks + fades out, then grows + fades in with new textures.
 * - 'brush'    : a horizontal wipe sweeps across the model revealing new textures.
 * - 'spin'     : model spins 180° on Y while crossfading textures mid-rotation.
 */
export type TransitionType = 'none' | 'dissolve' | 'flash' | 'zoom' | 'brush' | 'spin';

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
