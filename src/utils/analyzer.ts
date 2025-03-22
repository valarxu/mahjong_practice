import { AnalysisResult, TileGroup } from '../types/mahjong';

// 寻找最佳组合
export const findBestCombination = (counts: number[], originalTiles: number[]): AnalysisResult => {
  // 创建一个计分系统
  // 三张相同的牌（刻子）：3分
  // 顺子：2分
  // 对子：1分
  // 搭子(两面、嵌张、边张)：0.5分
  // 单张：0分
  
  // 定义组合对象
  const result: AnalysisResult = {
    groups: [],
    remaining: [],
    used: 0,
    total: originalTiles.length
  };
  
  // 复制计数数组，因为我们将修改它
  const tileCounts = [...counts];
  
  // 添加牌组的辅助函数
  const addGroup = (type: 'pung' | 'chow' | 'pair' | 'single' | 'twoSided' | 'closed' | 'edge', tiles: number[]) => {
    // 将牌组添加到结果中
    result.groups.push({
      type,
      tiles: [...tiles]
    });
    
    // 更新已使用的牌数
    result.used += tiles.length;
    
    // 减少牌计数
    tiles.forEach(tile => {
      tileCounts[tile]--;
    });
  };
  
  // 尝试形成更优的组合（主要是优化顺子和对子的组合）
  const tryOptimalCombination = () => {
    // 临时计数数组，用于尝试不同组合
    const tempCounts = [...tileCounts];
    
    // 储存最佳组合
    const bestGroups: TileGroup[] = [];
    let maxMeldCount = 0; // 最大面子数
    let bestPairCount = 0; // 最佳对子数
    
    // 递归尝试不同组合
    const tryFormCombination = (groups: TileGroup[], counts: number[], meldCount: number, pairCount: number) => {
      // 评估当前组合
      // 优先考虑完整面子（刻子和顺子）数量，然后考虑对子数量
      if (meldCount > maxMeldCount || (meldCount === maxMeldCount && pairCount > bestPairCount)) {
        maxMeldCount = meldCount;
        bestPairCount = pairCount;
        bestGroups.length = 0;
        bestGroups.push(...groups);
      }
      
      // 尝试形成刻子
      for (let i = 0; i < counts.length; i++) {
        if (counts[i] >= 3) {
          counts[i] -= 3;
          groups.push({ type: 'pung', tiles: [i, i, i] });
          tryFormCombination(groups, counts, meldCount + 1, pairCount);
          groups.pop();
          counts[i] += 3;
        }
      }
      
      // 尝试形成顺子
      for (let suit = 0; suit < 3; suit++) {
        const base = suit * 9;
        for (let i = 0; i < 7; i++) {
          const start = base + i;
          if (counts[start] > 0 && counts[start + 1] > 0 && counts[start + 2] > 0) {
            counts[start]--;
            counts[start + 1]--;
            counts[start + 2]--;
            groups.push({ type: 'chow', tiles: [start, start + 1, start + 2] });
            tryFormCombination(groups, counts, meldCount + 1, pairCount);
            groups.pop();
            counts[start]++;
            counts[start + 1]++;
            counts[start + 2]++;
          }
        }
      }
      
      // 尝试形成对子
      for (let i = 0; i < counts.length; i++) {
        if (counts[i] >= 2) {
          counts[i] -= 2;
          groups.push({ type: 'pair', tiles: [i, i] });
          tryFormCombination(groups, counts, meldCount, pairCount + 1);
          groups.pop();
          counts[i] += 2;
        }
      }
    };
    
    // 开始尝试组合
    tryFormCombination([], tempCounts, 0, 0);
    
    // 应用最佳组合结果
    if (bestGroups.length > 0) {
      bestGroups.forEach(group => {
        group.tiles.forEach(tile => {
          tileCounts[tile]--;
        });
        result.groups.push(group);
        result.used += group.tiles.length;
      });
      return true;
    }
    
    return false;
  };
  
  // 首先尝试找到最优组合（最多的顺子和刻子）
  if (!tryOptimalCombination()) {
    // 如果没有找到最优组合，使用原始算法
    
    // 首先处理刻子（三张相同的牌）
    for (let i = 0; i < tileCounts.length; i++) {
      while (tileCounts[i] >= 3) {
        addGroup('pung', [i, i, i]);
      }
    }
    
    // 处理顺子
    for (let suit = 0; suit < 3; suit++) {
      const base = suit * 9;
      // 特殊情况：优先处理多余的顺子，例如3万出现两次时
      for (let i = 0; i < 7; i++) {
        // 连续检查是否有可能形成顺子
        while (tileCounts[base + i] > 0 && tileCounts[base + i + 1] > 0 && tileCounts[base + i + 2] > 0) {
          addGroup('chow', [base + i, base + i + 1, base + i + 2]);
        }
      }
    }
  }
  
  // 继续处理对子
  for (let i = 0; i < tileCounts.length; i++) {
    if (tileCounts[i] >= 2) {
      addGroup('pair', [i, i]);
    }
  }
  
  // 处理搭子
  for (let suit = 0; suit < 3; suit++) {
    const base = suit * 9;
    
    // 1. 两面搭子
    for (let i = 1; i < 7; i++) {
      if (tileCounts[base + i] > 0 && tileCounts[base + i + 1] > 0) {
        addGroup('twoSided', [base + i, base + i + 1]);
      }
    }
    
    // 2. 嵌张搭子
    for (let i = 0; i < 7; i++) {
      if (tileCounts[base + i] > 0 && tileCounts[base + i + 2] > 0) {
        addGroup('closed', [base + i, base + i + 2]);
      }
    }
    
    // 3. 边张搭子
    if (tileCounts[base] > 0 && tileCounts[base + 1] > 0) {
      addGroup('edge', [base, base + 1]);
    }
    
    if (tileCounts[base + 7] > 0 && tileCounts[base + 8] > 0) {
      addGroup('edge', [base + 7, base + 8]);
    }
  }
  
  // 处理单张牌
  for (let i = 0; i < tileCounts.length; i++) {
    while (tileCounts[i] > 0) {
      addGroup('single', [i]);
    }
  }
  
  return result;
}; 