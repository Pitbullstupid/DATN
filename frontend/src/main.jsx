import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import "./i18n/i18n.js";
import Footer from "./components/Footer";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* <Toaster position="top-right" /> */}
        <App />
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
