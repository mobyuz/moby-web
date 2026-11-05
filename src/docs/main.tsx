import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";
import "../polish.css";
import "../theme.css";
import "./docs.css";
import { DocsApp } from "./DocsApp";

const root = document.getElementById("root");
if (!root) throw new Error("The Moby documentation root element is missing");

createRoot(root).render(<StrictMode><DocsApp /></StrictMode>);
