import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import TransactionForm from "../components/TransactionForm";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

const formatDate = (date) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const getTodayMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

function Dashboard({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(getTodayMonth());

  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // ================================
  // AHORROS
  // ================================

  const [savings, setSavings] = useState([]);
  const [showSavingForm, setShowSavingForm] = useState(false);

  const [savingName, setSavingName] = useState("");
  const [savingAmount, setSavingAmount] = useState("");
  const [savingTarget, setSavingTarget] = useState("");

  const [savingToEdit, setSavingToEdit] = useState(null);

  // AGREGAR DINERO A UNA META
const addMoneyToSaving = async (savingId, amount) => {
  const saving = savings.find((item) => item.id === savingId);

  if (!saving) return;

  const newAmount =
    Number(saving.amount || 0) + Number(amount);

  const { error } = await supabase
    .from("savings")
    .update({
      amount: newAmount,
    })
    .eq("id", savingId);

  if (error) {
    console.error("Error al agregar dinero:", error);
    alert("No se pudo agregar el dinero");
    return;
  }

  setSavings((prevSavings) =>
    prevSavings.map((item) =>
      item.id === savingId
        ? { ...item, amount: newAmount }
        : item
    )
  );
};

  // ================================
  // CARGAR TRANSACCIONES
  // ================================

  const loadTransactions = async () => {
    if (!user) return;

    setLoadingTransactions(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error cargando transacciones:", error);
    } else {
      setTransactions(data || []);
    }

    setLoadingTransactions(false);
  };

  // ================================
  // CARGAR AHORROS
  // ================================

  const loadSavings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("savings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando ahorros:", error);
    } else {
      setSavings(data || []);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadSavings();
  }, [user]);

  // ================================
  // FILTRAR TRANSACCIONES POR MES
  // ================================

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // ================================
  // CALCULOS
  // ================================

  const totalIngresos = useMemo(() => {
    return monthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [monthlyTransactions]);

  const totalGastos = useMemo(() => {
    return monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );
  }, [monthlyTransactions]);

  const saldoDisponible = useMemo(() => {
  return transactions
    .filter((transaction) => {
      return transaction.date?.slice(0, 7) <= selectedMonth;
    })
    .reduce((total, transaction) => {
      const amount = Number(transaction.amount || 0);

      return transaction.type === "income"
        ? total + amount
        : total - amount;
    }, 0);
}, [transactions, selectedMonth]);

  const porcentajeAhorro =
    totalIngresos > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((saldoDisponible / totalIngresos) * 100)
          )
        )
      : 0;

  const monthLabel = new Date(
    `${selectedMonth}-01T12:00:00`
  ).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  // ================================
  // TRANSACCIONES
  // ================================

  const handleOpenForm = (type) => {
    setTransactionType(type);
    setTransactionToEdit(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTransactionToEdit(null);
  };

  const handleSaveTransaction = async (transactionData) => {
    if (!user) return;

    if (transactionToEdit) {
      const { error } = await supabase
        .from("transactions")
        .update({
          description: transactionData.description,
          amount: transactionData.amount,
          category: transactionData.category,
          date: transactionData.date,
          type: transactionData.type,
        })
        .eq("id", transactionToEdit.id)
        .eq("user_id", user.id);

      if (error) {
        alert("Error al actualizar: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            description: transactionData.description,
            amount: transactionData.amount,
            category: transactionData.category,
            date: transactionData.date,
            type: transactionData.type,
          },
        ]);

      if (error) {
        alert("Error al guardar: " + error.message);
        return;
      }
    }

    await loadTransactions();
    handleCloseForm();
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setTransactionType(transaction.type);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta transacción?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert("Error al eliminar: " + error.message);
      return;
    }

    await loadTransactions();
  };

  // ================================
  // AHORROS - ABRIR FORMULARIO
  // ================================

  const handleOpenSavingForm = () => {
    setSavingToEdit(null);
    setSavingName("");
    setSavingAmount("");
    setSavingTarget("");
    setShowSavingForm(true);
  };

  const handleEditSaving = (saving) => {
    setSavingToEdit(saving);
    setSavingName(saving.name || "");
    setSavingAmount(saving.amount || "");
    setSavingTarget(saving.target_amount || "");
    setShowSavingForm(true);
  };

  const handleCloseSavingForm = () => {
    setShowSavingForm(false);
    setSavingToEdit(null);
  };

  // ================================
  // GUARDAR AHORRO
  // ================================

  const handleSaveSaving = async (e) => {
    e.preventDefault();

    if (!savingName || savingAmount === "" || savingTarget === "") {
      alert("Completa todos los campos.");
      return;
    }

    if (savingToEdit) {
      const { error } = await supabase
        .from("savings")
        .update({
          name: savingName,
          amount: Number(savingAmount),
          target_amount: Number(savingTarget),
        })
        .eq("id", savingToEdit.id)
        .eq("user_id", user.id);

      if (error) {
        alert("Error al actualizar el ahorro: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("savings")
        .insert([
          {
            user_id: user.id,
            name: savingName,
            amount: Number(savingAmount),
            target_amount: Number(savingTarget),
            month: selectedMonth,
          },
        ]);

      if (error) {
        alert("Error al guardar el ahorro: " + error.message);
        return;
      }
    }

    await loadSavings();
    handleCloseSavingForm();
  };

  // ================================
  // ELIMINAR AHORRO
  // ================================

  const handleDeleteSaving = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta meta de ahorro?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("savings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      alert("Error al eliminar el ahorro: " + error.message);
      return;
    }

    await loadSavings();
  };

  if (loadingTransactions) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <p>Cargando tus finanzas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">

        <header className="header">
          <h1>💰 Mi Finanzas</h1>
          <p>Tu resumen financiero personal</p>
        </header>

        <section className="month-selector">
          <label htmlFor="month">📅 Seleccionar mes</label>

          <input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </section>

        <section className="balance-card">
          <p>Saldo disponible</p>

          <h2>{formatCurrency(saldoDisponible)}</h2>

          <span>
            Resumen de {monthLabel}
          </span>
        </section>

        <section className="summary-grid">

          <div className="summary-card income-card">
            <div className="summary-icon">📈</div>

            <div>
              <span>Ingresos</span>
              <h3>{formatCurrency(totalIngresos)}</h3>
            </div>
          </div>

          <div className="summary-card expense-card">
            <div className="summary-icon">📉</div>

            <div>
              <span>Gastos</span>
              <h3>{formatCurrency(totalGastos)}</h3>
            </div>
          </div>

  
        </section>

        <section className="saving-progress-card">

          <div className="saving-progress-header">

            <div>
              <h2>🎯 Tu capacidad de ahorro</h2>

              <p>
                Actualmente puedes ahorrar{" "}
                <strong>{porcentajeAhorro}%</strong>{" "}
                de tus ingresos.
              </p>
            </div>

            <div className="saving-percent-big">
              {porcentajeAhorro}%
            </div>

          </div>

          <div className="saving-progress-bar">
            <div
              className="saving-progress-fill"
              style={{
                width: `${porcentajeAhorro}%`,
              }}
            />
          </div>

          <div className="saving-progress-labels">
            <span>0%</span>
            <span>Meta ideal: 20%</span>
            <span>100%</span>
          </div>

        </section>

        {/* ================================
            METAS DE AHORRO
        ================================= */}

        <section className="savings-section">

          <div className="savings-header">

            <div>
              <h2>🎯 Mis metas de ahorro</h2>
              <p>
                Define tus objetivos y lleva el control de tu progreso.
              </p>
            </div>

            <button
              className="income-button"
              onClick={handleOpenSavingForm}
            >
              ＋ Nueva meta
            </button>

          </div>

          {savings.length === 0 ? (
            <div className="empty-state">
              <div>🎯</div>
              <h3>Aún no tienes metas de ahorro</h3>
              <p>
                Crea una meta para comenzar a ahorrar.
              </p>
            </div>
          ) : (
            <div className="savings-list">

              {savings.map((saving) => {

                const progress =
                  Number(saving.target_amount) > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (Number(saving.amount) /
                            Number(saving.target_amount)) *
                            100
                        )
                      )
                    : 0;

                return (
                  <div
                    className="saving-item"
                    key={saving.id}
                  >

                    <div className="saving-item-header">

                      <div>
                        <h3>{saving.name}</h3>

                        <p>
                          {formatCurrency(saving.amount)} ahorrados de{" "}
                          {formatCurrency(saving.target_amount)}
                        </p>
                      </div>

                      <div className="saving-item-actions">
                        
                        <button
    className="add-money-button"
    onClick={() => {
      const amount = prompt("¿Cuánto dinero quieres agregar?");
      
      if (amount && Number(amount) > 0) {
        addMoneyToSaving(saving.id, amount);
      }
    }}
  >
    💰
  </button>

                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEditSaving(saving)
                          }
                        >
                          ✏️
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDeleteSaving(saving.id)
                          }
                        >
                          🗑️
                        </button>

                      </div>

                    </div>

                    <div className="saving-progress-bar">
                      <div
                        className="saving-progress-fill"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="saving-item-footer">

                      <span>{progress}% completado</span>

                      <strong>
                        Faltan{" "}
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(saving.target_amount) -
                              Number(saving.amount)
                          )
                        )}
                      </strong>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        <section className="action-buttons">

          <button
            className="income-button"
            onClick={() => handleOpenForm("income")}
          >
            <span>＋</span>
            Agregar ingreso
          </button>

          <button
            className="expense-button"
            onClick={() => handleOpenForm("expense")}
          >
            <span>−</span>
            Agregar gasto
          </button>

        </section>

        <section className="transactions-section">

          <div className="transactions-header">

            <div>
              <h2>Últimos movimientos</h2>

              <p>
                {monthlyTransactions.length} movimiento
                {monthlyTransactions.length !== 1 ? "s" : ""}{" "}
                en {monthLabel}
              </p>
            </div>

          </div>

          {monthlyTransactions.length === 0 ? (
            <div className="empty-state">
              <div>📭</div>

              <h3>No hay movimientos este mes</h3>

              <p>
                Agrega un ingreso o gasto para comenzar.
              </p>
            </div>
          ) : (
            <div className="transactions-list">

              {monthlyTransactions.map((transaction) => (

                <div
                  className="transaction-item"
                  key={transaction.id}
                >

                  <div className="transaction-icon">
                    {transaction.type === "income"
                      ? "💰"
                      : "🛒"}
                  </div>

                  <div className="transaction-info">

                    <h3>
                    {transaction.description}
                    </h3>

                    <p>
                      {transaction.category} • {formatDate(transaction.date)}
                    </p>

                  </div>

                  <div className="transaction-actions">

                    <div
                      className={
                        transaction.type === "income"
                          ? "transaction-amount income"
                          : "transaction-amount expense"
                      }
                    >
                      {transaction.type === "income"
                        ? "+"
                        : "-"}

                      {formatCurrency(transaction.amount)}
                    </div>

                    <div className="transaction-buttons">

                      <button
                        className="edit-button"
                        onClick={() =>
                          handleEditTransaction(transaction)
                        }
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          handleDeleteTransaction(transaction.id)
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </div>

      {/* FORMULARIO TRANSACCIONES */}

      {showForm && (
        <TransactionForm
          type={transactionType}
          transactionToEdit={transactionToEdit}
          onSave={handleSaveTransaction}
          onClose={handleCloseForm}
        />
      )}

      {/* FORMULARIO META DE AHORRO */}

      {showSavingForm && (

        <div className="saving-modal-overlay">

          <div className="saving-modal">

            <h2>
              {savingToEdit
                ? "✏️ Editar meta"
                : "🎯 Nueva meta de ahorro"}
            </h2>

            <form onSubmit={handleSaveSaving}>

              <label>Nombre de la meta</label>

              <input
                type="text"
                placeholder="Ej: Viaje a Brasil"
                value={savingName}
                onChange={(e) =>
                  setSavingName(e.target.value)
                }
              />

              <label>¿Cuánto llevas ahorrado?</label>

              <input
                type="number"
                placeholder="Ej: 250000"
                min="0"
                value={savingAmount}
                onChange={(e) =>
                  setSavingAmount(e.target.value)
                }
              />

              <label>Meta total</label>

              <input
                type="number"
                placeholder="Ej: 1000000"
                min="1"
                value={savingTarget}
                onChange={(e) =>
                  setSavingTarget(e.target.value)
                }
              />

              <div className="saving-modal-buttons">

                <button
                  type="button"
                  className="expense-button"
                  onClick={handleCloseSavingForm}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="income-button"
                >
                  Guardar meta
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;