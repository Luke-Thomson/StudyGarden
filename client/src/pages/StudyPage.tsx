import React, {useEffect, useMemo, useRef, useState} from "react";
import Timer from "../components/ui/Timer";
import Sidebar from "../components/ui/Sidebar";
import "./StudyPage.css";
import api, {type TimerMode} from "../api";
import type {Subject} from "../types";

interface StudyPageProps {
    token: string;
    subjects: Subject[];
    onSubjectsRefresh: () => Promise<void>;
    onSubjectCreate: (title: string) => Promise<Subject | null>;
    onWalletRefresh: () => Promise<void>;
}

const StudyPage: React.FC<StudyPageProps> = ({
                                                 token,
                                                 subjects,
                                                 onSubjectsRefresh,
                                                 onSubjectCreate,
                                                 onWalletRefresh,
                                             }) => {
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [mode, setMode] = useState<TimerMode>("STUDY");
    const [durationMinutes, setDurationMinutes] = useState(25);
    const [status, setStatus] = useState<string | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const stoppingSessionRef = useRef(false);
    const activeSessionRef = useRef<number | null>(null);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [creatingSubject, setCreatingSubject] = useState(false);
    const [newSubjectTitle, setNewSubjectTitle] = useState("");
    useEffect(() => {
        if (subjects.length > 0 && selectedSubjectId === null) {
            setSelectedSubjectId(subjects[0].id);
        }
    }, [subjects, selectedSubjectId]);
    useEffect(() => {
        const loadSubjects = async () => {
            setLoadingSubjects(true);
            try {
                await onSubjectsRefresh();
            } finally {
                setLoadingSubjects(false);
            }
        };
        if (subjects.length === 0) loadSubjects();
    }, []);
    const selectedSubjectTitle = useMemo(() => {
        return subjects.find((s) => s.id === selectedSubjectId)?.title ?? "";
    }, [subjects, selectedSubjectId]);
    const validateStart = () => {
        if (mode === "STUDY" && !selectedSubjectId) {
            setStatus("Select a subject to start a study session.");
            return false;
        }
        if (durationMinutes < 1) {
            setStatus("Duration must be at least 1 minute.");
            return false;
        }
        return true;
    };
    const handleStart = async () => {
        if (!validateStart()) return false;
        try {
            const payload = {
                durationSec: durationMinutes * 60,
                mode,
                subjectId: mode === "STUDY" ? selectedSubjectId! : undefined,
            };
            const res = await api.startTimer(token, payload);
            setActiveSessionId(res.sessionId);
            activeSessionRef.current = res.sessionId;
            setStatus("Session started!");
            return true;
        } catch (err: any) {
            setStatus(err?.message ?? "Unable to start session");
            return false;
        }
    };
    const finalizeSession = async () => {
        if (!activeSessionRef.current) {
            setStatus("No active session to stop.");
            return;
        }
        if (stoppingSessionRef.current) return;
        stoppingSessionRef.current = true;
        try {
            const res = await api.stopTimer(token, activeSessionRef.current, { keepalive: true });
            setStatus(res.message ?? "Session stopped.");
            await onWalletRefresh();
        } catch (err: any) {
            setStatus(err?.message ?? "Unable to stop session");
        } finally {
            setActiveSessionId(null);
            activeSessionRef.current = null;
            stoppingSessionRef.current = false;
        }
    };
    const handleStop = async () => {
        await finalizeSession();
    };
    const handleSessionComplete = async () => {
        await finalizeSession();
    };

    useEffect(() => {
        activeSessionRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (activeSessionRef.current && !stoppingSessionRef.current) {
                void finalizeSession();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            if (activeSessionRef.current && !stoppingSessionRef.current) {
                void finalizeSession();
            }
        };
    }, []);
    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectTitle.trim()) return;
        setCreatingSubject(true);
        try {
            const created = await onSubjectCreate(newSubjectTitle.trim());
            if (created) {
                setSelectedSubjectId(created.id);
                setNewSubjectTitle("");
            }
        } finally {
            setCreatingSubject(false);
        }
    };
    return (
        <div className="study-page-root">
            <aside className="study-sidebar">
                <Sidebar
                    subjects={subjects}
                    selectedId={selectedSubjectId}
                    onSelect={(id) => setSelectedSubjectId(id)}
                    loading={loadingSubjects}
                />
            </aside>
            <main className="study-main">
                <div className="study-timer-container" aria-hidden={false}>
                    <Timer
                        initialSeconds={0}
                        onSessionComplete={handleSessionComplete}
                        onStart={handleStart}
                        onStop={handleStop}
                        defaultMode="digital"
                    />
                </div>
                <section className="study-content">
                    <h1>Study</h1>
                    <p className="study-sub">Track focused time to earn coins, then spend them in your garden.</p>
                    <div className="study-controls">
                        <div className="control-row">
                            <label className="control-label">Session type</label>
                            <div className="control-buttons">
                                {["STUDY", "BREAK_SHORT", "BREAK_LONG"].map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        className={`pill-btn ${mode === m ? "active" : ""}`}
                                        onClick={() => setMode(m as TimerMode)}
                                    >
                                        {m === "STUDY" ? "Study" : m === "BREAK_SHORT" ? "Short Break" : "Long Break"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="control-row">
                            <label className="control-label">Duration (minutes)</label>
                            <input
                                type="number"
                                min={1}
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="duration-input"
                            />
                        </div>
                        <div className="control-row">
                            <label className="control-label">Current subject</label>
                            <div
                                className="subject-chip">{selectedSubjectTitle || "Choose a subject from the left"}</div>
                        </div>
                    </div>
                    <div className="course-view">
                        <form className="new-subject-form" onSubmit={handleCreateSubject}>
                            <label htmlFor="new-subject" className="control-label">Add a subject</label>
                            <div className="new-subject-row">
                                <input
                                    id="new-subject"
                                    type="text"
                                    value={newSubjectTitle}
                                    onChange={(e) => setNewSubjectTitle(e.target.value)}
                                    placeholder="e.g. Algebra"
                                    disabled={creatingSubject}
                                />
                                <button type="submit" disabled={creatingSubject || !newSubjectTitle.trim()}>
                                    {creatingSubject ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                        {status && <div className="status-banner">{status}</div>}
                        <p>Select a course from the left to view lessons / content here.</p>
                    </div>
                </section>
            </main>
        </div>
    );
};
export default StudyPage;