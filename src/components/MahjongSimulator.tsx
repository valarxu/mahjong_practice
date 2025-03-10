import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongSimulator.css';
import { 
  generateWinningHand, 
  sortTiles 
} from '../utils/mahjongUtils';

const MahjongSimulator: React.FC = () => {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<string[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [patternDescription, setPatternDescription] = useState<string>("");

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

  return (
    <div className="mahjong-simulator">
      <h1>17张牌练习模拟器</h1>
      <p className="simulator-description">17张麻将和牌练习</p>
      <p className="pattern-description">{patternDescription}</p>
      
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