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
  melds: string[][];  // 面子信息，每个面子是一个字符串数组
  pair: string[];     // 对子信息
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

// 判断一个面子是否为刻子（三张相同的牌）
const isTriplet = (meld: string[]): boolean => {
  return meld.length === 3 && meld[0] === meld[1] && meld[1] === meld[2];
};

// 判断一个面子是否为顺子（三张连续的牌）
const isSequence = (meld: string[]): boolean => {
  if (meld.length !== 3) return false;

  // 获取牌的类型和序号
  const getTileTypeAndIndex = (tile: string): [string, number] | null => {
    for (const type of ['characters', 'bamboo', 'circles'] as const) {
      const index = allTiles[type].indexOf(tile);
      if (index !== -1) {
        return [type, index];
      }
    }
    return null;
  };

  const info1 = getTileTypeAndIndex(meld[0]);
  const info2 = getTileTypeAndIndex(meld[1]);
  const info3 = getTileTypeAndIndex(meld[2]);

  // 如果任何一张牌不是数字牌，则不是顺子
  if (!info1 || !info2 || !info3) return false;

  // 判断是否同一类型且连续
  return info1[0] === info2[0] && info2[0] === info3[0] && 
         info2[1] === info1[1] + 1 && info3[1] === info2[1] + 1;
};

// 获取数字牌的相邻牌（前一张或后一张）
const getAdjacentTile = (tile: string, direction: 'prev' | 'next'): string | null => {
  for (const type of ['characters', 'bamboo', 'circles'] as const) {
    const index = allTiles[type].indexOf(tile);
    if (index !== -1) {
      const newIndex = direction === 'prev' ? index - 1 : index + 1;
      // 确保新索引在有效范围内（1-9）
      if (newIndex >= 0 && newIndex < allTiles[type].length) {
        return allTiles[type][newIndex];
      }
    }
  }
  return null;
};

// 获取牌的排序权重
const getTileSortWeight = (tile: string): number => {
  for (const type of ['characters', 'bamboo', 'circles', 'winds', 'dragons'] as const) {
    const index = allTiles[type].indexOf(tile);
    if (index !== -1) {
      // 按类型和索引计算权重
      const typeWeight = ['characters', 'bamboo', 'circles', 'winds', 'dragons'].indexOf(type) * 100;
      return typeWeight + index;
    }
  }
  return 999; // 未知牌给予较高权重
};

// 对面子内部进行排序
const sortMeldInternally = (meld: string[]): string[] => {
  return [...meld].sort((a, b) => getTileSortWeight(a) - getTileSortWeight(b));
};

// 比较两个面子的排序顺序
const compareMelds = (meldA: string[], meldB: string[]): number => {
  // 首先按照牌的类型排序
  const typeA = getTileTypeCategory(meldA[0]);
  const typeB = getTileTypeCategory(meldB[0]);
  
  if (typeA !== typeB) {
    // 按类型排序：万、条、筒、风、箭
    const typeOrder = ['characters', 'bamboo', 'circles', 'winds', 'dragons'];
    return typeOrder.indexOf(typeA) - typeOrder.indexOf(typeB);
  }
  
  // 同类型牌，按第一张牌的数值排序
  return getTileSortWeight(meldA[0]) - getTileSortWeight(meldB[0]);
};

// 获取牌的类型类别
const getTileTypeCategory = (tile: string): string => {
  for (const type of ['characters', 'bamboo', 'circles', 'winds', 'dragons'] as const) {
    if (allTiles[type].includes(tile)) {
      return type;
    }
  }
  return 'unknown';
};

// 替换面子中的一张牌
const replaceTileInMeld = (
  meld: string[], 
  tileToReplace: string, 
  newTile: string, 
  usedTiles: Map<string, number>
): boolean => {
  // 确保新牌不会超过4张的限制
  const newTileCount = (usedTiles.get(newTile) || 0);
  if (newTileCount >= 4) return false;

  // 更新使用牌的计数
  const index = meld.findIndex(t => t === tileToReplace);
  if (index === -1) return false;

  // 减少被替换牌的计数
  const oldCount = usedTiles.get(tileToReplace) || 0;
  usedTiles.set(tileToReplace, Math.max(0, oldCount - 1));
  
  // 增加新牌的计数
  usedTiles.set(newTile, newTileCount + 1);
  
  // 替换牌
  meld[index] = newTile;
  
  // 对面子内部进行排序
  const sortedTiles = sortMeldInternally(meld);
  for (let i = 0; i < meld.length; i++) {
    meld[i] = sortedTiles[i];
  }
  
  return true;
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
        // 生成5个面子并保存面子信息
        const allMelds: string[][] = [];
        let allTiles: string[] = [];
        
        for (let i = 0; i < 5; i++) {
          const meld = generateMeld(usedTiles);
          allMelds.push([...meld]); // 保存面子信息
          allTiles = [...allTiles, ...meld];
        }
        
        // 生成1个对子
        const pair = generatePair(usedTiles);
        
        // 随机挑选两个面子进行调整
        if (allMelds.length >= 2) {
          // 打乱面子数组顺序
          const shuffledMelds = [...allMelds].sort(() => Math.random() - 0.5);
          
          // 尝试调整前两个面子
          for (let i = 0; i < 2; i++) {
            const meldToAdjust = shuffledMelds[i];
            
            if (isTriplet(meldToAdjust)) {
              // 如果是刻子，尝试将其中一张替换为前一张或后一张
              const tileToReplace = meldToAdjust[0]; // 所有牌都一样，取第一张
              const direction = Math.random() < 0.5 ? 'prev' : 'next';
              const newTile = getAdjacentTile(tileToReplace, direction);
              
              // 如果找到合适的相邻牌，进行替换
              if (newTile) {
                // 尝试替换刻子中的一张牌
                const replaceIndex = Math.floor(Math.random() * 3);
                
                // 更新面子中的牌、原数组和使用计数
                if (replaceTileInMeld(meldToAdjust, tileToReplace, newTile, usedTiles)) {
                  // 更新原始的allTiles数组
                  const tileIndex = allTiles.findIndex(t => t === tileToReplace);
                  if (tileIndex !== -1) {
                    allTiles[tileIndex] = newTile;
                  }
                }
              }
            } else if (isSequence(meldToAdjust)) {
              // 如果是顺子，将其中一张替换为顺子中的另一张
              const replaceIndex = Math.floor(Math.random() * 3);
              const duplicateIndex = (replaceIndex + 1 + Math.floor(Math.random() * 2)) % 3;
              
              const tileToReplace = meldToAdjust[replaceIndex];
              const newTile = meldToAdjust[duplicateIndex];
              
              // 更新面子中的牌、原数组和使用计数
              if (replaceTileInMeld(meldToAdjust, tileToReplace, newTile, usedTiles)) {
                // 更新原始的allTiles数组
                const tileIndex = allTiles.findIndex(t => t === tileToReplace);
                if (tileIndex !== -1) {
                  allTiles[tileIndex] = newTile;
                }
              }
            }
          }
          
          // 更新tiles数组，保持顺序，并且按照面子类型排序
          allMelds.sort(compareMelds);
          allTiles = [];
          for (const meld of allMelds) {
            allTiles = [...allTiles, ...meld];
          }
        }
        
        return {
          tiles: [...allTiles, ...pair],
          melds: allMelds,
          pair: pair,
          description: "练习牌型 - 有两组面子被打乱"
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

// 按类型和面子分组显示麻将牌（修改groupTilesByTypeAndMeld函数）
const groupTilesByTypeAndMeld = (tiles: string[], melds: string[][], pair: string[]) => {
  // 创建分类组，每个花色分开
  const groups: {[key: string]: Array<{isMeld: boolean, tiles: string[]}> } = {
    characters: [], // 万子
    bamboo: [],     // 条子
    circles: [],    // 筒子
    honors: []      // 字牌（风牌和箭牌）
  };
  
  // 复制一个排序后的面子数组
  const sortedMelds = [...melds].sort(compareMelds);
  
  // 按面子分组处理
  for (const meld of sortedMelds) {
    // 确定面子类型
    let meldType = "";
    const firstTile = meld[0];
    
    if (allTiles.characters.includes(firstTile)) {
      meldType = "characters";
    } else if (allTiles.bamboo.includes(firstTile)) {
      meldType = "bamboo";
    } else if (allTiles.circles.includes(firstTile)) {
      meldType = "circles";
    } else if (allTiles.winds.includes(firstTile) || allTiles.dragons.includes(firstTile)) {
      meldType = "honors";
    }
    
    // 添加到对应类型组
    if (meldType) {
      groups[meldType].push({
        isMeld: true,
        tiles: [...meld]
      });
    }
  }
  
  // 处理对子
  if (pair.length === 2) {
    // ... 现有代码保持不变 ...
  }
  
  return groups;
}; 