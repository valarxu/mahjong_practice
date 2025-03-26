import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import MahjongTiles from './components/MahjongTiles'
import MahjongSimulator from './components/MahjongSimulator'
import MahjongPractice from './components/MahjongPractice'
import { useDeviceDetect } from './hooks/useDeviceDetect';

function App() {
  const { isMobile, isSmallMobile } = useDeviceDetect();
  
  // 组合设备类名
  const deviceClass = `${isMobile ? 'mobile-view' : ''} ${isSmallMobile ? 'small-mobile-view' : ''}`;

  return (
    <BrowserRouter>
      <div className={`app-container ${deviceClass}`}>
        <header className="app-header">
          <h1>麻将练习</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MahjongTiles />} />
            <Route path="/mahjong-simulator" element={<MahjongSimulator />} />
            <Route path="/mahjong-practice" element={<MahjongPractice />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
