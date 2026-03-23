import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Layout from "./layout/Layout.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import CreateSurvey from "./pages/CreateSurvey.jsx";
import SurveyAccess from "./pages/SurveyAccess.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: "*", element: <h1>404 Not Found</h1> },
      { path: "/register", element: <Register /> },
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/login", element: <Login /> },
      { path: "/create-survey", element: <CreateSurvey /> },
      { path: "/survey", element: <SurveyAccess /> },
      { path: "/survey/:surveyCode", element: <SurveyAccess /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
