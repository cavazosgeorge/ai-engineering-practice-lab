import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Lessons } from "./pages/Lessons";
import { LessonDetail } from "./pages/LessonDetail";
import { ChallengePage } from "./pages/ChallengePage";
import { Review } from "./pages/Review";
import { ProgressPage } from "./pages/Progress";
import { VocabularyPage } from "./pages/VocabularyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/lessons/:slug" element={<LessonDetail />} />
          <Route path="/challenges/:id" element={<ChallengePage />} />
          <Route path="/review" element={<Review />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/vocabulary/:lessonSlug" element={<VocabularyPage />} />
          <Route path="/vocabulary/:lessonSlug/flashcards" element={<VocabularyPage />} />
          <Route path="/vocabulary/:lessonSlug/quiz" element={<VocabularyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
