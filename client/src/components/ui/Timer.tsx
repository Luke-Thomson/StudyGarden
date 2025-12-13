import React, {useEffect, useRef, useState} from "react";
import "./Timer.css";

type DisplayMode = "digital" | "analog";

interface TimerProps {
    initialSeconds?: number; // start value in seconds (default 0)
    onSessionComplete?: (elapsedSeconds: number) => void; // called when user explicitly marks session complete
    defaultMode?: DisplayMode;
    onStart?: () => Promise<boolean | void> | boolean | void;
    onStop?: (elapsedSeconds: number) => Promise<void> | void;
    disabled?: boolean;
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

    const secDeg = sec * 6; // 360 / 60
    const minDeg = minFloat * 6;
    const hourDeg = hourFloat * 30; // 360 / 12

    // NOTE: no JSX.Element type here anymore
    const ticks: React.ReactElement[] = [];
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * 2 * Math.PI;
        const isMajor = i % 5 === 0;
        const inner = r - (isMajor ? 10 : 5);
        const outer = r;

        const x1 = cx + inner * Math.sin(angle);
        const y1 = cy - inner * Math.cos(angle);
        const x2 = cx + outer * Math.sin(angle);
        const y2 = cy - outer * Math.cos(angle);

        ticks.push(
            <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#b3b3b3"
                strokeWidth={isMajor ? 2 : 1}
            />
        );
    }

    const hand = (lengthPct: number, width: number, deg: number, color = "#234016") => {
        const len = r * lengthPct;
        const rad = (deg * Math.PI) / 180;
        const x2 = cx + len * Math.sin(rad);
        const y2 = cy - len * Math.cos(rad);

        return (
            <line
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
            />
        );
    };

    return (
        <svg
            className="analog-clock"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
        >
            <defs>
                <filter id="clock-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.12"/>
                </filter>
            </defs>

            <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="#fff"
                stroke="#e1e1e1"
                strokeWidth="2"
                filter="url(#clock-shadow)"
            />
            <g>{ticks}</g>

            {/* Center pivot */}
            <circle cx={cx} cy={cy} r="3.5" fill="#234016"/>

            <g className="hands">
                {hand(0.5, 6, hourDeg, "#24521f")}
                {hand(0.75, 4, minDeg, "#3b7b2f")}
                {hand(0.88, 2, secDeg, "#e74c3c")}
            </g>
        </svg>
    );
};

const Timer: React.FC<TimerProps> = ({
                                         initialSeconds = 0,
                                         onSessionComplete,
                                         defaultMode = "digital",
                                         onStart,
                                         onStop,
                                         disabled = false,
                                     }) => {
    const [seconds, setSeconds] = useState<number>(initialSeconds);
    const [running, setRunning] = useState<boolean>(false);

    const safeMode = (m: unknown): DisplayMode => {
        if (m === "digital" || m === "analog") return m;
        return "digital";
    };

    const [mode, setMode] = useState<DisplayMode>(() => safeMode(defaultMode));
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        setSeconds(initialSeconds);
    }, [initialSeconds]);

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

    const start = async () => {
        if (disabled) return;
        if (onStart) {
            const ok = await onStart();
            if (ok === false) return;
        }
        setRunning(true);
    };

    const stop = async () => {
        setRunning(false);
        if (onStop) await onStop(seconds);
    };

    const reset = () => {
        setRunning(false);
        setSeconds(initialSeconds);
    };

    const stopAndComplete = async () => {
        setRunning(false);
        if (onSessionComplete) await onSessionComplete(seconds);
        if (onStop) await onStop(seconds);
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
        
        <div className="timer-subtitle">
            If you click off of the Study page, your progress <br />
             will not be lost but the timer will reset!
        </div>
            <div className="timer-displays">
                {showDigital && (
                    <div
                        className="timer-display"
                        role="timer"
                        aria-live="polite"
                        aria-atomic="true"
                    >
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
                    <button
                        className="timer-btn start"
                        onClick={start}
                        aria-pressed="false"
                        disabled={disabled}
                    >
                        Start
                    </button>
                ) : (
                    <button
                        className="timer-btn stop"
                        onClick={stop}
                        aria-pressed="true"
                        disabled={disabled}
                    >
                        Stop
                    </button>
                )}
                <button
                    className="timer-btn complete"
                    onClick={stopAndComplete}
                    title="Stop and mark session complete"
                    disabled={disabled}
                >
                    Stop &amp; Mark
                </button>
                <button className="timer-btn reset" onClick={reset} disabled={disabled}>
                    Reset
                </button>
            </div>
        </div>
    );
};

export default Timer;
