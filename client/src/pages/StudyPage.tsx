import React from "react";
import Timer from "../components/ui/Timer";
import Sidebar from "../components/ui/Sidebar";
import "./StudyPage.css";

const StudyPage: React.FC = () => {
  const handleSessionComplete = (elapsedSeconds: number) => {
    console.log("Study session completed:", elapsedSeconds, "seconds");
    // hook: award coins / save session
  };

  return (
    <div className="study-page-root">
      {/* Left vertical courses sidebar - only rendered inside StudyPage */}
      <aside className="study-sidebar">
        <Sidebar />
      </aside>

      {/* Main area (course content) */}
      <main className="study-main">
        {/* Timer in a dedicated container positioned top-right over the study area */}
        <div className="study-timer-container" aria-hidden={false}>
          <Timer initialSeconds={0} onSessionComplete={handleSessionComplete} defaultMode="digital" />
        </div>

        {/* Page content */}
        <section className="study-content">
          <h1>Study</h1>
          <p className="study-sub">Select a course on the left to open it. Timer sits at the top-right.</p>

          {/* Example course content placeholder */}
          <div className="course-view">
            <p>Select a course from the left to view lessons / content here.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudyPage;