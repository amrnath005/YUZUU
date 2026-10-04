"use client";

import React, { createContext, useContext, useState } from "react";
import { RecordPaymentDialog } from "./record-payment-dialog";

interface RecordPaymentContextType {
  openRecordPayment: (clientId?: string) => void;
}

const RecordPaymentContext = createContext<RecordPaymentContextType | undefined>(undefined);

export function RecordPaymentProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string | undefined>();

  const openRecordPayment = (id?: string) => {
    setClientId(id);
    setOpen(true);
  };

  return (
    <RecordPaymentContext.Provider value={{ openRecordPayment }}>
      {children}
      <RecordPaymentDialog
        open={open}
        onOpenChange={setOpen}
        defaultClientId={clientId}
      />
    </RecordPaymentContext.Provider>
  );
}

export function useRecordPayment() {
  const context = useContext(RecordPaymentContext);
  if (!context) {
    return { openRecordPayment: () => {} };
  }
  return context;
}
