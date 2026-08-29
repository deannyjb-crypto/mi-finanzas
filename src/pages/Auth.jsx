import { useState } from "react";
import { supabase } from "../services/supabase";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        // INICIAR SESIÓN
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        console.log("Usuario conectado:", data.user);

        setMessage("¡Inicio de sesión exitoso!");

        if (onLogin) {
          onLogin(data.user);
        }
      } else {
        // CREAR CUENTA
        const { data, error } =
          await supabase.auth.signUp({
            email,
            password,
          });

        if (error) throw error;

        console.log("Usuario registrado:", data.user);

        setMessage(
          "¡Cuenta creada correctamente! Revisa tu correo para confirmar tu cuenta."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        <div className="auth-header">
          <div className="auth-logo">💰</div>

          <h1>Mi Finanzas</h1>

          <p>
            {isLogin
              ? "Inicia sesión para gestionar tus finanzas"
              : "Crea tu cuenta y comienza a organizar tus finanzas"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="input-group">
            <label>Correo electrónico</label>

            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : isLogin
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </button>

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

        </form>

        <div className="auth-switch">
          {isLogin ? (
            <>
              <span>¿No tienes cuenta?</span>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              <span>¿Ya tienes cuenta?</span>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Iniciar sesión
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}