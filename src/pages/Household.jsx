import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";

// ========================================
// FORMATEAR MONEDA
// ========================================

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

// ========================================
// FORMATEAR FECHA
// ========================================

const formatDate = (date) => {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
};

// ========================================
// OBTENER NOMBRE DEL USUARIO
// ========================================

const getUserDisplayName = (user) => {
  if (!user) return "Usuario";

  const metadata = user.user_metadata || {};

  const possibleName =
    metadata.name ||
    metadata.full_name ||
    metadata.fullName ||
    metadata.display_name ||
    metadata.preferred_username;

  if (possibleName) {
    return possibleName;
  }

  if (user.email) {
    const emailName = user.email.split("@")[0];

    if (emailName) {
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
  }

  return "Usuario";
};

// ========================================
// COMPONENTE
// ========================================

function Household({ user }) {
  // ======================================
  // ESTADOS
  // ======================================

  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Crear hogar
  const [householdName, setHouseholdName] = useState("");

  // Modal gasto
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

  // Modal miembro
  const [showMemberForm, setShowMemberForm] =
    useState(false);

  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");

  // ======================================
  // NOMBRE DEL USUARIO ACTUAL
  // ======================================

  const currentMember = useMemo(() => {
  return members.find(
    (member) => member.user_id === user?.id
  );
}, [members, user?.id]);

const currentUserName =
  currentMember?.name ||
  getUserDisplayName(user);

  // ======================================
  // CARGAR HOGAR
  // ======================================

  const loadHousehold = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // ----------------------------------
      // BUSCAR EL HOGAR DEL USUARIO
      // ----------------------------------

      const {
        data: memberships,
        error: membershipsError,
      } = await supabase
        .from("household_members")
        .select("household_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (membershipsError) {
        throw membershipsError;
      }

      // ----------------------------------
      // SI NO TIENE HOGAR
      // ----------------------------------

      if (!memberships || memberships.length === 0) {
        setHousehold(null);
        setMembers([]);
        setTransactions([]);
        return;
      }

      // ----------------------------------
      // USAR EL PRIMER HOGAR
      // ----------------------------------

      const householdId =
        memberships[0].household_id;

      if (!householdId) {
        throw new Error(
          "El registro del hogar no tiene household_id."
        );
      }

      // ----------------------------------
      // CARGAR HOGAR
      // ----------------------------------

      const {
        data: householdData,
        error: householdError,
      } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId)
        .single();

      if (householdError) {
        throw householdError;
      }

      setHousehold(householdData);

      // ----------------------------------
      // CARGAR MIEMBROS
      // ----------------------------------

      const {
        data: membersData,
        error: membersError,
      } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", householdId)
        .order("created_at", {
          ascending: true,
        });

      if (membersError) {
        throw membersError;
      }

      setMembers(membersData || []);

      // ----------------------------------
      // CARGAR GASTOS
      // ----------------------------------

      const {
        data: transactionsData,
        error: transactionsError,
      } = await supabase
        .from("household_transactions")
        .select("*")
        .eq("household_id", householdId)
        .order("date", {
          ascending: false,
        });

      if (transactionsError) {
        throw transactionsError;
      }

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error(
        "Error cargando hogar:",
        error
      );

      alert(
        "Error cargando el hogar: " +
          (error?.message || "Error desconocido")
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // CARGAR AL INICIAR
  // ======================================

  useEffect(() => {
    loadHousehold();
  }, [user?.id]);

  // ======================================
  // CREAR HOGAR
  // ======================================

  const handleCreateHousehold = async (e) => {
    e.preventDefault();

    const cleanHouseholdName =
      householdName.trim();

    if (!cleanHouseholdName) {
      alert("Escribe un nombre para tu hogar.");
      return;
    }

    if (!user?.id) {
      alert("No se encontró el usuario actual.");
      return;
    }

    try {
      // ----------------------------------
      // CREAR HOGAR
      // ----------------------------------

      const {
        data: householdData,
        error: householdError,
      } = await supabase
        .from("households")
        .insert([
          {
            name: cleanHouseholdName,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (householdError) {
        throw householdError;
      }

      if (!householdData?.id) {
        throw new Error(
          "No se pudo obtener el ID del hogar creado."
        );
      }

      // ----------------------------------
      // AGREGAR CREADOR COMO MIEMBRO
      // ----------------------------------

      const {
        error: memberError,
      } = await supabase
        .from("household_members")
        .insert([
          {
            household_id: householdData.id,
            user_id: user.id,
            name: currentUserName,
          },
        ]);

      if (memberError) {
        throw memberError;
      }

      setHouseholdName("");

      await loadHousehold();
    } catch (error) {
      console.error(
        "Error creando hogar:",
        error
      );

      alert(
        "Error al crear el hogar: " +
          (error?.message || "Error desconocido")
      );
    }
  };

  // ======================================
  // AGREGAR MIEMBRO
  // ======================================

  const handleAddMember = async (e) => {
    e.preventDefault();

    const cleanMemberId =
      memberId.trim();

    const cleanMemberName =
      memberName.trim();

    if (!cleanMemberId) {
      alert(
        "Ingresa el ID del usuario que deseas agregar."
      );
      return;
    }

    if (!cleanMemberName) {
      alert(
        "Ingresa el nombre del miembro."
      );
      return;
    }

    if (!household?.id) {
      alert(
        "Primero debes crear un hogar."
      );
      return;
    }

    if (cleanMemberId === user.id) {
      alert(
        "Ese usuario eres tú y ya perteneces al hogar."
      );
      return;
    }

    try {
      // ----------------------------------
      // COMPROBAR SI YA EXISTE
      // ----------------------------------

      const {
        data: existingMember,
        error: checkError,
      } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", household.id)
        .eq("user_id", cleanMemberId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingMember) {
        alert(
          "Este usuario ya pertenece al hogar."
        );
        return;
      }

      // ----------------------------------
      // INSERTAR MIEMBRO
      // ----------------------------------

      const {
        error: insertError,
      } = await supabase
        .from("household_members")
        .insert([
          {
            household_id: household.id,
            user_id: cleanMemberId,
            name: cleanMemberName,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      alert(
        "🎉 Miembro agregado correctamente."
      );

      setMemberId("");
      setMemberName("");
      setShowMemberForm(false);

      await loadHousehold();
    } catch (error) {
      console.error(
        "Error agregando miembro:",
        error
      );

      alert(
        "Error al agregar miembro: " +
          (error?.message || "Error desconocido")
      );
    }
  };

  // ======================================
  // OBTENER NOMBRE DEL MIEMBRO
  // ======================================

  const getMemberName = (userId) => {
    if (!userId) {
      return "Miembro";
    }

    const member = members.find(
      (item) => item.user_id === userId
    );

    // Si existe nombre guardado
    if (member?.name?.trim()) {
      return member.name.trim();
    }

    // Si es el usuario actual
    if (userId === user.id) {
      return currentUserName;
    }

    return "Miembro";
  };

  // ======================================
  // NUEVO GASTO
  // ======================================

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

  // ======================================
  // EDITAR GASTO
  // ======================================

  const handleEditTransaction = (
    transaction
  ) => {
    setTransactionToEdit(transaction);

    setDescription(
      transaction.description || ""
    );

    setAmount(
      transaction.amount?.toString() || ""
    );

    setCategory(
      transaction.category || "Hogar"
    );

    setDate(
      transaction.date ||
        new Date().toISOString().split("T")[0]
    );

    setShowTransactionForm(true);
  };

  // ======================================
  // GUARDAR GASTO
  // ======================================

  const handleSaveTransaction = async (e) => {
    e.preventDefault();

    if (!household?.id) {
      alert("No se encontró el hogar.");
      return;
    }

    const cleanDescription =
      description.trim();

    const numericAmount =
      Number(
        String(amount).replace(/\D/g, "")
      );

    if (!cleanDescription) {
      alert(
        "Completa la descripción."
      );
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      alert(
        "Ingresa un monto válido."
      );
      return;
    }

    try {
      // ----------------------------------
      // CREAR GASTO NUEVO
      // ----------------------------------

      if (!transactionToEdit) {
        const transactionData = {
          household_id: household.id,
          paid_by: user.id,
          description: cleanDescription,
          amount: numericAmount,
          category,
          date,
        };

        const {
          error,
        } = await supabase
          .from("household_transactions")
          .insert([transactionData]);

        if (error) {
          throw error;
        }
      } else {
        // --------------------------------
        // EDITAR GASTO
        // --------------------------------

        const {
          error,
        } = await supabase
          .from("household_transactions")
          .update({
            description: cleanDescription,
            amount: numericAmount,
            category,
            date,
          })
          .eq(
            "id",
            transactionToEdit.id
          )
          .eq(
            "household_id",
            household.id
          );

        if (error) {
          throw error;
        }
      }

      // ----------------------------------
      // LIMPIAR FORMULARIO
      // ----------------------------------

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
      console.error(
        "Error guardando gasto:",
        error
      );

      alert(
        "Error al guardar el gasto: " +
          (error?.message || "Error desconocido")
      );
    }
  };

  // ======================================
  // ELIMINAR GASTO
  // ======================================

  const handleDeleteTransaction = async (
    id
  ) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este gasto?"
    );

    if (!confirmar) {
      return;
    }

    if (!household?.id) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("household_transactions")
        .delete()
        .eq("id", id)
        .eq(
          "household_id",
          household.id
        );

      if (error) {
        throw error;
      }

      await loadHousehold();
    } catch (error) {
      console.error(
        "Error eliminando gasto:",
        error
      );

      alert(
        "Error al eliminar: " +
          (error?.message || "Error desconocido")
      );
    }
  };

  // ======================================
  // CÁLCULOS
  // ======================================

  const totalGastos = useMemo(() => {
    return transactions.reduce(
      (total, transaction) =>
        total +
        Number(transaction.amount || 0),
      0
    );
  }, [transactions]);

  // --------------------------------------
  // TOTAL PAGADO POR MÍ
  // --------------------------------------

  const myTotalPaid = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.paid_by === user?.id
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [transactions, user?.id]);

  // --------------------------------------
  // CONTAR MIEMBROS
  // --------------------------------------

  const memberCount = members.length;

  // --------------------------------------
  // PARTE QUE LE CORRESPONDE A CADA UNO
  // --------------------------------------

  const myShare =
    memberCount > 0
      ? totalGastos / memberCount
      : 0;

  // --------------------------------------
  // DIFERENCIA
  // --------------------------------------

  const balance =
    myTotalPaid - myShare;

  // --------------------------------------
  // MIEMBRO CONTRARIO EN UN HOGAR DE 2
  // --------------------------------------

  const otherMember = useMemo(() => {
    return members.find(
      (member) =>
        member.user_id !== user?.id
    );
  }, [members, user?.id]);

  const otherMemberName =
    otherMember?.name ||
    "La otra persona";

  // --------------------------------------
  // CUÁNTO PAGÓ LA OTRA PERSONA
  // --------------------------------------

  const otherTotalPaid = useMemo(() => {
    if (!otherMember?.user_id) {
      return 0;
    }

    return transactions
      .filter(
        (transaction) =>
          transaction.paid_by ===
          otherMember.user_id
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [
    transactions,
    otherMember?.user_id,
  ]);

  // ======================================
  // TEXTO DEL BALANCE
  // ======================================

  const balanceMessage = useMemo(() => {
    if (memberCount <= 1) {
      return (
        "Agrega otro miembro para calcular automáticamente cuánto corresponde pagar a cada uno."
      );
    }

    if (
      memberCount === 2 &&
      otherMember
    ) {
      const difference =
        Math.round(
          Math.abs(balance)
        );

      if (balance > 0) {
        return (
          `${otherMemberName} debe aportarte ${formatCurrency(
            difference
          )}.`
        );
      }

      if (balance < 0) {
        return (
          `Tú debes aportar ${formatCurrency(
            difference
          )} a ${otherMemberName}.`
        );
      }

      return (
        "🎉 Están perfectamente equilibrados."
      );
    }

    if (balance > 0) {
      return (
        `Has pagado ${formatCurrency(
          balance
        )} más de lo que te corresponde.`
      );
    }

    if (balance < 0) {
      return (
        `Te falta aportar ${formatCurrency(
          Math.abs(balance)
        )} para igualar tu parte.`
      );
    }

    return (
      "🎉 Tus aportes están perfectamente equilibrados."
    );
  }, [
    memberCount,
    otherMember,
    otherMemberName,
    balance,
  ]);

  // ======================================
  // LOADING
  // ======================================

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

  // ======================================
  // SIN HOGAR
  // ======================================

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

  // ======================================
  // DASHBOARD
  // ======================================

  return (
    <div className="dashboard">

      <div className="dashboard-container">

        {/* ==================================
            HEADER
        ================================== */}

        <header className="header">

          <h1>
            🏠 {household.name} ❤️
          </h1>

          <p>
            Finanzas compartidas del hogar
          </p>

        </header>

        {/* ==================================
            RESUMEN
        ================================== */}

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

        {/* ==================================
            MIEMBROS
        ================================== */}

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
              onClick={() => {
                setMemberId("");
                setMemberName("");
                setShowMemberForm(true);
              }}
            >
              ＋ Agregar miembro
            </button>

          </div>

          <div className="transactions-list">

            {members.map(
              (member, index) => (

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
                        ? member.name ||
                          currentUserName
                        : member.name ||
                          `Miembro ${index + 1}`}
                    </h3>

                    <p>
                      {member.user_id === user.id
                        ? "Tu cuenta"
                        : "Miembro del hogar"}
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        {/* ==================================
            MI APORTE
        ================================== */}

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

        {/* ==================================
            BALANCE COMPARTIDO
        ================================== */}

        <section className="saving-progress-card">

          <div className="saving-progress-header">

            <div>

              <h2>
                ⚖️ Balance compartido
              </h2>

              <p>
                {balanceMessage}
              </p>

              {memberCount === 2 &&
                otherMember && (
                  <p
                    style={{
                      marginTop: "10px",
                    }}
                  >
                    {currentUserName}:{" "}
                    <strong>
                      {formatCurrency(
                        myTotalPaid
                      )}
                    </strong>
                    {" • "}
                    {otherMemberName}:{" "}
                    <strong>
                      {formatCurrency(
                        otherTotalPaid
                      )}
                    </strong>
                  </p>
                )}

              {memberCount === 2 && (
                <p
                  style={{
                    marginTop: "6px",
                  }}
                >
                  A cada uno le corresponde
                  pagar{" "}
                  <strong>
                    {formatCurrency(
                      myShare
                    )}
                  </strong>
                </p>
              )}

            </div>

          </div>

        </section>

        {/* ==================================
            AGREGAR GASTO
        ================================== */}

        <section className="action-buttons">

          <button
            className="expense-button"
            onClick={openNewTransaction}
          >

            <span>
              ＋
            </span>

            Agregar gasto del hogar

          </button>

        </section>

        {/* ==================================
            LISTA DE GASTOS
        ================================== */}

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

              <div>
                📭
              </div>

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

                      <p
                        className="transaction-owner"
                      >
                        👤{" "}
                        {getMemberName(
                          transaction.paid_by
                        )}
                      </p>

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

      {/* ====================================
          MODAL AGREGAR MIEMBRO
      ==================================== */}

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
              Ingresa el ID y el nombre del
              usuario que deseas agregar.
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

              <label>
                Nombre
              </label>

              <input
                type="text"
                placeholder="Ej: Victor"
                value={memberName}
                onChange={(e) =>
                  setMemberName(
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
                    setMemberName("");
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

      {/* ====================================
          MODAL GASTO
      ==================================== */}

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
                  Hogar
                </option>

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