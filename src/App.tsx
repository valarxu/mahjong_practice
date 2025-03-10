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
          <p>以下是麻将牌的展示</p>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<MahjongTiles />} />
            <Route path="/mahjong-simulator" element={<MahjongSimulator />} />
          </Routes>
        </main>
        <footer>
          <p>© {new Date().getFullYear()} 麻将练习应用</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
