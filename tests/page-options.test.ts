import { describe, expect, it } from "vitest";
import {
  getBoardVersionForPlayerOption,
  getPlayerOptionIndex,
  PLAYER_OPTIONS,
} from "@/pages/index/page-options";

describe("page options", () => {
  it("maps player picker options to supported board versions", () => {
    expect(PLAYER_OPTIONS.map((option) => option.label)).toEqual([
      "2–4 人",
      "5–6 人",
    ]);
    expect(getBoardVersionForPlayerOption(0)).toBe("base");
    expect(getBoardVersionForPlayerOption(1)).toBe("extension");
    expect(getBoardVersionForPlayerOption(99)).toBe("base");
    expect(getPlayerOptionIndex("base")).toBe(0);
    expect(getPlayerOptionIndex("extension")).toBe(1);
  });
});
