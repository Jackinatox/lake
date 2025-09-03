"use client";

import React, { useEffect, useState } from "react";

interface ClientPayDateInterface {
  date: Date;
}

function ClientPayDate({ date }: ClientPayDateInterface) {
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    setNewDate(date.toLocaleString());
  }, [date]);
  
  return <>{newDate}</>;
}

export default ClientPayDate;
