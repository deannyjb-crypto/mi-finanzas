import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import "./App.css";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Household from "./pages/Household";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Controla la sección que se está mostrando
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    // Revisar si ya existe una sesión activa
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Detectar inicio y cierre de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        Cargando...
      </div>
    );
  }

  // Si no hay sesión
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // Usuario autenticado
  return (
    <>
      <nav className="main-navigation">
        <button
          onClick={() => setCurrentPage("dashboard")}
          className={
            currentPage === "dashboard"
              ? "nav-button active"
              : "nav-button"
          }
        >
          💰 Mis finanzas
        </button>

        <button
          onClick={() => setCurrentPage("household")}
          className={
            currentPage === "household"
              ? "nav-button active"
              : "nav-button"
          }
        >
          🏠 Mi hogar
        </button>
      </nav>

      {currentPage === "dashboard" && (
        <Dashboard user={user} />
      )}

      {currentPage === "household" && (
        <Household user={user} />
      )}
    </>
  );
}

export default App;