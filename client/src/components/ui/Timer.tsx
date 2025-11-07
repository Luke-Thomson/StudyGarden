import React, { useEffect, useRef, useState } from "react";
import "./Timer.css";

type DisplayMode = "digital" | "analog";

interface TimerProps {
  initialSeconds?: number; // start value in seconds (default 0)
  onSessionComplete?: (elapsedSeconds: number) => void; // called when user explicitly marks session complete
  defaultMode?: DisplayMode;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const formatTime = (s: number) => {
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${pad(mm)}:${pad(ss)}`;
};

const AnalogClock: React.FC<{ seconds: number; size?: number }> = ({ seconds, size = 140 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) - 6;

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const sec = totalSeconds % 60;
  const minFloat = (totalSeconds % 3600) / 60;
  const hourFloat = (totalSeconds / 3600) % 12;

  const secDeg = sec * 6;
  const minDeg = minFloat * 6;
  const hourDeg = hourFloat * 30;

  const hand = (lengthPct: number, width: number, deg: number, color = "#234016") => {
    const len = r * lengthPct;
    const rad = (deg - 90) * (Math.PI / 180);
    const x = cx + Math.cos(rad) * len;
    const y = cy + Math.sin(rad) * len;
    return <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };

  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const deg = i * 6;
    const rad = (deg - 90) * (Math.PI / 180);
    const inner = r - (i % 5 === 0 ? 10 : 6);
    const x1 = cx + Math.cos(rad) * inner;
    const y1 = cy + Math.sin(rad) * inner;
    const x2 = cx + Math.cos(rad) * r;
    const y2 = cy + Math.sin(rad) * r;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b3b3b3" strokeWidth={i % 5 === 0 ? 2 : 1} />;
  });

  return (
    <svg className="analog-clock" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <filter id="clock-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#e1e1e1" strokeWidth="2" filter="url(#clock-shadow)" />
      <circle cx={cx} cy={cy} r="3.5" fill="#234016" />
      <g>{ticks}</g>

      <g className="hands">
        {hand(0.5, 6, hourDeg, "#24521f")}
        {hand(0.75, 4, minDeg, "#3b7b2f")}
        {hand(0.88, 2, secDeg, "#e74c3c")}
      </g>
    </svg>
  );
};

const Timer: React.FC<TimerProps> = ({ initialSeconds = 0, onSessionComplete, defaultMode = "digital" }) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [running, setRunning] = useState<boolean>(false);

  const safeMode = (m: unknown): DisplayMode => {
    if (m === "digital" || m === "analog") return m;
    return "digital";
  };
  const [mode, setMode] = useState<DisplayMode>(() => safeMode(defaultMode));

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (running) {
      if (intervalRef.current !== null) return;
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [running]);

  const start = () => setRunning(true);
  const stop = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setSeconds(initialSeconds);
  };
  const stopAndComplete = () => {
    setRunning(false);
    if (onSessionComplete) onSessionComplete(seconds);
  };

  const showDigital = mode === "digital";
  const showAnalog = mode === "analog";

  return (
    <div className="timer-root" data-mode={mode}>
      <div className="timer-header">
        <div className="timer-title">Focus Timer</div>

        <div className="mode-toggle" role="tablist" aria-label="Timer display mode">
          <button
            className={`mode-btn ${mode === "digital" ? "active" : ""}`}
            onClick={() => setMode("digital")}
            aria-pressed={mode === "digital"}
          >
            Digital
          </button>
          <button
            className={`mode-btn ${mode === "analog" ? "active" : ""}`}
            onClick={() => setMode("analog")}
            aria-pressed={mode === "analog"}
          >
            Analog
          </button>
        </div>
      </div>

      <div className="timer-displays">
        {showDigital && (
          <div className="timer-display" role="timer" aria-live="polite" aria-atomic="true">
            {formatTime(seconds)}
          </div>
        )}

        {showAnalog && (
          <div className="timer-analog-wrapper" aria-hidden={!showAnalog}>
            <AnalogClock seconds={seconds} size={140} />
          </div>
        )}
      </div>

      <div className="timer-controls">
        {!running ? (
          <button className="timer-btn start" onClick={start} aria-pressed="false">
            Start
          </button>
        ) : (
          <button className="timer-btn stop" onClick={stop} aria-pressed="true">
            Stop
          </button>
        )}

        <button className="timer-btn complete" onClick={stopAndComplete} title="Stop and mark session complete">
          Stop & Mark
        </button>

        <button className="timer-btn reset" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;