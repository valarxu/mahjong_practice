// 麻将牌的类型和生成工具函数

// 定义麻将牌集合的类型
export interface TileSet {
  characters: string[];
  bamboo: string[];
  circles: string[];
  winds: string[];
  dragons: string[];
}

// 定义和牌结果的类型
export interface WinningHandResult {
  tiles: string[];
  description: string;
}

// 麻将牌的emoji（不包括花牌）
export const allTiles: TileSet = {
  // 万子
  characters: ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'],
  // 条子
  bamboo: ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'],
  // 筒子
  circles: ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'],
  // 风牌
  winds: ['🀀', '🀁', '🀂', '🀃'],
  // 箭牌
  dragons: ['🀄', '🀅', '🀆']
};

// 生成一个随机的数字牌（万、条、筒），考虑已使用的牌数
export const getRandomNumberTile = (usedTiles: Map<string, number>) => {
  const types = ['characters', 'bamboo', 'circles'] as const;
  
  // 尝试最多20次找到一个未达到限制的牌
  for (let attempt = 0; attempt < 20; attempt++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const index = Math.floor(Math.random() * 9);
    const tile = allTiles[type][index];
    
    // 检查这种牌是否已经使用了4张
    if (!usedTiles.has(tile) || (usedTiles.get(tile) as number) < 4) {
      return tile;
    }
  }
  
  // 如果尝试多次后仍未找到合适的牌，找一个使用最少的牌
  let minUsedTile = '';
  let minUsedCount = 4;
  
  for (const type of types) {
    for (let i = 0; i < 9; i++) {
      const tile = allTiles[type][i];
      const count = usedTiles.get(tile) || 0;
      if (count < minUsedCount) {
        minUsedTile = tile;
        minUsedCount = count;
      }
    }
  }
  
  return minUsedTile;
};

// 生成一个随机的字牌（风、箭），考虑已使用的牌数
export const getRandomHonorTile = (usedTiles: Map<string, number>) => {
  const types = ['winds', 'dragons'] as const;
  
  // 尝试最多10次找到一个未达到限制的牌
  for (let attempt = 0; attempt < 10; attempt++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const index = Math.floor(Math.random() * allTiles[type].length);
    const tile = allTiles[type][index];
    
    // 检查这种牌是否已经使用了4张
    if (!usedTiles.has(tile) || (usedTiles.get(tile) as number) < 4) {
      return tile;
    }
  }
  
  // 如果尝试多次后仍未找到合适的牌，找一个使用最少的牌
  let minUsedTile = '';
  let minUsedCount = 4;
  
  for (const type of types) {
    for (let i = 0; i < allTiles[type].length; i++) {
      const tile = allTiles[type][i];
      const count = usedTiles.get(tile) || 0;
      if (count < minUsedCount) {
        minUsedTile = tile;
        minUsedCount = count;
      }
    }
  }
  
  return minUsedTile;
};

// 生成一个随机的任意牌，考虑已使用的牌数
export const getRandomTile = (usedTiles: Map<string, number>) => {
  return Math.random() < 0.8 ? getRandomNumberTile(usedTiles) : getRandomHonorTile(usedTiles);
};

// 更新已使用的牌计数
export const updateUsedTiles = (usedTiles: Map<string, number>, tile: string) => {
  const currentCount = usedTiles.get(tile) || 0;
  usedTiles.set(tile, currentCount + 1);
};

// 生成一个面子（三张牌），考虑已使用的牌数
export const generateMeld = (usedTiles: Map<string, number>, isSequential: boolean = Math.random() > 0.5): string[] => {
  if (isSequential) {
    // 生成顺子（三张连续的牌）
    const types = ['characters', 'bamboo', 'circles'] as const;
    
    // 尝试最多10次找到可以形成顺子的起始牌
    for (let attempt = 0; attempt < 10; attempt++) {
      const type = types[Math.floor(Math.random() * types.length)];
      // 确保可以形成顺子（最大索引为6，因为需要连续3张牌）
      const startIndex = Math.floor(Math.random() * 7);
      
      const tile1 = allTiles[type][startIndex];
      const tile2 = allTiles[type][startIndex + 1];
      const tile3 = allTiles[type][startIndex + 2];
      
      const count1 = usedTiles.get(tile1) || 0;
      const count2 = usedTiles.get(tile2) || 0;
      const count3 = usedTiles.get(tile3) || 0;
      
      // 检查是否所有牌都未达到4张的限制
      if (count1 < 4 && count2 < 4 && count3 < 4) {
        // 更新使用计数
        updateUsedTiles(usedTiles, tile1);
        updateUsedTiles(usedTiles, tile2);
        updateUsedTiles(usedTiles, tile3);
        
        return [tile1, tile2, tile3];
      }
    }
    
    // 如果无法找到合适的顺子，退化为生成刻子
    return generateMeld(usedTiles, false);
  } else {
    // 生成刻子（三张相同的牌）
    // 尝试最多10次找到可以形成刻子的牌
    for (let attempt = 0; attempt < 10; attempt++) {
      const tile = getRandomTile(usedTiles);
      const count = usedTiles.get(tile) || 0;
      
      // 检查是否这种牌加上要生成的3张后不会超过4张
      if (count + 3 <= 4) {
        // 更新使用计数
        updateUsedTiles(usedTiles, tile);
        updateUsedTiles(usedTiles, tile);
        updateUsedTiles(usedTiles, tile);
        
        return [tile, tile, tile];
      }
    }
    
    // 如果无法找到合适的刻子，尝试生成替代方案
    // 找到剩余数量最多的牌
    let maxRemainingTile = '';
    let maxRemaining = 0;
    
    for (const type in allTiles) {
      for (const tile of allTiles[type as keyof typeof allTiles]) {
        const count = usedTiles.get(tile) || 0;
        const remaining = 4 - count;
        if (remaining > maxRemaining) {
          maxRemainingTile = tile;
          maxRemaining = remaining;
        }
      }
    }
    
    // 使用剩余最多的牌尽可能多地生成
    const result: string[] = [];
    for (let i = 0; i < Math.min(3, maxRemaining); i++) {
      result.push(maxRemainingTile);
      updateUsedTiles(usedTiles, maxRemainingTile);
    }
    
    // 如果不足3张，用其他牌补充
    while (result.length < 3) {
      const tile = getRandomTile(usedTiles);
      result.push(tile);
      updateUsedTiles(usedTiles, tile);
    }
    
    return result;
  }
};

// 生成一个对子（两张相同的牌），考虑已使用的牌数
export const generatePair = (usedTiles: Map<string, number>): string[] => {
  // 尝试最多10次找到可以形成对子的牌
  for (let attempt = 0; attempt < 10; attempt++) {
    const tile = getRandomTile(usedTiles);
    const count = usedTiles.get(tile) || 0;
    
    // 检查是否这种牌加上要生成的2张后不会超过4张
    if (count + 2 <= 4) {
      // 更新使用计数
      updateUsedTiles(usedTiles, tile);
      updateUsedTiles(usedTiles, tile);
      
      return [tile, tile];
    }
  }
  
  // 如果无法找到合适的对子，使用两张不同的牌
  const result: string[] = [];
  for (let i = 0; i < 2; i++) {
    const tile = getRandomTile(usedTiles);
    result.push(tile);
    updateUsedTiles(usedTiles, tile);
  }
  
  return result;
};

// 生成符合17张牌和牌的牌型
export const generateWinningHand = (): WinningHandResult => {
  const usedTiles = new Map<string, number>();
  
  // 17张牌的和牌典型牌型（5面子1对子）
  const patterns = [
    // 牌型1: 标准和牌型 - 5个面子 + 1个对子 = 17张
    {
      description: "标准和牌型 - 五面子一对",
      generator: () => {
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
      }
    },
  ];

  // 随机选择一个牌型
  const patternIndex = Math.floor(Math.random() * patterns.length);
  const result = patterns[patternIndex].generator();
  
  return result;
};

// 排序函数（按照万子、条子、筒子、风牌、箭牌的顺序）
export const sortTiles = (tiles: string[]) => {
  const tileOrder: {[key: string]: number} = {};
  
  // 设置每种牌的排序权重
  let order = 0;
  ['characters', 'bamboo', 'circles', 'winds', 'dragons'].forEach(type => {
    allTiles[type as keyof typeof allTiles].forEach((tile, index) => {
      tileOrder[tile] = order + index;
    });
    order += 100; // 确保不同类型的牌分开排序
  });
  
  return [...tiles].sort((a, b) => tileOrder[a] - tileOrder[b]);
}; 