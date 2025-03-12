import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongSimulator.css';
import { 
  generateWinningHand, 
  allTiles,
  getTileTypeCategory
} from '../utils/mahjongUtils';

const MahjongSimulator: React.FC = () => {
  const navigate = useNavigate();
  const [melds, setMelds] = useState<string[][]>([]); // 保存面子信息
  const [pair, setPair] = useState<string[]>([]); // 保存对子信息
  const [intactMelds, setIntactMelds] = useState<number[]>([]); // 保存未被破坏的面子索引
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [discardInfo, setDiscardInfo] = useState<{
    tile: string, 
    message: string, 
    validDraws?: Array<{tile: string, remaining: number}>
  } | null>(null);

  // 按类型和面子分组显示麻将牌
  const groupTilesByTypeAndMeld = (melds: string[][], pair: string[]) => {
    // 创建分类组，每个花色分开
    const groups: {[key: string]: Array<{isMeld: boolean, tiles: string[]}> } = {
      characters: [], // 万子
      bamboo: [],     // 条子
      circles: [],    // 筒子
      honors: []      // 字牌（风牌和箭牌）
    };
    
    // 按面子分组处理
    for (const meld of melds) {
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
      const pairTile = pair[0];
      let pairType = getTileTypeCategory(pairTile);
      
      if (pairType === 'winds' || pairType === 'dragons') {
        pairType = 'honors';
      }
      
      if (pairType && pairType !== 'unknown') {
        groups[pairType].push({
          isMeld: false,
          tiles: [...pair]
        });
      }
    }
    
    return groups;
  };

  // 抽取17张牌的和牌型
  const drawTiles = () => {
    const result = generateWinningHand();
    setMelds(result.melds);
    setPair(result.pair);
    setIntactMelds(result.intactMelds); // 保存未被破坏的面子索引
    setSelectedTileIndex(null); // 重置选中状态
    setDiscardInfo(null); // 重置打出牌信息
    
    // 添加更详细的调试信息
    console.log("完整结果: ", result);
    console.log("所有面子: ", result.melds);
    console.log("完整面子索引: ", result.intactMelds);
    console.log("完整面子内容: ", result.intactMelds.map(idx => result.melds[idx]));
    console.log("对子: ", result.pair);
  };

  // 将emoji表示的麻将牌转换为数字索引(0-33)
  const tileToIndex = (tile: string): number => {
    // 万子 0-8
    const characterIndex = allTiles.characters.indexOf(tile);
    if (characterIndex !== -1) return characterIndex;
    
    // 条子 9-17
    const bambooIndex = allTiles.bamboo.indexOf(tile);
    if (bambooIndex !== -1) return bambooIndex + 9;
    
    // 筒子 18-26
    const circleIndex = allTiles.circles.indexOf(tile);
    if (circleIndex !== -1) return circleIndex + 18;
    
    // 风牌 27-30
    const windIndex = allTiles.winds.indexOf(tile);
    if (windIndex !== -1) return windIndex + 27;
    
    // 箭牌 31-33
    const dragonIndex = allTiles.dragons.indexOf(tile);
    if (dragonIndex !== -1) return dragonIndex + 31;
    
    return -1; // 未知牌
  };

  // 将数字索引转换回emoji表示的麻将牌
  const indexToTile = (index: number): string => {
    if (index >= 0 && index <= 8) return allTiles.characters[index];
    if (index >= 9 && index <= 17) return allTiles.bamboo[index - 9];
    if (index >= 18 && index <= 26) return allTiles.circles[index - 18];
    if (index >= 27 && index <= 30) return allTiles.winds[index - 27];
    if (index >= 31 && index <= 33) return allTiles.dragons[index - 31];
    return ''; // 无效索引
  };

  // 构建计数数组
  const buildCounts = (tiles: number[]): number[] => {
    const counts = new Array(34).fill(0);
    for (const tile of tiles) {
      if (tile >= 0 && tile < 34) {
        counts[tile]++;
      }
    }
    return counts;
  };

  // 递归计算最大面子数
  const getMaxMelds = (counts: number[]): number => {
    let best = 0;
    
    // 遍历所有牌种
    for (let i = 0; i < 34; i++) {
      // 尝试刻子（三张相同的牌）
      if (counts[i] >= 3) {
        counts[i] -= 3;
        best = Math.max(best, 1 + getMaxMelds(counts));
        counts[i] += 3;  // 回溯
      }
      
      // 顺子：只对数字牌有效（0-8、9-17、18-26为三种花色）
      if (i < 27 && (i % 9) <= 6 && counts[i] > 0 && counts[i+1] > 0 && counts[i+2] > 0) {
        counts[i]--;
        counts[i+1]--;
        counts[i+2]--;
        best = Math.max(best, 1 + getMaxMelds(counts));
        counts[i]++;
        counts[i+1]++;
        counts[i+2]++;
      }
    }
    
    return best;
  };

  // 计算有效进张
  const findValidDraws = (handTiles: string[]): Array<{tile: string, remaining: number}> => {
    // 转换为数字索引
    const hand = handTiles.map(tile => tileToIndex(tile));
    
    // 计算原牌组的面子数
    const counts = buildCounts(hand);
    const baseMelds = getMaxMelds(counts);
    
    const validDraws: Array<{tile: string, remaining: number}> = [];
    
    // 计算手牌中每种牌的使用数量
    const tileUsage = new Map<string, number>();
    for (const tile of handTiles) {
      const count = tileUsage.get(tile) || 0;
      tileUsage.set(tile, count + 1);
    }
    
    // 遍历所有34张牌
    for (let tileIndex = 0; tileIndex < 34; tileIndex++) {
      // 如果输入牌组中该牌已达到4张，则跳过
      if (counts[tileIndex] >= 4) continue;
      
      // 模拟进张
      counts[tileIndex]++;
      
      // 计算新牌组的面子数
      const newMelds = getMaxMelds(counts);
      
      // 如果面子数增加1个，则视为有效进张
      if (newMelds === baseMelds + 1) {
        const tile = indexToTile(tileIndex);
        // 计算牌库中剩余的数量 (一种牌最多4张)
        const used = tileUsage.get(tile) || 0;
        const remaining = 4 - used;
        
        validDraws.push({
          tile, 
          remaining
        });
      }
      
      // 恢复计数
      counts[tileIndex]--;
    }
    
    return validDraws;
  };

  // 检查牌是否在未被破坏的面子或对子中 - 改进逻辑
  const isInIntactTiles = (tile: string) => {
    // 检查是否在对子中
    if (pair.includes(tile)) {
      console.log(`牌 ${tile} 在对子中`);
      return true;
    }
    
    // 检查是否在未被破坏的面子中
    for (const meldIndex of intactMelds) {
      if (melds[meldIndex] && melds[meldIndex].includes(tile)) {
        console.log(`牌 ${tile} 在完整面子 ${meldIndex} 中: ${melds[meldIndex]}`);
        return true;
      }
    }
    
    console.log(`牌 ${tile} 不在任何完整牌组中`);
    return false;
  };

  // 处理牌的点击事件 - 修改以检查牌是否在完整的面子中
  const handleTileClick = (index: number) => {
    if (index === selectedTileIndex) {
      setSelectedTileIndex(null);
      setDiscardInfo(null);
      return;
    }
    
    setSelectedTileIndex(index);
    
    // 创建一个映射来存储每个渲染索引对应的实际牌
    const indexToTileMap: {[key: number]: string} = {};
    let globalIdx = 0;
    
    // 遍历所有牌组，建立索引到牌的映射
    for (const type of ['characters', 'bamboo', 'circles', 'honors']) {
      if (tileGroups[type]) {
        for (const group of tileGroups[type]) {
          for (const tile of group.tiles) {
            indexToTileMap[globalIdx] = tile;
            globalIdx++;
          }
        }
      }
    }
    
    // 获取点击的牌
    const clickedTile = indexToTileMap[index];
    
    // 检查牌是否在未被破坏的面子或对子中
    if (isInIntactTiles(clickedTile)) {
      setDiscardInfo({
        tile: clickedTile,
        message: `无效打牌：不能打出完整面子或对子中的牌`,
        validDraws: []
      });
      return;
    }
    
    // 收集所有手牌
    const allHandTiles: string[] = [];
    for (const type of ['characters', 'bamboo', 'circles', 'honors']) {
      if (tileGroups[type]) {
        for (const group of tileGroups[type]) {
          allHandTiles.push(...group.tiles);
        }
      }
    }
    
    // 模拟打出选中的牌
    const remainingTiles = [...allHandTiles];
    const tileIndex = remainingTiles.indexOf(clickedTile);
    if (tileIndex !== -1) {
      remainingTiles.splice(tileIndex, 1);
    }
    
    // 计算有效进张
    const validDraws = findValidDraws(remainingTiles);
    
    setDiscardInfo({
      tile: clickedTile,
      message: `打出 ${clickedTile} 后，有效进张: ${validDraws.length}张`,
      validDraws: validDraws
    });
  };

  // 初始加载时抽牌
  useEffect(() => {
    drawTiles();
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  // 分组后的麻将牌
  const tileGroups = groupTilesByTypeAndMeld(melds, pair);
  
  // 跟踪全局索引
  let globalIndex = 0;

  return (
    <div className="mahjong-simulator">
      <h1>听牌练习模拟器</h1>
      
      <div className="buttons-container">
        <button className="simulator-button" onClick={drawTiles}>
          重新发牌
        </button>
        <button className="back-button" onClick={handleBackClick}>
          返回首页
        </button>
      </div>
      
      <div className="tiles-container">
        {['characters', 'bamboo', 'circles', 'honors'].map((type) => 
          tileGroups[type].length > 0 && (
            <div key={`type-${type}`} className="tile-type-row">
              {tileGroups[type].map((group, groupIndex) => (
                <div 
                  key={`group-${type}-${groupIndex}`} 
                  className={`tile-group ${group.isMeld ? 'meld-group' : 'pair-group'}`}
                >
                  {group.tiles.map((tile) => {
                    const currentIndex = globalIndex++;
                    return (
                      <div 
                        key={`tile-${currentIndex}`} 
                        className={`simulator-tile ${selectedTileIndex === currentIndex ? 'selected' : ''}`}
                        onClick={() => handleTileClick(currentIndex)}
                      >
                        {tile}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )
        )}
      </div>
      
      {discardInfo && (
        <div className="discard-info">
          <p>{discardInfo.message}</p>
          {discardInfo.validDraws && discardInfo.validDraws.length > 0 && (
            <div className="valid-draws">
              {discardInfo.validDraws.map((drawInfo, idx) => (
                <div key={`draw-${idx}`} className="draw-tile-container">
                  <div className="simulator-tile">
                    {drawInfo.tile}
                  </div>
                  <div className="remaining-count">
                    {drawInfo.remaining}
                  </div>
                </div>
              ))}
            </div>
          )}
          {discardInfo.validDraws && discardInfo.validDraws.length === 0 && (
            <p className="no-draws">无有效进张</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MahjongSimulator; 