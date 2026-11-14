import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "@/app/RootLayout";
import {
  LegacyProjectRedirect,
  LegacySlugRedirect,
  ProjectRoute,
} from "@/app/RouteGuards";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "projects", element: <Navigate to="/" replace /> },
      { path: "projects/:slug", element: <ProjectRoute /> },
      { path: "project", element: <Navigate to="/" replace /> },
      { path: "project/:slug", element: <LegacyProjectRedirect /> },
      { path: ":slug", element: <LegacySlugRedirect /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
