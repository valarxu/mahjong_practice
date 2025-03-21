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
    setAnalysisResult(null);
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
      
      // 清除当前分析结果
      setAnalysisResult(null);
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

  // 预选牌的函数
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
    
    // 清除当前分析结果
    setAnalysisResult(null);
  };

  // 打牌函数
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
    
    // 清除当前分析结果
    setAnalysisResult(null);
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
    console.log("tileCodes: ", tileCodes);
    
    // 准备一个纯数字数组，表示每种牌的数量
    const counts = new Array(34).fill(0); // 0-33，共34种牌
    tileCodes.forEach(code => {
      counts[code]++;
    });

    console.log("counts: ", counts);
    
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
    
    // 首先尝试找出所有刻子（三张相同的牌）
    for (let i = 0; i < tileCounts.length; i++) {
      if (tileCounts[i] >= 3) {
        // 形成刻子
        result.groups.push({
          type: 'pung',
          tiles: [i, i, i]
        });
        tileCounts[i] -= 3;
        result.used += 3;
      }
    }
    
    // 然后寻找顺子（123, 456, 789）
    // 只能在万、条、筒中形成顺子
    for (let suit = 0; suit < 3; suit++) {
      // 每种花色有9种数字
      const base = suit * 9;
      
      // 检查可能的顺子
      for (let i = 0; i < 7; i++) {
        // 顺子是连续的三张牌
        while (tileCounts[base + i] > 0 && tileCounts[base + i + 1] > 0 && tileCounts[base + i + 2] > 0) {
          // 形成顺子
          result.groups.push({
            type: 'chow',
            tiles: [base + i, base + i + 1, base + i + 2]
          });
          tileCounts[base + i]--;
          tileCounts[base + i + 1]--;
          tileCounts[base + i + 2]--;
          result.used += 3;
        }
      }
    }
    
    // 寻找对子
    for (let i = 0; i < tileCounts.length; i++) {
      if (tileCounts[i] >= 2) {
        // 形成对子
        result.groups.push({
          type: 'pair',
          tiles: [i, i]
        });
        tileCounts[i] -= 2;
        result.used += 2;
      }
    }
    
    // 寻找搭子
    // 只能在万、条、筒中形成搭子
    for (let suit = 0; suit < 3; suit++) {
      const base = suit * 9;
      
      // 1. 寻找两面搭子（如5,6等待4,7）
      for (let i = 0; i < 8; i++) {
        // 跳过边张位置，边张搭子需要单独处理
        if (i === 0 || i === 7) continue;
        
        if (tileCounts[base + i] > 0 && tileCounts[base + i + 1] > 0) {
          // 形成两面搭子
          result.groups.push({
            type: 'twoSided',
            tiles: [base + i, base + i + 1]
          });
          tileCounts[base + i]--;
          tileCounts[base + i + 1]--;
          result.used += 2;
        }
      }
      
      // 2. 寻找嵌张搭子（如3,5等待4）
      for (let i = 0; i < 7; i++) {
        if (tileCounts[base + i] > 0 && tileCounts[base + i + 2] > 0) {
          // 形成嵌张搭子
          result.groups.push({
            type: 'closed',
            tiles: [base + i, base + i + 2]
          });
          tileCounts[base + i]--;
          tileCounts[base + i + 2]--;
          result.used += 2;
        }
      }
      
      // 3. 寻找边张搭子（如1,2等待3或8,9等待7）
      // 一万二万搭子
      if (tileCounts[base] > 0 && tileCounts[base + 1] > 0) {
        result.groups.push({
          type: 'edge',
          tiles: [base, base + 1]
        });
        tileCounts[base]--;
        tileCounts[base + 1]--;
        result.used += 2;
      }
      
      // 八万九万搭子
      if (tileCounts[base + 7] > 0 && tileCounts[base + 8] > 0) {
        result.groups.push({
          type: 'edge',
          tiles: [base + 7, base + 8]
        });
        tileCounts[base + 7]--;
        tileCounts[base + 8]--;
        result.used += 2;
      }
    }
    
    // 处理单张牌
    for (let i = 0; i < tileCounts.length; i++) {
      while (tileCounts[i] > 0) {
        // 形成单张
        result.groups.push({
          type: 'single',
          tiles: [i]
        });
        tileCounts[i]--;
        result.used += 1;
      }
    }
    
    // 返回分析结果
    return result;
  };

  // 渲染分析结果的函数 - 修改以包含搭子类型
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    // 按组类型分组
    const pungGroups = analysisResult.groups.filter(g => g.type === 'pung');
    const chowGroups = analysisResult.groups.filter(g => g.type === 'chow');
    const pairGroups = analysisResult.groups.filter(g => g.type === 'pair');
    const twoSidedGroups = analysisResult.groups.filter(g => g.type === 'twoSided');
    const closedGroups = analysisResult.groups.filter(g => g.type === 'closed');
    const edgeGroups = analysisResult.groups.filter(g => g.type === 'edge');
    const singleGroups = analysisResult.groups.filter(g => g.type === 'single');
    
    return (
      <div className="analysis-result">
        <h3>分析牌型结果 (已组合: {analysisResult.used}/{analysisResult.total}张)</h3>
        
        {/* 横向展示刻子组 */}
        {pungGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">刻子</div>
            <div className="analysis-groups">
              {pungGroups.map((group, index) => (
                <div key={`pung-${index}`} className="tile-group pung">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`pung-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 横向展示顺子组 */}
        {chowGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">顺子</div>
            <div className="analysis-groups">
              {chowGroups.map((group, index) => (
                <div key={`chow-${index}`} className="tile-group chow">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`chow-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 横向展示对子组 */}
        {pairGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">对子</div>
            <div className="analysis-groups">
              {pairGroups.map((group, index) => (
                <div key={`pair-${index}`} className="tile-group pair">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`pair-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 横向展示两面搭子 */}
        {twoSidedGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">两面搭子</div>
            <div className="analysis-groups">
              {twoSidedGroups.map((group, index) => (
                <div key={`twoSided-${index}`} className="tile-group twoSided">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`twoSided-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 横向展示嵌张搭子 */}
        {closedGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">嵌张搭子</div>
            <div className="analysis-groups">
              {closedGroups.map((group, index) => (
                <div key={`closed-${index}`} className="tile-group closed">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`closed-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 横向展示边张搭子 */}
        {edgeGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">边张搭子</div>
            <div className="analysis-groups">
              {edgeGroups.map((group, index) => (
                <div key={`edge-${index}`} className="tile-group edge">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`edge-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 横向展示单张组 */}
        {singleGroups.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">单张</div>
            <div className="analysis-groups">
              {singleGroups.map((group, index) => (
                <div key={`single-${index}`} className="tile-group single">
                  <div className="group-tiles">
                    {group.tiles.map((tileCode, tileIndex) => (
                      <div key={`single-tile-${index}-${tileIndex}`} className="analysis-tile">
                        {getTileUnicode(tileCode)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 如果有剩余未分组的牌 */}
        {analysisResult.remaining.length > 0 && (
          <div className="analysis-row">
            <div className="row-label">剩余牌</div>
            <div className="analysis-groups">
              <div className="tile-group remaining">
                <div className="group-tiles">
                  {analysisResult.remaining.map((tileCode, index) => (
                    <div key={`remaining-tile-${index}`} className="analysis-tile">
                      {getTileUnicode(tileCode)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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