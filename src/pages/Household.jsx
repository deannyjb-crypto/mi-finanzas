import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

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

function Household({ user }) {
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  // CREAR HOGAR
  const [householdName, setHouseholdName] = useState("");

  // FORMULARIO GASTO
  const [showTransactionForm, setShowTransactionForm] =
    useState(false);

  const [transactionToEdit, setTransactionToEdit] =
    useState(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Hogar");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // AGREGAR MIEMBRO
  const [showMemberForm, setShowMemberForm] =
    useState(false);

  const [memberId, setMemberId] = useState("");

  // ================================
  // CARGAR HOGAR
  // ================================

  const loadHousehold = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Buscar el hogar del usuario
      const {
        data: memberData,
        error: memberError,
      } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (memberError) throw memberError;

      // Si todavía no tiene hogar
      if (!memberData) {
        setHousehold(null);
        setMembers([]);
        setTransactions([]);
        return;
      }

      const householdId = memberData.household_id;

      // Cargar hogar
      const {
        data: householdData,
        error: householdError,
      } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId)
        .single();

      if (householdError) throw householdError;

      setHousehold(householdData);

      // Cargar miembros
      const {
        data: membersData,
        error: membersError,
      } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", householdId);

      if (membersError) throw membersError;

      setMembers(membersData || []);

      // Cargar gastos
      const {
        data: transactionsData,
        error: transactionsError,
      } = await supabase
        .from("household_transactions")
        .select("*")
        .eq("household_id", householdId)
        .order("date", { ascending: false });

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error(
        "Error cargando hogar:",
        error
      );

      alert(
        "Error cargando el hogar: " +
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHousehold();
  }, [user]);

  // ================================
  // CREAR HOGAR
  // ================================

  const handleCreateHousehold = async (e) => {
    e.preventDefault();

    if (!householdName.trim()) {
      alert("Escribe un nombre para tu hogar.");
      return;
    }

    try {
      // Crear hogar
      const {
        data,
        error,
      } = await supabase
        .from("households")
        .insert([
          {
            name: householdName.trim(),
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Agregar creador como miembro
      const {
        error: memberError,
      } = await supabase
        .from("household_members")
        .insert([
          {
            household_id: data.id,
            user_id: user.id,
          },
        ]);

      if (memberError) throw memberError;

      setHouseholdName("");

      await loadHousehold();
    } catch (error) {
      console.error(error);

      alert(
        "Error al crear el hogar: " +
          error.message
      );
    }
  };

  // ================================
  // AGREGAR MIEMBRO
  // ================================

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!memberId.trim()) {
      alert(
        "Ingresa el ID del usuario que deseas agregar."
      );
      return;
    }

    if (!household) {
      alert("Primero debes crear un hogar.");
      return;
    }

    try {
      // Revisar si ya existe
      const {
        data: existingMember,
        error: checkError,
      } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", household.id)
        .eq("user_id", memberId.trim())
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingMember) {
        alert(
          "Este usuario ya pertenece al hogar."
        );
        return;
      }

      // Agregar miembro
      const { error } = await supabase
        .from("household_members")
        .insert([
          {
            household_id: household.id,
            user_id: memberId.trim(),
          },
        ]);

      if (error) throw error;

      alert("🎉 Miembro agregado correctamente.");

      setMemberId("");
      setShowMemberForm(false);

      await loadHousehold();
    } catch (error) {
      console.error(
        "Error agregando miembro:",
        error
      );

      alert(
        "Error al agregar miembro: " +
          error.message
      );
    }
  };

  // ================================
  // ABRIR NUEVO GASTO
  // ================================

  const openNewTransaction = () => {
    setTransactionToEdit(null);

    setDescription("");
    setAmount("");
    setCategory("Hogar");

    setDate(
      new Date().toISOString().split("T")[0]
    );

    setShowTransactionForm(true);
  };

  // ================================
  // EDITAR GASTO
  // ================================

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);

    setDescription(
      transaction.description || ""
    );

    setAmount(transaction.amount || "");

    setCategory(
      transaction.category || "Hogar"
    );

    setDate(
      transaction.date ||
        new Date().toISOString().split("T")[0]
    );

    setShowTransactionForm(true);
  };

  // ================================
  // GUARDAR GASTO
  // ================================

  const handleSaveTransaction = async (e) => {
    e.preventDefault();

    if (!description.trim() || !amount) {
      alert("Completa la descripción y el monto.");
      return;
    }

    try {
      const transactionData = {
        household_id: household.id,
        paid_by: transactionToEdit
          ? transactionToEdit.paid_by
          : user.id,
        description: description.trim(),
        amount: Number(amount),
        category,
        date,
      };

      if (transactionToEdit) {
        // EDITAR
        const { error } = await supabase
          .from("household_transactions")
          .update({
            description:
              transactionData.description,
            amount:
              transactionData.amount,
            category:
              transactionData.category,
            date:
              transactionData.date,
          })
          .eq(
            "id",
            transactionToEdit.id
          )
          .eq(
            "household_id",
            household.id
          );

        if (error) throw error;
      } else {
        // CREAR
        const { error } = await supabase
          .from("household_transactions")
          .insert([transactionData]);

        if (error) throw error;
      }

      setDescription("");
      setAmount("");
      setCategory("Hogar");

      setDate(
        new Date().toISOString().split("T")[0]
      );

      setTransactionToEdit(null);

      setShowTransactionForm(false);

      await loadHousehold();
    } catch (error) {
      console.error(error);

      alert(
        "Error al guardar el gasto: " +
          error.message
      );
    }
  };

  // ================================
  // ELIMINAR GASTO
  // ================================

  const handleDeleteTransaction = async (id) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este gasto?"
    );

    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from("household_transactions")
        .delete()
        .eq("id", id)
        .eq("household_id", household.id);

      if (error) throw error;

      await loadHousehold();
    } catch (error) {
      console.error(error);

      alert(
        "Error al eliminar: " +
          error.message
      );
    }
  };

  // ================================
  // CÁLCULOS
  // ================================

  const totalGastos = useMemo(() => {
    return transactions.reduce(
      (total, transaction) =>
        total +
        Number(transaction.amount || 0),
      0
    );
  }, [transactions]);

  const myTotalPaid = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.paid_by === user.id
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions, user]);

  const memberCount = members.length;

  const myShare =
    memberCount > 0
      ? totalGastos / memberCount
      : 0;

  const balance =
    myTotalPaid - myShare;

  // ================================
  // CARGANDO
  // ================================

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <p>
            Cargando finanzas del hogar...
          </p>
        </div>
      </div>
    );
  }

  // ================================
  // SIN HOGAR
  // ================================

  if (!household) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">

          <header className="header">
            <h1>
              🏠 Finanzas del Hogar
            </h1>

            <p>
              Comparte los gastos y lleva el
              control de las finanzas del hogar.
            </p>
          </header>

          <section className="savings-section">

            <div className="empty-state">

              <div>🏠</div>

              <h3>
                Aún no tienes un hogar
              </h3>

              <p>
                Crea tu hogar para comenzar a
                registrar gastos compartidos.
              </p>

              <form
                onSubmit={
                  handleCreateHousehold
                }
                style={{
                  marginTop: "25px",
                  width: "100%",
                  maxWidth: "450px",
                }}
              >
                <input
                  type="text"
                  placeholder="Ej: Hogar Deanny y familia"
                  value={householdName}
                  onChange={(e) =>
                    setHouseholdName(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    borderRadius: "12px",
                    border:
                      "2px solid #E8DDF7",
                    fontSize: "16px",
                    marginBottom: "15px",
                  }}
                />

                <button
                  type="submit"
                  className="income-button"
                >
                  🏠 Crear mi hogar
                </button>
              </form>

            </div>

          </section>

        </div>
      </div>
    );
  }

  // ================================
  // DASHBOARD DEL HOGAR
  // ================================

  return (
    <div className="dashboard">

      <div className="dashboard-container">

        <header className="header">

          <h1>
            🏠 {household.name}
          </h1>

          <p>
            Finanzas compartidas del hogar
          </p>

        </header>

        {/* RESUMEN */}

        <section className="summary-grid">

          <div className="summary-card expense-card">

            <div className="summary-icon">
              🧾
            </div>

            <div>

              <span>
                Total gastos
              </span>

              <h3>
                {formatCurrency(
                  totalGastos
                )}
              </h3>

            </div>

          </div>

          <div className="summary-card income-card">

            <div className="summary-icon">
              👥
            </div>

            <div>

              <span>
                Miembros
              </span>

              <h3>
                {memberCount}
              </h3>

            </div>

          </div>

        </section>

        {/* MIEMBROS */}

        <section className="savings-section">

          <div className="savings-header">

            <div>

              <h2>
                👥 Miembros del hogar
              </h2>

              <p>
                Personas que comparten estos
                gastos.
              </p>

            </div>

            <button
              className="income-button"
              onClick={() =>
                setShowMemberForm(true)
              }
            >
              ＋ Agregar miembro
            </button>

          </div>

          <div className="transactions-list">

            {members.map((member, index) => (

              <div
                className="transaction-item"
                key={member.id}
              >

                <div className="transaction-icon">
                  👤
                </div>

                <div className="transaction-info">

                  <h3>
                    {member.user_id === user.id
                      ? "Tú"
                      : `Miembro ${
                          index + 1
                        }`}
                  </h3>

                  <p>
                    Miembro del hogar
                  </p>

                </div>

              </div>

            ))}

          </div>

        </section>

        {/* MI APORTE */}

        <section className="balance-card">

          <p>
            Mi aporte al hogar
          </p>

          <h2>
            {formatCurrency(
              myTotalPaid
            )}
          </h2>

          <span>
            De un total de{" "}
            {formatCurrency(
              totalGastos
            )}
          </span>

        </section>

        {/* BALANCE */}

        <section className="saving-progress-card">

          <div className="saving-progress-header">

            <div>

              <h2>
                ⚖️ Balance compartido
              </h2>

              {memberCount <= 1 ? (

                <p>
                  Agrega otro miembro para
                  calcular automáticamente cuánto
                  corresponde pagar a cada uno.
                </p>

              ) : balance > 0 ? (

                <p>
                  Has pagado{" "}

                  <strong>
                    {formatCurrency(
                      balance
                    )}
                  </strong>{" "}

                  más de lo que te corresponde.
                </p>

              ) : balance < 0 ? (

                <p>
                  Te falta aportar{" "}

                  <strong>
                    {formatCurrency(
                      Math.abs(balance)
                    )}
                  </strong>{" "}

                  para igualar los gastos.
                </p>

              ) : (

                <p>
                  🎉 Los gastos están
                  perfectamente equilibrados.
                </p>

              )}

            </div>

          </div>

        </section>

        {/* AGREGAR GASTO */}

        <section className="action-buttons">

          <button
            className="expense-button"
            onClick={openNewTransaction}
          >

            <span>＋</span>

            Agregar gasto del hogar

          </button>

        </section>

        {/* LISTA GASTOS */}

        <section className="transactions-section">

          <div className="transactions-header">

            <div>

              <h2>
                Gastos del hogar
              </h2>

              <p>
                {transactions.length} gasto
                {transactions.length !== 1
                  ? "s"
                  : ""}
              </p>

            </div>

          </div>

          {transactions.length === 0 ? (

            <div className="empty-state">

              <div>📭</div>

              <h3>
                Aún no hay gastos compartidos
              </h3>

              <p>
                Agrega el primer gasto del hogar.
              </p>

            </div>

          ) : (

            <div className="transactions-list">

              {transactions.map(
                (transaction) => (

                  <div
                    className="transaction-item"
                    key={transaction.id}
                  >

                    <div className="transaction-icon">
                      🏠
                    </div>

                    <div className="transaction-info">

                      <h3>
                        {transaction.description}
                      </h3>

                      <p>
                        {transaction.category} •{" "}
                        {formatDate(
                          transaction.date
                        )}
                      </p>

                    </div>

                    <div className="transaction-actions">

                      <div className="transaction-amount expense">

                        −
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

      {/* ============================= */}
      {/* MODAL AGREGAR MIEMBRO */}
      {/* ============================= */}

      {showMemberForm && (

        <div className="saving-modal-overlay">

          <div className="saving-modal">

            <h2>
              👥 Agregar miembro
            </h2>

            <p
              style={{
                marginBottom: "20px",
                color: "#666",
              }}
            >
              Ingresa el ID del usuario que deseas
              agregar a tu hogar.
            </p>

            <form
              onSubmit={handleAddMember}
            >

              <label>
                ID del usuario
              </label>

              <input
                type="text"
                placeholder="Pega aquí el ID del usuario"
                value={memberId}
                onChange={(e) =>
                  setMemberId(
                    e.target.value
                  )
                }
              />

              <div className="saving-modal-buttons">

                <button
                  type="button"
                  className="expense-button"
                  onClick={() => {
                    setShowMemberForm(false);
                    setMemberId("");
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="income-button"
                >
                  Agregar miembro
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ============================= */}
      {/* MODAL GASTO */}
      {/* ============================= */}

      {showTransactionForm && (

        <div className="saving-modal-overlay">

          <div className="saving-modal">

            <h2>
              {transactionToEdit
                ? "✏️ Editar gasto"
                : "🏠 Agregar gasto del hogar"}
            </h2>

            <form
              onSubmit={
                handleSaveTransaction
              }
            >

              <label>
                Descripción
              </label>

              <input
                type="text"
                placeholder="Ej: Supermercado"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
              />

              <label>
                Monto
              </label>

              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 45.000"
                value={
                  amount
                    ? Number(
                        amount
                      ).toLocaleString(
                        "es-CL"
                      )
                    : ""
                }
                onChange={(e) => {
                  const value =
                    e.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setAmount(value);
                }}
              />

              <label>
                Categoría
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >

                <option>
                  Alimentación
                </option>

                <option>
                  Vivienda
                </option>

                <option>
                  Servicios
                </option>

                <option>
                  Transporte
                </option>

                <option>
                  Mascotas
                </option>

                <option>
                  Entretenimiento
                </option>

                <option>
                  Compras
                </option>

                <option>
                  Otros
                </option>

              </select>

              <label>
                Fecha
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value
                  )
                }
              />

              <div className="saving-modal-buttons">

                <button
                  type="button"
                  className="expense-button"
                  onClick={() => {
                    setShowTransactionForm(false);
                    setTransactionToEdit(null);
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="income-button"
                >
                  {transactionToEdit
                    ? "Guardar cambios"
                    : "Guardar gasto"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Household;