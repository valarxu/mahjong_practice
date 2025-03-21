import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongPractice.css';

const MahjongPractice: React.FC = () => {
  const navigate = useNavigate();
  const [playerTiles, setPlayerTiles] = useState<string[]>([]);
  
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

  // 发牌函数
  const dealTiles = () => {
    const shuffled = shuffleTiles(allTiles);
    const dealt = shuffled.slice(0, 17);
    // 排序，按照万、条、筒、风、箭的顺序
    dealt.sort((a, b) => {
      const tileGroups = ['🀇🀈🀉🀊🀋🀌🀍🀎🀏', '🀐🀑🀒🀓🀔🀕🀖🀗🀘', '🀙🀚🀛🀜🀝🀞🀟🀠🀡', '🀀🀁🀂🀃', '🀄🀅🀆'];
      
      for (let i = 0; i < tileGroups.length; i++) {
        const groupA = tileGroups[i].includes(a);
        const groupB = tileGroups[i].includes(b);
        
        if (groupA && !groupB) return -1;
        if (!groupA && groupB) return 1;
        if (groupA && groupB) {
          return tileGroups[i].indexOf(a) - tileGroups[i].indexOf(b);
        }
      }
      return 0;
    });
    
    setPlayerTiles(dealt);
  };

  // 组件加载时发牌
  useEffect(() => {
    dealTiles();
  }, []);

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleReDeal = () => {
    dealTiles();
  };

  return (
    <div className="mahjong-practice-container">
      <h2>打牌练习</h2>
      
      <div className="action-buttons">
        <button className="action-button" onClick={handleReturnHome}>返回首页</button>
        <button className="action-button" onClick={handleReDeal}>重新发牌</button>
      </div>
      
      <div className="practice-content">
        <div className="player-tiles">
          <h3>你的手牌</h3>
          <div className="tiles-row">
            {playerTiles.map((tile, index) => (
              <div key={index} className="tile">
                {tile}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MahjongPractice; 