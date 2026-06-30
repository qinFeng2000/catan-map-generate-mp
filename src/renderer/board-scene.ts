import {
  coordKey,
  type BoardPreset,
  type BoardVersion,
  type GeneratedBoard,
  type HexCoord,
} from "@/domain/board";
import type { GeneratorRules } from "@/domain/rules";
import {
  edgeEndpoints,
  hexCorners,
  hexToPoint,
  harborOpeningTriangle,
  type Point,
} from "@/geometry/hex";
import type { DrawCommand } from "./commands";

export interface SceneOptions {
  width: number;
  height: number;
  includeSummary: boolean;
  includeLegend?: boolean;
  title?: string;
  ruleLines?: readonly string[];
}

export const RESOURCE_COLORS = {
  wood: "#3f8f4b",
  wool: "#8fd694",
  grain: "#f0c84b",
  brick: "#c8793d",
  ore: "#7d8996",
  desert: "#ead8a8",
  sea: "#69a9d2",
} as const;

export const harborOpeningFill = (
  kind: "generic" | "resource",
  resource?: keyof typeof RESOURCE_COLORS,
): string =>
  kind === "generic" ? "#E7D9AD" : RESOURCE_COLORS[resource ?? "wood"];

const LABEL_MARGIN = 0.2;
const PAGE_PADDING = 12;
const PAGE_VERTICAL_PADDING = 16;
const LEGEND_TOP_GAP = 28;
const LEGEND_BOTTOM_GAP = 26;
const SHARE_TOP = 110;
const SHARE_BOTTOM = 300;
const SHARE_CANVAS_WIDTH = 1200;
const SHARE_CANVAS_MIN_RATIO = 1.5;
const RESOURCE_LEGEND = [
  ["wood", "木材"],
  ["brick", "砖块"],
  ["wool", "羊毛"],
  ["grain", "小麦"],
  ["ore", "矿石"],
  ["desert", "沙漠"],
] as const;

const rectPoints = (
  x: number,
  y: number,
  width: number,
  height: number,
): Point[] => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

export const measureBoardBounds = (
  preset: BoardPreset,
): { minX: number; maxX: number; minY: number; maxY: number } => {
  const points: Point[] = [];
  for (const coord of [...preset.seaCoords, ...preset.landCoords]) {
    points.push(...hexCorners(coord, 1), hexToPoint(coord, 1));
  }
  for (const harbor of preset.harbors) {
    points.push(
      hexToPoint(harbor.sea, 1),
      ...edgeEndpoints(harbor.sea, 1, harbor.facingEdge),
    );
  }
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};

export const getPageCanvasSize = (
  preset: BoardPreset,
  width = 686,
  includeSummary = false,
): { width: number; height: number } => {
  const { minX, maxX, minY, maxY } = measureBoardBounds(preset);
  const mapWidth = maxX - minX + LABEL_MARGIN * 2;
  const mapHeight = maxY - minY + LABEL_MARGIN * 2;
  const top = includeSummary
    ? SHARE_TOP + LEGEND_TOP_GAP + LEGEND_BOTTOM_GAP
    : PAGE_VERTICAL_PADDING + LEGEND_TOP_GAP + LEGEND_BOTTOM_GAP;
  const bottom = includeSummary ? SHARE_BOTTOM : PAGE_VERTICAL_PADDING;
  const padding = includeSummary ? 24 : PAGE_PADDING;
  const scale = (width - padding * 2) / mapWidth;
  return { width, height: Math.ceil(mapHeight * scale + top + bottom) };
};

export const getShareCanvasSize = (
  preset: BoardPreset,
  width = SHARE_CANVAS_WIDTH,
): { width: number; height: number } => {
  const naturalSize = getPageCanvasSize(preset, width, true);
  return {
    width,
    height: Math.max(
      naturalSize.height,
      Math.ceil(width * SHARE_CANVAS_MIN_RATIO),
    ),
  };
};

export const enabledRuleLines = (
  rules: GeneratorRules,
  version: BoardVersion,
): string[] => {
  const lines: string[] = [];
  if (rules.avoidCoastalDesert) lines.push("水边无沙漠");
  if (rules.uniqueNumberGroupPerResource)
    lines.push("同一资源不能出现相同数字组");
  if (rules.intersectionResourceLimitEnabled)
    lines.push(`交叉路口相同资源最多 ${rules.maxSameResourcePerIntersection}`);
  if (rules.maximizeSameNumberDistance) lines.push("最大化相同数字之间的距离");
  if (rules.forbidAdjacentSameNumberGroup) lines.push("6 和 8 不相邻");
  if (rules.disjointWoodBrickNumbers) lines.push("木材和砖块编号不相同");
  if (rules.balanceResourcePips) lines.push("资源平衡");
  if (rules.fairIntersections) lines.push("交叉路口公平");
  if (version === "extension" && rules.disjointWoodBrickNumbers)
    lines.push("扩充例外：木材和砖块共享一个数字");
  return lines;
};

export const createBoardScene = (
  board: GeneratedBoard,
  preset: BoardPreset,
  options: SceneOptions,
): DrawCommand[] => {
  const { minX, maxX, minY, maxY } = measureBoardBounds(preset);
  const mapWidth = maxX - minX + LABEL_MARGIN * 2;
  const mapHeight = maxY - minY + LABEL_MARGIN * 2;
  const top = options.includeSummary
    ? SHARE_TOP + LEGEND_TOP_GAP + LEGEND_BOTTOM_GAP
    : PAGE_VERTICAL_PADDING + LEGEND_TOP_GAP + LEGEND_BOTTOM_GAP;
  const bottom = options.includeSummary ? SHARE_BOTTOM : PAGE_VERTICAL_PADDING;
  const padding = options.includeSummary ? 24 : PAGE_PADDING;
  const scale = Math.min(
    (options.width - padding * 2) / mapWidth,
    (options.height - top - bottom) / mapHeight,
  );
  const offsetCenterX = (minX + maxX) / 2;
  const offsetCenterY = (minY + maxY) / 2;
  const offsetX = options.width / 2 - offsetCenterX * scale;
  const offsetY =
    top + (options.height - top - bottom) / 2 - offsetCenterY * scale;
  const project = ({ x, y }: Point): Point => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  });
  const polygon = (coord: HexCoord) => hexCorners(coord, 1).map(project);
  const center = (coord: HexCoord) => project(hexToPoint(coord, 1));
  const commands: DrawCommand[] = [
    {
      kind: "clear",
      color: "#f7f4ec",
      width: options.width,
      height: options.height,
    },
  ];

  preset.seaCoords.forEach((coord) =>
    commands.push({
      kind: "polygon",
      points: polygon(coord),
      fill: RESOURCE_COLORS.sea,
      stroke: RESOURCE_COLORS.sea,
      lineWidth: Math.max(1, scale * 0.01),
      tag: "sea-hex",
    }),
  );
  preset.harbors.forEach((harbor) => {
    const [apex, left, right] = harborOpeningTriangle(
      harbor.sea,
      1,
      harbor.facingEdge,
    ).map((point) => project(point)) as [Point, Point, Point];
    const fill = harborOpeningFill(harbor.kind, harbor.resource);
    commands.push({
      kind: "polygon",
      points: [apex, left, right],
      fill,
      stroke: fill,
      lineWidth: 0,
      tag: "harbor-opening",
    });
  });

  const byKey = new Map(board.hexes.map((hex) => [coordKey(hex.coord), hex]));
  preset.landCoords.forEach((coord) => {
    const hex = byKey.get(coordKey(coord));
    if (!hex) return;
    commands.push({
      kind: "polygon",
      points: polygon(coord),
      fill: RESOURCE_COLORS[hex.resource],
      stroke: RESOURCE_COLORS[hex.resource],
      lineWidth: Math.max(1, scale * 0.012),
      tag: "land-hex",
    });
    const at = center(coord);
    if (hex.number === null) return;
    commands.push({
      kind: "circle",
      center: at,
      radius: scale * 0.31,
      fill: "#fff7dd",
      stroke: "#fff7dd",
      lineWidth: 0,
      tag: "number-token",
    });
    commands.push({
      kind: "text",
      at,
      text: String(hex.number),
      color: hex.number === 6 || hex.number === 8 ? "#c83a2f" : "#24313a",
      fontSize: scale * 0.42,
      weight: "bold",
      align: "center",
      tag: "number-text",
    });
  });

  if (options.includeLegend ?? true) {
    const itemGap = Math.max(22, scale * 0.21);
    const swatchSize = Math.max(12, scale * 0.17);
    const fontSize = Math.max(14, scale * 0.2);
    const rowHeight = fontSize + 10;
    const startX = PAGE_PADDING + 4;
    const rightLimit = options.width - PAGE_PADDING;
    const startY = options.includeSummary
      ? SHARE_TOP + LEGEND_TOP_GAP
      : PAGE_VERTICAL_PADDING + LEGEND_TOP_GAP;
    let y = startY;
    let x = PAGE_PADDING + 4;
    RESOURCE_LEGEND.forEach(([resource, label]) => {
      const itemWidth = swatchSize + 6 + fontSize * label.length + itemGap;
      if (x > startX && x + itemWidth > rightLimit) {
        x = startX;
        y += rowHeight;
      }
      commands.push({
        kind: "polygon",
        points: rectPoints(x, y - swatchSize / 2, swatchSize, swatchSize),
        fill: RESOURCE_COLORS[resource],
        stroke: RESOURCE_COLORS[resource],
        lineWidth: 0,
        tag: "resource-legend-swatch",
      });
      commands.push({
        kind: "text",
        at: { x: x + swatchSize + 6, y },
        text: label,
        color: "#29333a",
        fontSize,
        weight: "bold",
        align: "left",
        tag: "resource-legend-label",
      });
      x += itemWidth;
    });
  }

  if (options.includeSummary) {
    commands.push({
      kind: "text",
      at: { x: options.width / 2, y: 66 },
      text: options.title ?? "卡坦岛地图生成器",
      color: "#29333a",
      fontSize: 42,
      weight: "bold",
      align: "center",
      tag: "share-title",
    });
    commands.push({
      kind: "text",
      at: { x: options.width / 2, y: 108 },
      text: board.version === "base" ? "2–4 人版" : "5–6 人扩充版",
      color: "#73808a",
      fontSize: 25,
      weight: "normal",
      align: "center",
      tag: "share-version",
    });
    (options.ruleLines ?? []).slice(0, 8).forEach((line, index) =>
      commands.push({
        kind: "text",
        at: { x: 70, y: options.height - bottom + 54 + index * 28 },
        text: `✓ ${line}`,
        color: "#52616b",
        fontSize: 22,
        weight: "normal",
        align: "left",
        tag: "share-rule",
      }),
    );
    const metricX = options.width - 70;
    commands.push({
      kind: "text",
      at: { x: metricX, y: options.height - 140 },
      text: `同组数字最短距离 ${board.metrics.sameNumberMinDistance} 格`,
      color: "#29333a",
      fontSize: 23,
      weight: "bold",
      align: "right",
      tag: "share-metric",
    });
    commands.push({
      kind: "text",
      at: { x: metricX, y: options.height - 105 },
      text: `资源概率最大差值 ${board.metrics.resourcePipRange}`,
      color: "#29333a",
      fontSize: 23,
      weight: "bold",
      align: "right",
      tag: "share-metric",
    });
    commands.push({
      kind: "text",
      at: { x: metricX, y: options.height - 70 },
      text: `交叉点最高 ${board.metrics.intersectionMaxPips} · 最大差值 ${board.metrics.intersectionPipRange}`,
      color: "#29333a",
      fontSize: 23,
      weight: "bold",
      align: "right",
      tag: "share-metric",
    });
    commands.push({
      kind: "text",
      at: { x: options.width - 70, y: options.height - 28 },
      text: "Fisher–Yates 随机排序 · 约束化生成",
      color: "#8a959c",
      fontSize: 18,
      weight: "normal",
      align: "right",
      tag: "share-algorithm",
    });
  }
  return commands;
};
