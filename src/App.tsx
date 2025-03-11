import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import MahjongTiles from './components/MahjongTiles'
import MahjongSimulator from './components/MahjongSimulator'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <h1>麻将练习</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MahjongTiles />} />
            <Route path="/mahjong-simulator" element={<MahjongSimulator />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
