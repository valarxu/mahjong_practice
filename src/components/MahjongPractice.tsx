import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongPractice.css';

// 牌的类型定义
interface Tile {
  id: string;
  value: string;
  isDrawn: boolean;
  isPreSelected: boolean;
}

const MahjongPractice: React.FC = () => {
  const navigate = useNavigate();
  const [playerTiles, setPlayerTiles] = useState<Tile[]>([]); // 手牌
  const [discardedTiles, setDiscardedTiles] = useState<Tile[]>([]); // 河里的牌
  const [remainingTiles, setRemainingTiles] = useState<string[]>([]); // 剩余可抓的牌
  const [canDraw, setCanDraw] = useState<boolean>(true); // 是否可以抓牌

  // 所有麻将牌
  const allTiles = [
    // 万子
    '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏',
    '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏',
    '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏',
    '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏',
    // 条子
    '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
    '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
    '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
    '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
    // 筒子
    '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
    '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
    '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
    '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
    // 风牌
    '🀀', '🀁', '🀂', '🀃', '🀀', '🀁', '🀂', '🀃',
    '🀀', '🀁', '🀂', '🀃', '🀀', '🀁', '🀂', '🀃',
    // 箭牌
    '🀄', '🀅', '🀆', '🀄', '🀅', '🀆',
    '🀄', '🀅', '🀆', '🀄', '🀅', '🀆'
  ];

  // 洗牌函数
  const shuffleTiles = (tiles: string[]): string[] => {
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
      const tileGroups = ['🀇🀈🀉🀊🀋🀌🀍🀎🀏', '🀐🀑🀒🀓🀔🀕🀖🀗🀘', '🀙🀚🀛🀜🀝🀞🀟🀠🀡', '🀀🀁🀂🀃', '🀄🀅🀆'];
      
      for (let i = 0; i < tileGroups.length; i++) {
        const groupA = tileGroups[i].includes(a.value);
        const groupB = tileGroups[i].includes(b.value);
        
        if (groupA && !groupB) return -1;
        if (!groupA && groupB) return 1;
        if (groupA && groupB) {
          return tileGroups[i].indexOf(a.value) - tileGroups[i].indexOf(b.value);
        }
      }
      return 0;
    });
  };

  // 初始发牌函数
  const dealInitialTiles = () => {
    const shuffled = shuffleTiles(allTiles);
    const playerDealt = shuffled.slice(0, 16); // 发16张牌给玩家
    const remaining = shuffled.slice(16); // 剩余的牌

    // 转换为Tile对象
    const playerTilesObjects = playerDealt.map((value, index) => ({
      id: `player-${index}-${Date.now()}`,
      value,
      isDrawn: false,
      isPreSelected: false
    }));

    // 排序
    const sortedTiles = sortTiles(playerTilesObjects);
    
    setPlayerTiles(sortedTiles);
    setRemainingTiles(remaining);
    setDiscardedTiles([]);
    setCanDraw(true);
  };

  // 抓牌函数
  const drawTile = () => {
    if (!canDraw || playerTiles.length >= 17) return;
    
    if (remainingTiles.length > 0) {
      const drawnTile = remainingTiles[0]; // 抓第一张牌
      const newRemainingTiles = remainingTiles.slice(1); // 更新剩余牌堆
      
      // 添加新抓的牌到手牌中
      const newTile: Tile = {
        id: `drawn-${Date.now()}`,
        value: drawnTile,
        isDrawn: true,
        isPreSelected: false
      };
      
      // 在添加新牌前取消所有预选状态
      const resetTiles = playerTiles.map(tile => ({
        ...tile,
        isPreSelected: false
      }));
      
      setPlayerTiles([...resetTiles, newTile]);
      setRemainingTiles(newRemainingTiles);
      setCanDraw(false);
    }
  };

  // 预选牌的函数
  const preSelectTile = (selectedTileId: string) => {
    // 如果有17张牌了才能预选
    if (playerTiles.length < 17 && !playerTiles.some(t => t.isDrawn)) return;
    
    // 更新牌的状态
    const updatedTiles = playerTiles.map(tile => ({
      ...tile,
      isPreSelected: tile.id === selectedTileId
    }));
    
    setPlayerTiles(updatedTiles);
  };

  // 打牌函数
  const discardTile = () => {
    // 必须有17张牌才能打牌
    if (playerTiles.length < 17) return;
    
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
    setCanDraw(true);
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
                {tile.value}
              </div>
            ))}
          </div>
        </div>
        
        <div className="discarded-tiles">
          <h3>牌河 ({discardedTiles.length}张)</h3>
          <div className="tiles-row discarded-row">
            {discardedTiles.map((tile, index) => (
              <div key={`discarded-${index}`} className="tile discarded-tile">
                {tile.value}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MahjongPractice; 