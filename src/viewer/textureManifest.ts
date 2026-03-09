import type { TextureManifest } from './types.js';

/**
 * Default manifest for the demo/sample model.
 * Maps material names in the GLB to texture filenames.
 * Extend or replace per model as needed.
 */
export const defaultTextureManifest: TextureManifest = {
  slots: [
    { key: 'default', filename: 'default.png', materialName: 'Material' },
  ],
};

/**
 * Manifest for the Warped Forest OBJ/MTL model (Blockbench export).
 * Material names and texture paths match ejemploAntiguoModelo/warpedForest.mtl.
 */
export const warpedForestManifest: TextureManifest = {
  slots: [
    { key: 'warped_nylium', filename: 'default/warped_nylium.png', materialName: 'm_db844399-9de9-ec2f-40bb-660a98c2c0da' },
    { key: 'warped_nylium_side', filename: 'default/warped_nylium_side.png', materialName: 'm_44776fb3-c0af-5062-3644-fbd65634bb72' },
    { key: 'netherrack', filename: 'default/netherrack.png', materialName: 'm_64450d3c-4607-95eb-02ef-7378820ef399' },
    { key: 'obsidian', filename: 'default/obsidian.png', materialName: 'm_4551aee7-9a03-44a0-83f7-ca5422a9b762' },
    { key: 'nether_portal', filename: 'default/nether_portal.png', materialName: 'm_f9aff552-cc3a-cc85-a103-b964ecd121d3' },
    { key: 'warped_wart_block', filename: 'default/warped_wart_block.png', materialName: 'm_1b940313-a97b-dea8-aed4-2bc5adec95d8' },
    { key: 'warped_fungus', filename: 'default/warped_fungus.png', materialName: 'm_5f9ab2fc-e71f-1df2-c6ae-6eab5e27d11a' },
    { key: 'nether_sprouts', filename: 'default/nether_sprouts.png', materialName: 'm_63e63aa8-ee03-661c-c334-14c083288d86' },
    { key: 'shroomlight', filename: 'default/shroomlight.png', materialName: 'm_77c93e8d-e9d6-b233-7cbd-f47f4ec75a43' },
    { key: 'crimson_roots', filename: 'default/crimson_roots.png', materialName: 'm_5c0cbec4-618a-6a77-46c6-75f50d1a8264' },
    { key: 'twisting_vines_plant', filename: 'default/twisting_vines_plant.png', materialName: 'm_b6f5a778-0a12-b640-aa72-1981264f3065' },
    { key: 'twisting_vines', filename: 'default/twisting_vines.png', materialName: 'm_68324f4a-89d6-7bad-c6e8-40d7e52659cc' },
    { key: 'warped_stem', filename: 'default/warped_stem.png', materialName: 'm_64fd0ae8-d372-ac3a-0a00-7af9d92568d1' },
    { key: 'warped_roots', filename: 'default/warped_roots.png', materialName: 'm_52cf8374-92b2-dd38-4616-f8dc109798d8' },
  ],
};
