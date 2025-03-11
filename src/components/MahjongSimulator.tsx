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
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [discardInfo, setDiscardInfo] = useState<{tile: string, message: string} | null>(null);

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
    setSelectedTileIndex(null); // 重置选中状态
    setDiscardInfo(null); // 重置打出牌信息
  };

  // 处理牌的点击事件
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
    
    // 使用映射获取正确的牌
    const clickedTile = indexToTileMap[index];
    
    setDiscardInfo({
      tile: clickedTile,
      message: `打出了 ${clickedTile} 牌后，进张如下`
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
        </div>
      )}
    </div>
  );
};

export default MahjongSimulator; 