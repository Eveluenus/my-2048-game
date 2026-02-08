import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence here
import './App.css';

let nextId = 0;

function App() {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState([
    [{ id: nextId++, val: 2 }, { id: nextId++, val: 2 }, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ]);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // --- LOGIC FUNCTIONS ---

  const checkGameOver = (currentGrid) => {
    // 1. Check if there are any empty cells
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === null) return false;
      }
    }
    // 2. Check for possible horizontal merges
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentGrid[r][c].val === currentGrid[r][c + 1].val) return false;
      }
    }
    // 3. Check for possible vertical merges
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 3; r++) {
        if (currentGrid[r][c].val === currentGrid[r + 1][c].val) return false;
      }
    }
    return true;
  };

  const resetGame = () => {
    setGameOver(false);
    nextId = 0; 
    const initialGrid = [
      [{ id: nextId++, val: 2 }, { id: nextId++, val: 2 }, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ];
    setGrid(initialGrid);
    setScore(0);
  };

  const moveRow = (row) => {
    let tiles = row.filter(t => t !== null);
    let newRow = [];
    let rowScore = 0;
    
    for (let i = 0; i < tiles.length; i++) {
      if (i < tiles.length - 1 && tiles[i].val === tiles[i + 1].val) {
        const newVal = tiles[i].val * 2;
        newRow.push({ id: tiles[i].id, val: newVal });
        rowScore += newVal;
        i++;
      } else {
        newRow.push(tiles[i]);
      }
    }
    while (newRow.length < 4) newRow.push(null);
    return { newRow, rowScore };
  };

  const addRandomTile = (currentGrid) => {
    const empty = [];
    currentGrid.forEach((row, r) => {
      row.forEach((tile, c) => {
        if (!tile) empty.push({ r, c });
      });
    });

    if (empty.length > 0) {
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      currentGrid[r][c] = { id: nextId++, val: Math.random() > 0.1 ? 2 : 4 };
    }
    return currentGrid;
  };

  const handleMove = (direction) => {
    if (gameOver) return; // Stop moves if game is over
    
    let newGrid = grid.map(row => [...row]);
    let moveScore = 0;

    if (direction === 'LEFT') {
      newGrid = newGrid.map(row => {
        const { newRow, rowScore } = moveRow(row);
        moveScore += rowScore;
        return newRow;
      });
    } else if (direction === 'RIGHT') {
      newGrid = newGrid.map(row => {
        const { newRow, rowScore } = moveRow([...row].reverse());
        moveScore += rowScore;
        return newRow.reverse();
      });
    } else if (direction === 'UP') {
      for (let c = 0; c < 4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        const { newRow, rowScore } = moveRow(col);
        moveScore += rowScore;
        for (let r = 0; r < 4; r++) newGrid[r][c] = newRow[r];
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < 4; c++) {
        let col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        const { newRow, rowScore } = moveRow([...col].reverse());
        moveScore += rowScore;
        const finalCol = newRow.reverse();
        for (let r = 0; r < 4; r++) newGrid[r][c] = finalCol[r];
      }
    }

    if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
      const finalGrid = addRandomTile(newGrid);
      setGrid([...finalGrid]);
      setScore(prev => prev + moveScore);
      
      if (checkGameOver(finalGrid)) {
        setGameOver(true);
      }
    }
  };

  // --- HANDLERS ---

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dx = touchStart.x - touchEnd.x;
    const dy = touchStart.y - touchEnd.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) handleMove(dx > 0 ? 'LEFT' : 'RIGHT');
    } else {
      if (Math.abs(dy) > 30) handleMove(dy > 0 ? 'UP' : 'DOWN');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handleMove('LEFT');
      if (e.key === 'ArrowRight') handleMove('RIGHT');
      if (e.key === 'ArrowUp') handleMove('UP');
      if (e.key === 'ArrowDown') handleMove('DOWN');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [grid, gameOver]); // Added gameOver to dependencies
  
  // Find the highest number on the board
  const maxTile = Math.max(...grid.flat().map(tile => tile ? tile.val : 0));
  // Calculate percentage (clamped at 100%)
  const progress = Math.min(Math.round((maxTile / 2048) * 100), 100);

  const getProgressColor = (pct) => {
    if (pct > 100) return "#edc22e"; 
    if (pct >= 99) return "#e268a8";
    if (pct >= 50)  return "#ff8000"; 
    if (pct >= 25)  return "#a335ee"; 
    if (pct >= 12)  return "#0070ff"; 
    if (pct >= 6)  return "#1eff00"; 
    return "#666666"; // Default Gray
  };

  const progressColor = getProgressColor(progress);

  return (
    <div className="game-container" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="game-header">
        <div className="title-section">
          <h1 className="main-title">黑魔</h1>
          <p className="sub-title">Model Evolution</p>
        </div>
        <div className="stats-section">
          <div className="score-box">
            <span className="label">Logs</span>
            <span className="value" style={{ color: progressColor}}>{progress}%</span>
          </div>
          <button className="reset-button" onClick={resetGame}>New Game</button>
        </div>
      </div>

      <div className="grid-wrapper">
        <div className="grid-background">
          {Array(16).fill(null).map((_, i) => <div key={i} className="grid-cell" />)}
        </div>
        <div className="tile-container">
          {grid.flatMap((row, r) =>
            row.map((tile, c) => tile && (
              <motion.div
                key={tile.id}
                layout
                transition={{ layout: { type: "spring", stiffness: 500, damping: 45 } }}
                className="tile"
                style={{
                  position: 'absolute',
                  top: `${r * 25}%`,
                  left: `${c * 25}%`,
                  width: '25%',
                  height: '25%',
                  padding: '5px',
                  boxSizing: 'border-box'
                }}
              >
                <div className="tile-inner">
                  <img src={`/tiles/${tile.val}.png`} alt={tile.val} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div 
              className="game-over-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p>天语断了!</p>
              <button className="reset-button" onClick={resetGame}>下把</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;