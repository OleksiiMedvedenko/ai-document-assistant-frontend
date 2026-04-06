import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/app-shell";
import { ProtectedRoute } from "../components/layout/protected-route";
import { AccountPage } from "../features/account/pages/account-page";
import { AdminUsersPage } from "../features/admin/pages/admin-users-page";
import { LoginPage } from "../features/auth/pages/login-page";
import { RegisterPage } from "../features/auth/pages/register-page";
import { DocumentChatPage } from "../features/chat/pages/document-chat-page";
import { ComparePage } from "../features/compare/pages/compare-page";
import { DocumentDetailsPage } from "../features/documents/pages/document-details-page";
import { DocumentsPage } from "../features/documents/pages/documents-page";
import { HomePage } from "../features/home/pages/home-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/home" replace />,
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
      { path: "/home", element: <HomePage /> },
      { path: "/documents", element: <DocumentsPage /> },
      { path: "/documents/:id", element: <DocumentDetailsPage /> },
      { path: "/documents/:id/chat", element: <DocumentChatPage /> },
      { path: "/compare", element: <ComparePage /> },
      { path: "/account", element: <AccountPage /> },
      {
        path: "/admin/users",
        element: (
          <ProtectedRoute requireAdmin>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
