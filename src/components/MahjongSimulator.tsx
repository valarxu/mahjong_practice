import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongSimulator.css';

const MahjongSimulator: React.FC = () => {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<string[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);

  // 麻将牌的emoji（不包括花牌）
  const allTiles = {
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

  // 生成一副完整的麻将牌（每种牌4张，不包括花牌）
  const generateFullDeck = () => {
    const deck: string[] = [];
    
    // 添加所有类型的牌，每种4张
    Object.values(allTiles).forEach(tileSet => {
      tileSet.forEach(tile => {
        for (let i = 0; i < 4; i++) {
          deck.push(tile);
        }
      });
    });
    
    return deck;
  };

  // 洗牌函数
  const shuffleDeck = (deck: string[]) => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 排序函数（按照万子、条子、筒子、风牌、箭牌的顺序）
  const sortTiles = (tiles: string[]) => {
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

  // 抽取17张牌
  const drawTiles = () => {
    const deck = generateFullDeck();
    const shuffled = shuffleDeck(deck);
    const drawn = shuffled.slice(0, 17);
    const sorted = sortTiles(drawn);
    setTiles(sorted);
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

  return (
    <div className="mahjong-simulator">
      <h1>17张牌练习模拟器</h1>
      
      <div className="tiles-container">
        {tiles.map((tile, index) => (
          <div 
            key={`tile-${index}`} 
            className={`simulator-tile ${selectedTileIndex === index ? 'selected' : ''}`}
            onClick={() => handleTileClick(index)}
          >
            {tile}
          </div>
        ))}
      </div>
      
      <div className="buttons-container">
        <button className="simulator-button" onClick={drawTiles}>
          重新发牌
        </button>
        <button className="back-button" onClick={handleBackClick}>
          返回首页
        </button>
      </div>
    </div>
  );
};

export default MahjongSimulator; 