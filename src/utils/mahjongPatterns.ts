import { WinningHandResult, allTiles, generateMeld, generatePair, getRandomTile, updateUsedTiles } from './mahjongUtils';

// 标准和牌型 - 5个面子 + 1个对子 = 17张
export const generateStandardPattern = (usedTiles: Map<string, number>): WinningHandResult => {
  // 生成5个面子
  const melds: string[] = [];
  for (let i = 0; i < 5; i++) {
    melds.push(...generateMeld(usedTiles));
  }
  
  // 生成1个对子
  const pair = generatePair(usedTiles);
  
  return {
    tiles: [...melds, ...pair],
    description: "标准和牌型 - 五面子一对"
  };
};

// 清一色和牌型 - 5个面子 + 1个对子，全部同色
export const generatePureColorPattern = (usedTiles: Map<string, number>): WinningHandResult => {
  // 实现清一色牌型的生成逻辑
  // ...
  
  return {
    tiles: [], // 实际的牌
    description: "清一色和牌型" 
  };
};

// 混一色和牌型 - 5个面子 + 1个对子，数牌同色+字牌
export const generateMixedColorPattern = (usedTiles: Map<string, number>): WinningHandResult => {
  // 实现混一色牌型的生成逻辑
  // ...
  
  return {
    tiles: [], // 实际的牌
    description: "混一色和牌型"
  };
};

// 全刻子和牌型 - 5个刻子 + 1个对子
export const generateAllTripletsPattern = (usedTiles: Map<string, number>): WinningHandResult => {
  // 实现全刻子牌型的生成逻辑
  // ...
  
  return {
    tiles: [], // 实际的牌
    description: "全刻子和牌型 - 五刻子一对"
  };
};

// 全顺子和牌型 - 5个顺子 + 1个对子
export const generateAllSequencesPattern = (usedTiles: Map<string, number>): WinningHandResult => {
  // 实现全顺子牌型的生成逻辑
  // ...
  
  return {
    tiles: [], // 实际的牌
    description: "全顺子和牌型 - 五顺子一对"
  };
};

// 所有和牌型的集合
export const patterns = [
  {
    description: "标准和牌型 - 五面子一对",
    generator: generateStandardPattern
  },
  {
    description: "清一色和牌型",
    generator: generatePureColorPattern
  },
  {
    description: "混一色和牌型",
    generator: generateMixedColorPattern
  },
  {
    description: "全刻子和牌型 - 五刻子一对",
    generator: generateAllTripletsPattern
  },
  {
    description: "全顺子和牌型 - 五顺子一对",
    generator: generateAllSequencesPattern
  }
]; 