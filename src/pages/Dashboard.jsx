import { useEffect, useMemo, useState } from "react";
import TransactionForm from "../components/TransactionForm";

const initialTransactions = [
  {
    id: "1",
    description: "Supermercado",
    amount: 45000,
    category: "Alimentación",
    date: "2026-08-24",
    type: "expense",
  },
  {
    id: "2",
    description: "Combustible",
    amount: 50000,
    category: "Transporte",
    date: "2026-08-23",
    type: "expense",
  },
  {
    id: "3",
    description: "Sueldo",
    amount: 2300000,
    category: "Trabajo",
    date: "2026-08-20",
    type: "income",
  },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
};

const getTodayMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

function Dashboard() {
  const [showForm, setShowForm] = useState(false);

  const [transactionType, setTransactionType] = useState("expense");

  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(getTodayMonth());

  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem("mi-finanzas-transactions");

    if (savedTransactions) {
      try {
        return JSON.parse(savedTransactions);
      } catch {
        return initialTransactions;
      }
    }

    return initialTransactions;
  });

  useEffect(() => {
    localStorage.setItem(
      "mi-finanzas-transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const monthlyTransactions = useMemo(() => {
    return transactions
      .filter((transaction) =>
        transaction.date.startsWith(selectedMonth)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, selectedMonth]);

  const totalIngresos = useMemo(() => {
    return monthlyTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );
  }, [monthlyTransactions]);

  const totalGastos = useMemo(() => {
    return monthlyTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + Number(transaction.amount),
        0
      );
  }, [monthlyTransactions]);

  const saldoDisponible = totalIngresos - totalGastos;

  const handleOpenForm = (type) => {
    setTransactionType(type);
    setTransactionToEdit(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setTransactionToEdit(null);
  };

  const handleSaveTransaction = (transactionData) => {
    if (transactionToEdit) {
      setTransactions((prevTransactions) =>
        prevTransactions.map((transaction) =>
          transaction.id === transactionToEdit.id
            ? {
                ...transactionData,
                id: transactionToEdit.id,
              }
            : transaction
        )
      );
    } else {
      const newTransaction = {
        ...transactionData,
        id: crypto.randomUUID(),
      };

      setTransactions((prevTransactions) => [
        ...prevTransactions,
        newTransaction,
      ]);
    }

    handleCloseForm();
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setTransactionType(transaction.type);
    setShowForm(true);
  };

  const handleDeleteTransaction = (id) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar esta transacción?"
    );

    if (!confirmar) return;

    setTransactions((prevTransactions) =>
      prevTransactions.filter(
        (transaction) => transaction.id !== id
      )
    );
  };

  const handleResetData = () => {
    const confirmar = window.confirm(
      "Esto eliminará todas tus transacciones guardadas y restaurará los datos iniciales. ¿Deseas continuar?"
    );

    if (!confirmar) return;

    setTransactions(initialTransactions);
  };

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
          <p>Tu resumen financiero personal</p>
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
            {formatCurrency(saldoDisponible)}
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
                {formatCurrency(totalIngresos)}
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
                {formatCurrency(totalGastos)}
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
                {formatCurrency(saldoDisponible)}
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
              <h2>Últimos movimientos</h2>

              <p>
                {monthlyTransactions.length} movimiento
                {monthlyTransactions.length !== 1
                  ? "s"
                  : ""}{" "}
                en {monthLabel}
              </p>
            </div>

            <button
              className="reset-button"
              onClick={handleResetData}
            >
              Restaurar ejemplo
            </button>
          </div>

          {monthlyTransactions.length === 0 ? (
            <div className="empty-state">
              <div>📭</div>

              <h3>
                No hay movimientos este mes
              </h3>

              <p>
                Agrega un ingreso o gasto para comenzar.
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
                      {transaction.type === "income"
                        ? "💰"
                        : "🛒"}
                    </div>

                    <div className="transaction-info">

                      <h3>
                        {transaction.description}
                      </h3>

                      <p>
                        {transaction.category}
                        {" • "}
                        {formatDate(transaction.date)}
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
          transactionToEdit={transactionToEdit}
          onSave={handleSaveTransaction}
          onClose={handleCloseForm}
        />
      )}

    </div>
  );
}

export default Dashboard;