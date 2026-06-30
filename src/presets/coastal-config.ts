import type {
  BoardVersion,
  HarborPreset,
  HexCoord,
  ProductiveResource,
} from "@/domain/board";
import { coordKey } from "@/domain/board";
import { HEX_DIRECTIONS } from "@/geometry/hex";

/** 港口槽位类型：`generic` 为 3:1，其余为对应资源 2:1 */
export type HarborKind = "generic" | ProductiveResource;

/** 港口槽位配置：仅保留坐标、类型与开口方向，id 由版本前缀生成 */
export interface HarborSlotConfig {
  sea: HexCoord;
  kind: HarborKind;
  facingEdge: HarborPreset["facingEdge"];
}

/** 某一版图的海洋与港口集中配置 */
export interface CoastalPresetConfig {
  /** 沿海洋环顺时针排列的固定港口顺序 */
  harbors: readonly HarborSlotConfig[];
}

const HARBOR_ID_PREFIX: Record<BoardVersion, string> = {
  base: "base-h",
  extension: "ext-h",
};

export const isGenericHarborKind = (kind: HarborKind): kind is "generic" =>
  kind === "generic";

/** 由陆地边界推导外围海洋六边形环 */
export const seaBoundary = (land: readonly HexCoord[]): HexCoord[] => {
  const landKeys = new Set(land.map(coordKey));
  const sea = new Map<string, HexCoord>();
  for (const coord of land) {
    for (const direction of HEX_DIRECTIONS) {
      const neighbor = { q: coord.q + direction.q, r: coord.r + direction.r };
      if (!landKeys.has(coordKey(neighbor)))
        sea.set(coordKey(neighbor), neighbor);
    }
  }
  return [...sea.values()];
};

/** 2–4 人：9 港（4×3:1 + 5×2:1） */
const BASE_HARBORS: readonly HarborSlotConfig[] = [
  { sea: { q: 2, r: -3 }, kind: "wool", facingEdge: 4 },
  { sea: { q: 3, r: -2 }, kind: "generic", facingEdge: 4 },
  { sea: { q: 3, r: 0 }, kind: "generic", facingEdge: 3 },
  { sea: { q: 1, r: 2 }, kind: "brick", facingEdge: 2 },
  { sea: { q: -1, r: 3 }, kind: "wood", facingEdge: 2 },
  { sea: { q: -3, r: 3 }, kind: "generic", facingEdge: 1 },
  { sea: { q: -3, r: 1 }, kind: "grain", facingEdge: 0 },
  { sea: { q: -2, r: -1 }, kind: "ore", facingEdge: 0 },
  { sea: { q: 0, r: -3 }, kind: "generic", facingEdge: 5 },
];

/** 5–6 人：11 港（在基础版上增加 1×3:1 与 1×羊毛 2:1） */
const EXTENSION_HARBORS: readonly HarborSlotConfig[] = [
  { sea: { q: 2, r: -4 }, kind: "wool", facingEdge: 4 },
  { sea: { q: 3, r: -3 }, kind: "generic", facingEdge: 4 },
  { sea: { q: 3, r: 0 }, kind: "generic", facingEdge: 3 },
  { sea: { q: 1, r: 2 }, kind: "brick", facingEdge: 2 },
  { sea: { q: 0, r: 3 }, kind: "wool", facingEdge: 3 },
  { sea: { q: -2, r: 4 }, kind: "wood", facingEdge: 2 },
  { sea: { q: -4, r: 4 }, kind: "generic", facingEdge: 1 },
  { sea: { q: -4, r: 2 }, kind: "grain", facingEdge: 0 },
  { sea: { q: -4, r: 1 }, kind: "generic", facingEdge: 1 },
  { sea: { q: -3, r: -1 }, kind: "ore", facingEdge: 0 },
  { sea: { q: 0, r: -4 }, kind: "generic", facingEdge: 5 },
];

export const COASTAL_CONFIGS: Record<BoardVersion, CoastalPresetConfig> = {
  base: { harbors: BASE_HARBORS },
  extension: { harbors: EXTENSION_HARBORS },
};

const toHarborPreset = (slot: HarborSlotConfig, id: string): HarborPreset =>
  isGenericHarborKind(slot.kind)
    ? { id, sea: slot.sea, kind: "generic", facingEdge: slot.facingEdge }
    : {
        id,
        sea: slot.sea,
        kind: "resource",
        resource: slot.kind,
        facingEdge: slot.facingEdge,
      };

export const buildHarborPresets = (version: BoardVersion): HarborPreset[] =>
  COASTAL_CONFIGS[version].harbors.map((slot, index) =>
    toHarborPreset(slot, `${HARBOR_ID_PREFIX[version]}${index}`),
  );

export const buildCoastalPreset = (
  version: BoardVersion,
  landCoords: readonly HexCoord[],
): { seaCoords: HexCoord[]; harbors: HarborPreset[] } => ({
  seaCoords: seaBoundary(landCoords),
  harbors: buildHarborPresets(version),
});

export const validateCoastalConfig = (
  landCoords: readonly HexCoord[],
  config: CoastalPresetConfig,
): string[] => {
  const issues: string[] = [];
  const landKeys = new Set(landCoords.map(coordKey));
  const seaKeys = new Set(seaBoundary(landCoords).map(coordKey));
  const seenHarborSea = new Set<string>();

  for (const [index, harbor] of config.harbors.entries()) {
    const seaKey = coordKey(harbor.sea);
    if (!seaKeys.has(seaKey)) {
      issues.push(`harbor[${index}] sea ${seaKey} is not on the ocean ring`);
    }
    if (seenHarborSea.has(seaKey)) {
      issues.push(`harbor[${index}] duplicates sea coordinate ${seaKey}`);
    }
    seenHarborSea.add(seaKey);

    if (harbor.facingEdge < 0 || harbor.facingEdge > 5) {
      issues.push(
        `harbor[${index}] facingEdge ${harbor.facingEdge} is out of range`,
      );
    }

    const direction = HEX_DIRECTIONS[harbor.facingEdge];
    if (!direction) {
      issues.push(
        `harbor[${index}] facingEdge ${harbor.facingEdge} is out of range`,
      );
      continue;
    }
    const landNeighbor = {
      q: harbor.sea.q + direction.q,
      r: harbor.sea.r + direction.r,
    };
    if (!landKeys.has(coordKey(landNeighbor))) {
      issues.push(
        `harbor[${index}] facingEdge ${harbor.facingEdge} does not point to land`,
      );
    }
  }

  return issues;
};
