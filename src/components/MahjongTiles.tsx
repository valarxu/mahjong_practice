import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongTiles.css';

const MahjongTiles: React.FC = () => {
  const navigate = useNavigate();
  // 麻将牌的emoji
  const tiles = {
    // 万子
    characters: ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'],
    // 条子
    bamboo: ['🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘'],
    // 筒子
    circles: ['🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡'],
    // 风牌
    winds: ['🀀', '🀁', '🀂', '🀃'],
    // 箭牌
    dragons: ['🀄', '🀅', '🀆'],
    // 花牌
    flowers: ['🀢', '🀣', '🀤', '🀥', '🀦', '🀧', '🀨', '🀩']
  };

  const handleButtonClick = () => {
    navigate('/mahjong-simulator');
  };

  return (
    <div className="mahjong-container">
      <div className="button-container">
        <button className="navigate-button" onClick={handleButtonClick}>
          听牌练习
        </button>
      </div>
      
      <div className="tile-section">
        <h3>万子</h3>
        <div className="tile-row">
          {tiles.characters.map((tile, index) => (
            <div key={`character-${index}`} className="tile">
              {tile}
            </div>
          ))}
        </div>
      </div>

      <div className="tile-section">
        <h3>条子</h3>
        <div className="tile-row">
          {tiles.bamboo.map((tile, index) => (
            <div key={`bamboo-${index}`} className="tile">
              {tile}
            </div>
          ))}
        </div>
      </div>

      <div className="tile-section">
        <h3>筒子</h3>
        <div className="tile-row">
          {tiles.circles.map((tile, index) => (
            <div key={`circle-${index}`} className="tile">
              {tile}
            </div>
          ))}
        </div>
      </div>

      <div className="tile-section">
        <h3>风牌</h3>
        <div className="tile-row">
          {tiles.winds.map((tile, index) => (
            <div key={`wind-${index}`} className="tile">
              {tile}
            </div>
          ))}
        </div>
      </div>

      <div className="tile-section">
        <h3>箭牌</h3>
        <div className="tile-row">
          {tiles.dragons.map((tile, index) => (
            <div key={`dragon-${index}`} className="tile">
              {tile}
            </div>
          ))}
        </div>
      </div>

      <div className="tile-section">
        <h3>花牌</h3>
        <div className="tile-row">
          {tiles.flowers.map((tile, index) => (
            <div key={`flower-${index}`} className="tile">
              {tile}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MahjongTiles; 