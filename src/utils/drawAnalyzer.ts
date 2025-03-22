import { Tile, TileToDrawItem } from '../types/mahjong';

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

// 分析打出特定牌后的进张
export const analyzeTilesToDraw = (
  playerTiles: Tile[],
  discardedTiles: Tile[],
  doorTiles: Tile[],
  discardedTileCode: number
): TileToDrawItem[] => {
  // 获取当前手牌编码
  const currentTileCodes = playerTiles.map(tile => tile.code);
  
  // 模拟手牌状态（去掉要打出的牌）
  const simulatedTiles = [...currentTileCodes];
  const discardIndex = simulatedTiles.indexOf(discardedTileCode);
  if (discardIndex !== -1) {
    simulatedTiles.splice(discardIndex, 1);
  }
  
  // 计算当前手牌评分
  const currentHandScore = calculateHandScore(simulatedTiles);
  
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
      
      // 计算新手牌的评分
      const newHandScore = calculateHandScore(newHandTiles);
      
      // 计算改善程度
      improvements[tileCode] = newHandScore - currentHandScore;
    }
  }
  
  // 将改善按照麻将牌顺序排序（万、条、筒、字牌）
  const sortedImprovements = Object.entries(improvements)
    .map(([tile, improvement]) => ({
      tile: parseInt(tile),
      improvement,
      count: remainingTileCounts[parseInt(tile)]
    }))
    .filter(item => item.improvement > 0)  // 只保留有正面改善的进张
    .sort((a, b) => a.tile - b.tile);  // 按照牌的编码顺序排序
  
  return sortedImprovements;
}; 