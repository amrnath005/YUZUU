"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDeliverables, useClients } from "@/hooks/useStore";
import { useAddWork } from "@/features/work/add-work-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkTable } from "@/features/work/work-table";
import { DELIVERABLE_TYPE_LABELS } from "@/types";

export default function WorkPage() {
  const { openAddWork } = useAddWork();
  const deliverables = useDeliverables({});
  const clients = useClients();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const hasActiveFilters = searchQuery !== "" || selectedClient !== "all" || selectedType !== "all" || selectedStatus !== "all" || dateFrom !== "" || dateTo !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedClient("all");
    setSelectedType("all");
    setSelectedStatus("all");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const clientOptions = useMemo(() => [
    { label: "All clients", value: "all" },
    ...clients.map(c => ({ label: c.name, value: c.id }))
  ], [clients]);

  const typeOptions = useMemo(() => [
    { label: "All types", value: "all" },
    ...Object.entries(DELIVERABLE_TYPE_LABELS).map(([value, label]) => ({ label, value }))
  ], []);

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "In Progress", value: "in-progress" },
    { label: "Delivered", value: "delivered" },
    { label: "Revision", value: "revision" },
    { label: "Cancelled", value: "cancelled" }
  ];

  const filteredDeliverables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    return deliverables.filter(d => {
      const client = clients.find(c => c.id === d.clientId);
      const clientName = client ? client.name.toLowerCase() : "";
      const title = d.title.toLowerCase();
      const typeLabel = (DELIVERABLE_TYPE_LABELS[d.type] || d.type).toLowerCase();
      const typeRaw = d.type.toLowerCase();

      // Universal search: matches deliverable title, client name, and deliverable type
      if (tokens.length > 0) {
        const searchableText = `${title} ${clientName} ${typeLabel} ${typeRaw}`;
        const matchesAll = tokens.every(token => searchableText.includes(token));
        if (!matchesAll) return false;
      }

      if (selectedClient !== "all" && d.clientId !== selectedClient) return false;
      if (selectedType !== "all" && d.type !== selectedType) return false;
      if (selectedStatus !== "all" && d.status !== selectedStatus) return false;
      
      if (dateFrom) {
        if (new Date(d.date) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        if (new Date(d.date) > new Date(dateTo)) return false;
      }
      
      return true;
    });
  }, [deliverables, clients, searchQuery, selectedClient, selectedType, selectedStatus, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredDeliverables.length / itemsPerPage);
  const paginatedDeliverables = filteredDeliverables.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-text-primary)]">Work</h1>
        <Button onClick={() => openAddWork()} icon={<Plus className="w-4 h-4" />}>
          Add work
        </Button>
      </div>

      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <Input 
              placeholder="Search work..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select 
            options={clientOptions}
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          />
          
          <Select 
            options={typeOptions}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />
          
          <Select 
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)]">From</span>
            <Input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-secondary)]">To</span>
            <Input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="ml-auto" icon={<X className="w-4 h-4" />}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {filteredDeliverables.length === 0 ? (
        <EmptyState 
          icon={<Search className="w-12 h-12" />}
          title="No work found"
          description={hasActiveFilters ? "Try adjusting your filters to see more results." : "You haven't added any work yet."}
          action={!hasActiveFilters ? { label: "Add work", onClick: openAddWork } : undefined}
        />
      ) : (
        <div className="space-y-4">
          <WorkTable deliverables={paginatedDeliverables} />
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredDeliverables.length)} of {filteredDeliverables.length} results
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1 inline-block" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
