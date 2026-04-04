import { AppProviders } from "@/app/providers/app-providers";
import "@/i18n";
import "@/styles/index.css";
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);
