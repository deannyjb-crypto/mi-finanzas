import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import TransactionForm from "../components/TransactionForm";

// ========================================
// FORMATEAR MONEDA
// ========================================

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
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
// MES ACTUAL
// ========================================

const getTodayMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

// ========================================
// DASHBOARD
// ========================================

function Dashboard({ user }) {
  // ======================================
  // TRANSACCIONES
  // ======================================

  const [showForm, setShowForm] = useState(false);

  const [transactionType, setTransactionType] =
    useState("expense");

  const [transactionToEdit, setTransactionToEdit] =
    useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [loadingTransactions, setLoadingTransactions] =
    useState(true);

  const [savingTransaction, setSavingTransaction] =
    useState(false);

  const [selectedMonth, setSelectedMonth] =
    useState(getTodayMonth());

  // ======================================
  // AHORROS
  // ======================================

  const [savings, setSavings] = useState([]);

  const [showSavingForm, setShowSavingForm] =
    useState(false);

  const [savingName, setSavingName] =
    useState("");

  const [savingAmount, setSavingAmount] =
    useState("");

  const [savingTarget, setSavingTarget] =
    useState("");

  const [savingToEdit, setSavingToEdit] =
    useState(null);


    const [showAddMoneyForm, setShowAddMoneyForm] = useState(false);
const [savingToAddMoney, setSavingToAddMoney] = useState(null);
const [addMoneyAmount, setAddMoneyAmount] = useState("");

  // ======================================
  // HOGAR
  // ======================================

  const [household, setHousehold] =
    useState(null);

  const [householdMembers, setHouseholdMembers] =
    useState([]);

  const [householdTransactions, setHouseholdTransactions] =
    useState([]);

  const [loadingHousehold, setLoadingHousehold] =
    useState(true);

  // ======================================
  // CARGAR TRANSACCIONES PERSONALES
  // ======================================

  const loadTransactions = async () => {
    if (!user?.id) {
      setLoadingTransactions(false);
      return;
    }

    setLoadingTransactions(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error(
        "Error cargando transacciones:",
        error
      );
    } finally {
      setLoadingTransactions(false);
    }
  };

  // ======================================
  // CARGAR AHORROS
  // ======================================

  const loadSavings = async () => {
    if (!user?.id) {
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("savings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setSavings(data || []);
    } catch (error) {
      console.error(
        "Error cargando ahorros:",
        error
      );
    }
  };

  // ======================================
  // CARGAR HOGAR
  // ======================================

  const loadHousehold = async () => {
    if (!user?.id) {
      setLoadingHousehold(false);
      return;
    }

    setLoadingHousehold(true);

    try {
      // ----------------------------------
      // BUSCAR HOGAR
      // ----------------------------------

      const {
        data: memberships,
        error: membershipsError,
      } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (membershipsError) {
        throw membershipsError;
      }

      // ----------------------------------
      // NO TIENE HOGAR
      // ----------------------------------

      if (
        !memberships ||
        memberships.length === 0
      ) {
        setHousehold(null);
        setHouseholdMembers([]);
        setHouseholdTransactions([]);
        return;
      }

      // ----------------------------------
      // USAR EL PRIMER HOGAR
      // ----------------------------------

      const householdId =
        memberships[0].household_id;

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

      setHouseholdMembers(
        membersData || []
      );

      // ----------------------------------
      // CARGAR GASTOS HOGAR
      // ----------------------------------

      const {
        data: householdTransactionsData,
        error: householdTransactionsError,
      } = await supabase
        .from("household_transactions")
        .select("*")
        .eq("household_id", householdId)
        .order("date", {
          ascending: false,
        });

      if (householdTransactionsError) {
        throw householdTransactionsError;
      }

      setHouseholdTransactions(
        householdTransactionsData || []
      );
    } catch (error) {
      console.error(
        "Error cargando hogar:",
        error
      );

      setHousehold(null);
      setHouseholdMembers([]);
      setHouseholdTransactions([]);
    } finally {
      setLoadingHousehold(false);
    }
  };

  // ======================================
  // CARGAR TODO AL INICIAR
  // ======================================

  useEffect(() => {
    loadTransactions();
    loadSavings();
    loadHousehold();
  }, [user?.id]);

  // ======================================
  // FILTRAR TRANSACCIONES DEL MES
  // ======================================

  const monthlyTransactions = useMemo(() => {
    return transactions
      .filter((transaction) =>
        transaction.date?.startsWith(
          selectedMonth
        )
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
  }, [
    transactions,
    selectedMonth,
  ]);

  // ======================================
  // FILTRAR GASTOS HOGAR DEL MES
  // ======================================

  const monthlyHouseholdTransactions =
    useMemo(() => {
      return householdTransactions
        .filter((transaction) =>
          transaction.date?.startsWith(
            selectedMonth
          )
        )
        .sort(
          (a, b) =>
            new Date(b.date) -
            new Date(a.date)
        );
    }, [
      householdTransactions,
      selectedMonth,
    ]);

  // ======================================
  // INGRESOS DEL MES
  // ======================================

  const totalIngresos = useMemo(() => {
    return monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [monthlyTransactions]);

  // ======================================
  // GASTOS DEL MES
  // ======================================

  const totalGastos = useMemo(() => {
    return monthlyTransactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
  }, [monthlyTransactions]);

  // ======================================
  // SALDO DISPONIBLE ACUMULADO
  // ======================================
  //
  // IMPORTANTE:
  // Aquí NO usamos solamente:
  // ingresos del mes - gastos del mes.
  //
  // Se acumulan todos los movimientos hasta
  // el mes seleccionado.
  // ======================================

  const saldoDisponible = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const transactionMonth =
          transaction.date?.slice(0, 7);

        return (
          transactionMonth &&
          transactionMonth <= selectedMonth
        );
      })
      .reduce((total, transaction) => {
        const amount = Number(
          transaction.amount || 0
        );

        if (
          transaction.type === "income"
        ) {
          return total + amount;
        }

        if (
          transaction.type === "expense"
        ) {
          return total - amount;
        }

        return total;
      }, 0);
  }, [
    transactions,
    selectedMonth,
  ]);

  // ======================================
  // AHORRO DEL MES / CAPACIDAD DE AHORRO
  // ======================================

  const ahorroDelMes =
    totalIngresos - totalGastos;

  const porcentajeAhorro =
    totalIngresos > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (ahorroDelMes /
                totalIngresos) *
                100
            )
          )
        )
      : 0;

  // ======================================
  // AHORRO ACUMULADO EN METAS
  // ======================================

  const totalAhorrado = useMemo(() => {
    return savings.reduce(
      (total, saving) =>
        total +
        Number(saving.amount || 0),
      0
    );
  }, [savings]);

  // ======================================
  // TOTAL GASTOS HOGAR DEL MES
  // ======================================

  const totalHouseholdGastos =
    useMemo(() => {
      return monthlyHouseholdTransactions.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );
    }, [
      monthlyHouseholdTransactions,
    ]);

  // ======================================
  // MI APORTE AL HOGAR
  // ======================================

  const myHouseholdPaid =
    useMemo(() => {
      return monthlyHouseholdTransactions
        .filter(
          (transaction) =>
            transaction.paid_by ===
            user?.id
        )
        .reduce(
          (total, transaction) =>
            total +
            Number(transaction.amount || 0),
          0
        );
    }, [
      monthlyHouseholdTransactions,
      user?.id,
    ]);

  // ======================================
  // MIEMBROS DEL HOGAR
  // ======================================

  const householdMemberCount =
    householdMembers.length;

  // ======================================
  // MI PARTE DEL HOGAR
  // ======================================

  const myHouseholdShare =
    householdMemberCount > 0
      ? totalHouseholdGastos /
        householdMemberCount
      : 0;

  // ======================================
  // BALANCE HOGAR
  // ======================================

  const householdBalance =
    myHouseholdPaid -
    myHouseholdShare;

  // ======================================
  // OTRO MIEMBRO
  // ======================================

  const otherHouseholdMember =
    useMemo(() => {
      return householdMembers.find(
        (member) =>
          member.user_id !==
          user?.id
      );
    }, [
      householdMembers,
      user?.id,
    ]);

  // ======================================
  // NOMBRE DEL OTRO MIEMBRO
  // ======================================

  const otherMemberName =
    otherHouseholdMember?.name ||
    "La otra persona";

  // ======================================
  // APORTE DEL OTRO MIEMBRO
  // ======================================

  const otherMemberPaid =
    useMemo(() => {
      if (
        !otherHouseholdMember?.user_id
      ) {
        return 0;
      }

      return monthlyHouseholdTransactions
        .filter(
          (transaction) =>
            transaction.paid_by ===
            otherHouseholdMember.user_id
        )
        .reduce(
          (total, transaction) =>
            total +
            Number(transaction.amount || 0),
          0
        );
    }, [
      monthlyHouseholdTransactions,
      otherHouseholdMember?.user_id,
    ]);

  // ======================================
  // MENSAJE DEL BALANCE DEL HOGAR
  // ======================================

  const householdBalanceText =
    useMemo(() => {
      if (!household) {
        return "";
      }

      if (
        householdMemberCount <= 1
      ) {
        return "Agrega otro miembro para comenzar a dividir los gastos.";
      }

      if (
        householdMemberCount === 2 &&
        otherHouseholdMember
      ) {
        const difference =
          Math.round(
            Math.abs(
              householdBalance
            )
          );

        if (
          householdBalance > 0
        ) {
          return `${otherMemberName} te debe ${formatCurrency(
            difference
          )}.`;
        }

        if (
          householdBalance < 0
        ) {
          return `Tú debes aportar ${formatCurrency(
            difference
          )} a ${otherMemberName}.`;
        }

        return "🎉 Están perfectamente equilibrados.";
      }

      if (
        householdBalance > 0
      ) {
        return `Has aportado ${formatCurrency(
          householdBalance
        )} más de lo que te corresponde.`;
      }

      if (
        householdBalance < 0
      ) {
        return `Te falta aportar ${formatCurrency(
          Math.abs(
            householdBalance
          )
        )}.`;
      }

      return "🎉 Estás perfectamente equilibrado.";
    }, [
      household,
      householdMemberCount,
      otherHouseholdMember,
      householdBalance,
      otherMemberName,
    ]);

  // ======================================
  // ABRIR FORMULARIO TRANSACCIÓN
  // ======================================

  const handleOpenForm = (type) => {
    setTransactionType(type);
    setTransactionToEdit(null);
    setShowForm(true);
  };

  // ======================================
  // CERRAR FORMULARIO TRANSACCIÓN
  // ======================================

  const handleCloseForm = () => {
    setShowForm(false);
    setTransactionToEdit(null);
  };

  // ======================================
  // GUARDAR TRANSACCIÓN
  // ======================================

  const handleSaveTransaction = async (
    transactionData
  ) => {
    if (savingTransaction) {
      return;
    }

    setSavingTransaction(true);

    try {
      // TransactionForm guarda en Supabase.
      // Aquí solo recargamos.

      await loadTransactions();

      handleCloseForm();
    } catch (error) {
      console.error(
        "Error actualizando transacciones:",
        error
      );

      alert(
        "Error: " +
          error.message
      );
    } finally {
      setSavingTransaction(false);
    }
  };

  // ======================================
  // EDITAR TRANSACCIÓN
  // ======================================

  const handleEditTransaction = (
    transaction
  ) => {
    setTransactionToEdit(transaction);

    setTransactionType(
      transaction.type
    );

    setShowForm(true);
  };

  // ======================================
  // ELIMINAR TRANSACCIÓN
  // ======================================

  const handleDeleteTransaction =
    async (id) => {
      const confirmar =
        window.confirm(
          "¿Seguro que quieres eliminar esta transacción?"
        );

      if (!confirmar) {
        return;
      }

      try {
        const {
          error,
        } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          );

        if (error) {
          throw error;
        }

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

  // ======================================
  // ABRIR FORMULARIO AHORRO
  // ======================================

  const handleOpenSavingForm = () => {
    setSavingToEdit(null);

    setSavingName("");
    setSavingAmount("");
    setSavingTarget("");

    setShowSavingForm(true);
  };

  // ======================================
  // EDITAR AHORRO
  // ======================================

  const handleEditSaving = (
    saving
  ) => {
    setSavingToEdit(saving);

    setSavingName(
      saving.name || ""
    );

    setSavingAmount(
      saving.amount || ""
    );

    setSavingTarget(
      saving.target_amount || ""
    );

    setShowSavingForm(true);
  };

  // ======================================
  // CERRAR FORMULARIO AHORRO
  // ======================================

  const handleCloseSavingForm = () => {
    setShowSavingForm(false);
    setSavingToEdit(null);
  };

  // ======================================
  // GUARDAR AHORRO
  // ======================================

  const handleSaveSaving =
    async (e) => {
      e.preventDefault();

      if (
        !savingName ||
        savingAmount === "" ||
        savingTarget === ""
      ) {
        alert(
          "Completa todos los campos."
        );

        return;
      }

      try {
        // --------------------------------
        // EDITAR
        // --------------------------------

        if (savingToEdit) {
          const {
            error,
          } = await supabase
            .from("savings")
            .update({
              name: savingName,
              amount:
                Number(savingAmount),
              target_amount:
                Number(savingTarget),
            })
            .eq(
              "id",
              savingToEdit.id
            )
            .eq(
              "user_id",
              user.id
            );

          if (error) {
            throw error;
          }
        } else {
          // --------------------------------
          // CREAR
          // --------------------------------

          const {
            error,
          } = await supabase
            .from("savings")
            .insert([
              {
                user_id: user.id,
                name: savingName,
                amount:
                  Number(savingAmount),
                target_amount:
                  Number(savingTarget),
                month:
                  selectedMonth,
              },
            ]);

          if (error) {
            throw error;
          }
        }

        await loadSavings();

        handleCloseSavingForm();
      } catch (error) {
        console.error(
          "Error guardando ahorro:",
          error
        );

        alert(
          "Error al guardar el ahorro: " +
            error.message
        );
      }
    };

  // ======================================
  // ABRIR FORMULARIO AGREGAR DINERO
  // ======================================

  const handleOpenAddMoney = (saving) => {
    setSavingToAddMoney(saving);
    setAddMoneyAmount("");
    setShowAddMoneyForm(true);
  };

  // ======================================
  // CERRAR FORMULARIO AGREGAR DINERO
  // ======================================

  const handleCloseAddMoney = () => {
    setShowAddMoneyForm(false);
    setSavingToAddMoney(null);
    setAddMoneyAmount("");
  };

  // ======================================
  // GUARDAR DINERO AGREGADO
  // ======================================

  const handleSubmitAddMoney = async (e) => {
    e.preventDefault();

    const amount = Number(addMoneyAmount);

    if (!amount || amount <= 0) {
      alert("Ingresa un monto válido.");
      return;
    }

    if (!savingToAddMoney) {
      return;
    }

    await addMoneyToSaving(
      savingToAddMoney.id,
      amount
    );

    handleCloseAddMoney();
  };

  // ======================================
  // AGREGAR DINERO A AHORRO
  // ======================================

  const addMoneyToSaving = async (
    savingId,
    amount
  ) => {
    const saving = savings.find(
      (item) => item.id === savingId
    );

    if (!saving) {
      return;
    }

    const newAmount =
      Number(saving.amount || 0) +
      Number(amount);

    try {
      const { error } = await supabase
        .from("savings")
        .update({
          amount: newAmount,
        })
        .eq("id", savingId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setSavings((prevSavings) =>
        prevSavings.map((item) =>
          item.id === savingId
            ? {
                ...item,
                amount: newAmount,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Error agregando dinero:",
        error
      );

      alert(
        "No se pudo agregar el dinero."
      );
    }
  };

  // ======================================
  // ELIMINAR META
  // ======================================

  const handleDeleteSaving =
    async (id) => {
      const confirmar =
        window.confirm(
          "¿Seguro que quieres eliminar esta meta de ahorro?"
        );

      if (!confirmar) {
        return;
      }

      try {
        const {
          error,
        } = await supabase
          .from("savings")
          .delete()
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          );

        if (error) {
          throw error;
        }

        await loadSavings();
      } catch (error) {
        console.error(
          "Error eliminando ahorro:",
          error
        );

        alert(
          "Error al eliminar el ahorro: " +
            error.message
        );
      }
    };

  // ======================================
  // NOMBRE DEL MES
  // ======================================

  const monthLabel =
    new Date(
      `${selectedMonth}-01T12:00:00`
    ).toLocaleDateString(
      "es-CL",
      {
        month: "long",
        year: "numeric",
      }
    );

  // ======================================
  // PANTALLA DE CARGA
  // ======================================

  if (loadingTransactions) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">

          <p>
            Cargando tus finanzas...
          </p>

        </div>
      </div>
    );
  }

  // ======================================
  // INTERFAZ
  // ======================================

  return (
    <div className="dashboard">

      <div className="dashboard-container">

        {/* ==================================
            HEADER
        ================================== */}

        <header className="header">

          <h1>
            💰 Mi Finanzas
          </h1>

          <p>
            Tu resumen financiero personal
          </p>

        </header>

        {/* ==================================
            SELECTOR MES
        ================================== */}

        <section className="month-selector">

          <label htmlFor="month">
            📅 Seleccionar mes
          </label>

          <input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value
              )
            }
          />

        </section>

        {/* ==================================
            SALDO DISPONIBLE
        ================================== */}

        <section className="balance-card">

          <p>
            Saldo disponible
          </p>

          <h2>
            {formatCurrency(
              saldoDisponible
            )}
          </h2>

          <span>
            Saldo acumulado hasta{" "}
            {monthLabel}
          </span>

        </section>

        {/* ==================================
            RESUMEN
        ================================== */}

        <section className="summary-grid">

          <div className="summary-card income-card">

            <div className="summary-icon">
              📈
            </div>

            <div>

              <span>
                Ingresos
              </span>

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

              <span>
                Gastos
              </span>

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

              <span>
                Ahorro acumulado
              </span>

              <h3>
                {formatCurrency(
                  totalAhorrado
                )}
              </h3>

            </div>

          </div>

        </section>

        {/* ==================================
            CAPACIDAD DE AHORRO
        ================================== */}

        <section className="saving-progress-card">

          <div className="saving-progress-header">

            <div>

              <h2>
                🎯 Tu capacidad de ahorro
              </h2>

              <p>
                Este mes puedes ahorrar aproximadamente{" "}
                <strong>
                  {formatCurrency(
                    Math.max(
                      0,
                      ahorroDelMes
                    )
                  )}
                </strong>
                {" "}
                ({porcentajeAhorro}% de tus ingresos).
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
                width:
                  `${porcentajeAhorro}%`,
              }}
            />

          </div>

          <div className="saving-progress-labels">

            <span>
              0%
            </span>

            <span>
              Meta ideal: 20%
            </span>

            <span>
              100%
            </span>

          </div>

        </section>

        {/* ==================================
            MI APORTE AL HOGAR
        ================================== */}

        {household && (

          <section className="saving-progress-card">

            <div className="saving-progress-header">

              <div>

                <h2>
                  🏠 Mi aporte al hogar
                </h2>

                {loadingHousehold ? (

                  <p>
                    Cargando información...
                  </p>

                ) : (

                  <>

                    <p>

                      En{" "}
                      <strong>
                        {household.name}
                      </strong>{" "}
                      has aportado{" "}
                      <strong>
                        {formatCurrency(
                          myHouseholdPaid
                        )}
                      </strong>{" "}
                      durante{" "}
                      {monthLabel}.

                    </p>

                    <p
                      style={{
                        marginTop: "8px",
                      }}
                    >

                      Tu parte correspondiente es{" "}

                      <strong>
                        {formatCurrency(
                          myHouseholdShare
                        )}
                      </strong>
                      .

                    </p>

                    <p
                      style={{
                        marginTop: "8px",
                      }}
                    >

                      {householdBalanceText}

                    </p>

                    {householdMemberCount ===
                      2 &&
                      otherHouseholdMember && (

                        <p
                          style={{
                            marginTop: "8px",
                          }}
                        >

                          Tú:{" "}
                          <strong>
                            {formatCurrency(
                              myHouseholdPaid
                            )}
                          </strong>

                          {" • "}

                          {otherMemberName}:{" "}

                          <strong>
                            {formatCurrency(
                              otherMemberPaid
                            )}
                          </strong>

                        </p>

                      )}

                  </>

                )}

              </div>

            </div>

          </section>

        )}

        {/* ==================================
            RESUMEN HOGAR
        ================================== */}

        {household && (

          <section className="summary-grid">

            <div className="summary-card expense-card">

              <div className="summary-icon">
                🏠
              </div>

              <div>

                <span>
                  Gastos del hogar
                </span>

                <h3>
                  {formatCurrency(
                    totalHouseholdGastos
                  )}
                </h3>

              </div>

            </div>

            <div className="summary-card income-card">

              <div className="summary-icon">
                👤
              </div>

              <div>

                <span>
                  Mi aporte
                </span>

                <h3>
                  {formatCurrency(
                    myHouseholdPaid
                  )}
                </h3>

              </div>

            </div>

            <div className="summary-card saving-card">

              <div className="summary-icon">
                ⚖️
              </div>

              <div>

                <span>
                  Mi parte
                </span>

                <h3>
                  {formatCurrency(
                    myHouseholdShare
                  )}
                </h3>

              </div>

            </div>

          </section>

        )}

        {/* ==================================
            METAS DE AHORRO
        ================================== */}

        <section className="savings-section">

          <div className="savings-header">

            <div>

              <h2>
                🎯 Mis metas de ahorro
              </h2>

              <p>
                Define tus objetivos y lleva
                el control de tu progreso.
              </p>

            </div>

            <button
              className="income-button"
              onClick={
                handleOpenSavingForm
              }
            >
              ＋ Nueva meta
            </button>

          </div>

          {savings.length === 0 ? (

            <div className="empty-state">

              <div>
                🎯
              </div>

              <h3>
                Aún no tienes metas de ahorro
              </h3>

              <p>
                Crea una meta para comenzar
                a ahorrar.
              </p>

            </div>

          ) : (

            <div className="savings-list">

              {savings.map(
                (saving) => {

                  const progress =
                    Number(
                      saving.target_amount
                    ) > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (
                              Number(
                                saving.amount
                              ) /
                              Number(
                                saving.target_amount
                              )
                            ) *
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

                          <h3>
                            {saving.name}
                          </h3>

                          <p>

                            {formatCurrency(
                              saving.amount
                            )}

                            {" "}
                            ahorrados de{" "}

                            {formatCurrency(
                              saving.target_amount
                            )}

                          </p>

                        </div>

                        <div className="saving-item-actions">

                          <button
  className="add-money-button"
  onClick={() =>
    handleOpenAddMoney(saving)
  }
  title="Agregar dinero"
>
  💰
</button>

                          <button
                            className="edit-button"
                            onClick={() =>
                              handleEditSaving(
                                saving
                              )
                            }
                          >
                            ✏️
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDeleteSaving(
                                saving.id
                              )
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
                            width:
                              `${progress}%`,
                          }}
                        />

                      </div>

                      <div className="saving-item-footer">

                        <span>
                          {progress}% completado
                        </span>

                        <strong>

                          Faltan{" "}

                          {formatCurrency(
                            Math.max(
                              0,
                              Number(
                                saving.target_amount
                              ) -
                                Number(
                                  saving.amount
                                )
                            )
                          )}

                        </strong>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* ==================================
            BOTONES
        ================================== */}

        <section className="action-buttons">

          <button
            className="income-button"
            onClick={() =>
              handleOpenForm("income")
            }
          >

            <span>
              ＋
            </span>

            Agregar ingreso

          </button>

          <button
            className="expense-button"
            onClick={() =>
              handleOpenForm("expense")
            }
          >

            <span>
              −
            </span>

            Agregar gasto

          </button>

        </section>

        {/* ==================================
            MOVIMIENTOS PERSONALES
        ================================== */}

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

          {monthlyTransactions.length ===
          0 ? (

            <div className="empty-state">

              <div>
                📭
              </div>

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
                        {transaction.description ||
                          transaction.title}
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

        {/* ==================================
            MIS GASTOS DEL HOGAR
        ================================== */}

        {household && (

          <section className="transactions-section">

            <div className="transactions-header">

              <div>

                <h2>
                  🏠 Mis gastos del hogar
                </h2>

                <p>
                  Gastos que has pagado tú
                  durante {monthLabel}
                </p>

              </div>

            </div>

            {monthlyHouseholdTransactions.filter(
              (transaction) =>
                transaction.paid_by ===
                user?.id
            ).length === 0 ? (

              <div className="empty-state">

                <div>
                  🏠
                </div>

                <h3>
                  No tienes gastos del hogar este mes
                </h3>

                <p>
                  Cuando registres un gasto del hogar
                  aparecerá aquí.
                </p>

              </div>

            ) : (

              <div className="transactions-list">

                {monthlyHouseholdTransactions
                  .filter(
                    (transaction) =>
                      transaction.paid_by ===
                      user?.id
                  )
                  .map(
                    (transaction) => (

                      <div
                        className="transaction-item"
                        key={
                          `household-${transaction.id}`
                        }
                      >

                        <div className="transaction-icon">
                          🏠
                        </div>

                        <div className="transaction-info">

                          <h3>
                            {transaction.description}
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

                          <div className="transaction-amount expense">

                            −
                            {formatCurrency(
                              transaction.amount
                            )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </section>

        )}

      </div>

      {/* ====================================
          FORMULARIO TRANSACCIÓN
      ==================================== */}

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
          saving={
            savingTransaction
          }
        />

      )}

      {/* ====================================
          FORMULARIO META DE AHORRO
      ==================================== */}

      {showSavingForm && (
        <div className="saving-modal-overlay">
          <div className="saving-modal">
            <h2>
              {savingToEdit
                ? "✏️ Editar meta"
                : "🎯 Nueva meta de ahorro"}
            </h2>

            <form onSubmit={handleSaveSaving}>
              <label>
                Nombre de la meta
              </label>

              <input
                type="text"
                placeholder="Ej: Viaje a Brasil"
                value={savingName}
                onChange={(e) =>
                  setSavingName(e.target.value)
                }
              />

              <label>
                ¿Cuánto llevas ahorrado?
              </label>

              <input
                type="number"
                placeholder="Ej: 250000"
                min="0"
                value={savingAmount}
                onChange={(e) =>
                  setSavingAmount(e.target.value)
                }
              />

              <label>
                Meta total
              </label>

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

      {/* ====================================
          FORMULARIO AGREGAR DINERO A META
      ==================================== */}

      {showAddMoneyForm && (
        <div className="saving-modal-overlay">
          <div className="saving-modal">
            <h2>💰 Agregar dinero</h2>

            {savingToAddMoney && (
              <p style={{ marginBottom: "20px" }}>
                Meta: <strong>{savingToAddMoney.name}</strong>
              </p>
            )}

            <form onSubmit={handleSubmitAddMoney}>
              <label>
                ¿Cuánto dinero quieres agregar?
              </label>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ej: 50000"
                value={addMoneyAmount}
                onChange={(e) =>
                  setAddMoneyAmount(e.target.value)
                }
                autoFocus
              />

              <div className="saving-modal-buttons">
                <button
                  type="button"
                  className="expense-button"
                  onClick={handleCloseAddMoney}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="income-button"
                >
                  💰 Agregar dinero
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