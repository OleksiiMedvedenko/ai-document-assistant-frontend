import { AppProviders } from "@/app/providers/app-providers";
import "@/i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

const savedTheme = localStorage.getItem("theme");
document.documentElement.setAttribute(
  "data-theme",
  savedTheme === "light" ? "light" : "dark",
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);
