import type { LevelConfig } from './level';
import { TileType } from './types';

import level01 from '../../levels/level-01.json';
import level02 from '../../levels/level-02.json';
import level03 from '../../levels/level-03.json';
import level04 from '../../levels/level-04.json';
import level05 from '../../levels/level-05.json';
import level06 from '../../levels/level-06.json';
import level07 from '../../levels/level-07.json';
import level08 from '../../levels/level-08.json';
import level09 from '../../levels/level-09.json';
import level10 from '../../levels/level-10.json';

interface RawLevel {
  id: number;
  moveLimit: number;
  goal: { type: string; count: number };
}

const TILE_TYPE_BY_NAME: Record<string, TileType> = {
  red: TileType.Red,
  blue: TileType.Blue,
  green: TileType.Green,
  yellow: TileType.Yellow,
  purple: TileType.Purple,
};

function parseLevel(raw: RawLevel): LevelConfig {
  return {
    id: raw.id,
    moveLimit: raw.moveLimit,
    goal: { type: TILE_TYPE_BY_NAME[raw.goal.type], count: raw.goal.count },
  };
}

const RAW_LEVELS: RawLevel[] = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
  level09,
  level10,
];

export const LEVELS: LevelConfig[] = RAW_LEVELS.map(parseLevel).sort((a, b) => a.id - b.id);

export function getLevelById(id: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}
