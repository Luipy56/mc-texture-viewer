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
