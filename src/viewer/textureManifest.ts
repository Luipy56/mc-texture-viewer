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
 * Paths are relative to texture-base-url = ./assets/ (Minecraft resource pack layout).
 * Material names match models/warped-forest/warpedForest.mtl.
 */
export const warpedForestManifest: TextureManifest = {
  slots: [
    { key: 'warped_nylium', filename: 'minecraft/textures/block/warped_nylium.png', materialName: 'm_db844399-9de9-ec2f-40bb-660a98c2c0da' },
    { key: 'warped_nylium_side', filename: 'minecraft/textures/block/warped_nylium_side.png', materialName: 'm_44776fb3-c0af-5062-3644-fbd65634bb72' },
    { key: 'netherrack', filename: 'minecraft/textures/block/netherrack.png', materialName: 'm_64450d3c-4607-95eb-02ef-7378820ef399' },
    { key: 'obsidian', filename: 'minecraft/textures/block/obsidian.png', materialName: 'm_4551aee7-9a03-44a0-83f7-ca5422a9b762' },
    { key: 'nether_portal', filename: 'minecraft/textures/block/nether_portal.png', materialName: 'm_f9aff552-cc3a-cc85-a103-b964ecd121d3' },
    { key: 'warped_wart_block', filename: 'minecraft/textures/block/warped_wart_block.png', materialName: 'm_1b940313-a97b-dea8-aed4-2bc5adec95d8' },
    { key: 'warped_fungus', filename: 'minecraft/textures/block/warped_fungus.png', materialName: 'm_5f9ab2fc-e71f-1df2-c6ae-6eab5e27d11a' },
    { key: 'nether_sprouts', filename: 'minecraft/textures/block/nether_sprouts.png', materialName: 'm_63e63aa8-ee03-661c-c334-14c083288d86' },
    { key: 'shroomlight', filename: 'minecraft/textures/block/shroomlight.png', materialName: 'm_77c93e8d-e9d6-b233-7cbd-f47f4ec75a43' },
    { key: 'crimson_roots', filename: 'minecraft/textures/block/crimson_roots.png', materialName: 'm_5c0cbec4-618a-6a77-46c6-75f50d1a8264' },
    { key: 'twisting_vines_plant', filename: 'minecraft/textures/block/twisting_vines_plant.png', materialName: 'm_b6f5a778-0a12-b640-aa72-1981264f3065' },
    { key: 'twisting_vines', filename: 'minecraft/textures/block/twisting_vines.png', materialName: 'm_68324f4a-89d6-7bad-c6e8-40d7e52659cc' },
    { key: 'warped_stem', filename: 'minecraft/textures/block/warped_stem.png', materialName: 'm_64fd0ae8-d372-ac3a-0a00-7af9d92568d1' },
    { key: 'warped_roots', filename: 'minecraft/textures/block/warped_roots.png', materialName: 'm_52cf8374-92b2-dd38-4616-f8dc109798d8' },
  ],
};

/**
 * Manifest for the Chicken OBJ/MTL model (Blockbench export).
 * Paths relative to texture-base-url = ./assets/ (Minecraft resource pack layout).
 * Material name matches models/chicken/chicken.mtl.
 */
export const chickenManifest: TextureManifest = {
  slots: [
    {
      key: 'chicken',
      filename: 'minecraft/textures/entity/chicken/chicken.png',
      materialName: 'm_6615d2c0-88e6-82a5-e5df-6195f4670fd3',
    },
  ],
};
