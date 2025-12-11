import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import type {
    LeaderboardRange,
    SessionTotals,
    StudyLeaderboardEntry,
    StudyLeaderboardResponse,
    UserProfile,
} from "../types";
import "./LeaderboardPage.css";
type LeaderboardPageProps = {
    token: string;
    user: UserProfile | null;
};
const rangeOptions: { value: LeaderboardRange; label: string }[] = [
    { value: "day", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
];
const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};
const displayName = (entry: StudyLeaderboardEntry) => entry.fullName || entry.email;
const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ token, user }) => {
    const [range, setRange] = useState<LeaderboardRange>("week");
    const [board, setBoard] = useState<StudyLeaderboardResponse | null>(null);
    const [totals, setTotals] = useState<SessionTotals | null>(null);
    const [loadingBoard, setLoadingBoard] = useState(false);
    const [loadingTotals, setLoadingTotals] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const myEntry = useMemo(
        () => board?.entries.find((entry) => entry.userId === user?.id) ?? null,
        [board, user?.id]
    );
    useEffect(() => {
        const fetchBoard = async () => {
            setLoadingBoard(true);
            setError(null);
            try {
                const data = await api.leaderboardStudy(range);
                setBoard(data);
            } catch (err: any) {
                setError(err?.message ?? "Unable to load leaderboard");
            } finally {
                setLoadingBoard(false);
            }
        };
        fetchBoard();
    }, [range]);
    useEffect(() => {
        const fetchTotals = async () => {
            setLoadingTotals(true);
            try {
                const data = await api.mySessionTotals(token);
                setTotals(data);
            } catch (err) {
                // Totals are a nice-to-have; ignore errors silently
            } finally {
                setLoadingTotals(false);
            }
        };
        fetchTotals();
    }, [token]);
    const rangeWindow = useMemo(() => {
        if (!board) return null;
        const from = new Date(board.from).toLocaleString();
        const to = new Date(board.to).toLocaleString();
        return `${from} → ${to}`;
    }, [board]);
    return (
        <div className="leaderboard-page">
            <header className="leaderboard-header">
                <div>
                    <h1>Study Leaderboard</h1>
                    <p className="leaderboard-subtitle">
                        Compare focused study time across the community and see how your totals stack up.
                    </p>
                    {rangeWindow && (
                        <p className="range-window" aria-live="polite">{`Range window: ${rangeWindow}`}</p>
                    )}
                </div>
                <div className="range-toggle" role="group" aria-label="Select leaderboard range">
                    {rangeOptions.map((option) => (
                        <button
                            key={option.value}
                            className={`pill-btn ${range === option.value ? "active" : ""}`}
                            onClick={() => setRange(option.value)}
                            type="button"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </header>
            <section className="leaderboard-summary">
                <div className="summary-card">
                    <div className="summary-title-row">
                        <h2>Your study totals</h2>
                        {loadingTotals && <span className="loading-text">Updating…</span>}
                    </div>
                    {totals ? (
                        <div className="totals-grid">
                            <div>
                                <p className="muted">Total focus time</p>
                                <strong className="metric">{formatDuration(totals.totalSeconds)}</strong>
                            </div>
                            <div>
                                <p className="muted">Sessions completed</p>
                                <strong className="metric">{totals.sessionsCount}</strong>
                            </div>
                        </div>
                    ) : (
                        <p className="muted">We’ll pull your session totals once you’ve started studying.</p>
                    )}
                    <p className="comparison-text">
                        {myEntry
                            ? `You’re currently #${myEntry.rank} for this ${range}. Keep it up!`
                            : "Study during this range to join the leaderboard."}
                    </p>
                </div>
                <div className="summary-card secondary">
                    <h3>How the ranking works</h3>
                    <p className="muted">
                        We total completed study sessions between the range start and end. Breaks don’t count, and only
                        completed sessions are included.
                    </p>
                    {board?.entries[0] && (
                        <p className="top-highlight">
                            <span className="muted">Current leader:</span> {displayName(board.entries[0])} with
                            {' '}
                            {formatDuration(board.entries[0].totalSeconds)} of focused time.
                        </p>
                    )}
                </div>
            </section>
            <section className="leaderboard-table" aria-live="polite">
                {error && <div className="error-banner">{error}</div>}
                {loadingBoard ? (
                    <div className="loading-card">Loading leaderboard…</div>
                ) : board && board.entries.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th scope="col">Rank</th>
                                <th scope="col">Learner</th>
                                <th scope="col">Focused time</th>
                                <th scope="col">Sessions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {board.entries.map((entry) => (
                                <tr
                                    key={entry.userId}
                                    className={entry.userId === user?.id ? "highlighted-row" : undefined}
                                >
                                    <td>#{entry.rank}</td>
                                    <td>
                                        <div className="name-cell">
                                            <span className="name">{displayName(entry)}</span>
                                            {entry.userId === user?.id && <span className="you-pill">You</span>}
                                        </div>
                                    </td>
                                    <td>{formatDuration(entry.totalSeconds)}</td>
                                    <td>{entry.sessionsCount}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">No study sessions have been completed in this range yet.</div>
                )}
            </section>
        </div>
    );
};
export default LeaderboardPage;