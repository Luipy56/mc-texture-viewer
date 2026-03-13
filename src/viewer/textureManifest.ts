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

/**
 * Manifest for the Cherry OBJ/MTL model (Blockbench export).
 * Paths relative to texture-base-url = ./assets/. Material names match models/cherry/cherry.mtl.
 */
export const cherryManifest: TextureManifest = {
  slots: [
    { key: 'cherry_leaves', filename: 'minecraft/textures/block/cherry_leaves.png', materialName: 'm_2bd455c6-957b-ce53-8e09-360df20704b0' },
    { key: 'grass_block_side', filename: 'minecraft/textures/block/grass_block_side.png', materialName: 'm_564d15ae-29d8-19b7-6c88-ad183569552e' },
    { key: 'grass_block_top', filename: 'minecraft/textures/block/grass_block_top.png', materialName: 'm_4f67e62b-9ed3-6891-b7f8-a9f710422365' },
    { key: 'dirt', filename: 'minecraft/textures/block/dirt.png', materialName: 'm_6d0c50e5-4e6e-3fa8-9c1b-7990822615b0' },
    { key: 'pink_petals', filename: 'minecraft/textures/block/pink_petals.png', materialName: 'm_c4477e27-2b3f-c2b3-0f31-63e7cd880e22' },
    { key: 'pink_petals_stem', filename: 'minecraft/textures/block/pink_petals_stem.png', materialName: 'm_b66b6df3-a882-0566-c959-5506b7c752e9' },
    { key: 'cherry_log', filename: 'minecraft/textures/block/cherry_log.png', materialName: 'm_1a0ca604-2063-e61a-3b9a-00db4b4d6738' },
    { key: 'cherry_log_top', filename: 'minecraft/textures/block/cherry_log_top.png', materialName: 'm_a457f4ef-4564-f066-a679-d769eecf0f48' },
  ],
};

/**
 * Manifest for the Hut OBJ/MTL model (Blockbench export).
 * Paths relative to texture-base-url = ./assets/. Material names match models/hut/hut.mtl.
 */
export const hutManifest: TextureManifest = {
  slots: [
    { key: 'dirt', filename: 'minecraft/textures/block/dirt.png', materialName: 'm_b91aadcb-59a6-f6f0-9504-205001c02f7d' },
    { key: 'grass_block_side', filename: 'minecraft/textures/block/grass_block_side.png', materialName: 'm_12b26c33-94a0-fb5e-9769-97136c51cc14' },
    { key: 'grass_block_top', filename: 'minecraft/textures/block/grass_block_top.png', materialName: 'm_11d5797e-e621-8377-1a7c-3f78cb76b5b7' },
    { key: 'short_grass', filename: 'minecraft/textures/block/short_grass.png', materialName: 'm_a36c6bc9-db52-a33b-599d-ed270435007d' },
    { key: 'clay', filename: 'minecraft/textures/block/clay.png', materialName: 'm_3119b50e-bec0-1fa9-5a49-dbeb99398cfb' },
    { key: 'water_still', filename: 'minecraft/textures/block/water_still.png', materialName: 'm_843085d9-5347-2e6e-ff89-35a5b3c90ca5' },
    { key: 'seagrass', filename: 'minecraft/textures/block/seagrass.png', materialName: 'm_92a3843c-a332-3ea1-66b8-ff7f9c4e8aea' },
    { key: 'spruce_planks', filename: 'minecraft/textures/block/spruce_planks.png', materialName: 'm_aa8b048a-099d-1de8-f014-3117f7f7929b' },
    { key: 'lily_pad', filename: 'minecraft/textures/block/lily_pad.png', materialName: 'm_ab773526-ffdc-fc1e-2077-92021df2913e' },
    { key: 'oak_planks', filename: 'minecraft/textures/block/oak_planks.png', materialName: 'm_2da3946f-c469-06c3-d779-174b1d5d923b' },
    { key: 'oak_log', filename: 'minecraft/textures/block/oak_log.png', materialName: 'm_e50ff972-dfe2-d65e-75a7-781ec01095b4' },
    { key: 'oak_leaves', filename: 'minecraft/textures/block/oak_leaves.png', materialName: 'm_d7115c8e-c68b-9019-047a-562e7bf7a882' },
    { key: 'red_mushroom', filename: 'minecraft/textures/block/red_mushroom.png', materialName: 'm_338543af-abd5-b0cf-0305-89e7e1f92e0d' },
    { key: 'flower_pot', filename: 'minecraft/textures/block/flower_pot.png', materialName: 'm_b0f38e99-254c-cfdb-82d5-5044bc15c2ef' },
    { key: 'oak_log_top', filename: 'minecraft/textures/block/oak_log_top.png', materialName: 'm_b8d991bd-e58c-d18b-3767-30901b7d9d60' },
    { key: 'crafting_table_front', filename: 'minecraft/textures/block/crafting_table_front.png', materialName: 'm_fb0faf26-5921-0f06-9dce-483183a041be' },
    { key: 'crafting_table_side', filename: 'minecraft/textures/block/crafting_table_side.png', materialName: 'm_169d87af-cadb-4347-0765-13ccce4527da' },
    { key: 'crafting_table_top', filename: 'minecraft/textures/block/crafting_table_top.png', materialName: 'm_486a75c2-6887-f19e-b8fb-a54f6114d1e6' },
    { key: 'cauldron_inner', filename: 'minecraft/textures/block/cauldron_inner.png', materialName: 'm_3bb67e87-98fc-7e0c-b526-bbb9ae19893f' },
    { key: 'cauldron_side', filename: 'minecraft/textures/block/cauldron_side.png', materialName: 'm_be77c9b9-7223-00a7-7917-f9d74d014cf8' },
    { key: 'cauldron_top', filename: 'minecraft/textures/block/cauldron_top.png', materialName: 'm_f11b3a10-16b4-39ec-e35d-3c2ba917c73d' },
    { key: 'pig', filename: 'minecraft/textures/entity/pig/pig.png', materialName: 'm_1e468a3b-a2c1-6454-258d-e70cfda5c3bc' },
  ],
};

/**
 * Manifest for the Birch Forest OBJ/MTL model (Blockbench export).
 * Paths relative to texture-base-url = ./assets/. Material names match models/birch/birch.mtl.
 */
export const birchManifest: TextureManifest = {
  slots: [
    { key: 'grass_block_side', filename: 'minecraft/textures/block/grass_block_side.png', materialName: 'm_f345789e-8c29-1362-029b-4e1923ff296c' },
    { key: 'grass_block_top', filename: 'minecraft/textures/block/grass_block_top.png', materialName: 'm_e666b017-fc47-0710-dabc-d361ede7fe7d' },
    { key: 'dirt', filename: 'minecraft/textures/block/dirt.png', materialName: 'm_80a3ab2b-f5c0-4c6e-a678-4a125a68305d' },
    { key: 'pink_tulip', filename: 'minecraft/textures/block/pink_tulip.png', materialName: 'm_70098ad3-deb5-19dc-8969-a1254067546c' },
    { key: 'birch_leaves', filename: 'minecraft/textures/block/birch_leaves.png', materialName: 'm_20aea295-ea2b-d7a4-9989-a11b1396ee2b' },
    { key: 'birch_log', filename: 'minecraft/textures/block/birch_log.png', materialName: 'm_87069218-6ca0-53fb-6a12-844577fe2503' },
    { key: 'birch_log_top', filename: 'minecraft/textures/block/birch_log_top.png', materialName: 'm_e88582d6-8df6-5ebb-d013-409648e2b5c0' },
    { key: 'red_mushroom', filename: 'minecraft/textures/block/red_mushroom.png', materialName: 'm_36a5cf41-8c07-e67d-3492-52a838f66c95' },
    { key: 'brown_mushroom', filename: 'minecraft/textures/block/brown_mushroom.png', materialName: 'm_07b80522-710e-8ab0-3a5e-b088361a0088' },
    { key: 'pink_petals', filename: 'minecraft/textures/block/pink_petals.png', materialName: 'm_5a1f42bb-e684-b2ac-c9f3-0a59d8e6e67d' },
    { key: 'pink_petals_stem', filename: 'minecraft/textures/block/pink_petals_stem.png', materialName: 'm_b29abc1c-0cb9-aa86-7371-3d440b7a1f9b' },
  ],
};

/**
 * Manifest for the Pyramid OBJ/MTL model (Blockbench export).
 * Paths relative to texture-base-url = ./assets/. Material names match models/pyramid/pyramid.mtl.
 */
export const pyramidManifest: TextureManifest = {
  slots: [
    { key: 'sandstone', filename: 'minecraft/textures/block/sandstone.png', materialName: 'm_3d226b10-38c9-2931-fa0a-f20d8e3b3f2b' },
    { key: 'sandstone_top', filename: 'minecraft/textures/block/sandstone_top.png', materialName: 'm_62d5fa20-4ea7-1200-ce2c-fa7e202c3bcd' },
    { key: 'sandstone_bottom', filename: 'minecraft/textures/block/sandstone_bottom.png', materialName: 'm_516d18fa-03fd-1350-c85f-dfe55acf55fb' },
    { key: 'cut_sandstone', filename: 'minecraft/textures/block/cut_sandstone.png', materialName: 'm_e6b3366a-6c42-4d92-cbbe-c2564c10f5c7' },
    { key: 'sand', filename: 'minecraft/textures/block/sand.png', materialName: 'm_bb2d304e-45a1-c5be-0053-06f8a2db7b60' },
    { key: 'orange_terracotta', filename: 'minecraft/textures/block/orange_terracotta.png', materialName: 'm_c2450b67-a77d-7ec0-f593-9be11bf0ea44' },
    { key: 'chiseled_sandstone', filename: 'minecraft/textures/block/chiseled_sandstone.png', materialName: 'm_c7b0e6f0-a6c3-2633-23fd-b147d6aa9a1f' },
    { key: 'cow', filename: 'minecraft/textures/entity/cow/cow.png', materialName: 'm_ae88375b-515c-4415-1a37-3e34ca9ae5d2' },
  ],
};

/**
 * Manifest for the Crimson Forest OBJ/MTL model (Blockbench export).
 * Paths relative to texture-base-url = ./assets/. Material names match models/crimson-forest/crimson.mtl.
 */
export const crimsonForestManifest: TextureManifest = {
  slots: [
    { key: 'crimson_nylium', filename: 'minecraft/textures/block/crimson_nylium.png', materialName: 'm_cbfd8da3-f5b9-28b4-53b3-1e2e150cbadc' },
    { key: 'crimson_nylium_side', filename: 'minecraft/textures/block/crimson_nylium_side.png', materialName: 'm_b7f27ec5-3f71-2417-60c0-b6ec26f4d2d1' },
    { key: 'netherrack', filename: 'minecraft/textures/block/netherrack.png', materialName: 'm_e03dee85-ad57-5ca2-4ba8-ebf286c0b425' },
    { key: 'nether_wart_block', filename: 'minecraft/textures/block/nether_wart_block.png', materialName: 'm_c9fb8da2-ba44-3a6f-3836-84a16869e402' },
    { key: 'obsidian', filename: 'minecraft/textures/block/obsidian.png', materialName: 'm_c4ef1af6-9f4f-8e89-5ab7-2a529fcaff0b' },
    { key: 'lava_flow', filename: 'minecraft/textures/block/lava_flow.png', materialName: 'm_0c5e5fee-845c-ac10-53af-2323212368c5' },
    { key: 'nether_portal', filename: 'minecraft/textures/block/nether_portal.png', materialName: 'm_89213101-21ab-29ba-4056-09b634180309' },
    { key: 'nether_sprouts', filename: 'minecraft/textures/block/nether_sprouts.png', materialName: 'm_a30e12cd-d1f3-7c9a-ae70-7500132ead86' },
    { key: 'shroomlight', filename: 'minecraft/textures/block/shroomlight.png', materialName: 'm_e017d01a-9f0d-64f2-7d14-69b4951336c9' },
    { key: 'crimson_fungus', filename: 'minecraft/textures/block/crimson_fungus.png', materialName: 'm_5ac92baa-0a89-867e-1d77-a98d905b89f9' },
    { key: 'crimson_stem', filename: 'minecraft/textures/block/crimson_stem.png', materialName: 'm_7367bffa-40e5-db4c-eacb-3488be58d487' },
    { key: 'lava_still', filename: 'minecraft/textures/block/lava_still.png', materialName: 'm_9bb1332c-a8af-1f69-9ac5-2889d2c50d3f' },
    { key: 'crimson_roots', filename: 'minecraft/textures/block/crimson_roots.png', materialName: 'm_1e44c380-ed00-6c81-b754-238e0eb2cd55' },
  ],
};
