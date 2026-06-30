# Taro Hex Map Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline Taro 4 map generator for H5 and WeChat Mini Program with 3–4 and 5–6 player presets, Fisher–Yates-ordered constrained generation, fixed directional harbors, rule controls, local persistence, and PNG export.

**Architecture:** Keep board rules, geometry, constrained search, scoring, and render-scene generation as pure TypeScript. The Taro page owns orchestration only; page Canvas and share Canvas consume the same platform-neutral drawing commands. Use seeded random sources in tests, fixed preset tables for harbors, versioned storage, and platform adapters for H5 download versus WeChat preview/save.

**Tech Stack:** Taro 4.2.0, React 18.3.1, TypeScript 5.9, Sass, Canvas 2D, Vitest 4, pnpm 11.

---

## File map

| Path                                     | Responsibility                                           |
| ---------------------------------------- | -------------------------------------------------------- |
| `package.json`                           | Scripts and pinned Taro/runtime/test dependencies        |
| `babel.config.cjs`                       | Taro React TypeScript transform                          |
| `config/index.ts`                        | Shared H5/weapp build configuration                      |
| `config/dev.ts`, `config/prod.ts`        | Environment-specific Taro config                         |
| `tsconfig.json`                          | Strict TypeScript configuration and aliases              |
| `vitest.config.ts`                       | Node-based pure TypeScript test runner                   |
| `project.config.json`                    | WeChat Developer Tools project metadata                  |
| `src/domain/board.ts`                    | Board, resource, number, harbor, metric types            |
| `src/domain/rules.ts`                    | Rule configuration, defaults, number groups, pip weights |
| `src/presets/board-presets.ts`           | Land/sea coordinates, bags, and explicit fixed harbors   |
| `src/geometry/hex.ts`                    | Axial coordinate math and Canvas projection              |
| `src/geometry/topology.ts`               | Adjacency, coast, intersections, and port edge endpoints |
| `src/generator/random.ts`                | Seeded RNG and Fisher–Yates                              |
| `src/generator/resource-search.ts`       | Budgeted constrained resource placement                  |
| `src/generator/number-search.ts`         | Budgeted constrained number placement                    |
| `src/generator/hard-rules.ts`            | Full-board hard-rule validation and diagnostics          |
| `src/generator/scoring.ts`               | Soft metrics and candidate comparison                    |
| `src/generator/generate-board.ts`        | Batched candidate orchestration and best-board selection |
| `src/renderer/commands.ts`               | Platform-neutral draw command types                      |
| `src/renderer/board-scene.ts`            | Board/harbor/share scene construction                    |
| `src/renderer/canvas-executor.ts`        | Taro CanvasContext command execution                     |
| `src/storage/board-storage.ts`           | Versioned Taro local-storage adapter                     |
| `src/pages/index/page-state.ts`          | Pure page state reducer                                  |
| `src/pages/index/use-board-generator.ts` | Page effects and generator orchestration                 |
| `src/components/BoardCanvas/*`           | Visible and offscreen Canvas lifecycle                   |
| `src/components/RulePanel/*`             | Rule switches and intersection-limit stepper             |
| `src/components/MetricSummary/*`         | Explainable score metrics                                |
| `src/sharing/share-image.ts`             | H5 PNG download and WeChat preview/save                  |
| `src/pages/index/*`                      | Single-page composition and styles                       |
| `tests/**/*.test.ts`                     | Pure unit, property, reducer, render, and adapter tests  |

## Fixed conventions

- Use pointy-top axial coordinates and edge indices `0..5` matching directions east, north-east, north-west, west, south-west, south-east.
- Resource identifiers are `wood`, `wool`, `grain`, `brick`, `ore`, `desert`.
- Number-group identifiers are `low` for `2/12`, `hot` for `6/8`, and the number string for all other values.
- Search budgets are 200 valid candidates, 400 candidate attempts, 5,000 resource nodes, 50,000 number nodes, and one event-loop yield per 10 candidate attempts.
- A failed generation never replaces the last successful board.
- Run focused tests before every commit, then run the complete verification stack in Task 12.

---

### Task 1: Bootstrap the Taro 4 React TypeScript shell

**Files:**

- Create: `.gitignore`
- Create: `package.json`
- Create: `babel.config.cjs`
- Create: `config/index.ts`
- Create: `config/dev.ts`
- Create: `config/prod.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `project.config.json`
- Create: `src/app.tsx`
- Create: `src/app.config.ts`
- Create: `src/app.scss`
- Create: `src/index.html`
- Create: `src/pages/index/index.config.ts`
- Create: `src/pages/index/index.tsx`
- Create: `src/pages/index/index.scss`
- Test: `tests/bootstrap.test.ts`

- [ ] **Step 1: Add the package and compiler configuration**

Create `package.json` with one Taro version across every Taro package and React 18 because `@tarojs/react@4.2.0` declares a React 18 peer:

```json
{
  "name": "board-game-mp",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@11.7.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev:h5": "taro build --type h5 --watch",
    "dev:weapp": "taro build --type weapp --watch",
    "build:h5": "taro build --type h5",
    "build:weapp": "taro build --type weapp",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@babel/runtime": "^7.28.0",
    "@tarojs/components": "4.2.0",
    "@tarojs/helper": "4.2.0",
    "@tarojs/plugin-framework-react": "4.2.0",
    "@tarojs/plugin-platform-h5": "4.2.0",
    "@tarojs/plugin-platform-weapp": "4.2.0",
    "@tarojs/react": "4.2.0",
    "@tarojs/runtime": "4.2.0",
    "@tarojs/shared": "4.2.0",
    "@tarojs/taro": "4.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@babel/core": "^7.28.0",
    "@tarojs/cli": "4.2.0",
    "@tarojs/webpack5-runner": "4.2.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "babel-preset-taro": "4.2.0",
    "sass": "^1.101.0",
    "typescript": "^5.9.3",
    "vitest": "^4.1.9"
  }
}
```

Create `babel.config.cjs`:

```js
module.exports = {
  presets: [["taro", { framework: "react", ts: true, compiler: "webpack5" }]],
};
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": false,
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["@tarojs/taro", "@types/react", "vitest/globals"]
  },
  "include": ["src", "tests", "config", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
```

- [ ] **Step 2: Add Taro build configuration**

Create `config/index.ts`:

```ts
import { defineConfig, type UserConfigExport } from "@tarojs/cli";
import devConfig from "./dev";
import prodConfig from "./prod";

export default defineConfig<"webpack5">(async (merge) => {
  const config: UserConfigExport<"webpack5"> = {
    projectName: "board-game-mp",
    date: "2026-06-30",
    designWidth: 750,
    deviceRatio: { 375: 2, 750: 1 },
    sourceRoot: "src",
    outputRoot: `dist/${process.env.TARO_ENV ?? "weapp"}`,
    framework: "react",
    compiler: "webpack5",
    cache: { enable: true },
    plugins: [],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: {
          enable: false,
          config: {
            namingPattern: "module",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    h5: {
      publicPath: "/",
      staticDirectory: "static",
      postcss: {
        autoprefixer: { enable: true, config: {} },
        cssModules: {
          enable: false,
          config: {
            namingPattern: "module",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
  };

  return process.env.NODE_ENV === "development"
    ? merge({}, config, devConfig)
    : merge({}, config, prodConfig);
});
```

Create `config/dev.ts` and `config/prod.ts`:

```ts
import type { UserConfigExport } from "@tarojs/cli";

export default {} satisfies UserConfigExport<"webpack5">;
```

Create `project.config.json`:

```json
{
  "miniprogramRoot": "dist/weapp/",
  "projectname": "board-game-mp",
  "description": "Offline hex map generator",
  "appid": "wx457da8486a97dccd",
  "setting": {
    "es6": false,
    "postcss": false,
    "minified": false,
    "urlCheck": false
  },
  "compileType": "miniprogram"
}
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`

Expected: exit code 0 and a new `pnpm-lock.yaml` with every `@tarojs/*` direct dependency resolved to `4.2.0`.

- [ ] **Step 4: Write a failing bootstrap test**

Create `tests/bootstrap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import appConfig from "@/app.config";

describe("app shell", () => {
  it("registers the generator as the only page", () => {
    expect(appConfig.pages).toEqual(["pages/index/index"]);
  });
});
```

Run: `pnpm test -- tests/bootstrap.test.ts`

Expected: FAIL because `src/app.config.ts` does not exist.

- [ ] **Step 5: Add the minimal Taro app shell**

Create `src/app.config.ts`:

```ts
export default defineAppConfig({
  pages: ["pages/index/index"],
  window: {
    navigationBarTitleText: "卡坦岛地图生成器",
    navigationBarBackgroundColor: "#f5f1e8",
    navigationBarTextStyle: "black",
    backgroundColor: "#f5f1e8",
  },
});
```

Create `src/app.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import "./app.scss";

export default function App({ children }: PropsWithChildren) {
  return children;
}
```

Create `src/pages/index/index.tsx`:

```tsx
import { Text, View } from "@tarojs/components";
import "./index.scss";

export default function IndexPage() {
  return (
    <View className="page">
      <Text>卡坦岛地图生成器</Text>
    </View>
  );
}
```

Create `src/pages/index/index.config.ts`:

```ts
export default definePageConfig({ navigationBarTitleText: "卡坦岛地图生成器" });
```

Create `src/app.scss`, `src/pages/index/index.scss`, and `src/index.html` with valid minimal content:

```scss
page {
  min-height: 100%;
  background: #f5f1e8;
  color: #2f3437;
}
```

```scss
.page {
  min-height: 100vh;
  padding: 32px;
  box-sizing: border-box;
}
```

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>卡坦岛地图生成器</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

Add `.gitignore`:

```gitignore
node_modules/
dist/
.DS_Store
coverage/
```

- [ ] **Step 6: Verify the shell**

Run: `pnpm test -- tests/bootstrap.test.ts && pnpm typecheck && pnpm build:h5 && pnpm build:weapp`

Expected: bootstrap test PASS, TypeScript exit 0, H5 output under `dist/h5`, and WeChat output under `dist/weapp`.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json pnpm-lock.yaml babel.config.cjs config tsconfig.json vitest.config.ts project.config.json src tests/bootstrap.test.ts
git commit -m "chore: scaffold Taro map generator"
```

---

### Task 2: Define domain types, rule defaults, and fixed presets

**Files:**

- Create: `src/domain/board.ts`
- Create: `src/domain/rules.ts`
- Create: `src/presets/board-presets.ts`
- Test: `tests/presets.test.ts`

- [ ] **Step 1: Write failing preset tests**

Create `tests/presets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, numberGroup, pipWeight } from "@/domain/rules";
import { BOARD_PRESETS } from "@/presets/board-presets";

describe("board presets", () => {
  it.each([
    ["base", 19, 18, 18, 9],
    ["extension", 30, 28, 22, 11],
  ] as const)(
    "%s has fixed component counts",
    (version, land, numbers, sea, harbors) => {
      const preset = BOARD_PRESETS[version];
      expect(preset.landCoords).toHaveLength(land);
      expect(preset.numberBag).toHaveLength(numbers);
      expect(preset.seaCoords).toHaveLength(sea);
      expect(preset.harbors).toHaveLength(harbors);
      expect(preset.resourceBag).toHaveLength(land);
    },
  );

  it("keeps every harbor fixed with a valid opening edge", () => {
    for (const preset of Object.values(BOARD_PRESETS)) {
      expect(
        new Set(
          preset.harbors.map((harbor) => `${harbor.sea.q},${harbor.sea.r}`),
        ).size,
      ).toBe(preset.harbors.length);
      expect(
        preset.harbors.every(
          (harbor) => harbor.facingEdge >= 0 && harbor.facingEdge <= 5,
        ),
      ).toBe(true);
    }
  });

  it("defines requested defaults and number semantics", () => {
    expect(DEFAULT_RULES).toMatchObject({
      avoidCoastalDesert: false,
      uniqueNumberGroupPerResource: true,
      intersectionResourceLimitEnabled: true,
      maxSameResourcePerIntersection: 1,
      maximizeSameNumberDistance: true,
      forbidAdjacentSameNumberGroup: false,
      disjointWoodBrickNumbers: true,
      balanceResourcePips: true,
      fairIntersections: true,
    });
    expect(numberGroup(6)).toBe(numberGroup(8));
    expect(numberGroup(2)).toBe(numberGroup(12));
    expect(pipWeight(6)).toBe(5);
    expect(pipWeight(12)).toBe(1);
  });
});
```

Run: `pnpm test -- tests/presets.test.ts`

Expected: FAIL because domain and preset modules do not exist.

- [ ] **Step 2: Add board and rule types**

Create `src/domain/board.ts`:

```ts
export type BoardVersion = "base" | "extension";
export type ProductiveResource = "wood" | "wool" | "grain" | "brick" | "ore";
export type Resource = ProductiveResource | "desert";
export type NumberToken = 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10 | 11 | 12;
export type HexEdge = 0 | 1 | 2 | 3 | 4 | 5;

export interface HexCoord {
  q: number;
  r: number;
}
export interface LandHex {
  id: string;
  coord: HexCoord;
  resource: Resource;
  number: NumberToken | null;
}
export interface HarborPreset {
  id: string;
  sea: HexCoord;
  kind: "generic" | "resource";
  resource?: ProductiveResource;
  facingEdge: HexEdge;
}
export interface BoardPreset {
  version: BoardVersion;
  landCoords: readonly HexCoord[];
  seaCoords: readonly HexCoord[];
  resourceBag: readonly Resource[];
  numberBag: readonly NumberToken[];
  harbors: readonly HarborPreset[];
  diameter: number;
}
export interface BoardMetrics {
  sameNumberMinDistance: number;
  resourcePipRange: number;
  intersectionMaxPips: number;
  intersectionPipRange: number;
  intersectionStdDev: number;
  woodBrickSharedPips: number;
  normalizedScore: number;
}
export interface GeneratedBoard {
  version: BoardVersion;
  hexes: readonly LandHex[];
  metrics: BoardMetrics;
  seed: number;
  createdAt: number;
}

export const PRODUCTIVE_RESOURCES: readonly ProductiveResource[] = [
  "wood",
  "wool",
  "grain",
  "brick",
  "ore",
];
export const isProductiveResource = (
  resource: Resource,
): resource is ProductiveResource => resource !== "desert";
export const coordKey = ({ q, r }: HexCoord): string => `${q},${r}`;
```

Create `src/domain/rules.ts`:

```ts
import type { NumberToken } from "./board";

export interface GeneratorRules {
  avoidCoastalDesert: boolean;
  uniqueNumberGroupPerResource: boolean;
  intersectionResourceLimitEnabled: boolean;
  maxSameResourcePerIntersection: 1 | 2 | 3;
  maximizeSameNumberDistance: boolean;
  forbidAdjacentSameNumberGroup: boolean;
  disjointWoodBrickNumbers: boolean;
  balanceResourcePips: boolean;
  fairIntersections: boolean;
}

export const DEFAULT_RULES: GeneratorRules = {
  avoidCoastalDesert: false,
  uniqueNumberGroupPerResource: true,
  intersectionResourceLimitEnabled: true,
  maxSameResourcePerIntersection: 1,
  maximizeSameNumberDistance: true,
  forbidAdjacentSameNumberGroup: false,
  disjointWoodBrickNumbers: true,
  balanceResourcePips: true,
  fairIntersections: true,
};

export type NumberGroup = "low" | "hot" | "3" | "4" | "5" | "9" | "10" | "11";
export const numberGroup = (number: NumberToken): NumberGroup => {
  if (number === 2 || number === 12) return "low";
  if (number === 6 || number === 8) return "hot";
  return String(number) as NumberGroup;
};
export const pipWeight = (number: NumberToken): number =>
  6 - Math.abs(7 - number);
```

- [ ] **Step 3: Add deterministic land, sea, bags, and explicit harbor tables**

Create `src/presets/board-presets.ts`. Generate fixed land/sea coordinates deterministically, but keep every harbor coordinate and edge literal:

```ts
import type {
  BoardPreset,
  HarborPreset,
  HexCoord,
  NumberToken,
  Resource,
} from "@/domain/board";
import { coordKey } from "@/domain/board";

const DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

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

const seaBoundary = (land: readonly HexCoord[]): HexCoord[] => {
  const landKeys = new Set(land.map(coordKey));
  const sea = new Map<string, HexCoord>();
  for (const coord of land) {
    for (const direction of DIRECTIONS) {
      const neighbor = { q: coord.q + direction.q, r: coord.r + direction.r };
      if (!landKeys.has(coordKey(neighbor)))
        sea.set(coordKey(neighbor), neighbor);
    }
  }
  return [...sea.values()];
};

const repeat = <T>(value: T, count: number): T[] =>
  Array.from({ length: count }, () => value);
const numberBag = (
  entries: readonly (readonly [NumberToken, number])[],
): NumberToken[] => entries.flatMap(([number, count]) => repeat(number, count));

const baseLand = rows([3, 4, 5, 4, 3]);
const extensionLand = rows([3, 4, 5, 6, 5, 4, 3]);

const baseHarbors: HarborPreset[] = [
  { id: "base-h0", sea: { q: 2, r: -3 }, kind: "generic", facingEdge: 4 },
  {
    id: "base-h1",
    sea: { q: 3, r: -2 },
    kind: "resource",
    resource: "wood",
    facingEdge: 4,
  },
  { id: "base-h2", sea: { q: 3, r: 0 }, kind: "generic", facingEdge: 3 },
  {
    id: "base-h3",
    sea: { q: 1, r: 2 },
    kind: "resource",
    resource: "brick",
    facingEdge: 2,
  },
  { id: "base-h4", sea: { q: -1, r: 3 }, kind: "generic", facingEdge: 2 },
  {
    id: "base-h5",
    sea: { q: -3, r: 3 },
    kind: "resource",
    resource: "grain",
    facingEdge: 1,
  },
  { id: "base-h6", sea: { q: -3, r: 1 }, kind: "generic", facingEdge: 0 },
  {
    id: "base-h7",
    sea: { q: -2, r: -1 },
    kind: "resource",
    resource: "wool",
    facingEdge: 0,
  },
  {
    id: "base-h8",
    sea: { q: 0, r: -3 },
    kind: "resource",
    resource: "ore",
    facingEdge: 5,
  },
];

const extensionHarbors: HarborPreset[] = [
  { id: "ext-h0", sea: { q: 2, r: -4 }, kind: "generic", facingEdge: 4 },
  {
    id: "ext-h1",
    sea: { q: 3, r: -3 },
    kind: "resource",
    resource: "wood",
    facingEdge: 4,
  },
  { id: "ext-h2", sea: { q: 3, r: -1 }, kind: "generic", facingEdge: 3 },
  {
    id: "ext-h3",
    sea: { q: 2, r: 1 },
    kind: "resource",
    resource: "brick",
    facingEdge: 3,
  },
  { id: "ext-h4", sea: { q: 0, r: 3 }, kind: "generic", facingEdge: 2 },
  {
    id: "ext-h5",
    sea: { q: -2, r: 4 },
    kind: "resource",
    resource: "grain",
    facingEdge: 1,
  },
  { id: "ext-h6", sea: { q: -4, r: 4 }, kind: "generic", facingEdge: 1 },
  {
    id: "ext-h7",
    sea: { q: -4, r: 2 },
    kind: "resource",
    resource: "wool",
    facingEdge: 1,
  },
  {
    id: "ext-h8",
    sea: { q: -4, r: 0 },
    kind: "resource",
    resource: "ore",
    facingEdge: 0,
  },
  { id: "ext-h9", sea: { q: -2, r: -2 }, kind: "generic", facingEdge: 5 },
  {
    id: "ext-h10",
    sea: { q: 0, r: -4 },
    kind: "resource",
    resource: "wool",
    facingEdge: 5,
  },
];

const baseResources: Resource[] = [
  ...repeat("wood", 4),
  ...repeat("wool", 4),
  ...repeat("grain", 4),
  ...repeat("brick", 3),
  ...repeat("ore", 3),
  "desert",
];
const extensionResources: Resource[] = [
  ...repeat("wood", 6),
  ...repeat("wool", 6),
  ...repeat("grain", 6),
  ...repeat("brick", 5),
  ...repeat("ore", 5),
  ...repeat("desert", 2),
];

export const BOARD_PRESETS: Record<"base" | "extension", BoardPreset> = {
  base: {
    version: "base",
    landCoords: baseLand,
    seaCoords: seaBoundary(baseLand),
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
    harbors: baseHarbors,
    diameter: 4,
  },
  extension: {
    version: "extension",
    landCoords: extensionLand,
    seaCoords: seaBoundary(extensionLand),
    resourceBag: extensionResources,
    numberBag: numberBag([
      [2, 1],
      [12, 3],
      [3, 3],
      [4, 3],
      [5, 3],
      [6, 3],
      [8, 3],
      [9, 3],
      [10, 3],
      [11, 3],
    ]),
    harbors: extensionHarbors,
    diameter: 6,
  },
};
```

- [ ] **Step 4: Run tests and type checking**

Run: `pnpm test -- tests/presets.test.ts && pnpm typecheck`

Expected: all preset tests PASS and TypeScript exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/domain src/presets tests/presets.test.ts
git commit -m "feat: define board presets and rules"
```

---

### Task 3: Implement hex geometry, coast detection, and intersections

**Files:**

- Create: `src/geometry/hex.ts`
- Create: `src/geometry/topology.ts`
- Modify: `src/presets/board-presets.ts`
- Test: `tests/geometry.test.ts`

- [ ] **Step 1: Write failing geometry tests**

Create `tests/geometry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BOARD_PRESETS } from "@/presets/board-presets";
import { edgeEndpoints, hexDistance } from "@/geometry/hex";
import { buildTopology } from "@/geometry/topology";

describe("hex geometry", () => {
  it("computes axial distance", () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });

  it("builds 54 intersections for the 3-4 player island", () => {
    const topology = buildTopology(BOARD_PRESETS.base.landCoords);
    expect(topology.intersections).toHaveLength(54);
    expect(topology.coastalHexKeys.size).toBeGreaterThan(0);
    expect(
      topology.intersections.some((point) => point.hexKeys.length === 3),
    ).toBe(true);
  });

  it("maps every fixed harbor opening to a land-facing edge", () => {
    for (const preset of Object.values(BOARD_PRESETS)) {
      const land = new Set(preset.landCoords.map(({ q, r }) => `${q},${r}`));
      for (const harbor of preset.harbors) {
        const direction = [
          { q: 1, r: 0 },
          { q: 1, r: -1 },
          { q: 0, r: -1 },
          { q: -1, r: 0 },
          { q: -1, r: 1 },
          { q: 0, r: 1 },
        ][harbor.facingEdge]!;
        expect(
          land.has(
            `${harbor.sea.q + direction.q},${harbor.sea.r + direction.r}`,
          ),
        ).toBe(true);
        expect(edgeEndpoints(harbor.sea, 20, harbor.facingEdge)).toHaveLength(
          2,
        );
      }
    }
  });
});
```

Run: `pnpm test -- tests/geometry.test.ts`

Expected: FAIL because geometry modules do not exist.

- [ ] **Step 2: Implement axial math and projection**

Create `src/geometry/hex.ts`:

```ts
import type { HexCoord, HexEdge } from "@/domain/board";

export const HEX_DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export interface Point {
  x: number;
  y: number;
}
export const addHex = (a: HexCoord, b: HexCoord): HexCoord => ({
  q: a.q + b.q,
  r: a.r + b.r,
});
export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};
export const hexToPoint = ({ q, r }: HexCoord, size: number): Point => ({
  x: Math.sqrt(3) * size * (q + r / 2),
  y: 1.5 * size * r,
});
export const hexCorners = (coord: HexCoord, size: number): Point[] => {
  const center = hexToPoint(coord, size);
  return Array.from({ length: 6 }, (_, index) => {
    const angle = ((-90 + index * 60) * Math.PI) / 180;
    return {
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    };
  });
};
export const edgeEndpoints = (
  coord: HexCoord,
  size: number,
  edge: HexEdge,
): [Point, Point] => {
  const center = hexToPoint(coord, size);
  const directionAngle = (-60 * edge * Math.PI) / 180;
  const pointAt = (angle: number): Point => ({
    x: center.x + size * Math.cos(angle),
    y: center.y + size * Math.sin(angle),
  });
  return [
    pointAt(directionAngle - Math.PI / 6),
    pointAt(directionAngle + Math.PI / 6),
  ];
};
```

- [ ] **Step 3: Implement topology once and reuse it across rules/scoring**

Create `src/geometry/topology.ts`:

```ts
import { coordKey, type HexCoord } from "@/domain/board";
import { addHex, HEX_DIRECTIONS, hexCorners, type Point } from "./hex";

export interface Intersection {
  key: string;
  point: Point;
  hexKeys: readonly string[];
}
export interface BoardTopology {
  neighbors: ReadonlyMap<string, readonly string[]>;
  intersections: readonly Intersection[];
  intersectionsByHex: ReadonlyMap<string, readonly string[]>;
  coastalHexKeys: ReadonlySet<string>;
}

const pointKey = ({ x, y }: Point): string =>
  `${Math.round(x * 1_000_000)},${Math.round(y * 1_000_000)}`;

export const buildTopology = (coords: readonly HexCoord[]): BoardTopology => {
  const coordByKey = new Map(coords.map((coord) => [coordKey(coord), coord]));
  const neighbors = new Map<string, string[]>();
  const intersectionMap = new Map<
    string,
    { point: Point; hexKeys: string[] }
  >();
  const intersectionsByHex = new Map<string, string[]>();
  const coastalHexKeys = new Set<string>();

  for (const coord of coords) {
    const key = coordKey(coord);
    const adjacent = HEX_DIRECTIONS.map((direction) =>
      coordKey(addHex(coord, direction)),
    ).filter((neighbor) => coordByKey.has(neighbor));
    neighbors.set(key, adjacent);
    if (adjacent.length < 6) coastalHexKeys.add(key);

    const keys = hexCorners(coord, 1).map((point) => {
      const vertexKey = pointKey(point);
      const entry = intersectionMap.get(vertexKey) ?? { point, hexKeys: [] };
      if (!entry.hexKeys.includes(key)) entry.hexKeys.push(key);
      intersectionMap.set(vertexKey, entry);
      return vertexKey;
    });
    intersectionsByHex.set(key, keys);
  }

  return {
    neighbors,
    intersections: [...intersectionMap].map(([key, value]) => ({
      key,
      ...value,
    })),
    intersectionsByHex,
    coastalHexKeys,
  };
};
```

Update `src/presets/board-presets.ts` in the same step: remove its local `DIRECTIONS` constant, import `HEX_DIRECTIONS` from `@/geometry/hex`, and use `HEX_DIRECTIONS` inside `seaBoundary`. This leaves one direction definition after Task 3.

- [ ] **Step 4: Run geometry and preset tests**

Run: `pnpm test -- tests/geometry.test.ts tests/presets.test.ts && pnpm typecheck`

Expected: both suites PASS and TypeScript exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/geometry src/presets/board-presets.ts tests/geometry.test.ts
git commit -m "feat: add board geometry and topology"
```

---

### Task 4: Add seeded Fisher–Yates and constrained resource placement

**Files:**

- Create: `src/generator/random.ts`
- Create: `src/generator/resource-search.ts`
- Test: `tests/random.test.ts`
- Test: `tests/resource-search.test.ts`

- [ ] **Step 1: Write failing random and resource-search tests**

Create `tests/random.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fisherYates, mulberry32 } from "@/generator/random";

describe("fisherYates", () => {
  it("preserves the input and is reproducible with a seed", () => {
    const input = [1, 2, 3, 4, 5];
    const first = fisherYates(input, mulberry32(42));
    const second = fisherYates(input, mulberry32(42));
    expect(first).toEqual(second);
    expect(first).not.toEqual(input);
    expect([...first].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
```

Create `tests/resource-search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/domain/rules";
import { coordKey } from "@/domain/board";
import { buildTopology } from "@/geometry/topology";
import { mulberry32 } from "@/generator/random";
import { placeResources } from "@/generator/resource-search";
import { BOARD_PRESETS } from "@/presets/board-presets";

describe("placeResources", () => {
  it.each(["base", "extension"] as const)(
    "finds a default %s layout within budget",
    (version) => {
      const preset = BOARD_PRESETS[version];
      const topology = buildTopology(preset.landCoords);
      const result = placeResources(
        preset,
        DEFAULT_RULES,
        topology,
        mulberry32(20260630),
        5_000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.hexes).toHaveLength(preset.landCoords.length);
      for (const intersection of topology.intersections) {
        const resources = intersection.hexKeys
          .map(
            (key) =>
              result.hexes.find((hex) => coordKey(hex.coord) === key)?.resource,
          )
          .filter((value) => value !== undefined && value !== "desert");
        expect(new Set(resources).size).toBe(resources.length);
      }
    },
  );
});
```

Run: `pnpm test -- tests/random.test.ts tests/resource-search.test.ts`

Expected: FAIL because generator modules do not exist.

- [ ] **Step 2: Implement deterministic random helpers**

Create `src/generator/random.ts`:

```ts
export type RandomSource = () => number;

export const mulberry32 = (seed: number): RandomSource => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4_294_967_296;
  };
};

export const fisherYates = <T>(
  input: readonly T[],
  random: RandomSource,
): T[] => {
  const output = [...input];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target]!, output[index]!];
  }
  return output;
};
```

- [ ] **Step 3: Implement budgeted resource backtracking**

Create `src/generator/resource-search.ts` with this public contract and pruning logic:

```ts
import {
  coordKey,
  isProductiveResource,
  type BoardPreset,
  type LandHex,
  type Resource,
} from "@/domain/board";
import type { GeneratorRules } from "@/domain/rules";
import type { BoardTopology } from "@/geometry/topology";
import { fisherYates, type RandomSource } from "./random";

export type ResourceSearchResult =
  | {
      ok: true;
      hexes: LandHex[];
      visitedNodes: number;
      pruned: Record<string, number>;
    }
  | { ok: false; visitedNodes: number; pruned: Record<string, number> };

export const placeResources = (
  preset: BoardPreset,
  rules: GeneratorRules,
  topology: BoardTopology,
  random: RandomSource,
  nodeBudget: number,
): ResourceSearchResult => {
  const coords = fisherYates(preset.landCoords, random);
  const priority = fisherYates(preset.resourceBag, random);
  const remaining = new Map<Resource, number>();
  const intersectionByKey = new Map(
    topology.intersections.map((intersection) => [
      intersection.key,
      intersection,
    ]),
  );
  for (const resource of preset.resourceBag)
    remaining.set(resource, (remaining.get(resource) ?? 0) + 1);
  const assigned = new Map<string, Resource>();
  const pruned = { coastalDesert: 0, intersectionLimit: 0, budget: 0 };
  let visitedNodes = 0;

  const validAt = (key: string, resource: Resource): boolean => {
    if (
      resource === "desert" &&
      rules.avoidCoastalDesert &&
      topology.coastalHexKeys.has(key)
    ) {
      pruned.coastalDesert += 1;
      return false;
    }
    if (
      !rules.intersectionResourceLimitEnabled ||
      !isProductiveResource(resource)
    )
      return true;
    for (const intersectionKey of topology.intersectionsByHex.get(key) ?? []) {
      const intersection = intersectionByKey.get(intersectionKey);
      const matching =
        intersection?.hexKeys.filter(
          (hexKey) => assigned.get(hexKey) === resource,
        ).length ?? 0;
      if (matching + 1 > rules.maxSameResourcePerIntersection) {
        pruned.intersectionLimit += 1;
        return false;
      }
    }
    return true;
  };

  const search = (index: number): boolean => {
    if (index === coords.length) return true;
    if (visitedNodes >= nodeBudget) {
      pruned.budget += 1;
      return false;
    }
    const coord = coords[index]!;
    const key = coordKey(coord);
    const choices = fisherYates(
      [
        ...new Set(
          priority.filter((resource) => (remaining.get(resource) ?? 0) > 0),
        ),
      ],
      random,
    );
    for (const resource of choices) {
      visitedNodes += 1;
      if (!validAt(key, resource)) continue;
      assigned.set(key, resource);
      remaining.set(resource, (remaining.get(resource) ?? 0) - 1);
      if (search(index + 1)) return true;
      remaining.set(resource, (remaining.get(resource) ?? 0) + 1);
      assigned.delete(key);
    }
    return false;
  };

  if (!search(0)) return { ok: false, visitedNodes, pruned };
  return {
    ok: true,
    visitedNodes,
    pruned,
    hexes: preset.landCoords.map((coord) => ({
      id: coordKey(coord),
      coord,
      resource: assigned.get(coordKey(coord))!,
      number: null,
    })),
  };
};
```

- [ ] **Step 4: Run focused tests**

Run: `pnpm test -- tests/random.test.ts tests/resource-search.test.ts && pnpm typecheck`

Expected: all tests PASS; both default versions finish below their 5,000-node resource budget.

- [ ] **Step 5: Commit**

```bash
git add src/generator/random.ts src/generator/resource-search.ts tests/random.test.ts tests/resource-search.test.ts
git commit -m "feat: add shuffled resource constraint search"
```

---

### Task 5: Implement constrained number placement and hard-rule validation

**Files:**

- Create: `src/generator/number-search.ts`
- Create: `src/generator/hard-rules.ts`
- Test: `tests/number-search.test.ts`
- Test: `tests/hard-rules.test.ts`

- [ ] **Step 1: Write failing number-search tests for both mathematical exceptions**

Create `tests/number-search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, numberGroup } from "@/domain/rules";
import { buildTopology } from "@/geometry/topology";
import { placeNumbers } from "@/generator/number-search";
import { placeResources } from "@/generator/resource-search";
import { mulberry32 } from "@/generator/random";
import { BOARD_PRESETS } from "@/presets/board-presets";

describe("placeNumbers", () => {
  it.each(["base", "extension"] as const)(
    "assigns all %s numbers under default rules",
    (version) => {
      const preset = BOARD_PRESETS[version];
      const topology = buildTopology(preset.landCoords);
      const resources = placeResources(
        preset,
        DEFAULT_RULES,
        topology,
        mulberry32(11),
        5_000,
      );
      expect(resources.ok).toBe(true);
      if (!resources.ok) return;
      const result = placeNumbers(
        preset,
        resources.hexes,
        DEFAULT_RULES,
        topology,
        mulberry32(19),
        50_000,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.hexes.filter((hex) => hex.number !== null)).toHaveLength(
        preset.numberBag.length,
      );
    },
  );

  it("uses exactly the two approved 5-6 player exceptions", () => {
    const preset = BOARD_PRESETS.extension;
    const topology = buildTopology(preset.landCoords);
    const resources = placeResources(
      preset,
      DEFAULT_RULES,
      topology,
      mulberry32(11),
      5_000,
    );
    if (!resources.ok) throw new Error("resource fixture failed");
    const result = placeNumbers(
      preset,
      resources.hexes,
      DEFAULT_RULES,
      topology,
      mulberry32(19),
      50_000,
    );
    if (!result.ok) throw new Error("number fixture failed");

    const grouped = new Map<string, string[]>();
    for (const hex of result.hexes) {
      if (hex.resource === "desert" || hex.number === null) continue;
      const values = grouped.get(hex.resource) ?? [];
      values.push(numberGroup(hex.number));
      grouped.set(hex.resource, values);
    }
    expect(
      [...grouped.values()].filter(
        (groups) => groups.length !== new Set(groups).size,
      ),
    ).toHaveLength(1);

    const wood = new Set(
      result.hexes
        .filter((hex) => hex.resource === "wood")
        .map((hex) => hex.number),
    );
    const brick = new Set(
      result.hexes
        .filter((hex) => hex.resource === "brick")
        .map((hex) => hex.number),
    );
    expect([...wood].filter((number) => brick.has(number))).toHaveLength(1);
  });
});
```

Run: `pnpm test -- tests/number-search.test.ts`

Expected: FAIL because `placeNumbers` does not exist.

- [ ] **Step 2: Implement incremental number constraints**

Create `src/generator/number-search.ts`. Use shuffled number and coordinate order, track exact values and groups per resource, and only enable exceptions when their parent rule is enabled:

```ts
import {
  coordKey,
  type BoardPreset,
  type BoardVersion,
  type LandHex,
  type NumberToken,
  type ProductiveResource,
} from "@/domain/board";
import {
  numberGroup,
  type GeneratorRules,
  type NumberGroup,
} from "@/domain/rules";
import type { BoardTopology } from "@/geometry/topology";
import { fisherYates, type RandomSource } from "./random";

export interface NumberSearchDiagnostics {
  visitedNodes: number;
  pruned: Record<
    "groupRepeat" | "adjacentGroup" | "woodBrickOverlap" | "budget",
    number
  >;
}

export type NumberSearchResult =
  | ({ ok: true; hexes: LandHex[] } & NumberSearchDiagnostics)
  | ({ ok: false } & NumberSearchDiagnostics);

const mayRepeatGroup = (
  version: BoardVersion,
  group: NumberGroup,
  number: NumberToken,
  currentExactNumbers: ReadonlyMap<NumberToken, number>,
  hotExceptionUsed: boolean,
): boolean =>
  version === "extension" &&
  group === "hot" &&
  !hotExceptionUsed &&
  !currentExactNumbers.has(number);

const allowedWoodBrickOverlap = (version: BoardVersion): number =>
  version === "extension" ? 1 : 0;

export const placeNumbers = (
  preset: BoardPreset,
  resourceHexes: readonly LandHex[],
  rules: GeneratorRules,
  topology: BoardTopology,
  random: RandomSource,
  nodeBudget: number,
): NumberSearchResult => {
  const hexes: LandHex[] = resourceHexes.map((hex) => ({
    ...hex,
    coord: { ...hex.coord },
    number: null,
  }));
  const productive = hexes.filter(
    (hex): hex is LandHex & { resource: ProductiveResource } =>
      hex.resource !== "desert",
  );
  const byKey = new Map(productive.map((hex) => [coordKey(hex.coord), hex]));
  const assigned = new Map<string, NumberToken>();
  const groupCounts = new Map<ProductiveResource, Map<NumberGroup, number>>();
  const exactCounts = new Map<ProductiveResource, Map<NumberToken, number>>();
  const numbers = fisherYates(preset.numberBag, random);
  const pruned = {
    groupRepeat: 0,
    adjacentGroup: 0,
    woodBrickOverlap: 0,
    budget: 0,
  };
  let visitedNodes = 0;

  const groupsFor = (resource: ProductiveResource) => {
    const value = groupCounts.get(resource) ?? new Map<NumberGroup, number>();
    groupCounts.set(resource, value);
    return value;
  };
  const exactFor = (resource: ProductiveResource) => {
    const value = exactCounts.get(resource) ?? new Map<NumberToken, number>();
    exactCounts.set(resource, value);
    return value;
  };
  const overlapCount = (): number => {
    const wood = exactFor("wood");
    const brick = exactFor("brick");
    return [...wood.keys()].filter((number) => brick.has(number)).length;
  };
  const adjust = <K>(map: Map<K, number>, key: K, delta: 1 | -1) => {
    const next = (map.get(key) ?? 0) + delta;
    if (next === 0) map.delete(key);
    else map.set(key, next);
  };

  const search = (index: number, hotExceptionCount: number): boolean => {
    if (index === numbers.length) {
      if (
        rules.uniqueNumberGroupPerResource &&
        preset.version === "extension" &&
        hotExceptionCount !== 1
      )
        return false;
      if (
        rules.disjointWoodBrickNumbers &&
        overlapCount() !== allowedWoodBrickOverlap(preset.version)
      )
        return false;
      return true;
    }
    if (visitedNodes >= nodeBudget) {
      pruned.budget += 1;
      return false;
    }
    const number = numbers[index]!;
    const group = numberGroup(number);
    const emptyKeys = [...byKey.keys()].filter((key) => !assigned.has(key));
    for (const key of fisherYates(emptyKeys, random)) {
      visitedNodes += 1;
      const hex = byKey.get(key)!;
      const groups = groupsFor(hex.resource);
      const exact = exactFor(hex.resource);
      const repeated = (groups.get(group) ?? 0) > 0;
      const allowedRepeat =
        repeated && rules.uniqueNumberGroupPerResource
          ? mayRepeatGroup(
              preset.version,
              group,
              number,
              exact,
              hotExceptionCount > 0,
            )
          : false;
      if (rules.uniqueNumberGroupPerResource && repeated && !allowedRepeat) {
        pruned.groupRepeat += 1;
        continue;
      }
      if (
        rules.forbidAdjacentSameNumberGroup &&
        (topology.neighbors.get(key) ?? []).some((neighbor) => {
          const adjacent = assigned.get(neighbor);
          return adjacent !== undefined && numberGroup(adjacent) === group;
        })
      ) {
        pruned.adjacentGroup += 1;
        continue;
      }

      assigned.set(key, number);
      adjust(groups, group, 1);
      adjust(exact, number, 1);
      if (
        rules.disjointWoodBrickNumbers &&
        overlapCount() > allowedWoodBrickOverlap(preset.version)
      ) {
        pruned.woodBrickOverlap += 1;
      } else if (
        search(index + 1, hotExceptionCount + (allowedRepeat ? 1 : 0))
      ) {
        return true;
      }
      adjust(exact, number, -1);
      adjust(groups, group, -1);
      assigned.delete(key);
    }
    return false;
  };

  if (!search(0, 0)) return { ok: false, visitedNodes, pruned };
  for (const [key, number] of assigned) byKey.get(key)!.number = number;
  return { ok: true, hexes, visitedNodes, pruned };
};
```

- [ ] **Step 3: Write full-board validator tests**

Create `tests/hard-rules.test.ts` with generated public-board fixtures, then mutate only the property needed for each violation:

```ts
import { describe, expect, it } from "vitest";
import { coordKey, type BoardVersion, type LandHex } from "@/domain/board";
import { DEFAULT_RULES } from "@/domain/rules";
import { buildTopology } from "@/geometry/topology";
import { validateHardRules } from "@/generator/hard-rules";
import { placeNumbers } from "@/generator/number-search";
import { mulberry32 } from "@/generator/random";
import { placeResources } from "@/generator/resource-search";
import { BOARD_PRESETS } from "@/presets/board-presets";

const generated = (version: BoardVersion): LandHex[] => {
  const preset = BOARD_PRESETS[version];
  const topology = buildTopology(preset.landCoords);
  const resources = placeResources(
    preset,
    DEFAULT_RULES,
    topology,
    mulberry32(11),
    5_000,
  );
  if (!resources.ok) throw new Error("resource fixture failed");
  const numbers = placeNumbers(
    preset,
    resources.hexes,
    DEFAULT_RULES,
    topology,
    mulberry32(19),
    50_000,
  );
  if (!numbers.ok) throw new Error("number fixture failed");
  return numbers.hexes.map((hex) => ({ ...hex, coord: { ...hex.coord } }));
};

const rulesForEveryValidator = {
  ...DEFAULT_RULES,
  avoidCoastalDesert: true,
  forbidAdjacentSameNumberGroup: true,
};

describe("validateHardRules", () => {
  it("reports coastal desert", () => {
    const preset = BOARD_PRESETS.base;
    const topology = buildTopology(preset.landCoords);
    const board = generated("base");
    const key = [...topology.coastalHexKeys][0]!;
    const hex = board.find((item) => coordKey(item.coord) === key)!;
    hex.resource = "desert";
    hex.number = null;
    expect(
      validateHardRules(board, preset, rulesForEveryValidator, topology).map(
        (item) => item.rule,
      ),
    ).toContain("coastal-desert");
  });

  it("reports a repeated number group on one resource", () => {
    const preset = BOARD_PRESETS.base;
    const topology = buildTopology(preset.landCoords);
    const board = generated("base");
    const wood = board.filter((hex) => hex.resource === "wood");
    wood[0]!.number = 6;
    wood[1]!.number = 8;
    expect(
      validateHardRules(board, preset, rulesForEveryValidator, topology).map(
        (item) => item.rule,
      ),
    ).toContain("resource-number-group");
  });

  it("reports an intersection resource overflow", () => {
    const preset = BOARD_PRESETS.base;
    const topology = buildTopology(preset.landCoords);
    const board = generated("base");
    const intersection = topology.intersections.find(
      (item) => item.hexKeys.length === 3,
    )!;
    intersection.hexKeys.slice(0, 2).forEach((key) => {
      board.find((hex) => coordKey(hex.coord) === key)!.resource = "ore";
    });
    expect(
      validateHardRules(board, preset, rulesForEveryValidator, topology).map(
        (item) => item.rule,
      ),
    ).toContain("intersection-resource-limit");
  });

  it("reports adjacent equal number groups", () => {
    const preset = BOARD_PRESETS.base;
    const topology = buildTopology(preset.landCoords);
    const board = generated("base");
    const [leftKey, neighborKeys] = [...topology.neighbors].find(
      ([, neighbors]) => neighbors.length > 0,
    )!;
    board.find((hex) => coordKey(hex.coord) === leftKey)!.number = 6;
    board.find((hex) => coordKey(hex.coord) === neighborKeys[0])!.number = 8;
    expect(
      validateHardRules(board, preset, rulesForEveryValidator, topology).map(
        (item) => item.rule,
      ),
    ).toContain("adjacent-number-group");
  });

  it("reports a base wood/brick number overlap", () => {
    const preset = BOARD_PRESETS.base;
    const topology = buildTopology(preset.landCoords);
    const board = generated("base");
    const wood = board.find((hex) => hex.resource === "wood")!;
    const brick = board.find((hex) => hex.resource === "brick")!;
    wood.number = 3;
    brick.number = 3;
    expect(
      validateHardRules(board, preset, rulesForEveryValidator, topology).map(
        (item) => item.rule,
      ),
    ).toContain("wood-brick-overlap");
  });

  it.each(["base", "extension"] as const)(
    "accepts a generated default %s board",
    (version) => {
      const preset = BOARD_PRESETS[version];
      expect(
        validateHardRules(
          generated(version),
          preset,
          DEFAULT_RULES,
          buildTopology(preset.landCoords),
        ),
      ).toEqual([]);
    },
  );
});
```

- [ ] **Step 4: Implement independent hard-rule validation**

Create `src/generator/hard-rules.ts`:

```ts
export type HardRuleId =
  | "coastal-desert"
  | "resource-number-group"
  | "intersection-resource-limit"
  | "adjacent-number-group"
  | "wood-brick-overlap";

export interface HardRuleViolation {
  rule: HardRuleId;
  hexKeys: readonly string[];
  message: string;
}

export const validateHardRules = (
  board: readonly LandHex[],
  preset: BoardPreset,
  rules: GeneratorRules,
  topology: BoardTopology,
): HardRuleViolation[] => {
  const byKey = new Map(board.map((hex) => [coordKey(hex.coord), hex]));
  const violations: HardRuleViolation[] = [];

  if (rules.avoidCoastalDesert) {
    for (const key of topology.coastalHexKeys) {
      if (byKey.get(key)?.resource === "desert")
        violations.push({
          rule: "coastal-desert",
          hexKeys: [key],
          message: "沙漠位于海岸",
        });
    }
  }

  if (rules.uniqueNumberGroupPerResource) {
    let allowedHotRepeats = 0;
    for (const resource of PRODUCTIVE_RESOURCES) {
      const grouped = new Map<NumberGroup, LandHex[]>();
      board
        .filter((hex) => hex.resource === resource && hex.number !== null)
        .forEach((hex) => {
          const group = numberGroup(hex.number!);
          grouped.set(group, [...(grouped.get(group) ?? []), hex]);
        });
      for (const [group, hexes] of grouped) {
        if (hexes.length <= 1) continue;
        const exact = new Set(hexes.map((hex) => hex.number));
        const allowed =
          preset.version === "extension" &&
          group === "hot" &&
          hexes.length === 2 &&
          exact.has(6) &&
          exact.has(8);
        if (allowed) allowedHotRepeats += 1;
        else
          violations.push({
            rule: "resource-number-group",
            hexKeys: hexes.map((hex) => hex.id),
            message: "同一资源出现重复数字组",
          });
      }
    }
    if (preset.version === "extension" && allowedHotRepeats !== 1)
      violations.push({
        rule: "resource-number-group",
        hexKeys: [],
        message: "扩充版必须且只能使用一个 6/8 例外",
      });
  }

  if (rules.intersectionResourceLimitEnabled) {
    for (const intersection of topology.intersections) {
      for (const resource of PRODUCTIVE_RESOURCES) {
        const keys = intersection.hexKeys.filter(
          (key) => byKey.get(key)?.resource === resource,
        );
        if (keys.length > rules.maxSameResourcePerIntersection)
          violations.push({
            rule: "intersection-resource-limit",
            hexKeys: keys,
            message: "交叉点同类资源超过上限",
          });
      }
    }
  }

  if (rules.forbidAdjacentSameNumberGroup) {
    for (const [key, neighbors] of topology.neighbors) {
      const left = byKey.get(key);
      if (left?.number === null || left?.number === undefined) continue;
      for (const neighbor of neighbors.filter((item) => item > key)) {
        const right = byKey.get(neighbor);
        if (
          right?.number !== null &&
          right?.number !== undefined &&
          numberGroup(left.number) === numberGroup(right.number)
        ) {
          violations.push({
            rule: "adjacent-number-group",
            hexKeys: [key, neighbor],
            message: "相邻地块数字组相同",
          });
        }
      }
    }
  }

  if (rules.disjointWoodBrickNumbers) {
    const wood = new Set(
      board
        .filter((hex) => hex.resource === "wood")
        .map((hex) => hex.number)
        .filter((value): value is NumberToken => value !== null),
    );
    const shared = board
      .filter(
        (hex) =>
          hex.resource === "brick" &&
          hex.number !== null &&
          wood.has(hex.number),
      )
      .map((hex) => hex.number!);
    const expected = preset.version === "extension" ? 1 : 0;
    if (new Set(shared).size !== expected)
      violations.push({
        rule: "wood-brick-overlap",
        hexKeys: [],
        message: `木材与砖块共享数字数量必须为 ${expected}`,
      });
  }

  return violations;
};
```

Import `PRODUCTIVE_RESOURCES`, `coordKey`, `LandHex`, `NumberToken`, `NumberGroup`, and `numberGroup` explicitly. Preserve the validator block order above so diagnostic identifiers are stable.

- [ ] **Step 5: Run focused tests**

Run: `pnpm test -- tests/number-search.test.ts tests/hard-rules.test.ts && pnpm typecheck`

Expected: all tests PASS; default extension generation shows one hot-group repeat and one exact wood/brick overlap, never more.

- [ ] **Step 6: Commit**

```bash
git add src/generator/number-search.ts src/generator/hard-rules.ts tests/number-search.test.ts tests/hard-rules.test.ts
git commit -m "feat: add constrained number rules"
```

---

### Task 6: Add explainable scoring and candidate comparison

**Files:**

- Create: `src/generator/scoring.ts`
- Test: `tests/scoring.test.ts`

- [ ] **Step 1: Write failing metric-order tests**

Create `tests/scoring.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { BoardMetrics, LandHex } from "@/domain/board";
import { DEFAULT_RULES } from "@/domain/rules";
import {
  compareMetrics,
  resourcePipTotals,
  standardDeviation,
} from "@/generator/scoring";

const metricFixture = (
  overrides: Partial<BoardMetrics> = {},
): BoardMetrics => ({
  sameNumberMinDistance: 2,
  resourcePipRange: 3,
  intersectionMaxPips: 12,
  intersectionPipRange: 8,
  intersectionStdDev: 2,
  woodBrickSharedPips: 0,
  normalizedScore: 0.5,
  ...overrides,
});
const defaultRules = DEFAULT_RULES;
const extensionRules = DEFAULT_RULES;
const scoreFixture: LandHex[] = [
  { id: "0,0", coord: { q: 0, r: 0 }, resource: "wood", number: 6 },
  { id: "1,0", coord: { q: 1, r: 0 }, resource: "wood", number: 9 },
];

describe("scoring", () => {
  it("prefers the lowest 5-6 wood/brick shared pip value before all soft metrics", () => {
    const lowOverlap = metricFixture({
      woodBrickSharedPips: 2,
      normalizedScore: 0.2,
    });
    const highOverlap = metricFixture({
      woodBrickSharedPips: 5,
      normalizedScore: 0.9,
    });
    expect(
      compareMetrics(lowOverlap, highOverlap, extensionRules, "extension"),
    ).toBeGreaterThan(0);
  });

  it("prefers distance, balance, and fair intersections when enabled", () => {
    const balanced = metricFixture({ normalizedScore: 0.8 });
    const skewed = metricFixture({ normalizedScore: 0.3 });
    expect(
      compareMetrics(balanced, skewed, defaultRules, "base"),
    ).toBeGreaterThan(0);
  });

  it("calculates transparent raw values", () => {
    expect(resourcePipTotals(scoreFixture).get("wood")).toBe(9);
    expect(standardDeviation([2, 2, 2])).toBe(0);
  });
});
```

Run: `pnpm test -- tests/scoring.test.ts`

Expected: FAIL because scoring functions do not exist.

- [ ] **Step 2: Implement raw metrics and normalized score**

Create `src/generator/scoring.ts` with these formulas:

```ts
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
export const standardDeviation = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
  );
};

const distanceScore = (minimum: number, diameter: number): number =>
  clamp01(minimum / diameter);
const resourceBalanceScore = (range: number): number => clamp01(1 - range / 30);
const intersectionFairnessScore = (
  range: number,
  deviation: number,
  maximum: number,
): number =>
  clamp01(
    1 - ((0.5 * range) / 14 + (0.3 * deviation) / 7 + (0.2 * maximum) / 15),
  );
```

```ts
export const resourcePipTotals = (
  hexes: readonly LandHex[],
): Map<ProductiveResource, number> => {
  const totals = new Map(PRODUCTIVE_RESOURCES.map((resource) => [resource, 0]));
  for (const hex of hexes) {
    if (!isProductiveResource(hex.resource) || hex.number === null) continue;
    totals.set(hex.resource, totals.get(hex.resource)! + pipWeight(hex.number));
  }
  return totals;
};

export const intersectionPips = (
  hexes: readonly LandHex[],
  topology: BoardTopology,
): number[] => {
  const byKey = new Map(hexes.map((hex) => [coordKey(hex.coord), hex]));
  return topology.intersections
    .map((intersection) =>
      intersection.hexKeys.reduce((sum, key) => {
        const number = byKey.get(key)?.number;
        return (
          sum +
          (number === null || number === undefined ? 0 : pipWeight(number))
        );
      }, 0),
    )
    .filter((value) => value > 0);
};

export const scoreBoard = (
  hexes: readonly LandHex[],
  preset: BoardPreset,
  rules: GeneratorRules,
  topology: BoardTopology,
): BoardMetrics => {
  const groups = new Map<NumberGroup, LandHex[]>();
  hexes
    .filter((hex) => hex.number !== null)
    .forEach((hex) => {
      const group = numberGroup(hex.number!);
      groups.set(group, [...(groups.get(group) ?? []), hex]);
    });
  const distances = [...groups.values()].flatMap((items) =>
    items.flatMap((left, index) =>
      items
        .slice(index + 1)
        .map((right) => hexDistance(left.coord, right.coord)),
    ),
  );
  const sameNumberMinDistance = distances.length
    ? Math.min(...distances)
    : preset.diameter;
  const resourceTotals = [...resourcePipTotals(hexes).values()];
  const resourcePipRange =
    Math.max(...resourceTotals) - Math.min(...resourceTotals);
  const pointPips = intersectionPips(hexes, topology);
  const intersectionMaxPips = Math.max(...pointPips);
  const intersectionPipRange = intersectionMaxPips - Math.min(...pointPips);
  const intersectionStdDev = standardDeviation(pointPips);
  const woodNumbers = new Set(
    hexes.filter((hex) => hex.resource === "wood").map((hex) => hex.number),
  );
  const shared = hexes
    .filter(
      (hex) =>
        hex.resource === "brick" &&
        hex.number !== null &&
        woodNumbers.has(hex.number),
    )
    .map((hex) => hex.number!);
  const woodBrickSharedPips = shared.length
    ? Math.min(...shared.map(pipWeight))
    : 0;
  const enabledScores = [
    rules.maximizeSameNumberDistance
      ? distanceScore(sameNumberMinDistance, preset.diameter)
      : null,
    rules.balanceResourcePips ? resourceBalanceScore(resourcePipRange) : null,
    rules.fairIntersections
      ? intersectionFairnessScore(
          intersectionPipRange,
          intersectionStdDev,
          intersectionMaxPips,
        )
      : null,
  ].filter((value): value is number => value !== null);
  const normalizedScore = enabledScores.length
    ? enabledScores.reduce((sum, value) => sum + value, 0) /
      enabledScores.length
    : 0;
  return {
    sameNumberMinDistance,
    resourcePipRange,
    intersectionMaxPips,
    intersectionPipRange,
    intersectionStdDev,
    woodBrickSharedPips,
    normalizedScore,
  };
};

export const compareMetrics = (
  a: BoardMetrics,
  b: BoardMetrics,
  rules: GeneratorRules,
  version: BoardVersion,
): number => {
  if (
    version === "extension" &&
    rules.disjointWoodBrickNumbers &&
    a.woodBrickSharedPips !== b.woodBrickSharedPips
  )
    return b.woodBrickSharedPips - a.woodBrickSharedPips;
  if (a.normalizedScore !== b.normalizedScore)
    return a.normalizedScore - b.normalizedScore;
  if (a.intersectionPipRange !== b.intersectionPipRange)
    return b.intersectionPipRange - a.intersectionPipRange;
  if (a.resourcePipRange !== b.resourcePipRange)
    return b.resourcePipRange - a.resourcePipRange;
  return a.sameNumberMinDistance - b.sameNumberMinDistance;
};
```

Import all referenced board/rule/geometry symbols explicitly at the top of the file.

`compareMetrics` order must be:

1. For extension + wood/brick rule, lower `woodBrickSharedPips` wins.
2. Higher enabled-rule `normalizedScore` wins.
3. Lower `intersectionPipRange` wins.
4. Lower `resourcePipRange` wins.
5. Higher `sameNumberMinDistance` wins.
6. Return `0` to keep the first-generated candidate.

- [ ] **Step 3: Run scoring tests**

Run: `pnpm test -- tests/scoring.test.ts && pnpm typecheck`

Expected: scoring tests PASS and TypeScript exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/generator/scoring.ts tests/scoring.test.ts
git commit -m "feat: score map fairness candidates"
```

---

### Task 7: Orchestrate batched generation with diagnostics

**Files:**

- Create: `src/generator/generate-board.ts`
- Test: `tests/generate-board.test.ts`

- [ ] **Step 1: Write failing end-to-end generator tests**

Create `tests/generate-board.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import type { BoardPreset } from "@/domain/board";
import { DEFAULT_RULES } from "@/domain/rules";
import { generateBoard } from "@/generator/generate-board";

const impossiblePreset: BoardPreset = {
  version: "base",
  landCoords: [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
  ],
  seaCoords: [],
  resourceBag: ["wood", "wood"],
  numberBag: [2, 3],
  harbors: [],
  diameter: 1,
};

describe("generateBoard", () => {
  it.each(["base", "extension"] as const)(
    "generates a reproducible legal %s board",
    async (version) => {
      const options = {
        seed: 1024,
        targetCandidates: 5,
        maxAttempts: 20,
        yieldEvery: 2,
        now: () => 1_719_705_600_000,
      };
      const first = await generateBoard(version, DEFAULT_RULES, options);
      const second = await generateBoard(version, DEFAULT_RULES, options);
      expect(first.ok).toBe(true);
      expect(second).toEqual(first);
      if (first.ok)
        expect(
          first.board.hexes.filter((hex) => hex.number !== null),
        ).toHaveLength(version === "base" ? 18 : 28);
    },
  );

  it("yields between batches", async () => {
    const yieldControl = vi.fn(async () => undefined);
    await generateBoard("base", DEFAULT_RULES, {
      seed: 3,
      targetCandidates: 3,
      maxAttempts: 10,
      yieldEvery: 1,
      yieldControl,
    });
    expect(yieldControl).toHaveBeenCalled();
  });

  it("returns diagnostics instead of a partial board when no legal candidate exists", async () => {
    const result = await generateBoard("base", DEFAULT_RULES, {
      seed: 1,
      targetCandidates: 1,
      maxAttempts: 1,
      resourceNodeBudget: 100,
      presetOverride: impossiblePreset,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostics.attempts).toBe(1);
  });
});
```

Run: `pnpm test -- tests/generate-board.test.ts`

Expected: FAIL because orchestration does not exist.

- [ ] **Step 2: Implement the result and option contracts**

Create `src/generator/generate-board.ts`:

```ts
export interface GenerateOptions {
  seed?: number;
  targetCandidates?: number;
  maxAttempts?: number;
  resourceNodeBudget?: number;
  numberNodeBudget?: number;
  yieldEvery?: number;
  yieldControl?: () => Promise<void>;
  now?: () => number;
  presetOverride?: BoardPreset;
}

export interface GenerationDiagnostics {
  attempts: number;
  validCandidates: number;
  resourceNodes: number;
  numberNodes: number;
  pruned: Record<string, number>;
}

export type GenerateBoardResult =
  | { ok: true; board: GeneratedBoard; diagnostics: GenerationDiagnostics }
  | { ok: false; diagnostics: GenerationDiagnostics; message: string };
```

```ts
export const generateBoard = async (
  version: BoardVersion,
  rules: GeneratorRules,
  options: GenerateOptions = {},
): Promise<GenerateBoardResult> => {
  const preset = options.presetOverride ?? BOARD_PRESETS[version];
  const seed = options.seed ?? Math.floor(Math.random() * 0x1_0000_0000);
  const targetCandidates = options.targetCandidates ?? 200;
  const maxAttempts = options.maxAttempts ?? 400;
  const resourceNodeBudget = options.resourceNodeBudget ?? 5_000;
  const numberNodeBudget = options.numberNodeBudget ?? 50_000;
  const yieldEvery = options.yieldEvery ?? 10;
  const yieldControl =
    options.yieldControl ??
    (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  const now = options.now ?? Date.now;
  const random = mulberry32(seed);
  const topology = buildTopology(preset.landCoords);
  const diagnostics: GenerationDiagnostics = {
    attempts: 0,
    validCandidates: 0,
    resourceNodes: 0,
    numberNodes: 0,
    pruned: {},
  };
  let best: { hexes: LandHex[]; metrics: BoardMetrics } | null = null;

  const mergePruned = (pruned: Record<string, number>) =>
    Object.entries(pruned).forEach(([key, count]) => {
      diagnostics.pruned[key] = (diagnostics.pruned[key] ?? 0) + count;
    });

  for (
    let attempt = 0;
    attempt < maxAttempts && diagnostics.validCandidates < targetCandidates;
    attempt += 1
  ) {
    diagnostics.attempts = attempt + 1;
    const resources = placeResources(
      preset,
      rules,
      topology,
      random,
      resourceNodeBudget,
    );
    diagnostics.resourceNodes += resources.visitedNodes;
    mergePruned(resources.pruned);
    if (resources.ok) {
      const numbers = placeNumbers(
        preset,
        resources.hexes,
        rules,
        topology,
        random,
        numberNodeBudget,
      );
      diagnostics.numberNodes += numbers.visitedNodes;
      mergePruned(numbers.pruned);
      if (numbers.ok) {
        const violations = validateHardRules(
          numbers.hexes,
          preset,
          rules,
          topology,
        );
        violations.forEach(({ rule }) => {
          diagnostics.pruned[rule] = (diagnostics.pruned[rule] ?? 0) + 1;
        });
        if (violations.length === 0) {
          const metrics = scoreBoard(numbers.hexes, preset, rules, topology);
          if (
            !best ||
            compareMetrics(metrics, best.metrics, rules, version) > 0
          )
            best = { hexes: numbers.hexes, metrics };
          diagnostics.validCandidates += 1;
        }
      }
    }
    if ((attempt + 1) % yieldEvery === 0) await yieldControl();
  }

  if (!best)
    return {
      ok: false,
      diagnostics,
      message: "未找到满足全部规则的地图，请调整约束后重试",
    };
  return {
    ok: true,
    diagnostics,
    board: {
      version,
      hexes: best.hexes,
      metrics: best.metrics,
      seed,
      createdAt: now(),
    },
  };
};
```

Import every referenced type/helper explicitly. Production defaults are visible in this function; do not duplicate them in the page.

- [ ] **Step 3: Run generator tests and the pure suite**

Run: `pnpm test -- tests/generate-board.test.ts tests/resource-search.test.ts tests/number-search.test.ts tests/hard-rules.test.ts tests/scoring.test.ts && pnpm typecheck`

Expected: all tests PASS. Reduced test budgets finish quickly; production defaults remain 200/400/5,000/50,000.

- [ ] **Step 4: Commit**

```bash
git add src/generator/generate-board.ts tests/generate-board.test.ts
git commit -m "feat: generate ranked legal maps"
```

---

### Task 8: Build shared board drawing commands and Canvas execution

**Files:**

- Create: `src/renderer/commands.ts`
- Create: `src/renderer/board-scene.ts`
- Create: `src/renderer/canvas-executor.ts`
- Create: `src/components/BoardCanvas/index.tsx`
- Create: `src/components/BoardCanvas/index.scss`
- Test: `tests/board-scene.test.ts`

- [ ] **Step 1: Write failing scene tests**

Create `tests/board-scene.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type {
  BoardMetrics,
  BoardVersion,
  GeneratedBoard,
} from "@/domain/board";
import { BOARD_PRESETS } from "@/presets/board-presets";
import { createBoardScene } from "@/renderer/board-scene";

const zeroMetrics: BoardMetrics = {
  sameNumberMinDistance: 0,
  resourcePipRange: 0,
  intersectionMaxPips: 0,
  intersectionPipRange: 0,
  intersectionStdDev: 0,
  woodBrickSharedPips: 0,
  normalizedScore: 0,
};
const generatedFixture = (version: BoardVersion) => {
  const preset = BOARD_PRESETS[version];
  let numberIndex = 0;
  const board: GeneratedBoard = {
    version,
    seed: 1,
    createdAt: 1,
    metrics: zeroMetrics,
    hexes: preset.landCoords.map((coord, index) => {
      const resource = preset.resourceBag[index]!;
      return {
        id: `${coord.q},${coord.r}`,
        coord,
        resource,
        number: resource === "desert" ? null : preset.numberBag[numberIndex++]!,
      };
    }),
  };
  return { board, preset };
};
const basePreset = BOARD_PRESETS.base;
const hotNumberFixture: GeneratedBoard = (() => {
  const { board } = generatedFixture("base");
  const productive = board.hexes
    .filter((hex) => hex.resource !== "desert")
    .map((hex) => ({ ...hex }));
  productive[0]!.number = 6;
  productive[1]!.number = 8;
  return {
    ...board,
    hexes: [
      ...productive,
      ...board.hexes.filter((hex) => hex.resource === "desert"),
    ],
  };
})();

describe("createBoardScene", () => {
  it.each(["base", "extension"] as const)(
    "draws all %s sea tiles and directional harbors",
    (version) => {
      const { board, preset } = generatedFixture(version);
      const commands = createBoardScene(board, preset, {
        width: 700,
        height: 700,
        includeSummary: false,
      });
      expect(
        commands.filter((command) => command.tag === "sea-hex"),
      ).toHaveLength(preset.seaCoords.length);
      expect(
        commands.filter((command) => command.tag === "harbor-label"),
      ).toHaveLength(preset.harbors.length);
      expect(
        commands.filter((command) => command.tag === "harbor-channel"),
      ).toHaveLength(preset.harbors.length * 2);
    },
  );

  it("uses red text for 6 and 8 but still draws their number text", () => {
    const commands = createBoardScene(hotNumberFixture, basePreset, {
      width: 700,
      height: 700,
      includeSummary: false,
    });
    expect(commands).toContainEqual(
      expect.objectContaining({ kind: "text", text: "6", color: "#c83a2f" }),
    );
    expect(commands).toContainEqual(
      expect.objectContaining({ kind: "text", text: "8", color: "#c83a2f" }),
    );
  });
});
```

Run: `pnpm test -- tests/board-scene.test.ts`

Expected: FAIL because renderer modules do not exist.

- [ ] **Step 2: Define small platform-neutral drawing commands**

Create `src/renderer/commands.ts`:

```ts
import type { Point } from "@/geometry/hex";

interface Tagged {
  tag?: string;
}
export type DrawCommand =
  | ({ kind: "clear"; color: string; width: number; height: number } & Tagged)
  | ({
      kind: "polygon";
      points: readonly Point[];
      fill: string;
      stroke: string;
      lineWidth: number;
    } & Tagged)
  | ({
      kind: "line";
      from: Point;
      to: Point;
      color: string;
      lineWidth: number;
    } & Tagged)
  | ({
      kind: "circle";
      center: Point;
      radius: number;
      fill: string;
      stroke: string;
      lineWidth: number;
    } & Tagged)
  | ({
      kind: "text";
      at: Point;
      text: string;
      color: string;
      fontSize: number;
      weight: "normal" | "bold";
      align: "left" | "center" | "right";
    } & Tagged);
```

- [ ] **Step 3: Implement board layout and directional harbor channels**

Create `src/renderer/board-scene.ts`:

```ts
export interface SceneOptions {
  width: number;
  height: number;
  includeSummary: boolean;
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

export const createBoardScene = (
  board: GeneratedBoard,
  preset: BoardPreset,
  options: SceneOptions,
): DrawCommand[] => {
  const allCoords = [...preset.seaCoords, ...preset.landCoords];
  const rawPoints = allCoords.flatMap((coord) => hexCorners(coord, 1));
  const minX = Math.min(...rawPoints.map((point) => point.x));
  const maxX = Math.max(...rawPoints.map((point) => point.x));
  const minY = Math.min(...rawPoints.map((point) => point.y));
  const maxY = Math.max(...rawPoints.map((point) => point.y));
  const top = options.includeSummary ? 150 : 30;
  const bottom = options.includeSummary ? 430 : 30;
  const padding = 30;
  const scale = Math.min(
    (options.width - padding * 2) / (maxX - minX),
    (options.height - top - bottom) / (maxY - minY),
  );
  const offsetX = (options.width - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = top - minY * scale;
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
      stroke: "#f2e7d2",
      lineWidth: 2,
      tag: "sea-hex",
    }),
  );
  preset.harbors.forEach((harbor) => {
    const marker = center(harbor.sea);
    const [left, right] = edgeEndpoints(harbor.sea, 1, harbor.facingEdge).map(
      project,
    ) as [Point, Point];
    commands.push({
      kind: "line",
      from: marker,
      to: left,
      color: "#33444f",
      lineWidth: Math.max(2, scale * 0.04),
      tag: "harbor-channel",
    });
    commands.push({
      kind: "line",
      from: marker,
      to: right,
      color: "#33444f",
      lineWidth: Math.max(2, scale * 0.04),
      tag: "harbor-channel",
    });
    if (harbor.kind === "resource" && harbor.resource)
      commands.push({
        kind: "circle",
        center: { x: marker.x, y: marker.y - scale * 0.16 },
        radius: scale * 0.1,
        fill: RESOURCE_COLORS[harbor.resource],
        stroke: "#fff8e8",
        lineWidth: 2,
        tag: "harbor-resource",
      });
    commands.push({
      kind: "text",
      at: { x: marker.x, y: marker.y + scale * 0.12 },
      text: harbor.kind === "generic" ? "3:1" : "2:1",
      color: "#23313a",
      fontSize: Math.max(12, scale * 0.24),
      weight: "bold",
      align: "center",
      tag: "harbor-label",
    });
  });

  const byKey = new Map(board.hexes.map((hex) => [coordKey(hex.coord), hex]));
  preset.landCoords.forEach((coord) => {
    const hex = byKey.get(coordKey(coord))!;
    commands.push({
      kind: "polygon",
      points: polygon(coord),
      fill: RESOURCE_COLORS[hex.resource],
      stroke: "#fff4da",
      lineWidth: 3,
      tag: "land-hex",
    });
    const at = center(coord);
    if (hex.number === null)
      commands.push({
        kind: "text",
        at,
        text: "◆",
        color: "#5e5138",
        fontSize: scale * 0.34,
        weight: "bold",
        align: "center",
        tag: "desert-mark",
      });
    else {
      commands.push({
        kind: "circle",
        center: at,
        radius: scale * 0.27,
        fill: "#fff7dd",
        stroke: "#35434a",
        lineWidth: 2,
        tag: "number-token",
      });
      commands.push({
        kind: "text",
        at,
        text: String(hex.number),
        color: hex.number === 6 || hex.number === 8 ? "#c83a2f" : "#24313a",
        fontSize: scale * 0.3,
        weight: "bold",
        align: "center",
        tag: "number-text",
      });
    }
  });

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
  }
  return commands;
};
```

Import `coordKey`, `GeneratedBoard`, `BoardPreset`, `HexCoord`, `Point`, `edgeEndpoints`, `hexCorners`, `hexToPoint`, `DrawCommand`, and export `RESOURCE_COLORS` for the page legend.

- [ ] **Step 4: Implement the Taro CanvasContext executor**

Create `src/renderer/canvas-executor.ts`:

```ts
import type Taro from "@tarojs/taro";
import type { DrawCommand } from "./commands";

export const executeCommands = (
  context: Taro.CanvasContext,
  commands: readonly DrawCommand[],
): Promise<void> =>
  new Promise((resolve) => {
    for (const command of commands) {
      if (command.kind === "clear") {
        context.setFillStyle(command.color);
        context.fillRect(0, 0, command.width, command.height);
        continue;
      }
      if (command.kind === "polygon") {
        context.beginPath();
        context.moveTo(command.points[0]!.x, command.points[0]!.y);
        command.points
          .slice(1)
          .forEach((point) => context.lineTo(point.x, point.y));
        context.closePath();
        context.setFillStyle(command.fill);
        context.fill();
        context.setStrokeStyle(command.stroke);
        context.setLineWidth(command.lineWidth);
        context.stroke();
        continue;
      }
      if (command.kind === "line") {
        context.beginPath();
        context.moveTo(command.from.x, command.from.y);
        context.lineTo(command.to.x, command.to.y);
        context.setStrokeStyle(command.color);
        context.setLineWidth(command.lineWidth);
        context.stroke();
        continue;
      }
      if (command.kind === "circle") {
        context.beginPath();
        context.arc(
          command.center.x,
          command.center.y,
          command.radius,
          0,
          Math.PI * 2,
        );
        context.setFillStyle(command.fill);
        context.fill();
        context.setStrokeStyle(command.stroke);
        context.setLineWidth(command.lineWidth);
        context.stroke();
        continue;
      }
      context.setFillStyle(command.color);
      context.setFontSize(command.fontSize);
      context.setTextAlign(command.align);
      context.setTextBaseline("middle");
      context.fillText(command.text, command.at.x, command.at.y);
    }
    context.draw(false, resolve);
  });
```

Use `setFillStyle`, `setStrokeStyle`, `setLineWidth`, `setFontSize`, `setTextAlign`, and `setTextBaseline('middle')` for Taro H5/weapp compatibility.

- [ ] **Step 5: Add the reusable Canvas component**

Create `src/components/BoardCanvas/index.tsx`:

```tsx
import { Canvas } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect } from "react";
import type { DrawCommand } from "@/renderer/commands";
import { executeCommands } from "@/renderer/canvas-executor";
import "./index.scss";

interface Props {
  canvasId: string;
  commands: readonly DrawCommand[];
  width: number;
  height: number;
  offscreen?: boolean;
}

export function BoardCanvas({
  canvasId,
  commands,
  width,
  height,
  offscreen = false,
}: Props) {
  useEffect(() => {
    const context = Taro.createCanvasContext(canvasId);
    void executeCommands(context, commands);
  }, [canvasId, commands]);
  return (
    <Canvas
      canvasId={canvasId}
      id={canvasId}
      className={
        offscreen ? "board-canvas board-canvas--offscreen" : "board-canvas"
      }
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
```

Create `src/components/BoardCanvas/index.scss`:

```scss
.board-canvas {
  display: block;
  width: 100%;
  max-width: 100%;
}
.board-canvas--offscreen {
  position: fixed;
  left: -2000px;
  top: 0;
  pointer-events: none;
}
```

- [ ] **Step 6: Run renderer tests**

Run: `pnpm test -- tests/board-scene.test.ts && pnpm typecheck`

Expected: scene tests PASS and TypeScript exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/renderer src/components/BoardCanvas tests/board-scene.test.ts
git commit -m "feat: render maps and directional harbors"
```

---

### Task 9: Add versioned storage and pure page state

**Files:**

- Create: `src/storage/board-storage.ts`
- Create: `src/pages/index/page-state.ts`
- Test: `tests/board-storage.test.ts`
- Test: `tests/page-state.test.ts`

- [ ] **Step 1: Write failing storage and reducer tests**

Create `tests/board-storage.test.ts` using an injected key-value adapter:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "@/domain/rules";
import { BOARD_PRESETS } from "@/presets/board-presets";
import {
  loadBoardState,
  saveBoardState,
  STORAGE_KEY,
  type PersistedBoardState,
  type StorageAdapter,
} from "@/storage/board-storage";

const preset = BOARD_PRESETS.base;
let numberIndex = 0;
const validPersistedState: PersistedBoardState = {
  schemaVersion: 1,
  version: "base",
  rules: DEFAULT_RULES,
  board: {
    version: "base",
    seed: 1,
    createdAt: 1,
    metrics: {
      sameNumberMinDistance: 2,
      resourcePipRange: 3,
      intersectionMaxPips: 12,
      intersectionPipRange: 8,
      intersectionStdDev: 2,
      woodBrickSharedPips: 0,
      normalizedScore: 0.5,
    },
    hexes: preset.landCoords.map((coord, index) => {
      const resource = preset.resourceBag[index]!;
      return {
        id: `${coord.q},${coord.r}`,
        coord,
        resource,
        number: resource === "desert" ? null : preset.numberBag[numberIndex++]!,
      };
    }),
  },
};
const mapStorage = (memory: Map<string, unknown>): StorageAdapter => ({
  get: (key) => memory.get(key),
  set: (key, value) => {
    memory.set(key, value);
  },
  remove: (key) => {
    memory.delete(key);
  },
});

describe("board storage", () => {
  it("round-trips schema v1 and rejects malformed or future records", () => {
    const memory = new Map<string, unknown>();
    const adapter = mapStorage(memory);
    saveBoardState(validPersistedState, adapter);
    expect(loadBoardState(adapter)).toEqual(validPersistedState);
    memory.set(STORAGE_KEY, { schemaVersion: 99 });
    expect(loadBoardState(adapter)).toBeNull();
  });
});
```

Create `tests/page-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { GeneratedBoard } from "@/domain/board";
import { DEFAULT_RULES } from "@/domain/rules";
import {
  initialPageState,
  pageReducer,
  type PageState,
} from "@/pages/index/page-state";

const board: GeneratedBoard = {
  version: "base",
  seed: 1,
  createdAt: 1,
  hexes: [],
  metrics: {
    sameNumberMinDistance: 2,
    resourcePipRange: 3,
    intersectionMaxPips: 12,
    intersectionPipRange: 8,
    intersectionStdDev: 2,
    woodBrickSharedPips: 0,
    normalizedScore: 0.5,
  },
};
const diagnostics = {
  attempts: 1,
  validCandidates: 0,
  resourceNodes: 10,
  numberNodes: 0,
  pruned: { intersectionLimit: 4 },
};
const readyState: PageState = {
  ...initialPageState,
  status: "ready",
  board,
  version: "base",
  draftRules: DEFAULT_RULES,
  appliedRules: DEFAULT_RULES,
};
const changedRules = { ...DEFAULT_RULES, avoidCoastalDesert: true };

describe("pageReducer", () => {
  it("keeps the previous board through generation failure", () => {
    const generating = pageReducer(readyState, { type: "generation-started" });
    const failed = pageReducer(generating, {
      type: "generation-failed",
      message: "无解",
      diagnostics,
    });
    expect(failed.board).toBe(readyState.board);
    expect(failed.status).toBe("generation-error");
  });

  it("marks rule edits dirty without replacing applied rules", () => {
    const next = pageReducer(readyState, {
      type: "draft-rules-changed",
      rules: changedRules,
    });
    expect(next.dirty).toBe(true);
    expect(next.appliedRules).toEqual(readyState.appliedRules);
  });
});
```

Run: `pnpm test -- tests/board-storage.test.ts tests/page-state.test.ts`

Expected: FAIL because storage and reducer modules do not exist.

- [ ] **Step 2: Implement validated schema-v1 storage**

Create `src/storage/board-storage.ts`:

```ts
import Taro from "@tarojs/taro";

export const STORAGE_KEY = "hex-map-generator:v1";
export interface StorageAdapter {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
}
export interface PersistedBoardState {
  schemaVersion: 1;
  version: BoardVersion;
  rules: GeneratorRules;
  board: GeneratedBoard;
}

export const taroStorage: StorageAdapter = {
  get: (key) => Taro.getStorageSync(key),
  set: (key, value) => Taro.setStorageSync(key, value),
  remove: (key) => Taro.removeStorageSync(key),
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isRules = (value: unknown): value is GeneratorRules => {
  if (!isRecord(value)) return false;
  const booleans: (keyof GeneratorRules)[] = [
    "avoidCoastalDesert",
    "uniqueNumberGroupPerResource",
    "intersectionResourceLimitEnabled",
    "maximizeSameNumberDistance",
    "forbidAdjacentSameNumberGroup",
    "disjointWoodBrickNumbers",
    "balanceResourcePips",
    "fairIntersections",
  ];
  return (
    booleans.every((key) => typeof value[key] === "boolean") &&
    [1, 2, 3].includes(value.maxSameResourcePerIntersection as number)
  );
};
const isBoard = (value: unknown): value is GeneratedBoard => {
  if (
    !isRecord(value) ||
    (value.version !== "base" && value.version !== "extension") ||
    !Array.isArray(value.hexes) ||
    !isRecord(value.metrics)
  )
    return false;
  const expectedLength = value.version === "base" ? 19 : 30;
  const metricKeys = [
    "sameNumberMinDistance",
    "resourcePipRange",
    "intersectionMaxPips",
    "intersectionPipRange",
    "intersectionStdDev",
    "woodBrickSharedPips",
    "normalizedScore",
  ];
  const resources = new Set([
    "wood",
    "wool",
    "grain",
    "brick",
    "ore",
    "desert",
  ]);
  const numbers = new Set([2, 3, 4, 5, 6, 8, 9, 10, 11, 12, null]);
  const validHexes = value.hexes.every(
    (hex) =>
      isRecord(hex) &&
      typeof hex.id === "string" &&
      isRecord(hex.coord) &&
      Number.isInteger(hex.coord.q) &&
      Number.isInteger(hex.coord.r) &&
      resources.has(String(hex.resource)) &&
      numbers.has(hex.number as number | null),
  );
  return (
    value.hexes.length === expectedLength &&
    validHexes &&
    metricKeys.every((key) => typeof value.metrics[key] === "number") &&
    typeof value.seed === "number" &&
    typeof value.createdAt === "number"
  );
};
const isPersistedBoardState = (value: unknown): value is PersistedBoardState =>
  isRecord(value) &&
  value.schemaVersion === 1 &&
  (value.version === "base" || value.version === "extension") &&
  isRules(value.rules) &&
  isBoard(value.board) &&
  value.board.version === value.version;

export const loadBoardState = (
  storage: StorageAdapter = taroStorage,
): PersistedBoardState | null => {
  const value = storage.get(STORAGE_KEY);
  if (!isPersistedBoardState(value)) {
    if (value) storage.remove(STORAGE_KEY);
    return null;
  }
  return value;
};
export const saveBoardState = (
  state: PersistedBoardState,
  storage: StorageAdapter = taroStorage,
): void => storage.set(STORAGE_KEY, state);
```

Import `BoardVersion`, `GeneratedBoard`, and `GeneratorRules` explicitly.

- [ ] **Step 3: Implement the page reducer**

Create `src/pages/index/page-state.ts` with:

```ts
export type PageStatus =
  | "restoring"
  | "generating"
  | "ready"
  | "generation-error"
  | "exporting"
  | "export-error";
export interface PageState {
  status: PageStatus;
  version: BoardVersion;
  draftRules: GeneratorRules;
  appliedRules: GeneratorRules;
  board: GeneratedBoard | null;
  dirty: boolean;
  message: string | null;
  diagnostics: GenerationDiagnostics | null;
}

export const initialPageState: PageState = {
  status: "restoring",
  version: "base",
  draftRules: DEFAULT_RULES,
  appliedRules: DEFAULT_RULES,
  board: null,
  dirty: false,
  message: null,
  diagnostics: null,
};

export type PageAction =
  | { type: "restored"; persisted: PersistedBoardState }
  | { type: "version-changed"; version: BoardVersion }
  | { type: "draft-rules-changed"; rules: GeneratorRules }
  | { type: "generation-started" }
  | {
      type: "generation-succeeded";
      board: GeneratedBoard;
      rules: GeneratorRules;
      diagnostics: GenerationDiagnostics;
    }
  | {
      type: "generation-failed";
      message: string;
      diagnostics: GenerationDiagnostics;
    }
  | { type: "export-started" }
  | { type: "export-succeeded" }
  | { type: "export-failed"; message: string };

export const pageReducer = (
  state: PageState,
  action: PageAction,
): PageState => {
  switch (action.type) {
    case "restored":
      return {
        ...state,
        status: "ready",
        version: action.persisted.version,
        draftRules: action.persisted.rules,
        appliedRules: action.persisted.rules,
        board: action.persisted.board,
        dirty: false,
        message: null,
      };
    case "version-changed":
      return { ...state, version: action.version, message: null };
    case "draft-rules-changed":
      return { ...state, draftRules: action.rules, dirty: true, message: null };
    case "generation-started":
      return { ...state, status: "generating", message: null };
    case "generation-succeeded":
      return {
        ...state,
        status: "ready",
        board: action.board,
        draftRules: action.rules,
        appliedRules: action.rules,
        dirty: false,
        message: null,
        diagnostics: action.diagnostics,
      };
    case "generation-failed":
      return {
        ...state,
        status: "generation-error",
        message: action.message,
        diagnostics: action.diagnostics,
      };
    case "export-started":
      return { ...state, status: "exporting", message: null };
    case "export-succeeded":
      return { ...state, status: "ready", message: null };
    case "export-failed":
      return { ...state, status: "export-error", message: action.message };
  }
};
```

Import every referenced type/default explicitly. `generation-failed` and `export-failed` deliberately spread the old state so the successful board remains visible.

- [ ] **Step 4: Run focused tests**

Run: `pnpm test -- tests/board-storage.test.ts tests/page-state.test.ts && pnpm typecheck`

Expected: both suites PASS and TypeScript exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/storage src/pages/index/page-state.ts tests/board-storage.test.ts tests/page-state.test.ts
git commit -m "feat: persist maps and model page state"
```

---

### Task 10: Build the generator page, rule panel, and metrics

**Files:**

- Create: `src/pages/index/use-board-generator.ts`
- Create: `src/components/RulePanel/model.ts`
- Create: `src/components/RulePanel/index.tsx`
- Create: `src/components/RulePanel/index.scss`
- Create: `src/components/MetricSummary/index.tsx`
- Create: `src/components/MetricSummary/index.scss`
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pages/index/index.scss`
- Test: `tests/rule-panel-model.test.ts`

- [ ] **Step 1: Write failing rule-control model tests**

Keep UI state transformations pure and test them without a DOM:

```ts
import { DEFAULT_RULES } from "@/domain/rules";
import {
  decrementIntersectionLimit,
  incrementIntersectionLimit,
  toggleRule,
} from "@/components/RulePanel/model";

it("keeps the intersection limit between 1 and 3", () => {
  expect(
    decrementIntersectionLimit({
      ...DEFAULT_RULES,
      maxSameResourcePerIntersection: 1,
    }).maxSameResourcePerIntersection,
  ).toBe(1);
  expect(
    incrementIntersectionLimit({
      ...DEFAULT_RULES,
      maxSameResourcePerIntersection: 3,
    }).maxSameResourcePerIntersection,
  ).toBe(3);
});

it("toggles only the requested boolean rule", () => {
  expect(toggleRule(DEFAULT_RULES, "avoidCoastalDesert")).toEqual({
    ...DEFAULT_RULES,
    avoidCoastalDesert: true,
  });
});
```

Run: `pnpm test -- tests/rule-panel-model.test.ts`

Expected: FAIL because the rule model does not exist.

- [ ] **Step 2: Implement pure rule transformations**

Create `src/components/RulePanel/model.ts`:

```ts
import type { GeneratorRules } from "@/domain/rules";

export type BooleanRuleKey = Exclude<
  keyof GeneratorRules,
  "maxSameResourcePerIntersection"
>;
export const toggleRule = (
  rules: GeneratorRules,
  key: BooleanRuleKey,
): GeneratorRules => ({ ...rules, [key]: !rules[key] });
export const decrementIntersectionLimit = (
  rules: GeneratorRules,
): GeneratorRules => ({
  ...rules,
  maxSameResourcePerIntersection: Math.max(
    1,
    rules.maxSameResourcePerIntersection - 1,
  ) as 1 | 2 | 3,
});
export const incrementIntersectionLimit = (
  rules: GeneratorRules,
): GeneratorRules => ({
  ...rules,
  maxSameResourcePerIntersection: Math.min(
    3,
    rules.maxSameResourcePerIntersection + 1,
  ) as 1 | 2 | 3,
});
```

- [ ] **Step 3: Implement the page orchestration hook**

Create `src/pages/index/use-board-generator.ts`:

```ts
export const useBoardGenerator = () => {
  const [state, dispatch] = useReducer(pageReducer, initialPageState);

  const runGeneration = useCallback(
    async (version: BoardVersion, rules: GeneratorRules) => {
      dispatch({ type: "generation-started" });
      const result = await generateBoard(version, rules);
      if (!result.ok) {
        dispatch({
          type: "generation-failed",
          message: result.message,
          diagnostics: result.diagnostics,
        });
        return;
      }
      dispatch({
        type: "generation-succeeded",
        board: result.board,
        rules,
        diagnostics: result.diagnostics,
      });
      saveBoardState({ schemaVersion: 1, version, rules, board: result.board });
    },
    [],
  );

  useEffect(() => {
    const persisted = loadBoardState();
    if (persisted) dispatch({ type: "restored", persisted });
    else void runGeneration("base", DEFAULT_RULES);
  }, [runGeneration]);

  const changeVersion = useCallback(
    (version: BoardVersion) => {
      dispatch({ type: "version-changed", version });
      void runGeneration(version, state.draftRules);
    },
    [runGeneration, state.draftRules],
  );
  const changeDraftRules = useCallback(
    (rules: GeneratorRules) => dispatch({ type: "draft-rules-changed", rules }),
    [],
  );
  const regenerate = useCallback(
    () => runGeneration(state.version, state.draftRules),
    [runGeneration, state.draftRules, state.version],
  );

  return { state, changeVersion, changeDraftRules, regenerate, dispatch };
};
```

Import React hooks, domain types/defaults, generator, reducer/initial state, and storage functions explicitly.

- [ ] **Step 4: Implement RulePanel and MetricSummary**

Use Taro `Switch`, `Button`, `Text`, and `View`. Keep labels exactly:

```ts
const RULE_ROWS = [
  ["avoidCoastalDesert", "水边无沙漠"],
  ["uniqueNumberGroupPerResource", "同一资源不能出现相同数字"],
  ["maximizeSameNumberDistance", "最大化相同数字之间的距离"],
  ["forbidAdjacentSameNumberGroup", "相邻数字不能相同"],
  ["disjointWoodBrickNumbers", "木材和砖块的编号并不相同"],
  ["balanceResourcePips", "资源平衡"],
  ["fairIntersections", "交叉路口公平"],
] as const;
```

Implement `RulePanel` with controlled values and local expansion only:

```tsx
interface RulePanelProps {
  version: BoardVersion;
  rules: GeneratorRules;
  disabled: boolean;
  onChange(rules: GeneratorRules): void;
}

export function RulePanel({
  version,
  rules,
  disabled,
  onChange,
}: RulePanelProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View className="rule-panel">
      <Button
        className="rule-panel__header"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        生成规则 {expanded ? "收起" : "展开"}
      </Button>
      {expanded && (
        <View className="rule-panel__body">
          {RULE_ROWS.map(([key, label]) => (
            <View className="rule-row" key={key}>
              <Text>{label}</Text>
              <Switch
                disabled={disabled}
                checked={rules[key]}
                color="#d98b16"
                onChange={() => onChange(toggleRule(rules, key))}
              />
            </View>
          ))}
          <View className="rule-row rule-row--limit">
            <Switch
              disabled={disabled}
              checked={rules.intersectionResourceLimitEnabled}
              color="#d98b16"
              onChange={() =>
                onChange(toggleRule(rules, "intersectionResourceLimitEnabled"))
              }
            />
            <Text>交叉路口最大相同资源</Text>
            <Button
              disabled={disabled}
              onClick={() => onChange(decrementIntersectionLimit(rules))}
            >
              −
            </Button>
            <Text>{rules.maxSameResourcePerIntersection}</Text>
            <Button
              disabled={disabled}
              onClick={() => onChange(incrementIntersectionLimit(rules))}
            >
              ＋
            </Button>
          </View>
          {version === "extension" && (
            <Text className="rule-panel__note">
              扩充版会保留一个 6/8 同资源例外，以及一个木材/砖块共享数字。
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
```

Import `Button`, `Switch`, `Text`, `View`, `useState`, domain types, and model helpers explicitly. Disable all controls while generation/export is active.

`MetricSummary` renders raw values, not a total score:

```tsx
export function MetricSummary({ metrics }: { metrics: BoardMetrics }) {
  return (
    <View className="metric-summary">
      <Text>同组数字最短距离 {metrics.sameNumberMinDistance} 格</Text>
      <Text>资源概率最大差值 {metrics.resourcePipRange}</Text>
      <Text>
        交叉点最高概率 {metrics.intersectionMaxPips}，最大差值{" "}
        {metrics.intersectionPipRange}
      </Text>
    </View>
  );
}
```

- [ ] **Step 5: Compose the page**

Replace `src/pages/index/index.tsx` with a single-page layout:

```tsx
const DIAGNOSTIC_LABELS: Record<string, string> = {
  coastalDesert: "水边沙漠冲突",
  intersectionLimit: "交叉点资源冲突",
  groupRepeat: "同资源数字冲突",
  adjacentGroup: "相邻数字冲突",
  woodBrickOverlap: "木材砖块编号冲突",
  budget: "搜索预算耗尽",
};

export default function IndexPage() {
  const { state, changeVersion, changeDraftRules, regenerate } =
    useBoardGenerator();
  const preset = BOARD_PRESETS[state.version];
  const commands = state.board
    ? createBoardScene(state.board, preset, {
        width: 686,
        height: state.version === "base" ? 650 : 760,
        includeSummary: false,
      })
    : [];
  const busy = state.status === "generating" || state.status === "exporting";

  return (
    <View className="page">
      <View className="version-tabs">
        {(["base", "extension"] as const).map((version) => (
          <Button
            key={version}
            disabled={busy}
            className={
              state.version === version
                ? "version-tab version-tab--active"
                : "version-tab"
            }
            onClick={() => changeVersion(version)}
          >
            {version === "base" ? "2–4 人" : "5–6 人"}
          </Button>
        ))}
      </View>
      <View className="map-card">
        {state.board && (
          <BoardCanvas
            canvasId="board-canvas"
            commands={commands}
            width={686}
            height={state.version === "base" ? 650 : 760}
          />
        )}
        {state.status === "generating" && (
          <View className="map-loading">正在寻找满足规则的地图…</View>
        )}
      </View>
      <View className="actions">
        <Button
          className="action action--primary"
          disabled={busy}
          onClick={regenerate}
        >
          重新生成
        </Button>
        <Button
          className="action action--secondary"
          disabled={!state.board || busy}
        >
          分享图片
        </Button>
      </View>
      {state.dirty && (
        <Text className="dirty-note">配置已变更，点击重新生成后应用</Text>
      )}
      {state.message && (
        <View className="error-card">
          <Text>{state.message}</Text>
          {state.diagnostics &&
            Object.entries(state.diagnostics.pruned)
              .filter(([, count]) => count > 0)
              .map(([rule, count]) => (
                <Text key={rule}>
                  {DIAGNOSTIC_LABELS[rule] ?? rule}：{count} 次
                </Text>
              ))}
        </View>
      )}
      <RulePanel
        version={state.version}
        rules={state.draftRules}
        disabled={busy}
        onChange={changeDraftRules}
      />
      {state.board && <MetricSummary metrics={state.board.metrics} />}
      <View className="resource-legend">
        {(
          [
            ["wood", "木材"],
            ["brick", "砖块"],
            ["wool", "羊毛"],
            ["grain", "小麦"],
            ["ore", "矿石"],
            ["desert", "沙漠"],
          ] as const
        ).map(([resource, label]) => (
          <View className="resource-legend__item" key={resource}>
            <View
              className="resource-legend__swatch"
              style={{ background: RESOURCE_COLORS[resource] }}
            />
            <Text>{label}</Text>
          </View>
        ))}
      </View>
      <Text className="algorithm-note">
        Fisher–Yates 随机排序 · 约束化生成 · 固定方向港口
      </Text>
    </View>
  );
}
```

Wire the share handler in Task 11. Add resource legend chips for wood, brick, wool, grain, ore, and desert below metrics.

- [ ] **Step 6: Add responsive Sass**

Use these fixed tokens in `index.scss` and component styles:

```scss
$paper: #f5f1e8;
$surface: #fffdf8;
$ink: #29333a;
$muted: #73808a;
$accent: #d98b16;
$sea: #69a9d2;

.page {
  min-height: 100vh;
  padding: 24px;
  background: $paper;
  box-sizing: border-box;
}
.version-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}
.version-tab {
  width: 220px;
  border-radius: 999px;
  background: transparent;
  color: $muted;
}
.version-tab--active {
  border: 2px solid $accent;
  color: $accent;
  background: #fff8ea;
}
.map-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  background: $surface;
  box-shadow: 0 12px 30px rgba(41, 51, 58, 0.08);
}
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 253, 248, 0.72);
}
.actions {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin: 24px 0;
}
.action {
  min-height: 88px;
  border-radius: 28px;
  font-weight: 700;
}
.action--primary {
  background: $accent;
  color: white;
}
.action--secondary {
  border: 2px solid $accent;
  color: $accent;
  background: transparent;
}
.resource-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 22px;
  margin-top: 20px;
  color: $muted;
}
.resource-legend__item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.resource-legend__swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}
@media (min-width: 900px) {
  .page {
    max-width: 820px;
    margin: 0 auto;
  }
}
```

Create component styles:

```scss
// RulePanel/index.scss
.rule-panel {
  margin-top: 24px;
  border-radius: 24px;
  background: #fffdf8;
  overflow: hidden;
}
.rule-panel__header {
  width: 100%;
  text-align: left;
  background: transparent;
  color: #29333a;
  font-weight: 700;
}
.rule-panel__body {
  padding: 12px 24px 24px;
}
.rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  border-bottom: 1px solid #eee7da;
}
.rule-row--limit button {
  width: 56px;
  min-width: 56px;
  padding: 0;
}
.rule-panel__note {
  display: block;
  margin-top: 18px;
  color: #73808a;
  font-size: 24px;
  line-height: 1.5;
}

// MetricSummary/index.scss
.metric-summary {
  display: grid;
  gap: 10px;
  margin-top: 20px;
  padding: 20px 24px;
  border-radius: 20px;
  background: #fffdf8;
  color: #52616b;
}
```

Do not add horizontal scrolling. Canvas scene scaling, not CSS clipping, must keep the complete extension sea ring visible.

- [ ] **Step 7: Run focused tests and both builds**

Run: `pnpm test -- tests/rule-panel-model.test.ts tests/page-state.test.ts && pnpm typecheck && pnpm build:h5 && pnpm build:weapp`

Expected: tests PASS, TypeScript exit 0, both builds exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/pages src/components/RulePanel src/components/MetricSummary tests/rule-panel-model.test.ts
git commit -m "feat: build map generator page"
```

---

### Task 11: Export and share the same scene on H5 and WeChat

**Files:**

- Create: `src/sharing/share-image.ts`
- Modify: `src/renderer/board-scene.ts`
- Modify: `src/components/BoardCanvas/index.tsx`
- Modify: `src/pages/index/index.tsx`
- Modify: `src/pages/index/use-board-generator.ts`
- Test: `tests/share-image.test.ts`

- [ ] **Step 1: Write failing platform-adapter tests**

Create `tests/share-image.test.ts` with injected platform APIs:

```ts
import { describe, expect, it, vi } from "vitest";
import { shareImage, type ShareApi } from "@/sharing/share-image";

const apiFixture = (): ShareApi => ({
  getCanvas: vi.fn(() => ({}) as HTMLCanvasElement),
  toPngBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
  download: vi.fn(),
  canvasToTempFilePath: vi.fn(async () => ({ tempFilePath: "/tmp/map.png" })),
  chooseAction: vi.fn(async () => "save" as const),
  previewImage: vi.fn(async () => undefined),
  saveImageToPhotosAlbum: vi.fn(async () => undefined),
});

describe("shareImage", () => {
  it("downloads a PNG on H5", async () => {
    const api = apiFixture();
    await shareImage({ platform: "h5", canvasId: "share-canvas", api });
    expect(api.download).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/\.png$/),
    );
  });

  it("offers preview and explicit save on WeChat", async () => {
    const api = apiFixture();
    await shareImage({ platform: "weapp", canvasId: "share-canvas", api });
    expect(api.canvasToTempFilePath).toHaveBeenCalled();
    expect(api.saveImageToPhotosAlbum).toHaveBeenCalled();
  });

  it("returns a recoverable permission result when album access is denied", async () => {
    const api = apiFixture();
    vi.mocked(api.saveImageToPhotosAlbum).mockRejectedValue({
      errMsg: "saveImageToPhotosAlbum:fail auth deny",
    });
    const result = await shareImage({
      platform: "weapp",
      canvasId: "share-canvas",
      api,
    });
    expect(result).toEqual({ ok: false, reason: "album-permission" });
  });
});
```

Run: `pnpm test -- tests/share-image.test.ts`

Expected: FAIL because share adapter does not exist.

- [ ] **Step 2: Add the share scene**

Extend `createBoardScene` so `includeSummary: true` creates a 1200px-wide portrait scene with title, version, full board, enabled rule lines, metrics, and `Fisher–Yates 随机排序 · 约束化生成`. Reuse every map and harbor command from the normal scene; only transformation and summary commands differ.

After the rule commands, append these exact summary commands:

```ts
commands.push({
  kind: "text",
  at: { x: 70, y: options.height - 140 },
  text: `同组数字最短距离 ${board.metrics.sameNumberMinDistance} 格`,
  color: "#29333a",
  fontSize: 23,
  weight: "bold",
  align: "left",
  tag: "share-metric",
});
commands.push({
  kind: "text",
  at: { x: 70, y: options.height - 105 },
  text: `资源概率最大差值 ${board.metrics.resourcePipRange}`,
  color: "#29333a",
  fontSize: 23,
  weight: "bold",
  align: "left",
  tag: "share-metric",
});
commands.push({
  kind: "text",
  at: { x: 70, y: options.height - 70 },
  text: `交叉点最高 ${board.metrics.intersectionMaxPips} · 最大差值 ${board.metrics.intersectionPipRange}`,
  color: "#29333a",
  fontSize: 23,
  weight: "bold",
  align: "left",
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
```

Add a pure helper:

```ts
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
  if (rules.forbidAdjacentSameNumberGroup) lines.push("相邻数字不能相同");
  if (rules.disjointWoodBrickNumbers) lines.push("木材和砖块编号不相同");
  if (rules.balanceResourcePips) lines.push("资源平衡");
  if (rules.fairIntersections) lines.push("交叉路口公平");

  if (version === "extension" && rules.disjointWoodBrickNumbers)
    lines.push("扩充例外：木材和砖块共享一个数字");
  return lines;
};
```

- [ ] **Step 3: Implement platform share adapters**

Create `src/sharing/share-image.ts` with injected APIs for testing and Taro defaults in production:

```ts
import Taro from "@tarojs/taro";

export type ShareResult =
  | { ok: true }
  | {
      ok: false;
      reason: "render" | "download" | "album-permission" | "cancelled";
    };
export interface ShareApi {
  getCanvas(id: string): HTMLCanvasElement;
  toPngBlob(canvas: HTMLCanvasElement): Promise<Blob>;
  download(blob: Blob, filename: string): void;
  canvasToTempFilePath(options: {
    canvasId: string;
    destWidth: number;
    destHeight: number;
    fileType: "png";
    quality: number;
  }): Promise<{ tempFilePath: string }>;
  chooseAction(items: readonly string[]): Promise<"preview" | "save">;
  previewImage(options: { urls: string[]; current: string }): Promise<void>;
  saveImageToPhotosAlbum(options: { filePath: string }): Promise<void>;
}
export interface ShareRequest {
  platform: "h5" | "weapp";
  canvasId: string;
  api: ShareApi;
  now?: () => number;
}

export const shareImage = async ({
  platform,
  canvasId,
  api,
  now = Date.now,
}: ShareRequest): Promise<ShareResult> => {
  try {
    if (platform === "h5") {
      const canvas = api.getCanvas(canvasId);
      const blob = await api.toPngBlob(canvas);
      api.download(blob, `hex-map-${now()}.png`);
      return { ok: true };
    }

    const { tempFilePath } = await api.canvasToTempFilePath({
      canvasId,
      destWidth: 1200,
      destHeight: 1800,
      fileType: "png",
      quality: 1,
    });
    const action = await api.chooseAction(["预览图片", "保存到相册"]);
    if (action === "preview")
      await api.previewImage({ urls: [tempFilePath], current: tempFilePath });
    else await api.saveImageToPhotosAlbum({ filePath: tempFilePath });
    return { ok: true };
  } catch (error) {
    const message =
      typeof error === "object" && error !== null && "errMsg" in error
        ? String(error.errMsg)
        : String(error);
    if (message.includes("auth deny") || message.includes("auth denied"))
      return { ok: false, reason: "album-permission" };
    if (message.includes("cancel")) return { ok: false, reason: "cancelled" };
    return { ok: false, reason: platform === "h5" ? "download" : "render" };
  }
};

export const createShareApi = (platform: "h5" | "weapp"): ShareApi => ({
  getCanvas: (id) => {
    if (platform !== "h5") throw new Error("canvas DOM is H5-only");
    const canvas = document.getElementById(id);
    if (!(canvas instanceof HTMLCanvasElement))
      throw new Error("share canvas not found");
    return canvas;
  },
  toPngBlob: (canvas) =>
    new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG render failed")),
        "image/png",
      ),
    ),
  download: (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  canvasToTempFilePath: (options) => Taro.canvasToTempFilePath(options),
  chooseAction: async (items) => {
    const { tapIndex } = await Taro.showActionSheet({ itemList: [...items] });
    return tapIndex === 0 ? "preview" : "save";
  },
  previewImage: async (options) => {
    await Taro.previewImage(options);
  },
  saveImageToPhotosAlbum: async (options) => {
    await Taro.saveImageToPhotosAlbum(options);
  },
});
```

Keep calls to `document`, `HTMLCanvasElement`, and `URL` inside functions that execute only for `platform === 'h5'`; the WeChat build may parse but must not evaluate them. When the page receives `album-permission`, show a modal and call `Taro.openSetting()` only after the user confirms.

- [ ] **Step 4: Wire offscreen Canvas and page state**

Add `onDrawn?: () => void` to `BoardCanvas`; call it only after `executeCommands(...).then(onDrawn)`. When a board exists, render a second `BoardCanvas` with `offscreen`, id `share-canvas`, width `1200`, height `1800`, share commands, and `onDrawn={() => setShareReady(true)}`. Reset `shareReady` to false whenever the board id/creation time changes.

The share button must:

1. dispatch `export-started`;
2. reject the click with `图片仍在准备，请稍候` unless `shareReady` is true;
3. call `shareImage` with `process.env.TARO_ENV`;
4. dispatch success or a specific error;
5. preserve the current board in every branch.

- [ ] **Step 5: Run share tests and builds**

Run: `pnpm test -- tests/share-image.test.ts tests/board-scene.test.ts tests/page-state.test.ts && pnpm typecheck && pnpm build:h5 && pnpm build:weapp`

Expected: tests PASS, both builds exit 0, and no browser-only global is evaluated in the WeChat build.

- [ ] **Step 6: Commit**

```bash
git add src/sharing src/renderer/board-scene.ts src/pages/index tests/share-image.test.ts
git commit -m "feat: export map images across platforms"
```

---

### Task 12: Complete integration verification and handoff documentation

**Files:**

- Create: `README.md`

- [ ] **Step 1: Run the full automated suite**

Run: `pnpm test`

Expected: all suites PASS, including presets, geometry, random, resource search, number search, hard rules, scoring, generator, renderer, storage, page state, rule model, and sharing.

- [ ] **Step 2: Run static and build verification**

Run: `pnpm typecheck && pnpm build:h5 && pnpm build:weapp && git diff --check`

Expected: every command exits 0; output exists at `dist/h5` and `dist/weapp`; no whitespace errors.

- [ ] **Step 3: Inspect the H5 page in the in-app browser**

Run: `pnpm dev:h5`

Open the emitted localhost URL using the `browser:control-in-app-browser` skill at execution time. Verify:

- 3–4 map displays 19 land and 18 sea hexes;
- 5–6 map displays 30 land and 22 sea hexes without horizontal scrolling;
- all fixed harbors display the correct `3:1` or resource `2:1` label;
- every harbor shows two channel lines toward its configured land edge;
- default rule switches match the specification;
- rule edits show `配置已变更` without changing the map;
- regenerate replaces the map and updates raw metrics;
- H5 share downloads a non-empty PNG matching the visible map;
- reload restores the last successful version, rules, and board.

Expected: no runtime console error and no clipped sea/harbor labels at 375px and 820px viewport widths.

- [ ] **Step 4: Inspect the WeChat output**

Open the repository in WeChat Developer Tools using `project.config.json`. Verify the same map counts, fixed port directions, generation states, local restore, preview, save, and denied-album authorization flow.

Expected: no compile warning caused by browser-only APIs; generated PNG is sharp at 1200×1800.

- [ ] **Step 5: Add the README**

Create `README.md`:

````md
# 卡坦岛地图生成器

基于 Taro 4、React 和 TypeScript 的离线六边形资源地图生成器，支持 H5 与微信小程序。

## 开发

```bash
pnpm install
pnpm dev:h5
pnpm dev:weapp
```

## 验证

```bash
pnpm test
pnpm typecheck
pnpm build:h5
pnpm build:weapp
```

## 设计约束

- Fisher–Yates 决定资源、数字和坐标的约束搜索顺序。
- 港口位置、类型和开口方向按版图固定。
- 5–6 人版包含规格中说明的两个数学必要例外。
- 地图与分享图片复用同一绘图模型。
- 项目不包含原游戏版权美术素材。
````

- [ ] **Step 6: Re-run final verification after documentation or fixes**

Run: `pnpm test && pnpm typecheck && pnpm build:h5 && pnpm build:weapp && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add README.md src tests package.json pnpm-lock.yaml
git commit -m "docs: document map generator verification"
```

---

## Final acceptance checklist

- [ ] H5 and WeChat builds both pass.
- [ ] Component counts and fixed harbor tables match both presets.
- [ ] Default rule state matches the requested checkboxes.
- [ ] Fisher–Yates controls all constrained-search ordering.
- [ ] Both 5–6 mathematical exceptions are exact and tested.
- [ ] Hard-rule failure preserves the prior board and reports diagnostics.
- [ ] Soft metrics are explainable raw values and influence candidate selection.
- [ ] Harbor type and opening direction appear in page and share image.
- [ ] H5 downloads PNG; WeChat previews/saves and handles denied permission.
- [ ] Cache corruption falls back to defaults.
- [ ] 本地缓存可恢复最近一次成功地图，损坏时回退默认配置。
- [ ] No original game art, texture, icon, or logo is included.
