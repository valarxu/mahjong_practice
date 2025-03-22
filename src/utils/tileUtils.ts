import { Tile } from '../types/mahjong';

// 白板的编码
export const WHITE_DRAGON_CODE = 33;

// 编码到Unicode映射
export const TILE_UNICODE_MAP: Record<number, string> = {
  // 万子
  0: '🀇', 1: '🀈', 2: '🀉', 3: '🀊', 4: '🀋', 5: '🀌', 6: '🀍', 7: '🀎', 8: '🀏',
  // 条子
  9: '🀐', 10: '🀑', 11: '🀒', 12: '🀓', 13: '🀔', 14: '🀕', 15: '🀖', 16: '🀗', 17: '🀘',
  // 筒子
  18: '🀙', 19: '🀚', 20: '🀛', 21: '🀜', 22: '🀝', 23: '🀞', 24: '🀟', 25: '🀠', 26: '🀡',
  // 风牌
  27: '🀀', 28: '🀁', 29: '🀂', 30: '🀃',
  // 箭牌
  31: '🀄', 32: '🀅', 33: '🀆'
};

// 所有麻将牌（用编码表示）
export const allTiles: number[] = [
  // 万子 (36张)
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  0, 1, 2, 3, 4, 5, 6, 7, 8,
  // 条子 (36张)
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  // 筒子 (36张)
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  // 风牌 (16张)
  27, 28, 29, 30, 27, 28, 29, 30,
  27, 28, 29, 30, 27, 28, 29, 30,
  // 箭牌 (12张)
  31, 32, 33, 31, 32, 33,
  31, 32, 33, 31, 32, 33
];

// 获取牌的Unicode表示
export const getTileUnicode = (code: number): string => {
  return TILE_UNICODE_MAP[code] || '?';
};

// 检查是否可以抓牌
export const checkCanDraw = (tileCount: number) => {
  // 当手牌数量是3n+1时，可以抓牌
  return tileCount % 3 === 1;
};

// 检查是否可以打牌
export const checkCanDiscard = (tileCount: number) => {
  // 当手牌数量是3n+2时，可以打牌
  return tileCount % 3 === 2;
};

// 洗牌函数
export const shuffleTiles = (tiles: number[]): number[] => {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 排序函数
export const sortTiles = (tiles: Tile[]): Tile[] => {
  return [...tiles].sort((a, b) => {
    // 按照编码排序，自然就是按照万条筒风箭的顺序
    return a.code - b.code;
  });
};

// 检查是否有4张相同的牌（可以暗杠）
export const checkConcealedKong = (tiles: Tile[], selectedTileId: string) => {
  // 找到预选的牌
  const selectedTile = tiles.find(t => t.id === selectedTileId);
  if (!selectedTile) return false;

  // 计算相同牌的数量
  const sameValueTiles = tiles.filter(t => t.code === selectedTile.code);
  return sameValueTiles.length === 4;
}; 