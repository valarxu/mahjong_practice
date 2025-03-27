import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MahjongPractice.css';

// 导入类型
import { AnalysisResult, Tile, TileToDrawItem, TileGroup } from '../types/mahjong';

// 导入工具函数
import {
  allTiles,
  checkCanDraw,
  checkCanDiscard,
  getTileUnicode,
  shuffleTiles,
  sortTiles
} from '../utils/tileUtils';

// 导入分析相关函数
import { findBestCombination } from '../utils/analyzer';
import { analyzeTilesToDraw } from '../utils/drawAnalyzer';

const MahjongPractice: React.FC = () => {
  const navigate = useNavigate();
  const [playerTiles, setPlayerTiles] = useState<Tile[]>([]); // 手牌
  const [remainingTiles, setRemainingTiles] = useState<number[]>([]); // 剩余可抓的牌
  const [canDraw, setCanDraw] = useState<boolean>(true); // 是否可以抓牌
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // 牌型分析结果

  // 新增状态变量，用于存储进张分析结果
  const [tilesToDrawAnalysis, setTilesToDrawAnalysis] = useState<TileToDrawItem[]>([]);
  const [showTilesToDrawAnalysis, setShowTilesToDrawAnalysis] = useState<boolean>(false);

  // 初始发牌函数
  const dealInitialTiles = () => {
    const shuffled = shuffleTiles(allTiles);
    let playerDealt = shuffled.slice(0, 13); // 发13张牌给玩家
    let remaining = shuffled.slice(13); // 剩余的牌

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
    setCanDraw(checkCanDraw(sortedTiles.length));
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

      // 正常添加牌
      const updatedPlayerTiles = [...resetTiles, newTile];
      setPlayerTiles(updatedPlayerTiles);
      setRemainingTiles(newRemainingTiles);
      setCanDraw(checkCanDraw(updatedPlayerTiles.length));
    }
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

    // 进行进张分析
    const selectedTile = playerTiles.find(tile => tile.id === selectedTileId);
    if (selectedTile) {
      const { tilesToDraw } = analyzeTilesToDraw(
        playerTiles, 
        [], 
        [], 
        selectedTile.code
      );
      
      // 无论是否是不良出牌，都显示进张分析区域
      setTilesToDrawAnalysis(tilesToDraw);
      setShowTilesToDrawAnalysis(true);
    } else {
      setShowTilesToDrawAnalysis(false);
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

    // 移除所有牌的isDrawn状态，并重新排序
    const resetTiles = updatedPlayerTiles.map(tile => ({
      ...tile,
      isDrawn: false
    }));

    // 重新排序手牌
    const sortedTiles = sortTiles(resetTiles);

    setPlayerTiles(sortedTiles);
    setCanDraw(checkCanDraw(sortedTiles.length));
    // 清除进张分析
    setShowTilesToDrawAnalysis(false);
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

  // 分析牌型
  const analyzeTiles = () => {
    // 提取手牌的编码
    const tileCodes = playerTiles.map(tile => tile.code);

    // 准备一个纯数字数组，表示每种牌的数量
    const counts = new Array(34).fill(0); // 0-33，共34种牌
    tileCodes.forEach(code => {
      counts[code]++;
    });

    // 调用分析函数
    const result = findBestCombination(counts, tileCodes);

    // 设置分析结果
    setAnalysisResult(result);
  };

  // 渲染分析结果的函数
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    // 按类型和最小牌码分组
    const groupedResults: {[key: string]: TileGroup[]} = {};
    
    // 对每个牌组生成唯一键并分组
    analysisResult.groups.forEach(group => {
      // 为每个组创建一个键，包含类型和所有牌的代码
      const minTile = Math.min(...group.tiles);
      const key = `${minTile}-${group.type}`;
      
      if (!groupedResults[key]) {
        groupedResults[key] = [];
      }
      
      groupedResults[key].push(group);
    });
    
    // 获取所有键并按牌的值排序
    const sortedKeys = Object.keys(groupedResults).sort((a, b) => {
      const [aMinTile] = a.split('-').map(Number);
      const [bMinTile] = b.split('-').map(Number);
      return aMinTile - bMinTile;
    });
    
    // 最终排序的牌组
    const sortedGroups = sortedKeys.flatMap(key => groupedResults[key]);
    
    // 计算面子数和对子数
    const meldCount = sortedGroups.filter(group => group.type === 'pung' || group.type === 'chow').length;
    const pairCount = sortedGroups.filter(group => group.type === 'pair').length;
    
    // 判断是否和牌
    const isWinning = meldCount === 4 && pairCount === 1;
    
    return (
      <div className="analysis-result">
        <h3>
          分析牌型结果 (已组合: {analysisResult.used}/{analysisResult.total}张)
          {isWinning && <span className="winning-hand"> - 和牌！</span>}
        </h3>
        
        <div className="analysis-all-groups">
          {sortedGroups.map((group, index) => (
            <div key={`group-${index}`} className={`tile-group ${group.type}`}>
              <div className="group-tiles">
                {group.tiles.map((tileCode, tileIndex) => (
                  <div key={`tile-${index}-${tileIndex}`} className="analysis-tile">
                    {getTileUnicode(tileCode)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染进张分析结果
  const renderTilesToDrawAnalysis = () => {
    if (!showTilesToDrawAnalysis) {
      return null;
    }
    
    // 检查是否是不良出牌
    const selectedTile = playerTiles.find(tile => tile.isPreSelected);
    if (!selectedTile) return null;
    
    const { badDiscard } = analyzeTilesToDraw(
      playerTiles, 
      [], 
      [], 
      selectedTile.code
    );
    
    // 如果是不良出牌
    if (badDiscard.isBad) {
      return (
        <div className="tiles-to-draw-analysis">
          <h3 className="bad-discard-title">{badDiscard.reason}</h3>
          <div className="tiles-to-draw-groups">
            <div className="bad-discard-info">
              打出这张牌会破坏已有的组合，建议重新选择
            </div>
          </div>
        </div>
      );
    }
    
    // 正常进张分析显示
    if (tilesToDrawAnalysis.length === 0) {
      return (
        <div className="tiles-to-draw-analysis">
          <h3>进张分析</h3>
          <div className="tiles-to-draw-groups">
            <div className="no-improvement-info">
              没有找到可改善牌型的进张
            </div>
          </div>
        </div>
      );
    }
    
    // 总进张数量
    const totalTilesToDraw = tilesToDrawAnalysis.reduce((sum, item) => sum + item.count, 0);
    
    return (
      <div className="tiles-to-draw-analysis">
        <h3>进张分析 (共{totalTilesToDraw}张牌)</h3>
        <div className="tiles-to-draw-groups">
          {tilesToDrawAnalysis.map((item, index) => (
            <div key={`draw-${index}`} className="tiles-to-draw-item">
              <div className="tile-to-draw">
                <div className="analysis-tile">{getTileUnicode(item.tile)}</div>
                <div className="tile-to-draw-info">
                  <span className="tile-count">{item.count}张</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    analyzeTiles();
  }, [playerTiles]);

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

        {showTilesToDrawAnalysis && (
          <div className="tiles-to-draw-container">
            {renderTilesToDrawAnalysis()}
          </div>
        )}

        {analysisResult && (
          <div className="analysis-result-container">
            {renderAnalysisResult()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MahjongPractice; 