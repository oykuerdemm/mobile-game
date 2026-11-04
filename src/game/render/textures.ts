import Phaser from 'phaser';
import { TileType } from '../logic/types';

export const TILE_SIZE = 64;

const TILE_COLORS: Record<TileType, number> = {
  [TileType.Red]: 0xe74c3c,
  [TileType.Blue]: 0x3498db,
  [TileType.Green]: 0x2ecc71,
  [TileType.Yellow]: 0xf1c40f,
  [TileType.Purple]: 0x9b59b6,
};

export function textureKeyForTile(type: TileType): string {
  return `tile-${type}`;
}

/** Draws one procedural shape texture per tile type (color + shape, for colorblind-friendly distinction). */
export function createTileTextures(scene: Phaser.Scene): void {
  const graphics = scene.make.graphics({}, false);
  const size = TILE_SIZE;
  const center = size / 2;
  const radius = size * 0.38;

  const shapes: Record<TileType, () => void> = {
    [TileType.Red]: () => graphics.fillCircle(center, center, radius),
    [TileType.Blue]: () => drawPolygon(graphics, center, center, radius, 4, Math.PI / 4),
    [TileType.Green]: () => drawPolygon(graphics, center, center, radius, 3, -Math.PI / 2),
    [TileType.Yellow]: () => drawPolygon(graphics, center, center, radius, 4, 0),
    [TileType.Purple]: () => drawStar(graphics, center, center, 5, radius, radius * 0.5),
  };

  for (const type of [TileType.Red, TileType.Blue, TileType.Green, TileType.Yellow, TileType.Purple]) {
    graphics.clear();
    graphics.fillStyle(TILE_COLORS[type], 1);
    shapes[type]();
    graphics.generateTexture(textureKeyForTile(type), size, size);
  }
  graphics.destroy();
}

function drawPolygon(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation: number,
): void {
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    points.push(new Phaser.Math.Vector2(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)));
  }
  g.fillPoints(points, true);
}

function drawStar(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
): void {
  const points: Phaser.Math.Vector2[] = [];
  const step = Math.PI / spikes;
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes; i++) {
    points.push(new Phaser.Math.Vector2(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius));
    rot += step;
    points.push(new Phaser.Math.Vector2(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius));
    rot += step;
  }
  g.fillPoints(points, true);
}
