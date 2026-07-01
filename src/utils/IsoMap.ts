import Phaser from 'phaser';

export enum TileType {
  Grass = 0,
  Path = 1,
  Training = 2,
}

export interface MapObject {
  sprite: Phaser.GameObjects.Image;
  body?: Phaser.Physics.Arcade.StaticBody;
}

export interface IsoMapResult {
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  obstacles: Phaser.Physics.Arcade.StaticGroup;
  dummyPositions: { x: number; y: number }[];
}

const MAP_W = 20;
const MAP_H = 16;
const TILE_W = 64;
const TILE_H = 32;

function cartToIso(col: number, row: number): { x: number; y: number } {
  const x = (col - row) * (TILE_W / 2);
  const y = (col + row) * (TILE_H / 2);
  return { x, y };
}

function buildTileGrid(): TileType[][] {
  const grid: TileType[][] = Array.from({ length: MAP_H }, () =>
    Array.from({ length: MAP_W }, () => TileType.Grass),
  );

  for (let row = 2; row < MAP_H - 2; row++) {
    for (let col = 3; col < MAP_W - 3; col++) {
      grid[row][col] = TileType.Path;
    }
  }

  for (let row = 3; row < MAP_H - 3; row++) {
    grid[row][9] = TileType.Path;
    grid[row][10] = TileType.Path;
  }

  for (let col = 4; col < MAP_W - 4; col++) {
    grid[7][col] = TileType.Path;
    grid[8][col] = TileType.Path;
  }

  for (let row = 10; row < MAP_H - 2; row++) {
    for (let col = 12; col < MAP_W - 2; col++) {
      grid[row][col] = TileType.Training;
    }
  }

  return grid;
}

const HOUSE_POSITIONS = [
  { col: 4, row: 3 },
  { col: 14, row: 3 },
  { col: 3, row: 11 },
  { col: 15, row: 10 },
];

const TREE_POSITIONS = [
  { col: 2, row: 6 },
  { col: 17, row: 5 },
  { col: 2, row: 13 },
  { col: 6, row: 12 },
  { col: 16, row: 13 },
  { col: 11, row: 2 },
];

const DUMMY_POSITIONS = [
  { col: 14, row: 11 },
  { col: 16, row: 11 },
  { col: 15, row: 12 },
  { col: 14, row: 13 },
  { col: 16, row: 13 },
  { col: 15, row: 14 },
];

function getTileTexture(tile: TileType, row: number, col: number): string {
  if (tile === TileType.Grass) {
    return (row + col) % 3 === 0 ? 'tile_grass_v' : 'tile_grass';
  }
  if (tile === TileType.Path) {
    return (row + col) % 3 === 1 ? 'tile_path_v' : 'tile_path';
  }
  return 'tile_training';
}

export function createIsoMap(scene: Phaser.Scene): IsoMapResult {
  const grid = buildTileGrid();
  const offsetX = MAP_W * (TILE_W / 2);
  const offsetY = TILE_H;

  // Tiles with organic variant selection
  for (let row = 0; row < MAP_H; row++) {
    for (let col = 0; col < MAP_W; col++) {
      const { x, y } = cartToIso(col, row);
      const tile = grid[row][col];
      const tex = getTileTexture(tile, row, col);
      scene.add
        .image(offsetX + x, offsetY + y, tex)
        .setOrigin(0.5, 0.5)
        .setDepth(y);
    }
  }

  const obstacles = scene.physics.add.staticGroup();

  // Houses — richer texture, adjusted vertical offset for new art height
  for (const { col, row } of HOUSE_POSITIONS) {
    const { x, y } = cartToIso(col, row);
    const wx = offsetX + x;
    const wy = offsetY + y;
    const house = scene.add.image(wx, wy - 20, 'house').setDepth(wy);
    obstacles.add(house);
    const body = house.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(48, 40);
    body.setOffset(8, 10);
  }

  // Trees — alternate two variants for variety
  TREE_POSITIONS.forEach(({ col, row }, index) => {
    const { x, y } = cartToIso(col, row);
    const wx = offsetX + x;
    const wy = offsetY + y;
    const treeKey = index % 2 === 0 ? 'tree' : 'tree2';
    const tree = scene.add.image(wx, wy - 10, treeKey).setDepth(wy);
    obstacles.add(tree);
    const body = tree.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(28, 28);
    body.setOffset(17, 18);
  });

  // Atmospheric decor (non-blocking, pure visual)
  const decorPositions: Array<{ col: number; row: number; type: 'bush' | 'rock' }> = [
    { col: 1, row: 4, type: 'bush' },
    { col: 5, row: 1, type: 'rock' },
    { col: 18, row: 3, type: 'bush' },
    { col: 0, row: 10, type: 'rock' },
    { col: 7, row: 5, type: 'bush' },
    { col: 19, row: 8, type: 'rock' },
    { col: 3, row: 14, type: 'bush' },
    { col: 12, row: 1, type: 'rock' },
    { col: 17, row: 14, type: 'bush' },
  ];
  for (const { col, row, type } of decorPositions) {
    const { x, y } = cartToIso(col, row);
    const wx = offsetX + x;
    const wy = offsetY + y + (type === 'bush' ? -4 : 0);
    scene.add.image(wx, wy, type).setOrigin(0.5, 0.7).setDepth(wy - 1);
  }

  const spawn = cartToIso(9, 8);
  const dummyPositions = DUMMY_POSITIONS.map(({ col, row }) => {
    const { x, y } = cartToIso(col, row);
    return { x: offsetX + x, y: offsetY + y };
  });

  const mapWidth = offsetX * 2 + TILE_W;
  const mapHeight = (MAP_H + MAP_W) * (TILE_H / 2) + TILE_H * 2;

  return {
    width: mapWidth,
    height: mapHeight,
    spawnX: offsetX + spawn.x,
    spawnY: offsetY + spawn.y,
    obstacles,
    dummyPositions,
  };
}
