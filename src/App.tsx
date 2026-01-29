import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Lessons } from "./pages/Lessons";
import { LessonDetail } from "./pages/LessonDetail";
import { ChallengePage } from "./pages/ChallengePage";
import { Review } from "./pages/Review";
import { ProgressPage } from "./pages/Progress";
import { VocabularyPage } from "./pages/VocabularyPage";

// Admin components
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { VocabularyFormPage } from "./pages/admin/VocabularyFormPage";

function VocabularyFormEdit() {
  const { termId } = useParams();
  return <VocabularyFormPage key={termId} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main app routes */}
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

        {/* Admin login - standalone (no layout) */}
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* Admin area - protected with own layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/vocabulary/new" element={<VocabularyFormPage />} />
            <Route path="/admin/vocabulary/:termId/edit" element={<VocabularyFormEdit />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
