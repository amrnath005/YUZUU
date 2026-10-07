"use client";

import React, { createContext, useContext, useState } from "react";
import { RecordPaymentDialog } from "./record-payment-dialog";

interface RecordPaymentContextType {
  openRecordPayment: (clientId?: string, deliverableId?: string) => void;
}

const RecordPaymentContext = createContext<RecordPaymentContextType | undefined>(undefined);

export function RecordPaymentProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string | undefined>();
  const [deliverableId, setDeliverableId] = useState<string | undefined>();

  const openRecordPayment = (cId?: string, dId?: string) => {
    setClientId(cId);
    setDeliverableId(dId);
    setOpen(true);
  };

  return (
    <RecordPaymentContext.Provider value={{ openRecordPayment }}>
      {children}
      <RecordPaymentDialog
        open={open}
        onOpenChange={setOpen}
        defaultClientId={clientId}
        defaultDeliverableId={deliverableId}
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
