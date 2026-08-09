import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [user, setUser] = useState(null);

    const [token, setToken] = useState(localStorage.getItem("token"));

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const savedUser = localStorage.getItem("user");

        if (savedUser) {

            setUser(JSON.parse(savedUser));

        }

        setLoading(false);

    }, []);

    const login = (userData, jwtToken) => {

        localStorage.setItem("token", jwtToken);

        localStorage.setItem("user", JSON.stringify(userData));

        setUser(userData);

        setToken(jwtToken);

    };

    const logout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        setUser(null);

        setToken(null);

    };

    return (

        <AuthContext.Provider

            value={{

                user,

                token,

                login,

                logout,

                loading,

                isAuthenticated: !!token

            }}

        >

            {children}

        </AuthContext.Provider>

    );

}

export function useAuth() {

    return useContext(AuthContext);

}