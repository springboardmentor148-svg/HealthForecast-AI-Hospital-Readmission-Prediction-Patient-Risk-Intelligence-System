import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";

import { Toaster } from "react-hot-toast";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./assets/css/variables.css";
import "./assets/css/global.css";

ReactDOM.createRoot(
    document.getElementById("root")
).render(

    <React.StrictMode>

        <BrowserRouter>

            <AuthProvider>

                <App />

                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    toastOptions={{
                        duration: 3000,
                        style: {
                            borderRadius: "10px",
                            background: "#fff",
                            color: "#1E293B",
                            fontSize: "14px"
                        },
                        success: {
                            style: {
                                borderLeft: "5px solid #22C55E"
                            }
                        },
                        error: {
                            style: {
                                borderLeft: "5px solid #EF4444"
                            }
                        }
                    }}
                />

            </AuthProvider>

        </BrowserRouter>

    </React.StrictMode>

);