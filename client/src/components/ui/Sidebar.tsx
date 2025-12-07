import React from "react";
import "./Sidebar.css";

interface SidebarProps {
    subjects: { id: number; title: string }[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    loading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({subjects, selectedId, onSelect, loading = false}) => {
    return (
        <nav className="sidebar" aria-label="Your courses">
            <div className="sidebar-title">Your Courses</div>
            {loading && <div className="course-loading">Loading…</div>}
            <ul className="course-list">
                {subjects.length === 0 && !loading && <li className="course-item">No subjects yet</li>}
                {subjects.map((c) => {
                    const active = c.id === selectedId;
                    return (
                        <li key={c.id} className={`course-item ${active ? "active" : ""}`}>
                            <button
                                type="button"
                                className="course-link"
                                title={c.title}
                                onClick={() => onSelect(c.id)}
                            >
                                {c.title}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
export default Sidebar;