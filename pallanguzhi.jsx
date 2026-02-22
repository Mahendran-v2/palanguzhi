import { useState, useEffect, useCallback, useRef } from "react";

const INITIAL_BOARD = Array(14).fill(5);
const STEP_DELAY = 280;

function computeTurnSteps(boardIn, choice) {
  const b = [...boardIn];
  const steps = [];
  let hand = b[choice];
  b[choice] = 0;
  let currentIdx = choice;

  steps.push({
    board: [...b], hand, highlight: choice, captureHighlight: null,
    message: `Picked up ${hand} seeds from pit ${choice}`, phase: "pickup"
  });

  while (true) {
    while (hand > 0) {
      currentIdx = (currentIdx + 1) % 14;
      b[currentIdx] += 1;
      hand -= 1;
      steps.push({
        board: [...b], hand, highlight: currentIdx, captureHighlight: null,
        message: `Sowing… pit ${currentIdx} now has ${b[currentIdx]}`, phase: "sowing"
      });
    }

    const nextIdx = (currentIdx + 1) % 14;
    if (b[nextIdx] > 0) {
      hand = b[nextIdx];
      b[nextIdx] = 0;
      currentIdx = nextIdx;
      steps.push({
        board: [...b], hand, highlight: currentIdx, captureHighlight: null,
        message: `Relay! Lifted ${hand} seeds from pit ${currentIdx}`, phase: "relay"
      });
    } else {
      const captureIdx = (nextIdx + 1) % 14;
      const captured = b[captureIdx];
      b[captureIdx] = 0;
      if (captured > 0) {
        steps.push({
          board: [...b], hand: 0, highlight: currentIdx, captureHighlight: captureIdx,
          message: `💥 Captured ${captured} seeds from pit ${captureIdx}!`, phase: "capture",
          captured
        });
      } else {
        steps.push({
          board: [...b], hand: 0, highlight: currentIdx, captureHighlight: null,
          message: "Landed in an empty pit. Turn ends.", phase: "end", captured: 0
        });
      }
      return { steps, finalBoard: b, captured };
    }
  }
}

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
`;

const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { background: #1a0c06; }

.pg-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: radial-gradient(ellipse at 50% 0%, #3d1a08 0%, #1a0c06 70%);
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #f5e6c8;
  position: relative;
  overflow: hidden;
}

.pg-root::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,180,60,.03) 40px, rgba(255,180,60,.03) 41px),
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,180,60,.03) 40px, rgba(255,180,60,.03) 41px);
  pointer-events: none;
}

.pg-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(1.4rem, 4vw, 2.4rem);
  font-weight: 900;
  color: #ffd56b;
  text-align: center;
  letter-spacing: .08em;
  text-shadow: 0 0 40px rgba(255,180,60,.5), 0 2px 4px rgba(0,0,0,.8);
  margin-bottom: 6px;
}

.pg-subtitle {
  font-style: italic;
  color: #c8a87a;
  text-align: center;
  font-size: 1.05rem;
  margin-bottom: 28px;
  letter-spacing: .04em;
}

/* Scoreboard */
.pg-scores {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
  justify-content: center;
}
.pg-score-card {
  background: rgba(255,180,60,.08);
  border: 1px solid rgba(255,180,60,.2);
  border-radius: 12px;
  padding: 10px 28px;
  text-align: center;
  transition: all .4s;
}
.pg-score-card.active {
  background: rgba(255,180,60,.18);
  border-color: rgba(255,180,60,.55);
  box-shadow: 0 0 24px rgba(255,180,60,.2);
}
.pg-score-label {
  font-size: .75rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #c8a87a;
}
.pg-score-value {
  font-family: 'Cinzel Decorative', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #ffd56b;
  line-height: 1.1;
}

/* Board */
.pg-board-wrap {
  position: relative;
  background: linear-gradient(160deg, #7a3a10 0%, #5c2908 40%, #6e3310 100%);
  border-radius: 20px;
  padding: 20px 24px;
  box-shadow:
    0 0 0 3px #a0520d,
    0 0 0 5px #4a1e06,
    0 12px 60px rgba(0,0,0,.7),
    inset 0 1px 0 rgba(255,200,100,.15);
  margin-bottom: 20px;
}

.pg-board-wrap::before, .pg-board-wrap::after {
  content: '◈';
  position: absolute;
  color: #ffd56b;
  font-size: 1.4rem;
  opacity: .4;
  top: 50%;
  transform: translateY(-50%);
}
.pg-board-wrap::before { left: 8px; }
.pg-board-wrap::after  { right: 8px; }

.pg-player-label {
  font-style: italic;
  font-size: .9rem;
  letter-spacing: .06em;
  color: #c8a87a;
  margin-bottom: 8px;
  text-align: center;
  transition: color .3s;
}
.pg-player-label.active { color: #ffd56b; font-weight: 600; }

.pg-row {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* Pit */
.pg-pit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.pg-pit-bowl {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #2a1208, #0f0603);
  box-shadow:
    inset 0 4px 12px rgba(0,0,0,.8),
    inset 0 -2px 4px rgba(255,140,50,.08),
    0 2px 4px rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 6px;
  gap: 2px;
  transition: transform .15s, box-shadow .15s;
  position: relative;
  overflow: hidden;
}

.pg-pit.clickable .pg-pit-bowl:hover {
  transform: translateY(-3px);
  box-shadow:
    inset 0 4px 12px rgba(0,0,0,.8),
    0 6px 20px rgba(255,140,50,.25),
    0 0 0 2px rgba(255,180,60,.4);
}

.pg-pit.clickable .pg-pit-bowl { cursor: pointer; }
.pg-pit:not(.clickable) .pg-pit-bowl { cursor: default; }

.pg-pit.highlight .pg-pit-bowl {
  box-shadow:
    inset 0 4px 12px rgba(0,0,0,.6),
    0 0 0 3px #ffd56b,
    0 0 20px rgba(255,213,107,.5);
  animation: pulse-pit 0.5s ease-out;
}

.pg-pit.capture-highlight .pg-pit-bowl {
  box-shadow:
    inset 0 4px 12px rgba(0,0,0,.6),
    0 0 0 3px #ff6b6b,
    0 0 25px rgba(255,100,100,.6);
}

@keyframes pulse-pit {
  0%   { transform: scale(1.12); }
  100% { transform: scale(1); }
}

.pg-pit-count {
  font-family: 'Cormorant Garamond', serif;
  font-size: .8rem;
  color: #c8a87a;
  text-align: center;
  min-height: 16px;
}

/* Seeds */
.pg-seed {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all .2s;
}
.pg-seed.p1 {
  background: radial-gradient(circle at 35% 35%, #ffe799, #d4a017);
  box-shadow: 0 1px 3px rgba(0,0,0,.5);
}
.pg-seed.p2 {
  background: radial-gradient(circle at 35% 35%, #ffa07a, #c0392b);
  box-shadow: 0 1px 3px rgba(0,0,0,.5);
}
.pg-seed.neutral {
  background: radial-gradient(circle at 35% 35%, #d4c5b0, #8b7355);
  box-shadow: 0 1px 3px rgba(0,0,0,.5);
}

/* Message */
.pg-message {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background: rgba(255,180,60,.07);
  border: 1px solid rgba(255,180,60,.15);
  border-radius: 10px;
  font-style: italic;
  font-size: 1.1rem;
  color: #f5e6c8;
  text-align: center;
  margin-bottom: 16px;
  width: 100%;
  max-width: 520px;
  transition: all .3s;
  letter-spacing: .02em;
}
.pg-message.capture { color: #ff9f7a; border-color: rgba(255,100,60,.4); }
.pg-message.relay   { color: #ffe082; }

/* Hand display */
.pg-hand {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
  font-size: .9rem;
  color: #c8a87a;
  min-height: 24px;
  font-style: italic;
}
.pg-hand-seeds {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  max-width: 160px;
  justify-content: center;
}

/* Buttons */
.pg-btn {
  font-family: 'Cinzel Decorative', serif;
  font-size: .85rem;
  letter-spacing: .08em;
  padding: 12px 32px;
  background: linear-gradient(135deg, #c67c14, #8b4e08);
  border: 1px solid #e09030;
  border-radius: 8px;
  color: #fff8e7;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 4px 16px rgba(0,0,0,.4);
  text-shadow: 0 1px 2px rgba(0,0,0,.4);
}
.pg-btn:hover {
  background: linear-gradient(135deg, #d4890f, #a05c0a);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,140,50,.3);
}

/* Game over */
.pg-gameover {
  text-align: center;
  padding: 20px;
}
.pg-gameover-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.6rem;
  color: #ffd56b;
  margin-bottom: 8px;
  text-shadow: 0 0 30px rgba(255,200,60,.5);
}
.pg-gameover-winner {
  font-size: 1.2rem;
  font-style: italic;
  color: #f5e6c8;
  margin-bottom: 20px;
}

/* Turn indicator */
.pg-turn-banner {
  font-family: 'Cinzel Decorative', serif;
  font-size: .75rem;
  letter-spacing: .15em;
  padding: 6px 18px;
  border-radius: 20px;
  margin-bottom: 16px;
  background: rgba(255,180,60,.12);
  border: 1px solid rgba(255,180,60,.25);
  color: #ffd56b;
}

@media (max-width: 520px) {
  .pg-pit-bowl { width: 48px; height: 48px; }
  .pg-row { gap: 6px; }
  .pg-board-wrap { padding: 14px 10px; }
}
`;

function Seeds({ count, player }) {
  const cls = player === 0 ? "p1" : player === 1 ? "p2" : "neutral";
  const display = Math.min(count, 12);
  return (
    <>
      {Array.from({ length: display }).map((_, i) => (
        <div key={i} className={`pg-seed ${cls}`} />
      ))}
      {count > 12 && (
        <div style={{ fontSize: "9px", color: "#c8a87a", fontFamily: "Cormorant Garamond, serif" }}>
          +{count - 12}
        </div>
      )}
    </>
  );
}

export default function Pallanguzhi() {
  const [board, setBoard] = useState([...INITIAL_BOARD]);
  const [scores, setScores] = useState([0, 0]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [phase, setPhase] = useState("select"); // select | animating | gameover
  const [highlight, setHighlight] = useState(null);
  const [captureHighlight, setCaptureHighlight] = useState(null);
  const [message, setMessage] = useState("Player 1 — choose a pit to begin!");
  const [msgType, setMsgType] = useState("");
  const [handCount, setHandCount] = useState(0);
  const animRef = useRef(null);

  const clearAnim = () => {
    if (animRef.current) clearTimeout(animRef.current);
  };

  const handlePitClick = useCallback((pitIdx) => {
    if (phase !== "select") return;
    const validRange = currentPlayer === 0 ? [0,6] : [7,13];
    if (pitIdx < validRange[0] || pitIdx > validRange[1]) return;
    if (board[pitIdx] === 0) return;

    const { steps, finalBoard, captured } = computeTurnSteps(board, pitIdx);
    setPhase("animating");

    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        // done
        setHighlight(null);
        setCaptureHighlight(null);
        setHandCount(0);

        const newScores = [...scores];
        newScores[currentPlayer] += captured;

        const next = 1 - currentPlayer;
        const nextPits = finalBoard.slice(next === 0 ? 0 : 7, next === 0 ? 7 : 14);
        const thisPits = finalBoard.slice(currentPlayer === 0 ? 0 : 7, currentPlayer === 0 ? 7 : 14);

        if (finalBoard.reduce((a, b) => a + b, 0) === 0) {
          setBoard(finalBoard);
          setScores(newScores);
          setPhase("gameover");
          setMessage("All seeds have been collected!");
          return;
        }

        if (nextPits.reduce((a, b) => a + b, 0) === 0) {
          setBoard(finalBoard);
          setScores(newScores);
          setPhase("gameover");
          setMessage(`Player ${next + 1} has no moves!`);
          return;
        }

        setScores(newScores);
        setBoard(finalBoard);
        setCurrentPlayer(next);
        setPhase("select");
        setMessage(`Player ${next + 1} — choose a pit!`);
        setMsgType("");
        return;
      }

      const step = steps[i];
      setBoard([...step.board]);
      setHighlight(step.highlight);
      setCaptureHighlight(step.captureHighlight);
      setHandCount(step.hand || 0);
      setMessage(step.message);
      setMsgType(step.phase === "capture" ? "capture" : step.phase === "relay" ? "relay" : "");
      i++;
      animRef.current = setTimeout(run, STEP_DELAY);
    };
    run();
  }, [phase, board, currentPlayer, scores]);

  useEffect(() => () => clearAnim(), []);

  const restart = () => {
    clearAnim();
    setBoard([...INITIAL_BOARD]);
    setScores([0, 0]);
    setCurrentPlayer(0);
    setPhase("select");
    setHighlight(null);
    setCaptureHighlight(null);
    setMessage("Player 1 — choose a pit to begin!");
    setMsgType("");
    setHandCount(0);
  };

  // P2 top row: pits 13→7 (left to right)
  const topRow = [13, 12, 11, 10, 9, 8, 7];
  // P1 bottom row: pits 0→6
  const botRow = [0, 1, 2, 3, 4, 5, 6];

  const renderPit = (idx) => {
    const isP1Pit = idx <= 6;
    const player = isP1Pit ? 0 : 1;
    const clickable =
      phase === "select" &&
      currentPlayer === player &&
      board[idx] > 0;
    const isHL = highlight === idx;
    const isCap = captureHighlight === idx;

    return (
      <div
        key={idx}
        className={`pg-pit ${clickable ? "clickable" : ""} ${isHL ? "highlight" : ""} ${isCap ? "capture-highlight" : ""}`}
        onClick={() => handlePitClick(idx)}
      >
        <div className="pg-pit-bowl">
          <Seeds count={board[idx]} player={player} />
        </div>
        <div className="pg-pit-count">{board[idx]}</div>
      </div>
    );
  };

  const winner =
    phase === "gameover"
      ? scores[0] > scores[1]
        ? "Player 1 Wins! 🎉"
        : scores[1] > scores[0]
        ? "Player 2 Wins! 🎉"
        : "It's a Draw!"
      : null;

  return (
    <>
      <style>{FONTS}</style>
      <style>{STYLES}</style>
      <div className="pg-root">
        <div className="pg-title">Pallanguzhi</div>
        <div className="pg-subtitle">The Ancient Seeds Game of South India</div>

        {/* Scores */}
        <div className="pg-scores">
          {[0, 1].map((p) => (
            <div
              key={p}
              className={`pg-score-card ${phase === "select" && currentPlayer === p ? "active" : ""}`}
            >
              <div className="pg-score-label">Player {p + 1}</div>
              <div className="pg-score-value">{scores[p]}</div>
            </div>
          ))}
        </div>

        {phase !== "gameover" && (
          <div className="pg-turn-banner">
            {phase === "animating"
              ? "⟳ Sowing…"
              : `Player ${currentPlayer + 1}'s Turn`}
          </div>
        )}

        {/* Message */}
        <div className={`pg-message ${msgType}`}>{message}</div>

        {/* Hand */}
        <div className="pg-hand">
          {handCount > 0 && (
            <>
              <span>In hand:</span>
              <div className="pg-hand-seeds">
                {Array.from({ length: Math.min(handCount, 10) }).map((_, i) => (
                  <div key={i} className={`pg-seed ${currentPlayer === 0 ? "p1" : "p2"}`} />
                ))}
                {handCount > 10 && (
                  <span style={{ fontSize: "10px", color: "#c8a87a" }}>+{handCount - 10}</span>
                )}
              </div>
              <span style={{ fontSize: ".85rem" }}>({handCount})</span>
            </>
          )}
        </div>

        {/* Board */}
        <div className="pg-board-wrap">
          <div
            className={`pg-player-label ${phase === "select" && currentPlayer === 1 ? "active" : ""}`}
          >
            ↑ Player 2
          </div>
          <div className="pg-row">{topRow.map(renderPit)}</div>
          <div style={{ height: 16 }} />
          <div className="pg-row">{botRow.map(renderPit)}</div>
          <div
            className={`pg-player-label ${phase === "select" && currentPlayer === 0 ? "active" : ""}`}
            style={{ marginTop: 8, marginBottom: 0 }}
          >
            Player 1 ↓
          </div>
        </div>

        {/* Game over */}
        {phase === "gameover" && (
          <div className="pg-gameover">
            <div className="pg-gameover-title">Game Over</div>
            <div className="pg-gameover-winner">{winner}</div>
            <button className="pg-btn" onClick={restart}>
              Play Again
            </button>
          </div>
        )}

        {phase !== "gameover" && (
          <button className="pg-btn" style={{ marginTop: 8 }} onClick={restart}>
            Restart
          </button>
        )}
      </div>
    </>
  );
}
