"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AddWorkDialog } from './add-work-dialog';

interface AddWorkContextType {
  openAddWork: (clientId?: string) => void;
  closeAddWork: () => void;
}

const AddWorkContext = createContext<AddWorkContextType | undefined>(undefined);

export function AddWorkProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetClientId, setTargetClientId] = useState<string | undefined>(undefined);

  const openAddWork = useCallback((clientId?: string) => {
    setTargetClientId(clientId);
    setIsOpen(true);
  }, []);
  const closeAddWork = useCallback(() => {
    setIsOpen(false);
    setTargetClientId(undefined);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'N' to open Add Work, but only if not in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = ['input', 'textarea'].includes(target.tagName.toLowerCase()) || target.isContentEditable;
      if (e.key.toLowerCase() === 'n' && !isInput) {
        e.preventDefault();
        openAddWork();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openAddWork]);

  return (
    <AddWorkContext.Provider value={{ openAddWork, closeAddWork }}>
      {children}
      <AddWorkDialog isOpen={isOpen} onClose={closeAddWork} defaultClientId={targetClientId} />
    </AddWorkContext.Provider>
  );
}

export function useAddWork() {
  const context = useContext(AddWorkContext);
  if (context === undefined) {
    return { openAddWork: () => {}, closeAddWork: () => {} };
  }
  return context;
}
