import { AnalysisResult, Tile, TileToDrawItem, TileGroup } from '../types/mahjong';
import { findBestCombination } from './analyzer';

// 计算手牌评分
export const calculateHandScore = (tileCodes: number[]): number => {
  // 计算牌数统计
  const counts = new Array(34).fill(0);
  tileCodes.forEach(code => {
    counts[code]++;
  });
  
  // 计算分数的函数，用递归搜索最佳组合
  const calculateBestScore = (currentCounts: number[]): number => {
    // 基础分数
    let baseScore = 0;
    
    // 函数用于递归尝试不同组合
    const tryFormations = (counts: number[], index: number = 0): number => {
      // 如果已经处理完所有牌
      if (index >= counts.length) {
        return 0;
      }
      
      // 如果当前位置没有牌
      if (counts[index] === 0) {
        return tryFormations(counts, index + 1);
      }
      
      let maxScore = 0;
      
      // 尝试形成刻子
      if (counts[index] >= 3) {
        counts[index] -= 3;
        const scoreWithPung = 3 + tryFormations(counts, index); // 刻子价值3分
        counts[index] += 3;
        maxScore = Math.max(maxScore, scoreWithPung);
      }
      
      // 尝试形成对子
      if (counts[index] >= 2) {
        counts[index] -= 2;
        const scoreWithPair = 1 + tryFormations(counts, index); // 对子价值1分
        counts[index] += 2;
        maxScore = Math.max(maxScore, scoreWithPair);
      }
      
      // 尝试形成顺子 (仅对数牌1-9有效)
      if (index % 9 <= 6 && index < 27) { // 确保是1-7点的数牌
        
        if (counts[index] > 0 && counts[index + 1] > 0 && counts[index + 2] > 0) {
          counts[index]--;
          counts[index + 1]--;
          counts[index + 2]--;
          const scoreWithChow = 2 + tryFormations(counts, index); // 顺子价值2分
          counts[index]++;
          counts[index + 1]++;
          counts[index + 2]++;
          maxScore = Math.max(maxScore, scoreWithChow);
        }
      }
      
      // 尝试将当前牌作为单张处理
      counts[index]--;
      const scoreWithSingle = tryFormations(counts, index);
      counts[index]++;
      
      // 对于单张，我们不额外给分，只是继续尝试组合其他牌
      maxScore = Math.max(maxScore, scoreWithSingle);
      
      return maxScore;
    };
    
    // 执行递归计算
    return baseScore + tryFormations([...currentCounts]);
  };
  
  return calculateBestScore(counts);
};

// 检查是否是不良出牌
export const checkBadDiscard = (playerTiles: Tile[], selectedTileCode: number): { isBad: boolean; reason: string } => {
  // 提取手牌编码
  const tileCodes = playerTiles.map(tile => tile.code);
  
  // 计算每种牌的数量
  const counts = new Array(34).fill(0);
  tileCodes.forEach(code => {
    counts[code]++;
  });
  
  // 分析当前手牌
  const currentAnalysis = findBestCombination(counts, tileCodes);
  
  // 1. 检查是否拆了顺子
  const hasBreakChow = currentAnalysis.groups.some(group => {
    if (group.type === 'chow') {
      return group.tiles.includes(selectedTileCode);
    }
    return false;
  });
  
  if (hasBreakChow) {
    return { isBad: true, reason: '不良出牌：拆了顺子' };
  }
  
  // 计算对子数量
  const pairCount = currentAnalysis.groups.filter(group => group.type === 'pair').length;
  
  // 2. 检查是否在对子不为0的情况下拆了暗刻
  const hasBreakPung = currentAnalysis.groups.some(group => {
    if (group.type === 'pung' && pairCount > 0) {
      return group.tiles.includes(selectedTileCode);
    }
    return false;
  });
  
  if (hasBreakPung) {
    return { isBad: true, reason: '不良出牌：拆了刻子' };
  }
  
  // 3. 检查是否在对子为1的情况下拆了对子
  if (pairCount === 1) {
    const hasBreakPair = currentAnalysis.groups.some(group => {
      if (group.type === 'pair') {
        return group.tiles.includes(selectedTileCode);
      }
      return false;
    });
    
    if (hasBreakPair) {
      return { isBad: true, reason: '不良出牌：拆了唯一对子' };
    }
  }
  
  return { isBad: false, reason: '' };
};

// 评估牌型进度分数（朝着和牌的进度）
export const evaluateHandProgress = (analysis: AnalysisResult): number => {
  // 计算面子数 (顺子+刻子)
  const meldCount = analysis.groups.filter(
    group => group.type === 'chow' || group.type === 'pung'
  ).length;
  
  // 计算对子数
  const pairCount = analysis.groups.filter(group => group.type === 'pair').length;
  
  // 计算搭子数量（可能形成面子的部分）
  const protoMeldCount = analysis.groups.filter(
    group => group.type === 'twoSided' || group.type === 'closed' || group.type === 'edge'
  ).length;
  
  // 计算单张数量
  const singleCount = analysis.groups.filter(group => group.type === 'single').length;
  
  // 基础分数 = 面子*10 + 对子*5 + 搭子*2
  // 每个单张扣1分
  // 这样我们优先形成面子，其次是对子，再次是搭子，单张是负价值
  return meldCount * 10 + Math.min(pairCount, 1) * 5 + protoMeldCount * 2 - singleCount;
};

// 分析打出特定牌后的进张
export const analyzeTilesToDraw = (
  playerTiles: Tile[],
  discardedTiles: Tile[],
  doorTiles: Tile[],
  discardedTileCode: number
): { tilesToDraw: TileToDrawItem[], badDiscard: { isBad: boolean; reason: string } } => {
  // 首先检查是否是不良出牌
  const badDiscardCheck = checkBadDiscard(playerTiles, discardedTileCode);
  if (badDiscardCheck.isBad) {
    return { tilesToDraw: [], badDiscard: badDiscardCheck };
  }
  
  // 获取当前手牌编码
  const currentTileCodes = playerTiles.map(tile => tile.code);
  
  // 模拟手牌状态（去掉要打出的牌）
  const simulatedTiles = [...currentTileCodes];
  const discardIndex = simulatedTiles.indexOf(discardedTileCode);
  if (discardIndex !== -1) {
    simulatedTiles.splice(discardIndex, 1);
  }
  
  // 分析当前牌型（打出牌后）
  const counts = new Array(34).fill(0);
  simulatedTiles.forEach(code => {
    counts[code]++;
  });
  const currentAnalysis = findBestCombination(counts, simulatedTiles);
  const currentProgress = evaluateHandProgress(currentAnalysis);
  
  // 统计未出现的牌数量
  const remainingTileCounts: { [key: number]: number } = {};
  for (let i = 0; i < 34; i++) {
    // 每种牌最多4张
    const maxCount = 4;
    // 已经在手牌和牌河中的数量
    const inHandCount = simulatedTiles.filter(code => code === i).length;
    const inDiscardedCount = discardedTiles.filter(tile => tile.code === i).length;
    const inDoorCount = doorTiles.filter(tile => tile.code === i).length;
    
    // 计算剩余的数量
    remainingTileCounts[i] = Math.max(0, maxCount - inHandCount - inDiscardedCount - inDoorCount);
  }
  
  // 针对每一种可能的进张进行评估
  const improvements: { [key: number]: number } = {};
  for (let tileCode = 0; tileCode < 34; tileCode++) {
    // 如果这种牌还有剩余
    if (remainingTileCounts[tileCode] > 0) {
      // 模拟抓到这张牌
      const newHandTiles = [...simulatedTiles, tileCode];
      
      // 重新分析牌型
      const newCounts = [...counts];
      newCounts[tileCode]++;
      const newAnalysis = findBestCombination(newCounts, newHandTiles);
      const newProgress = evaluateHandProgress(newAnalysis);
      
      // 计算进步程度 - 正值表示向和牌进步
      const progressImprovement = newProgress - currentProgress;
      
      // 只记录有进步的牌
      if (progressImprovement > 0) {
        improvements[tileCode] = progressImprovement;
      }
    }
  }
  
  // 将改善按照麻将牌顺序排序（万、条、筒、字牌）
  const sortedImprovements = Object.entries(improvements)
    .map(([tile, improvement]) => ({
      tile: parseInt(tile),
      improvement,
      count: remainingTileCounts[parseInt(tile)]
    }))
    .sort((a, b) => a.tile - b.tile);  // 按照牌的编码顺序排序
  
  return { 
    tilesToDraw: sortedImprovements,
    badDiscard: { isBad: false, reason: '' }
  };
}; 