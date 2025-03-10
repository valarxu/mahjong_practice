import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongSimulator.css';
import { 
  generateWinningHand, 
  sortTiles,
  allTiles
} from '../utils/mahjongUtils';

const MahjongSimulator: React.FC = () => {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<string[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [patternDescription, setPatternDescription] = useState<string>("");

  // 按类型分组显示麻将牌，将风牌和箭牌合并为"字牌"
  const groupTilesByType = (tiles: string[]) => {
    const groups: {[key: string]: string[]} = {
      characters: [],  // 万子
      bamboo: [],      // 条子
      circles: [],     // 筒子
      honors: []       // 字牌（风牌和箭牌）
    };
    
    // 将每张牌分配到对应的类型组
    tiles.forEach(tile => {
      // 对于数牌（万、条、筒）正常分组
      if (allTiles.characters.includes(tile)) {
        groups.characters.push(tile);
      } else if (allTiles.bamboo.includes(tile)) {
        groups.bamboo.push(tile);
      } else if (allTiles.circles.includes(tile)) {
        groups.circles.push(tile);
      } 
      // 将风牌和箭牌都归入"字牌"类别
      else if (allTiles.winds.includes(tile) || allTiles.dragons.includes(tile)) {
        groups.honors.push(tile);
      }
    });
    
    return groups;
  };

  // 抽取17张牌的和牌型
  const drawTiles = () => {
    const result = generateWinningHand();
    const sorted = sortTiles(result.tiles);
    setTiles(sorted);
    setPatternDescription(result.description);
    setSelectedTileIndex(null); // 重置选中状态
  };

  // 处理牌的点击事件
  const handleTileClick = (index: number) => {
    setSelectedTileIndex(index === selectedTileIndex ? null : index);
  };

  // 初始加载时抽牌
  useEffect(() => {
    drawTiles();
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  // 分组后的麻将牌
  const tileGroups = groupTilesByType(tiles);
  
  // 获取全局索引（用于选中状态）
  const getGlobalIndex = (typeIndex: number, tileIndex: number): number => {
    let globalIndex = tileIndex;
    const types = ['characters', 'bamboo', 'circles', 'honors'];
    
    for (let i = 0; i < typeIndex; i++) {
      globalIndex += tileGroups[types[i]].length;
    }
    
    return globalIndex;
  };

  return (
    <div className="mahjong-simulator">
      <h1>17张牌练习模拟器</h1>
      <p className="simulator-description">17张麻将和牌练习</p>
      
      <div className="buttons-container">
        <button className="simulator-button" onClick={drawTiles}>
          重新发牌
        </button>
        <button className="back-button" onClick={handleBackClick}>
          返回首页
        </button>
      </div>
      
      <p className="pattern-description">{patternDescription}</p>
      
      <div className="tiles-container">
        {Object.keys(tileGroups).map((type, typeIndex) => 
          tileGroups[type].length > 0 && (
            <div key={`type-${type}`} className="tile-type-row">
              {tileGroups[type].map((tile, tileIndex) => {
                const globalIndex = getGlobalIndex(typeIndex, tileIndex);
                return (
                  <div 
                    key={`tile-${globalIndex}`} 
                    className={`simulator-tile ${selectedTileIndex === globalIndex ? 'selected' : ''}`}
                    onClick={() => handleTileClick(globalIndex)}
                  >
                    {tile}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MahjongSimulator; 