import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./polish.css";
import "./theme.css";

const root = document.getElementById("root");
if (!root) throw new Error("The Moby page root element is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
