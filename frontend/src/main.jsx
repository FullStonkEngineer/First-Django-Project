import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
