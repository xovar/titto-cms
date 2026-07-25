import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store";
import { initializeTheme } from "./store/slices/themeSlice";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./config/AuthContext";

// Initialize dark mode class on HTML before rendering
store.dispatch(initializeTheme());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
