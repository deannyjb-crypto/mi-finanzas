import { useEffect, useState } from "react";

function TransactionForm({
  type,
  transactionToEdit,
  onClose,
  onSave,
}) {
  const [description, setDescription] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [category, setCategory] =
    useState("Otros");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const isIncome = type === "income";

  useEffect(() => {
    if (transactionToEdit) {
      setDescription(
        transactionToEdit.description ||
          transactionToEdit.title ||
          ""
      );

      setAmount(transactionToEdit.amount || "");

      setCategory(
        transactionToEdit.category || "Otros"
      );

      setDate(
        transactionToEdit.date ||
          new Date()
            .toISOString()
            .split("T")[0]
      );
    } else {
      setDescription("");
      setAmount("");
      setCategory("Otros");
      setDate(
        new Date().toISOString().split("T")[0]
      );
    }
  }, [transactionToEdit, type]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim() || !amount) {
      alert(
        "Completa la descripción y el monto."
      );
      return;
    }

    const transaction = {
      type,
      description: description.trim(),
      amount: Number(amount),
      category,
      date,
    };

    onSave(transaction);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor:
          "rgba(76, 45, 120, 0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          width: "100%",
          maxWidth: "500px",
          borderRadius: "24px",
          padding: "30px",
          boxShadow:
            "0 20px 60px rgba(76, 45, 120, 0.25)",
        }}
      >
        <h2
          style={{
            color: isIncome
              ? "#7C4DFF"
              : "#E85D8E",
            marginTop: 0,
            marginBottom: "25px",
            textAlign: "center",
          }}
        >
          {transactionToEdit
            ? isIncome
              ? "✏️ Editar ingreso"
              : "✏️ Editar gasto"
            : isIncome
            ? "➕ Agregar ingreso"
            : "➖ Agregar gasto"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              color: "#4B2E83",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Descripción
          </label>

          <input
            type="text"
            placeholder={
  isIncome
    ? "Ej: Salario, Freelance, Venta"
    : "Ej: Supermercado, Transporte, Comida"
}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "20px",
              borderRadius: "12px",
              border:
                "2px solid #E8DDF7",
              fontSize: "16px",
            }}
          />

          <label
            style={{
              display: "block",
              color: "#4B2E83",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Monto
          </label>

          <input
            type="text"
  inputMode="numeric"
  placeholder="Ej: 45.000"
  value={
    amount
      ? Number(amount).toLocaleString("es-CL")
      : ""
  }
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    setAmount(value);
  }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "20px",
              borderRadius: "12px",
              border:
                "2px solid #E8DDF7",
              fontSize: "16px",
            }}
          />

          <label
            style={{
              display: "block",
              color: "#4B2E83",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Categoría
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "20px",
              borderRadius: "12px",
              border:
                "2px solid #E8DDF7",
              fontSize: "16px",
              backgroundColor: "#ffffff",
            }}
          >
            {isIncome ? (
              <>
                <option>Salario</option>
                <option>Negocio</option>
                <option>Inversión</option>
                <option>Otros</option>
              </>
            ) : (
              <>
                <option>Alimentación</option>
                <option>Transporte</option>
                <option>Hogar</option>
                <option>Servicios</option>
                <option>Entretenimiento</option>
                <option>Salud</option>
                <option>Compras</option>
                <option>Otros</option>
              </>
            )}
          </select>

          <label
            style={{
              display: "block",
              color: "#4B2E83",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Fecha
          </label>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              marginBottom: "25px",
              borderRadius: "12px",
              border:
                "2px solid #E8DDF7",
              fontSize: "16px",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "#EEE7F8",
                color: "#4B2E83",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: isIncome
                  ? "#9B6DDB"
                  : "#EE7198",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {transactionToEdit
                ? "Guardar cambios"
                : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;