'use client';

import { useEffect, useMemo, useState } from 'react';

type Mark = 'X' | 'O';
type Cell = Mark | null;
type Level = 'Easy' | 'Medium' | 'Hard';
type GameMode = 'AI' | 'Human';
type Screen = 'start' | 'mode' | 'level' | 'game' | 'decider' | 'final';

type WinPattern = {
  cells: [number, number, number];
};

type WinResult = {
  winner: Mark;
  cells: [number, number, number];
};

type MatchScore = Record<Mark, number>;

type Point = {
  x: number;
  y: number;
};

const WIN_PATTERNS: WinPattern[] = [
  { cells: [0, 1, 2] },
  { cells: [3, 4, 5] },
  { cells: [6, 7, 8] },
  { cells: [0, 3, 6] },
  { cells: [1, 4, 7] },
  { cells: [2, 5, 8] },
  { cells: [0, 4, 8] },
  { cells: [2, 4, 6] },
];

const LEVELS: Array<{ name: Level; label: string; note: string }> = [
  { name: 'Easy', label: 'EASY', note: 'Random relaxed moves' },
  { name: 'Medium', label: 'MEDIUM', note: 'Wins, blocks, then attacks' },
  { name: 'Hard', label: 'HARD', note: 'Best move minimax AI' },
];

const MOVE_PRIORITY = [4, 0, 2, 6, 8, 1, 3, 5, 7];
const AI_DELAY: Record<Level, number> = {
  Easy: 420,
  Medium: 520,
  Hard: 620,
};

function createEmptyBoard(): Cell[] {
  return Array<Cell>(9).fill(null);
}

function otherMark(mark: Mark): Mark {
  return mark === 'X' ? 'O' : 'X';
}

function isBoardFull(board: Cell[]) {
  return board.every(Boolean);
}

function getWinner(board: Cell[]): WinResult | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern.cells;

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return {
        winner: board[a],
        cells: pattern.cells,
      };
    }
  }

  return null;
}

function getAvailableMoves(board: Cell[]) {
  return board.reduce<number[]>((moves, cell, index) => {
    if (!cell) moves.push(index);
    return moves;
  }, []);
}

function getOrderedMoves(board: Cell[]) {
  const available = new Set(getAvailableMoves(board));
  return MOVE_PRIORITY.filter((move) => available.has(move));
}

function getRandomMove(board: Cell[]) {
  const moves = getAvailableMoves(board);
  if (!moves.length) return -1;
  return moves[Math.floor(Math.random() * moves.length)];
}

function findImmediateMove(board: Cell[], mark: Mark) {
  for (const move of getOrderedMoves(board)) {
    const testBoard = [...board];
    testBoard[move] = mark;

    if (getWinner(testBoard)?.winner === mark) {
      return move;
    }
  }

  return -1;
}

function getMediumMove(board: Cell[]) {
  const winningMove = findImmediateMove(board, 'O');
  if (winningMove !== -1) return winningMove;

  const blockingMove = findImmediateMove(board, 'X');
  if (blockingMove !== -1) return blockingMove;

  const orderedMoves = getOrderedMoves(board);
  if (!orderedMoves.length) return -1;

  if (orderedMoves.includes(4)) return 4;

  const corners = orderedMoves.filter((move) => [0, 2, 6, 8].includes(move));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  return orderedMoves[0];
}

function minimax(board: Cell[], isAiTurn: boolean, depth: number): number {
  const result = getWinner(board);

  if (result?.winner === 'O') return 10 - depth;
  if (result?.winner === 'X') return depth - 10;
  if (isBoardFull(board)) return 0;

  const moves = getOrderedMoves(board);

  if (isAiTurn) {
    let bestScore = -Infinity;

    for (const move of moves) {
      const testBoard = [...board];
      testBoard[move] = 'O';
      bestScore = Math.max(bestScore, minimax(testBoard, false, depth + 1));
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of moves) {
    const testBoard = [...board];
    testBoard[move] = 'X';
    bestScore = Math.min(bestScore, minimax(testBoard, true, depth + 1));
  }

  return bestScore;
}

function getHardMove(board: Cell[]) {
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of getOrderedMoves(board)) {
    const testBoard = [...board];
    testBoard[move] = 'O';
    const score = minimax(testBoard, false, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  if (!bestMoves.length) return -1;

  for (const preferredMove of MOVE_PRIORITY) {
    if (bestMoves.includes(preferredMove)) return preferredMove;
  }

  return bestMoves[0];
}

function getAiMove(board: Cell[], level: Level) {
  if (getWinner(board) || isBoardFull(board)) return -1;

  if (level === 'Easy') return getRandomMove(board);
  if (level === 'Medium') return getMediumMove(board);

  return getHardMove(board);
}

function markPlayerName(mark: Mark, mode: GameMode) {
  if (mark === 'X') return 'Player 1';
  return mode === 'AI' ? 'AI Player' : 'Player 2';
}

function modeLabel(mode: GameMode, level: Level) {
  return mode === 'AI' ? `${level} AI` : '2 Players';
}

function getCellCenter(index: number): Point {
  return {
    x: (index % 3) * 100 + 50,
    y: Math.floor(index / 3) * 100 + 50,
  };
}

function getWinningLinePoints(cells: [number, number, number]) {
  return {
    start: getCellCenter(cells[0]),
    end: getCellCenter(cells[2]),
  };
}

function MarkShape({ mark, variant = 'board' }: { mark: Mark; variant?: 'board' | 'header' | 'turn' }) {
  return <span aria-hidden="true" className={`mark-shape mark-${mark.toLowerCase()} mark-${variant}`} />;
}

function ScoreDots({ score, mark }: { score: number; mark: Mark }) {
  return (
    <span className={`score-dots score-dots-${mark.toLowerCase()}`} aria-hidden="true">
      {[0, 1].map((dot) => (
        <span key={dot} className={dot < score ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

export default function TicTacToe() {
  const [screen, setScreen] = useState<Screen>('start');
  const [mode, setMode] = useState<GameMode>('AI');
  const [level, setLevel] = useState<Level>('Easy');
  const [board, setBoard] = useState<Cell[]>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Mark>('X');
  const [score, setScore] = useState<MatchScore>({ X: 0, O: 0 });
  const [round, setRound] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  const [roundWinner, setRoundWinner] = useState<Mark | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [winningLine, setWinningLine] = useState<WinResult | null>(null);
  const [finalWinner, setFinalWinner] = useState<Mark | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const canPlay = !isLocked && !aiThinking && (mode === 'Human' || currentPlayer === 'X');
  const linePoints = winningLine ? getWinningLinePoints(winningLine.cells) : null;

  const roundMessage = useMemo(() => {
    if (roundWinner) return `${markPlayerName(roundWinner, mode)} wins round ${round}`;
    if (isDraw) return `Round ${round} is a draw - replay this round`;
    if (aiThinking) return 'AI Player is thinking...';
    return `${markPlayerName(currentPlayer, mode)} turn`;
  }, [aiThinking, currentPlayer, isDraw, mode, round, roundWinner]);

  const resetRoundState = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
    setIsLocked(false);
    setRoundWinner(null);
    setIsDraw(false);
    setWinningLine(null);
    setAiThinking(false);
  };

  const resetMatch = () => {
    setScore({ X: 0, O: 0 });
    setRound(1);
    setFinalWinner(null);
    resetRoundState();
  };

  const showFinalWinner = (winner: Mark, nextScore: MatchScore) => {
    setFinalWinner(winner);
    setScore(nextScore);
    setScreen('final');
  };

  const finishRound = (result: WinResult, nextBoard: Cell[]) => {
    const nextScore: MatchScore = {
      ...score,
      [result.winner]: score[result.winner] + 1,
    };

    setBoard(nextBoard);
    setScore(nextScore);
    setRoundWinner(result.winner);
    setWinningLine(result);
    setIsDraw(false);
    setIsLocked(true);
    setAiThinking(false);

    if (nextScore[result.winner] === 2 || round === 3) {
      window.setTimeout(() => showFinalWinner(result.winner, nextScore), 950);
    }
  };

  const finishDraw = (nextBoard: Cell[]) => {
    setBoard(nextBoard);
    setRoundWinner(null);
    setWinningLine(null);
    setIsDraw(true);
    setIsLocked(true);
    setAiThinking(false);
  };

  const applyMove = (index: number, mark: Mark) => {
    if (isLocked || board[index] || getWinner(board) || isBoardFull(board)) return;

    const nextBoard = [...board];
    nextBoard[index] = mark;

    const result = getWinner(nextBoard);

    if (result) {
      finishRound(result, nextBoard);
      return;
    }

    if (isBoardFull(nextBoard)) {
      finishDraw(nextBoard);
      return;
    }

    setBoard(nextBoard);
    setCurrentPlayer(otherMark(mark));
    setAiThinking(false);
  };

  const handleCellClick = (index: number) => {
    if (!canPlay) return;
    applyMove(index, currentPlayer);
  };

  useEffect(() => {
    if (screen !== 'game' || mode !== 'AI' || currentPlayer !== 'O' || isLocked) {
      if (mode !== 'AI' || currentPlayer !== 'O') setAiThinking(false);
      return;
    }

    if (getWinner(board) || isBoardFull(board)) return;

    setAiThinking(true);

    const timer = window.setTimeout(() => {
      const move = getAiMove(board, level);
      if (move === -1 || board[move]) {
        setAiThinking(false);
        return;
      }

      applyMove(move, 'O');
    }, AI_DELAY[level]);

    return () => window.clearTimeout(timer);
  }, [board, currentPlayer, isLocked, level, mode, round, score, screen]);

  const goStart = () => {
    resetMatch();
    setScreen('start');
  };

  const goMode = () => {
    resetMatch();
    setScreen('mode');
  };

  const chooseMode = (selectedMode: GameMode) => {
    setMode(selectedMode);
    resetMatch();

    if (selectedMode === 'AI') {
      setScreen('level');
      return;
    }

    setScreen('game');
  };

  const chooseLevel = (selectedLevel: Level) => {
    setLevel(selectedLevel);
    resetMatch();
    setScreen('game');
  };

  const continueAfterRound = () => {
    if (score.X === 2 || score.O === 2) {
      showFinalWinner(score.X > score.O ? 'X' : 'O', score);
      return;
    }

    if (isDraw) {
      resetRoundState();
      return;
    }

    if (round === 2 && score.X === 1 && score.O === 1) {
      setScreen('decider');
      return;
    }

    setRound((previousRound) => Math.min(previousRound + 1, 3));
    resetRoundState();
  };

  const continueDecider = () => {
    setRound(3);
    resetRoundState();
    setScreen('game');
  };

  const newMatch = () => {
    resetMatch();
    setScreen('game');
  };

  const resultButtonText = () => {
    if (isDraw) return 'Replay Round';
    if (score.X === 2 || score.O === 2 || round === 3) return 'Result';
    if (round === 2 && score.X === 1 && score.O === 1) return 'Decider';
    return 'Next';
  };

  return (
    <main className="neon-app">
      <div className="star-field" />
      <div className="ambient ambient-x" />
      <div className="ambient ambient-o" />

      {screen === 'start' && (
        <section className="neon-card menu-card" aria-label="Tic Tac Toe start screen">
          <div className="floating-mark floating-x-one">×</div>
          <div className="floating-mark floating-o-one">○</div>
          <div className="floating-mark floating-x-two">×</div>
          <div className="floating-mark floating-o-two">○</div>

          <h1 className="game-logo" aria-label="Tic Tac Toe">
            <span className="logo-o">TIC</span>
            <span className="logo-x">TAC</span>
            <span className="logo-o">TOE</span>
          </h1>

          <button type="button" className="primary-button button-o" onClick={() => setScreen('mode')}>
            Start Game
          </button>
        </section>
      )}

      {screen === 'mode' && (
        <section className="neon-card select-card" aria-label="Choose game mode">
          <div className="screen-kicker">Battle Mode</div>
          <h2 className="screen-title">Choose Mode</h2>

          <div className="option-list mode-options">
            <button type="button" className="option-button option-o" onClick={() => chooseMode('AI')}>
              <strong>Single Player - AI</strong>
              <span>Play against computer intelligence</span>
            </button>

            <button type="button" className="option-button option-x" onClick={() => chooseMode('Human')}>
              <strong>2 Players - Human</strong>
              <span>Two players on the same device</span>
            </button>
          </div>

          <button type="button" className="small-link" onClick={goStart}>
            Back to Start
          </button>
        </section>
      )}

      {screen === 'level' && (
        <section className="neon-card select-card" aria-label="Choose AI level">
          <div className="screen-kicker">AI Difficulty</div>
          <h2 className="screen-title">Choose Level</h2>

          <div className="option-list">
            {LEVELS.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`option-button ${index % 2 === 0 ? 'option-o' : 'option-x'}`}
                onClick={() => chooseLevel(item.name)}
              >
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </button>
            ))}
          </div>

          <button type="button" className="small-link" onClick={goMode}>
            Back to Mode
          </button>
        </section>
      )}

      {screen === 'game' && (
        <section className="neon-card game-card" aria-label="Tic Tac Toe game board">
          <header className="game-header">
            <article className={`player-panel player-panel-x ${currentPlayer === 'X' && !isLocked ? 'is-active' : ''}`}>
              <MarkShape mark="X" variant="header" />
              <div className="player-text">
                <strong>Player 1</strong>
                <span>X</span>
                <ScoreDots score={score.X} mark="X" />
              </div>
            </article>

            <div className={`turn-panel ${currentPlayer === 'X' ? 'turn-x' : 'turn-o'} ${aiThinking ? 'is-thinking' : ''}`}>
              <MarkShape mark={currentPlayer} variant="turn" />
              <span>{aiThinking ? 'AI Move' : 'Turn'}</span>
            </div>

            <article className={`player-panel player-panel-o ${currentPlayer === 'O' && !isLocked ? 'is-active' : ''}`}>
              <div className="player-text align-right">
                <strong>{mode === 'AI' ? 'AI Player' : 'Player 2'}</strong>
                <span>O</span>
                <ScoreDots score={score.O} mark="O" />
              </div>
              <MarkShape mark="O" variant="header" />
            </article>
          </header>

          <div className="match-bar" aria-live="polite">
            <span>Round {round}/3</span>
            <strong>
              <span className="text-x">{score.X}</span>
              <em>:</em>
              <span className="text-o">{score.O}</span>
            </strong>
            <span>{modeLabel(mode, level)}</span>
          </div>

          <div className="board-wrap">
            <div className="board-frame">
              {board.map((cell, index) => {
                const isWinningCell = Boolean(winningLine?.cells.includes(index));

                return (
                  <button
                    key={index}
                    type="button"
                    className={`board-cell ${isWinningCell ? `winning-cell winning-${winningLine?.winner.toLowerCase()}` : ''}`}
                    aria-label={`Cell ${index + 1}`}
                    disabled={!canPlay || Boolean(cell)}
                    onClick={() => handleCellClick(index)}
                  >
                    {cell && <MarkShape mark={cell} variant="board" />}
                  </button>
                );
              })}

              {winningLine && linePoints && (
                <svg className="win-line-svg" viewBox="0 0 300 300" aria-hidden="true">
                  <line
                    className={`win-line win-line-${winningLine.winner.toLowerCase()}`}
                    x1={linePoints.start.x}
                    y1={linePoints.start.y}
                    x2={linePoints.end.x}
                    y2={linePoints.end.y}
                  />
                </svg>
              )}
            </div>
          </div>

          <p className={`round-status ${currentPlayer === 'X' ? 'status-x' : 'status-o'}`}>{roundMessage}</p>

          <footer className={`game-actions ${isLocked ? 'actions-locked' : ''}`}>
            <button type="button" onClick={goStart}>Main</button>
            <button type="button" onClick={goMode}>Mode</button>
            <button type="button" onClick={newMatch}>New</button>
            {isLocked && (
              <button type="button" className="next-action" onClick={continueAfterRound}>
                {resultButtonText()}
              </button>
            )}
          </footer>
        </section>
      )}

      {screen === 'decider' && (
        <section className="neon-card result-card" aria-label="Deciding match">
          <div className="screen-kicker">Final Round</div>
          <h2 className="screen-title">Deciding Match</h2>
          <div className="decider-score">
            <span className="text-x">1</span>
            <em>:</em>
            <span className="text-o">1</span>
          </div>
          <p className="result-text">The match is tied. One more round decides the champion.</p>
          <button type="button" className="primary-button split-button" onClick={continueDecider}>
            Continue
          </button>
        </section>
      )}

      {screen === 'final' && finalWinner && (
        <section className={`neon-card result-card final-${finalWinner.toLowerCase()}`} aria-label="Final result">
          <div className="screen-kicker">Match Complete</div>
          <h2 className="result-title">
            <span className={finalWinner === 'X' ? 'text-x' : 'text-o'}>{markPlayerName(finalWinner, mode)}</span> Wins
          </h2>

          <div className="final-score">
            <small>Final Score</small>
            <strong>
              <span className="text-x">{score.X}</span>
              <em>:</em>
              <span className="text-o">{score.O}</span>
            </strong>
            <p>
              <span className={finalWinner === 'X' ? 'text-x' : 'text-o'}>{finalWinner}</span> is the champion.
            </p>
          </div>

          <div className="result-actions">
            <button type="button" className={`primary-button ${finalWinner === 'X' ? 'button-x' : 'button-o'}`} onClick={newMatch}>
              Play Again
            </button>
            <button type="button" className="secondary-button" onClick={goStart}>
              Main Menu
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
