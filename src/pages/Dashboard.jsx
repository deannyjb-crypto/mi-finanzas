import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import TransactionForm from "../components/TransactionForm";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
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

  const [transactionType, setTransactionType] =
    useState("expense");

  const [transactionToEdit, setTransactionToEdit] =
    useState(null);

  const [selectedMonth, setSelectedMonth] =
    useState(getTodayMonth());

  const [transactions, setTransactions] = useState([]);

  const [loadingTransactions, setLoadingTransactions] =
    useState(true);

  // ==============================
  // CARGAR TRANSACCIONES
  // ==============================

  const loadTransactions = async () => {
    if (!user) return;

    setLoadingTransactions(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error(
        "Error cargando transacciones:",
        error
      );
    } else {
      setTransactions(data || []);
    }

    setLoadingTransactions(false);
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  // ==============================
  // FILTRAR POR MES
  // ==============================

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      transaction.date?.startsWith(selectedMonth)
    );
  }, [transactions, selectedMonth]);

  // ==============================
  // TOTALES
  // ==============================

  const totalIngresos = useMemo(() => {
    return monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );
  }, [monthlyTransactions]);

  const totalGastos = useMemo(() => {
    return monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );
  }, [monthlyTransactions]);

  const saldoDisponible =
    totalIngresos - totalGastos;

  // ==============================
  // ABRIR FORMULARIO
  // ==============================

  const handleOpenForm = (type) => {
    setTransactionType(type);
    setTransactionToEdit(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTransactionToEdit(null);
  };

  // ==============================
  // GUARDAR TRANSACCIÓN
  // ==============================

  const handleSaveTransaction = async (
    transactionData
  ) => {
    try {
      // EDITAR
      if (transactionToEdit) {
        const { error } = await supabase
          .from("transactions")
          .update({
            title: transactionData.description,
            amount: transactionData.amount,
            category: transactionData.category,
            type: transactionData.type,
            date: transactionData.date,
          })
          .eq(
            "id",
            transactionToEdit.id
          )
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // CREAR
        const { error } = await supabase
          .from("transactions")
          .insert([
            {
              user_id: user.id,
              title: transactionData.description,
              amount: transactionData.amount,
              category: transactionData.category,
              type: transactionData.type,
              date: transactionData.date,
            },
          ]);

        if (error) throw error;
      }

      await loadTransactions();

      handleCloseForm();
    } catch (error) {
  console.error("Error guardando transacción:", error);

  alert(
    "Error al guardar: " + error.message

      );
    }
  };

  // ==============================
  // EDITAR
  // ==============================

  const handleEditTransaction = (
    transaction
  ) => {
    setTransactionToEdit({
      ...transaction,
      description: transaction.title,
    });

    setTransactionType(transaction.type);

    setShowForm(true);
  };

  // ==============================
  // ELIMINAR
  // ==============================

  const handleDeleteTransaction = async (
    id
  ) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta transacción?"
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await loadTransactions();
    } catch (error) {
      console.error(
        "Error eliminando transacción:",
        error
      );

      alert(
        "No se pudo eliminar la transacción."
      );
    }
  };

  // ==============================
  // MES EN TEXTO
  // ==============================

  const monthLabel = new Date(
    `${selectedMonth}-01T12:00:00`
  ).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard">
      <div className="dashboard-container">

        <header className="header">
          <h1>💰 Mi Finanzas</h1>

          <p>
            Tu resumen financiero personal
          </p>
        </header>

        <section className="month-selector">
          <label htmlFor="month">
            📅 Seleccionar mes
          </label>

          <input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(e.target.value)
            }
          />
        </section>

        <section className="balance-card">
          <p>Saldo disponible</p>

          <h2>
            {formatCurrency(
              saldoDisponible
            )}
          </h2>

          <span>
            Resumen de {monthLabel}
          </span>
        </section>

        <section className="summary-grid">

          <div className="summary-card income-card">

            <div className="summary-icon">
              📈
            </div>

            <div>
              <span>Ingresos</span>

              <h3>
                {formatCurrency(
                  totalIngresos
                )}
              </h3>
            </div>

          </div>

          <div className="summary-card expense-card">

            <div className="summary-icon">
              📉
            </div>

            <div>
              <span>Gastos</span>

              <h3>
                {formatCurrency(
                  totalGastos
                )}
              </h3>
            </div>

          </div>

          <div className="summary-card saving-card">

            <div className="summary-icon">
              💵
            </div>

            <div>
              <span>Ahorro</span>

              <h3>
                {formatCurrency(
                  saldoDisponible
                )}
              </h3>
            </div>

          </div>

        </section>

        <section className="action-buttons">

          <button
            className="income-button"
            onClick={() =>
              handleOpenForm("income")
            }
          >
            <span>＋</span>

            Agregar ingreso
          </button>

          <button
            className="expense-button"
            onClick={() =>
              handleOpenForm("expense")
            }
          >
            <span>−</span>

            Agregar gasto
          </button>

        </section>

        <section className="transactions-section">

          <div className="transactions-header">

            <div>

              <h2>
                Últimos movimientos
              </h2>

              <p>
                {
                  monthlyTransactions.length
                }{" "}
                movimiento
                {monthlyTransactions.length !==
                1
                  ? "s"
                  : ""}{" "}
                en {monthLabel}
              </p>

            </div>

          </div>

          {loadingTransactions ? (
            <div className="empty-state">

              <div>⏳</div>

              <h3>
                Cargando movimientos...
              </h3>

            </div>
          ) : monthlyTransactions.length ===
            0 ? (
            <div className="empty-state">

              <div>📭</div>

              <h3>
                No hay movimientos este mes
              </h3>

              <p>
                Agrega un ingreso o gasto
                para comenzar.
              </p>

            </div>
          ) : (
            <div className="transactions-list">

              {monthlyTransactions.map(
                (transaction) => (

                  <div
                    className="transaction-item"
                    key={transaction.id}
                  >

                    <div className="transaction-icon">
                      {transaction.type ===
                      "income"
                        ? "💰"
                        : "🛒"}
                    </div>

                    <div className="transaction-info">

                      <h3>
                        {transaction.title}
                      </h3>

                      <p>
                        {transaction.category}

                        {" • "}

                        {formatDate(
                          transaction.date
                        )}
                      </p>

                    </div>

                    <div className="transaction-actions">

                      <div
                        className={
                          transaction.type ===
                          "income"
                            ? "transaction-amount income"
                            : "transaction-amount expense"
                        }
                      >

                        {transaction.type ===
                        "income"
                          ? "+"
                          : "-"}

                        {formatCurrency(
                          transaction.amount
                        )}

                      </div>

                      <div className="transaction-buttons">

                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEditTransaction(
                              transaction
                            )
                          }
                          title="Editar"
                        >
                          ✏️
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction.id
                            )
                          }
                          title="Eliminar"
                        >
                          🗑️
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>
          )}

        </section>

      </div>

      {showForm && (
        <TransactionForm
          type={transactionType}
          transactionToEdit={
            transactionToEdit
          }
          onSave={
            handleSaveTransaction
          }
          onClose={
            handleCloseForm
          }
        />
      )}

    </div>
  );
}

export default Dashboard;