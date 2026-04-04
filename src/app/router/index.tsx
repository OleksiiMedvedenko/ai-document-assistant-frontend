import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/app-shell";
import { ProtectedRoute } from "../components/layout/protected-route";
import { LoginPage } from "../features/auth/pages/login-page";
import { RegisterPage } from "../features/auth/pages/register-page";
import { DocumentChatPage } from "../features/chat/pages/document-chat-page";
import { ComparePage } from "../features/compare/pages/compare-page";
import { DocumentDetailsPage } from "../features/documents/pages/document-details-page";
import { DocumentsPage } from "../features/documents/pages/documents-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/documents" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: "/documents", element: <DocumentsPage /> },
      { path: "/documents/:id", element: <DocumentDetailsPage /> },
      { path: "/documents/:id/chat", element: <DocumentChatPage /> },
      { path: "/compare", element: <ComparePage /> },
    ],
  },
]);
