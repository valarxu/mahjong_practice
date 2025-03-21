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
  const [doorTiles, setDoorTiles] = useState<Tile[]>([]); // 门前的牌
  const [remainingTiles, setRemainingTiles] = useState<string[]>([]); // 剩余可抓的牌
  const [canDraw, setCanDraw] = useState<boolean>(true); // 是否可以抓牌
  const [showConcealedKong, setShowConcealedKong] = useState<boolean>(false); // 是否显示暗杠按钮

  // 白板的值
  const WHITE_DRAGON = '🀆';

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
    let playerDealt = shuffled.slice(0, 16); // 发16张牌给玩家
    let remaining = shuffled.slice(16); // 剩余的牌
    const initialDoorTiles: Tile[] = []; // 初始门前牌
    
    // 检查初始牌中是否有白板
    let hasWhiteDragon = true;
    while (hasWhiteDragon && remaining.length > 0) {
      hasWhiteDragon = false;
      
      // 检查每张牌是否是白板
      for (let i = 0; i < playerDealt.length; i++) {
        if (playerDealt[i] === WHITE_DRAGON) {
          // 找到白板，添加到门前
          initialDoorTiles.push({
            id: `door-${initialDoorTiles.length}-${Date.now()}`,
            value: WHITE_DRAGON,
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
    setDoorTiles(initialDoorTiles);
    setCanDraw(checkCanDraw(sortedTiles.length));
    setShowConcealedKong(false);
  };

  // 处理白板的函数
  const handleWhiteDragon = (drawnTile: Tile, currentRemainingTiles: string[]) => {
    // 添加白板到门前
    const doorTile = { ...drawnTile, isPreSelected: false, isDrawn: false };
    const updatedDoorTiles = [...doorTiles, doorTile];
    setDoorTiles(updatedDoorTiles);

    // 如果还有牌，再抓一张
    if (currentRemainingTiles.length > 0) {
      const newDrawnTile = currentRemainingTiles[0];
      const newRemainingTiles = currentRemainingTiles.slice(1);
      
      // 创建新抓的牌
      const newTile: Tile = {
        id: `drawn-${Date.now() + 1}`,
        value: newDrawnTile,
        isDrawn: true,
        isPreSelected: false
      };
      
      // 检查新抓的牌是否是白板
      if (newDrawnTile === WHITE_DRAGON) {
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
      const drawnTileValue = remainingTiles[0]; // 抓第一张牌
      const newRemainingTiles = remainingTiles.slice(1); // 更新剩余牌堆
      
      // 添加新抓的牌到手牌中
      const newTile: Tile = {
        id: `drawn-${Date.now()}`,
        value: drawnTileValue,
        isDrawn: true,
        isPreSelected: false
      };
      
      // 在添加新牌前取消所有预选状态
      const resetTiles = playerTiles.map(tile => ({
        ...tile,
        isPreSelected: false
      }));
      
      // 检查是否抓到白板
      if (drawnTileValue === WHITE_DRAGON) {
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
    const sameValueTiles = tiles.filter(t => t.value === selectedTile.value);
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
    const sameValueTiles = playerTiles.filter(t => t.value === preSelectedTile.value);
    if (sameValueTiles.length !== 4) return;
    
    // 从手牌中移除这4张牌
    const updatedPlayerTiles = playerTiles.filter(t => t.value !== preSelectedTile.value);
    
    // 添加到门前区域
    const kongTiles = sameValueTiles.map((tile, index) => ({
      id: `kong-${Date.now()}-${index}`,
      value: tile.value,
      isDrawn: false,
      isPreSelected: false
    }));
    
    setDoorTiles([...doorTiles, ...kongTiles]);
    setPlayerTiles(updatedPlayerTiles);
    setShowConcealedKong(false);
    
    // 抓一张牌补充
    if (remainingTiles.length > 0) {
      const drawnTileValue = remainingTiles[0];
      const newRemainingTiles = remainingTiles.slice(1);
      
      const newTile: Tile = {
        id: `drawn-${Date.now()}`,
        value: drawnTileValue,
        isDrawn: true,
        isPreSelected: false
      };
      
      // 检查是否抓到白板
      if (drawnTileValue === WHITE_DRAGON) {
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
        {showConcealedKong && (
          <button 
            className="action-button kong-button" 
            onClick={performConcealedKong}
          >
            暗杠
          </button>
        )}
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
        
        {doorTiles.length > 0 && (
          <div className="door-tiles">
            <h3>门前 ({doorTiles.length}张)</h3>
            <div className="tiles-row door-row">
              {doorTiles.map((tile, index) => (
                <div key={`door-${index}`} className="tile door-tile">
                  {tile.value}
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