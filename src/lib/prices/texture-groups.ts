/** Группы фактур для прайса. Цен в этом файле нет: диапазон считается по камням из каталога. */

export const PRICE_TEXTURE_GROUPS = [
  { id: "mono", title: "Монотонная фактура", tags: ["монотонный"] },
  { id: "specks", title: "Вкрапления", tags: ["вкрапления", "вкрапления (terrazzo)", "крупные вкрапления"] },
  { id: "marbling", title: "Разводы", tags: ["разводы"] },
  { id: "veins", title: "Жилы", tags: ["мелкие жилы", "крупные жилы"] }
] as const;

export type PriceTextureRow = {
  id: string;
  title: string;
  min: number;
  max: number;
};

type PricedTexture = {
  textures: readonly string[];
  pricePerSqm: number;
};

/** Минимум и максимум по фактуре. Камень с несколькими фактурами входит в каждую подходящую группу. */
export function texturePriceRows(materials: readonly PricedTexture[]): PriceTextureRow[] {
  return PRICE_TEXTURE_GROUPS.flatMap((group) => {
    const tags = new Set<string>(group.tags);
    const prices = materials
      .filter((material) => material.pricePerSqm > 0 && material.textures.some((texture) => tags.has(texture)))
      .map((material) => material.pricePerSqm);
    if (prices.length === 0) return [];
    return [{ id: group.id, title: group.title, min: Math.min(...prices), max: Math.max(...prices) }];
  });
}
