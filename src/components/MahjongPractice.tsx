import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongPractice.css';

// 牌的类型定义
interface Tile {
  id: string;
  code: number; // 使用数字编码代替直接使用Unicode
  isDrawn: boolean;
  isPreSelected: boolean;
}

// 分析结果中的组定义
interface TileGroup {
  type: 'pung' | 'chow' | 'pair' | 'single' | 'twoSided' | 'closed' | 'edge';
  tiles: number[]; // 使用数字编码
}

// 分析结果定义
interface AnalysisResult {
  groups: TileGroup[];
  remaining: number[];
  used: number;
  total: number;
}

const MahjongPractice: React.FC = () => {
  const navigate = useNavigate();
  const [playerTiles, setPlayerTiles] = useState<Tile[]>([]); // 手牌
  const [discardedTiles, setDiscardedTiles] = useState<Tile[]>([]); // 河里的牌
  const [doorTiles, setDoorTiles] = useState<Tile[]>([]); // 门前的牌
  const [remainingTiles, setRemainingTiles] = useState<number[]>([]); // 剩余可抓的牌
  const [canDraw, setCanDraw] = useState<boolean>(true); // 是否可以抓牌
  const [showConcealedKong, setShowConcealedKong] = useState<boolean>(false); // 是否显示暗杠按钮
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // 牌型分析结果

  // 新增状态变量，用于存储进张分析结果
  const [tilesToDrawAnalysis, setTilesToDrawAnalysis] = useState<{
    tile: number;
    improvement: number;
    count: number;
  }[]>([]);
  const [showTilesToDrawAnalysis, setShowTilesToDrawAnalysis] = useState<boolean>(false);

  // 牌编码常量
  // 0-8: 一万到九万 (0-8)
  // 9-17: 一条到九条 (9-17)
  // 18-26: 一筒到九筒 (18-26)
  // 27-30: 东南西北风 (27-30)
  // 31-33: 中发白 (31-33)

  // 白板的编码
  const WHITE_DRAGON_CODE = 33;

  // 编码到Unicode映射
  const TILE_UNICODE_MAP: Record<number, string> = {
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
  const allTiles: number[] = [
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
  const getTileUnicode = (code: number): string => {
    return TILE_UNICODE_MAP[code] || '?';
  };

  // 检查是否可以抓牌
  const checkCanDraw = (tileCount: number) => {
    // 当手牌数量是3n+1时，可以抓牌
    return tileCount % 3 === 1;
  };

  // 检查是否可以打牌
  const checkCanDiscard = (tileCount: number) => {
    // 当手牌数量是3n+2时，可以打牌
    return tileCount % 3 === 2;
  };

  // 洗牌函数
  const shuffleTiles = (tiles: number[]): number[] => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 排序函数
  const sortTiles = (tiles: Tile[]): Tile[] => {
    return [...tiles].sort((a, b) => {
      // 按照编码排序，自然就是按照万条筒风箭的顺序
      return a.code - b.code;
    });
  };

  // 初始发牌函数
  const dealInitialTiles = () => {
    const shuffled = shuffleTiles(allTiles);
    let playerDealt = shuffled.slice(0, 16); // 发16张牌给玩家
    let remaining = shuffled.slice(16); // 剩余的牌
    const initialDoorTiles: Tile[] = []; // 初始门前牌

    // 检查初始牌中是否有白板
    let hasWhiteDragon = true;
    while (hasWhiteDragon && remaining.length > 0) {
      hasWhiteDragon = false;

      // 检查每张牌是否是白板
      for (let i = 0; i < playerDealt.length; i++) {
        if (playerDealt[i] === WHITE_DRAGON_CODE) {
          // 找到白板，添加到门前
          initialDoorTiles.push({
            id: `door-${initialDoorTiles.length}-${Date.now()}`,
            code: WHITE_DRAGON_CODE,
            isDrawn: false,
            isPreSelected: false
          });

          // 从剩余牌堆中抓一张新牌替换白板
          if (remaining.length > 0) {
            playerDealt[i] = remaining[0];
            remaining = remaining.slice(1);

            // 继续检查，因为新抓的牌可能还是白板
            hasWhiteDragon = true;
          }
        }
      }
    }

    // 转换为Tile对象
    const playerTilesObjects = playerDealt.map((code, index) => ({
      id: `player-${index}-${Date.now()}`,
      code,
      isDrawn: false,
      isPreSelected: false
    }));

    // 排序
    const sortedTiles = sortTiles(playerTilesObjects);

    setPlayerTiles(sortedTiles);
    setRemainingTiles(remaining);
    setDiscardedTiles([]);
    setDoorTiles(initialDoorTiles);
    setCanDraw(checkCanDraw(sortedTiles.length));
    setShowConcealedKong(false);
  };

  // 处理白板的函数
  const handleWhiteDragon = (drawnTile: Tile, currentRemainingTiles: number[]) => {
    // 添加白板到门前
    const doorTile = { ...drawnTile, isPreSelected: false, isDrawn: false };
    const updatedDoorTiles = [...doorTiles, doorTile];
    setDoorTiles(updatedDoorTiles);

    // 如果还有牌，再抓一张
    if (currentRemainingTiles.length > 0) {
      const newDrawnTileCode = currentRemainingTiles[0];
      const newRemainingTiles = currentRemainingTiles.slice(1);

      // 创建新抓的牌
      const newTile: Tile = {
        id: `drawn-${Date.now() + 1}`,
        code: newDrawnTileCode,
        isDrawn: true,
        isPreSelected: false
      };

      // 检查新抓的牌是否是白板
      if (newDrawnTileCode === WHITE_DRAGON_CODE) {
        // 递归处理
        return handleWhiteDragon(newTile, newRemainingTiles);
      } else {
        // 把新抓的牌加入手牌
        const updatedPlayerTiles = [...playerTiles.map(tile => ({
          ...tile,
          isPreSelected: false
        })), newTile];

        setPlayerTiles(updatedPlayerTiles);
        setRemainingTiles(newRemainingTiles);
        setCanDraw(checkCanDraw(updatedPlayerTiles.length));

        return { remainingTiles: newRemainingTiles };
      }
    } else {
      // 没有牌了，保持当前状态
      setCanDraw(checkCanDraw(playerTiles.length));
      return { remainingTiles: currentRemainingTiles };
    }
  };

  // 抓牌函数
  const drawTile = () => {
    // 只有当手牌数量是3n+1时才能抓牌
    if (!canDraw || !checkCanDraw(playerTiles.length)) return;

    if (remainingTiles.length > 0) {
      const drawnTileCode = remainingTiles[0]; // 抓第一张牌
      const newRemainingTiles = remainingTiles.slice(1); // 更新剩余牌堆

      // 添加新抓的牌到手牌中
      const newTile: Tile = {
        id: `drawn-${Date.now()}`,
        code: drawnTileCode,
        isDrawn: true,
        isPreSelected: false
      };

      // 在添加新牌前取消所有预选状态
      const resetTiles = playerTiles.map(tile => ({
        ...tile,
        isPreSelected: false
      }));

      // 检查是否抓到白板
      if (drawnTileCode === WHITE_DRAGON_CODE) {
        const result = handleWhiteDragon(newTile, newRemainingTiles);
        if (result) {
          setRemainingTiles(result.remainingTiles);
        }
      } else {
        // 正常添加牌
        const updatedPlayerTiles = [...resetTiles, newTile];
        setPlayerTiles(updatedPlayerTiles);
        setRemainingTiles(newRemainingTiles);
        setCanDraw(checkCanDraw(updatedPlayerTiles.length));
      }
    }
  };

  // 检查是否有4张相同的牌（可以暗杠）
  const checkConcealedKong = (tiles: Tile[], selectedTileId: string) => {
    // 找到预选的牌
    const selectedTile = tiles.find(t => t.id === selectedTileId);
    if (!selectedTile) return false;

    // 计算相同牌的数量
    const sameValueTiles = tiles.filter(t => t.code === selectedTile.code);
    return sameValueTiles.length === 4;
  };

  // 预选牌的函数 - 修改，增加进张分析
  const preSelectTile = (selectedTileId: string) => {
    // 只有当手牌数量是3n+2时才能预选打牌
    if (!checkCanDiscard(playerTiles.length)) return;

    // 更新牌的状态
    const updatedTiles = playerTiles.map(tile => ({
      ...tile,
      isPreSelected: tile.id === selectedTileId
    }));

    setPlayerTiles(updatedTiles);

    // 检查是否有暗杠
    const hasKong = checkConcealedKong(playerTiles, selectedTileId);
    setShowConcealedKong(hasKong);

    // 进行进张分析
    const selectedTile = playerTiles.find(tile => tile.id === selectedTileId);
    if (selectedTile) {
      analyzeTilesToDraw(selectedTile.code);
      setShowTilesToDrawAnalysis(true);
    } else {
      setShowTilesToDrawAnalysis(false);
    }
  };

  // 暗杠操作
  const performConcealedKong = () => {
    // 找到预选的牌
    const preSelectedTile = playerTiles.find(tile => tile.isPreSelected);
    if (!preSelectedTile) return;

    // 找到所有相同的牌
    const sameValueTiles = playerTiles.filter(t => t.code === preSelectedTile.code);
    if (sameValueTiles.length !== 4) return;

    // 从手牌中移除这4张牌
    const updatedPlayerTiles = playerTiles.filter(t => t.code !== preSelectedTile.code);

    // 添加到门前区域
    const kongTiles = sameValueTiles.map((tile, index) => ({
      id: `kong-${Date.now()}-${index}`,
      code: tile.code,
      isDrawn: false,
      isPreSelected: false
    }));

    setDoorTiles([...doorTiles, ...kongTiles]);
    setPlayerTiles(updatedPlayerTiles);
    setShowConcealedKong(false);

    // 抓一张牌补充
    if (remainingTiles.length > 0) {
      const drawnTileCode = remainingTiles[0];
      const newRemainingTiles = remainingTiles.slice(1);

      const newTile: Tile = {
        id: `drawn-${Date.now()}`,
        code: drawnTileCode,
        isDrawn: true,
        isPreSelected: false
      };

      // 检查是否抓到白板
      if (drawnTileCode === WHITE_DRAGON_CODE) {
        const result = handleWhiteDragon(newTile, newRemainingTiles);
        if (result) {
          setRemainingTiles(result.remainingTiles);
        }
      } else {
        // 正常添加牌
        const finalPlayerTiles = [...updatedPlayerTiles, newTile];
        setPlayerTiles(finalPlayerTiles);
        setRemainingTiles(newRemainingTiles);
        setCanDraw(checkCanDraw(finalPlayerTiles.length));
      }
    }
  };

  // 打牌函数 - 修改，取消进张分析显示
  const discardTile = () => {
    // 只有当手牌数量是3n+2时才能打牌
    if (!checkCanDiscard(playerTiles.length)) return;

    // 找到预选的牌
    const preSelectedTile = playerTiles.find(tile => tile.isPreSelected);
    if (!preSelectedTile) return;

    // 从手牌中移除预选的牌
    const updatedPlayerTiles = playerTiles.filter(tile => !tile.isPreSelected);

    // 将预选的牌加入到河里
    const discardedTile = { ...preSelectedTile, isPreSelected: false };

    // 移除所有牌的isDrawn状态，并重新排序
    const resetTiles = updatedPlayerTiles.map(tile => ({
      ...tile,
      isDrawn: false
    }));

    // 重新排序手牌
    const sortedTiles = sortTiles(resetTiles);

    setPlayerTiles(sortedTiles);
    setDiscardedTiles([...discardedTiles, discardedTile]);
    setCanDraw(checkCanDraw(sortedTiles.length));
    setShowConcealedKong(false);
    // 清除进张分析
    setShowTilesToDrawAnalysis(false);
  };

  // 点击牌的处理函数
  const handleTileClick = (tileId: string) => {
    const tile = playerTiles.find(t => t.id === tileId);
    if (!tile) return;

    if (tile.isPreSelected) {
      // 如果牌已经预选，则打出去
      discardTile();
    } else {
      // 否则预选
      preSelectTile(tileId);
    }
  };

  // 组件加载时发牌
  useEffect(() => {
    dealInitialTiles();
  }, []);

  // 重新发牌
  const handleReDeal = () => {
    dealInitialTiles();
  };

  // 返回首页
  const handleReturnHome = () => {
    navigate('/');
  };

  // 实现牌型分析函数
  const analyzeTiles = () => {
    // 提取手牌的编码
    const tileCodes = playerTiles.map(tile => tile.code);

    // 准备一个纯数字数组，表示每种牌的数量
    const counts = new Array(34).fill(0); // 0-33，共34种牌
    tileCodes.forEach(code => {
      counts[code]++;
    });

    // 调用分析函数
    const result = findBestCombination(counts, tileCodes);

    // 设置分析结果
    setAnalysisResult(result);
  };

  // 寻找最佳组合
  const findBestCombination = (counts: number[], originalTiles: number[]) => {
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

  // 渲染分析结果的函数 - 修复相同牌组不显示问题
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    // 按类型和最小牌码分组
    const groupedResults: {[key: string]: TileGroup[]} = {};
    
    // 对每个牌组生成唯一键并分组
    analysisResult.groups.forEach(group => {
      // 为每个组创建一个键，包含类型和所有牌的代码
      const minTile = Math.min(...group.tiles);
      const key = `${minTile}-${group.type}`;
      
      if (!groupedResults[key]) {
        groupedResults[key] = [];
      }
      
      groupedResults[key].push(group);
    });
    
    // 获取所有键并按牌的值排序
    const sortedKeys = Object.keys(groupedResults).sort((a, b) => {
      const [aMinTile] = a.split('-').map(Number);
      const [bMinTile] = b.split('-').map(Number);
      return aMinTile - bMinTile;
    });
    
    // 最终排序的牌组
    const sortedGroups = sortedKeys.flatMap(key => groupedResults[key]);
    
    return (
      <div className="analysis-result">
        <h3>分析牌型结果 (已组合: {analysisResult.used}/{analysisResult.total}张)</h3>
        
        <div className="analysis-all-groups">
          {sortedGroups.map((group, index) => (
            <div key={`group-${index}`} className={`tile-group ${group.type}`}>
              <div className="group-tiles">
                {group.tiles.map((tileCode, tileIndex) => (
                  <div key={`tile-${index}-${tileIndex}`} className="analysis-tile">
                    {getTileUnicode(tileCode)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 新增函数：分析打出特定牌后的进张
  const analyzeTilesToDraw = (discardedTileCode: number) => {
    // 获取当前手牌编码
    const currentTileCodes = playerTiles.map(tile => tile.code);
    
    // 模拟手牌状态（去掉要打出的牌）
    const simulatedTiles = [...currentTileCodes];
    const discardIndex = simulatedTiles.indexOf(discardedTileCode);
    if (discardIndex !== -1) {
      simulatedTiles.splice(discardIndex, 1);
    }
    
    // 准备用于记录各种进张的改善程度
    const improvements: { [key: number]: number } = {};
    
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
    
    // 将改善按照效果从大到小排序
    const sortedImprovements = Object.entries(improvements)
      .map(([tile, improvement]) => ({
        tile: parseInt(tile),
        improvement,
        count: remainingTileCounts[parseInt(tile)]
      }))
      .filter(item => item.improvement > 0)  // 只保留有正面改善的进张
      .sort((a, b) => b.improvement - a.improvement);
    
    setTilesToDrawAnalysis(sortedImprovements);
  };

  // 新增函数：计算手牌评分
  const calculateHandScore = (tileCodes: number[]) => {
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
          const suit = Math.floor(index / 9);
          const startIndex = suit * 9;
          
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

  // 新增：渲染进张分析结果
  const renderTilesToDrawAnalysis = () => {
    if (!showTilesToDrawAnalysis || tilesToDrawAnalysis.length === 0) {
      return null;
    }
    
    // 总进张数量
    const totalTilesToDraw = tilesToDrawAnalysis.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <div className="tiles-to-draw-analysis">
        <h3>进张分析 (共{totalTilesToDraw}张牌)</h3>
        <div className="tiles-to-draw-groups">
          {tilesToDrawAnalysis.map((item, index) => (
            <div key={`draw-${index}`} className="tiles-to-draw-item">
              <div className="tile-to-draw">
                <div className="analysis-tile">{getTileUnicode(item.tile)}</div>
                <div className="tile-to-draw-info">
                  <span className="tile-count">剩余: {item.count}张</span>
                  <span className="tile-improvement">改善: +{item.improvement.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    analyzeTiles();
  }, [playerTiles]);

  return (
    <div className="mahjong-practice-container">
      <h2>打牌练习</h2>

      <div className="action-buttons">
        <button className="action-button" onClick={handleReturnHome}>返回首页</button>
        <button className="action-button" onClick={handleReDeal}>重新发牌</button>
        <button
          className={`action-button ${!canDraw ? 'disabled' : ''}`}
          onClick={drawTile}
          disabled={!canDraw}
        >
          抓牌
        </button>
        {showConcealedKong && (
          <button
            className="action-button kong-button"
            onClick={performConcealedKong}
          >
            暗杠
          </button>
        )}
        <button className="action-button" onClick={analyzeTiles}>
          分析牌型
        </button>
      </div>

      <div className="practice-content">
        <div className="player-tiles">
          <h3>你的手牌 ({playerTiles.length}张)</h3>
          <div className="tiles-row">
            {playerTiles.map((tile) => (
              <div
                key={tile.id}
                className={`tile ${tile.isDrawn ? 'drawn-tile' : ''} ${tile.isPreSelected ? 'pre-selected' : ''}`}
                onClick={() => handleTileClick(tile.id)}
              >
                {getTileUnicode(tile.code)}
              </div>
            ))}
          </div>
        </div>

        {showTilesToDrawAnalysis && (
          <div className="tiles-to-draw-container">
            {renderTilesToDrawAnalysis()}
          </div>
        )}

        {analysisResult && (
          <div className="analysis-result-container">
            {renderAnalysisResult()}
          </div>
        )}

        {doorTiles.length > 0 && (
          <div className="door-tiles">
            <h3>门前 ({doorTiles.length}张)</h3>
            <div className="tiles-row door-row">
              {doorTiles.map((tile, index) => (
                <div key={`door-${index}`} className="tile door-tile">
                  {getTileUnicode(tile.code)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="discarded-tiles">
          <h3>牌河 ({discardedTiles.length}张)</h3>
          <div className="tiles-row discarded-row">
            {discardedTiles.map((tile, index) => (
              <div key={`discarded-${index}`} className="tile discarded-tile">
                {getTileUnicode(tile.code)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MahjongPractice; 