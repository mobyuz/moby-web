import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./landing/landing.css";

const root = document.getElementById("root");
if (!root) throw new Error("The Moby page root element is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
