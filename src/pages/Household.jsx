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
    return user.email.split("@")[0];
  }

  return "Usuario";
};
export default Household;