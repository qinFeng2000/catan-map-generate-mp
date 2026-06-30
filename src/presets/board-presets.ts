import type {
  BoardPreset,
  HexCoord,
  NumberToken,
  Resource,
} from "@/domain/board";
import { buildCoastalPreset } from "@/presets/coastal-config";

const rows = (widths: readonly number[]): HexCoord[] => {
  const middle = Math.floor(widths.length / 2);
  return widths.flatMap((width, index) => {
    const r = index - middle;
    const qStart = index <= middle ? -index : -middle;
    return Array.from({ length: width }, (_, offset) => ({
      q: qStart + offset,
      r,
    }));
  });
};

const repeat = <T>(value: T, count: number): T[] =>
  Array.from({ length: count }, () => value);
const numberBag = (
  entries: readonly (readonly [NumberToken, number])[],
): NumberToken[] => entries.flatMap(([number, count]) => repeat(number, count));

const baseLand = rows([3, 4, 5, 4, 3]);
const extensionLand = rows([3, 4, 5, 6, 5, 4, 3]);

const baseResources: Resource[] = [
  ...repeat<Resource>("wood", 4),
  ...repeat<Resource>("wool", 4),
  ...repeat<Resource>("grain", 4),
  ...repeat<Resource>("brick", 3),
  ...repeat<Resource>("ore", 3),
  "desert",
];
const extensionResources: Resource[] = [
  ...repeat<Resource>("wood", 6),
  ...repeat<Resource>("wool", 6),
  ...repeat<Resource>("grain", 6),
  ...repeat<Resource>("brick", 5),
  ...repeat<Resource>("ore", 5),
  ...repeat<Resource>("desert", 2),
];

const baseCoastal = buildCoastalPreset("base", baseLand);
const extensionCoastal = buildCoastalPreset("extension", extensionLand);

export const BOARD_PRESETS: Record<"base" | "extension", BoardPreset> = {
  base: {
    version: "base",
    landCoords: baseLand,
    seaCoords: baseCoastal.seaCoords,
    resourceBag: baseResources,
    numberBag: numberBag([
      [2, 1],
      [12, 1],
      [3, 2],
      [4, 2],
      [5, 2],
      [6, 2],
      [8, 2],
      [9, 2],
      [10, 2],
      [11, 2],
    ]),
    harbors: baseCoastal.harbors,
    diameter: 4,
  },
  extension: {
    version: "extension",
    landCoords: extensionLand,
    seaCoords: extensionCoastal.seaCoords,
    resourceBag: extensionResources,
    numberBag: numberBag([
      [2, 2],
      [12, 2],
      [3, 3],
      [4, 3],
      [5, 3],
      [6, 3],
      [8, 3],
      [9, 3],
      [10, 3],
      [11, 3],
    ]),
    harbors: extensionCoastal.harbors,
    diameter: 6,
  },
};
