// 牌的类型定义
export interface Tile {
  id: string;
  code: number; // 使用数字编码代替直接使用Unicode
  isDrawn: boolean;
  isPreSelected: boolean;
}

// 分析结果中的组定义
export interface TileGroup {
  type: 'pung' | 'chow' | 'pair' | 'single' | 'twoSided' | 'closed' | 'edge';
  tiles: number[]; // 使用数字编码
}

// 分析结果定义
export interface AnalysisResult {
  groups: TileGroup[];
  remaining: number[];
  used: number;
  total: number;
}

// 进张分析项
export interface TileToDrawItem {
  tile: number;
  improvement: number;
  count: number;
} 