import type { BoardVersion } from "@/domain/board";

export interface PlayerOption {
  label: string;
  version: BoardVersion;
}

export const PLAYER_OPTIONS: readonly PlayerOption[] = [
  { label: "2–4 人", version: "base" },
  { label: "5–6 人", version: "extension" },
];

export const getPlayerOptionIndex = (version: BoardVersion): number =>
  Math.max(
    0,
    PLAYER_OPTIONS.findIndex((option) => option.version === version),
  );

export const getBoardVersionForPlayerOption = (index: number): BoardVersion =>
  PLAYER_OPTIONS[index]?.version ?? "base";
