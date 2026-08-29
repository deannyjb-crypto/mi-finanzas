import { useEffect, useState } from "react";
import { supabase } from "./services/supabase";
import "./App.css";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div style={{ padding: "40px", textAlign: "center" }}>
        Cargando...
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} />
  ) : (
    <Auth onLogin={setUser} />
  );
}

export default App;