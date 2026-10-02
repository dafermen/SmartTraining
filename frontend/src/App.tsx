import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";

const AccessDeniedPage = lazy(() =>
  import("./pages/AccessDeniedPage").then((module) => ({
    default: module.AccessDeniedPage,
  })),
);
const AdminProgressPage = lazy(() =>
  import("./pages/AdminProgressPage").then((module) => ({
    default: module.AdminProgressPage,
  })),
);
const AdminAssignmentsPage = lazy(() =>
  import("./pages/AdminAssignmentsPage").then((module) => ({
    default: module.AdminAssignmentsPage,
  })),
);
const AdminTrainingsPage = lazy(() =>
  import("./pages/AdminTrainingsPage").then((module) => ({
    default: module.AdminTrainingsPage,
  })),
);
const AdminTrainingPreviewPage = lazy(() =>
  import("./pages/AdminTrainingPreviewPage").then((module) => ({
    default: module.AdminTrainingPreviewPage,
  })),
);
const AdminVideosPage = lazy(() =>
  import("./pages/AdminVideosPage").then((module) => ({
    default: module.AdminVideosPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("./pages/AdminUsersPage").then((module) => ({
    default: module.AdminUsersPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const DocumentationPage = lazy(() =>
  import("./pages/DocumentationPage").then((module) => ({
    default: module.DocumentationPage,
  })),
);
const LearnerCatalogPage = lazy(() =>
  import("./pages/LearnerCatalogPage").then((module) => ({
    default: module.LearnerCatalogPage,
  })),
);
const LearningVideoPage = lazy(() =>
  import("./pages/LearningVideoPage").then((module) => ({
    default: module.LearningVideoPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);
const TrainingDetailPage = lazy(() =>
  import("./pages/TrainingDetailPage").then((module) => ({
    default: module.TrainingDetailPage,
  })),
);

function PageFallback() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <div className="animate-pulse space-y-4" role="status">
        <span className="sr-only">Cargando página…</span>
        <div className="h-8 w-64 rounded-lg bg-slate-200" />
        <div className="h-32 rounded-2xl bg-slate-200" />
        <div className="h-48 rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}

function LegacyDocumentationRedirect() {
  const location = useLocation();
  const suffix = location.pathname.slice("/documentation".length);

  return (
    <Navigate replace to={`/docs${suffix}${location.search}${location.hash}`} />
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/app" element={<DashboardPage />} />
                <Route path="/docs" element={<DocumentationPage />} />
                <Route
                  path="/docs/:documentId"
                  element={<DocumentationPage />}
                />
                <Route
                  path="/documentation/*"
                  element={<LegacyDocumentationRedirect />}
                />
                <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                  <Route path="/admin" element={<DashboardPage />} />
                  <Route
                    path="/admin/content"
                    element={<AdminTrainingsPage />}
                  />
                  <Route
                    path="/admin/trainings/:trainingId/preview"
                    element={<AdminTrainingPreviewPage />}
                  />
                  <Route
                    path="/admin/progress"
                    element={<AdminProgressPage />}
                  />
                  <Route
                    path="/admin/assignments"
                    element={<AdminAssignmentsPage />}
                  />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route
                    path="/admin/modules/:moduleId/videos"
                    element={<AdminVideosPage />}
                  />
                </Route>
                <Route element={<ProtectedRoute roles={["LEARNER"]} />}>
                  <Route path="/learn" element={<LearnerCatalogPage />} />
                  <Route
                    path="/learn/trainings/:trainingId"
                    element={<TrainingDetailPage />}
                  />
                  <Route
                    path="/learn/trainings/:trainingId/videos/:videoId"
                    element={<LearningVideoPage />}
                  />
                </Route>
              </Route>
            </Route>
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  );
}
