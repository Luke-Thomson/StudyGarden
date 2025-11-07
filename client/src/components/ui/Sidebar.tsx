import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

/* Simple clickable vertical list of courses. Replace the sample list with your real courses. */
const sampleCourses = [
  { id: "course-1", title: "Algebra I", to: "/study/course/algebra-1" },
  { id: "course-2", title: "Biology Basics", to: "/study/course/biology-basics" },
  { id: "course-3", title: "Spanish 101", to: "/study/course/spanish-101" },
  { id: "course-4", title: "History", to: "/study/course/history" },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="sidebar" aria-label="Your courses">
      <div className="sidebar-title">Your Courses</div>
      <ul className="course-list">
        {sampleCourses.map((c) => {
          const active = location.pathname === c.to;
          return (
            <li key={c.id} className={`course-item ${active ? "active" : ""}`}>
              <Link to={c.to} className="course-link" title={c.title}>
                {c.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;