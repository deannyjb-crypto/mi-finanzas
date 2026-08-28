import { useState } from "react";
import TransactionForm from "../components/TransactionForm";

const formatDate = (date) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
};
function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
const [transactionToEdit, setTransactionToEdit] = useState(null);
const [selectedMonth, setSelectedMonth] = useState("2026-08");

  const [transactions, setTransactions] = useState([
  {
    description: "Supermercado",
    amount: 45000,
    category: "Alimentación",
    date: "2026-08-24",
    type: "expense",
  },
  {
    description: "Combustible",
    amount: 50000,
    category: "Transporte",
    date: "2026-08-23",
    type: "expense",
  },
  {
    description: "Sueldo",
    amount: 2300000,
    category: "Trabajo",
    date: "2026-08-20",
    type: "income",
  },
]);
const monthlyTransactions = transactions.filter(
    (transaction) => transaction.date.startsWith(selectedMonth)
);

const totalIngresos = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

const totalGastos = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

const saldoDisponible = totalIngresos - totalGastos;
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

    setTransactions((prev) =>
        prev.filter((transaction) => transaction.id !== id)
    );
};
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F8F1FF 0%, #F0E7FF 100%)",
        color: "#38206B",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >

        {/* ENCABEZADO */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              margin: "0",
              fontWeight: "700",
              color: "#48268A",
            }}
          >
            💰 Mi Finanzas
          </h1>

          <p
            style={{
              fontSize: "22px",
              color: "#7662A6",
              marginTop: "12px",
            }}
          >
            Tu resumen financiero
          </p>
        </div>


        {/* SALDO */}

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: "28px",
            padding: "45px 30px",
            textAlign: "center",
            boxShadow: "0 15px 40px rgba(103, 70, 160, 0.12)",
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              fontSize: "22px",
              color: "#806BAF",
              margin: "0 0 15px",
            }}
          >
            Saldo disponible
          </p>

          <h2
            style={{
              fontSize: "58px",
              margin: "0",
              color: "#4B2692",
              fontWeight: "700",
            }}
          >
          ${saldoDisponible.toLocaleString("es-CL")}
          </h2>
        </div>


        {/* RESUMEN */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "22px",
            marginBottom: "25px",
          }}
        >

          {/* INGRESOS */}

          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "22px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(103, 70, 160, 0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#F0E6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                📈
              </div>

              <span
                style={{
                  fontSize: "20px",
                  color: "#70589F",
                }}
              >
                Ingresos
              </span>
            </div>

            <h2
              style={{
                fontSize: "30px",
                margin: "20px 0 0",
                color: "#7950C8",
              }}
            >
             ${(totalIngresos - totalGastos).toLocaleString("es-CL")}
            </h2>
          </div>


          {/* GASTOS */}

          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "22px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(103, 70, 160, 0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#FFEAF0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                📉
              </div>

              <span
                style={{
                  fontSize: "20px",
                  color: "#70589F",
                }}
              >
                Gastos
              </span>
            </div>

            <h2
              style={{
                fontSize: "30px",
                margin: "20px 0 0",
                color: "#F06C91",
              }}
            >
              ${totalGastos.toLocaleString("es-CL")}
            </h2>
          </div>


          {/* AHORRO */}

          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "22px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(103, 70, 160, 0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#E3F8EF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                💵
              </div>

              <span
                style={{
                  fontSize: "20px",
                  color: "#70589F",
                }}
              >
                Ahorro
              </span>
            </div>

            <h2
              style={{
                fontSize: "30px",
                margin: "20px 0 0",
                color: "#32B982",
              }}
            >
          ${saldoDisponible.toLocaleString("es-CL")}
            </h2>
          </div>

        </div>


        {/* BOTONES */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "22px",
            marginBottom: "25px",
          }}
        >

          <button
            onClick={() => {
    setTransactionType("income");
    setShowForm(true);
    }}
            style={{
              border: "none",
              borderRadius: "20px",
              padding: "22px",
              background: "linear-gradient(135deg, #B88BEF, #9E6DE0)",
              color: "white",
              fontSize: "21px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(158, 109, 224, 0.25)",
            }}
          >
            ＋ Agregar ingreso
          </button>


          <button
  onClick={() => {
    setTransactionType("expense");
    setShowForm(true);
  }}
  style={{
              border: "none",
              borderRadius: "20px",
              padding: "22px",
              background: "linear-gradient(135deg, #F78EAD, #F26F98)",
              color: "white",
              fontSize: "21px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(242, 111, 152, 0.20)",
            }}
          >
            − Agregar gasto
          </button>

        </div>


        {showForm && (
  <TransactionForm
    type={transactionType}
    transactionToEdit={transactionToEdit}
    onClose={() => {
        setShowForm(false);
        setTransactionToEdit(null);
    }}
    onSave={(transaction) => {
    setTransactions((prev) => {
        if (transactionToEdit) {
            return prev.map((item) =>
                item.id === transactionToEdit.id
                    ? transaction
                    : item
            );
        }

        return [transaction, ...prev];
    });

    setTransactionToEdit(null);
    setShowForm(false);
}}
/>
)}

        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            padding: "30px",
            boxShadow: "0 10px 30px rgba(103, 70, 160, 0.10)",
          }}
        >

          <h2
            style={{
              textAlign: "center",
              marginTop: "0",
              marginBottom: "25px",
              color: "#48268A",
              fontSize: "28px",
            }}
          >
            SUPERMERCADO
            <div
    style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        marginBottom: "10px",
    }}
>
    <label
        style={{
            color: "#7950C8",
            fontWeight: "600",
            fontSize: "18px",
        }}
>
        Mes:
    </label>

    <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        style={{
            padding: "10px 14px",
            borderRadius: "12px",
            border: "2px solid #DCC8F5",
            color: "#7950C8",
            fontSize: "16px",
            backgroundColor: "#FFFFFF",
        }}
    />
</div>
          </h2>


{monthlyTransactions.map((transaction, index) => (
  <div
    key={index}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom:
    index < monthlyTransactions.length - 1
          ? "1px solid #EEE7F7"
          : "none",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          backgroundColor:
            transaction.type === "income"
              ? "#E3F8EF"
              : "#FFEAF0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
        }}
      >
        {transaction.type === "income" ? "💼" : "🛒"}
      </div>

      <div>
        <div
          style={{
            fontSize: "19px",
            color: "#38206B",
            fontWeight: "600",
          }}
        >
          {transaction.description}
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#8B78B5",
            marginTop: "4px",
          }}
        >
          {transaction.category} · {formatDate(transaction.date)}
        </div>
      </div>
    </div>

    <strong
      style={{
        color:
          transaction.type === "income"
            ? "#32B982"
            : "#F06C91",
        fontSize: "19px",
      }}
    >
      {transaction.type === "income" ? "+" : "-"}$
      {transaction.amount.toLocaleString("es-CL")}
    </strong>

    <button
    onClick={() => handleEditTransaction(transaction)}
    style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "20px",
        marginLeft: "15px"
    }}
>
    ✏️
</button>
<button
    onClick={() => handleDeleteTransaction(transaction.id)}
    style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: "20px",
        marginLeft: "8px"
    }}
>
    🗑️
</button>
  </div>
  ))}
</div>
</div>
</div>
);
}

export default Dashboard;