import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";

const CATEGORIES = ["Food & Dining", "Shopping", "Utilities", "Transportation", "Entertainment", "Healthcare", "Others"];

const LedgerView = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [merchantSearch, setMerchantSearch] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Form states
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const fetchTransactions = async (page = 0) => {
    setLoading(true);
    try {
      const response = await api.get("/api/transactions", {
        params: {
          category: categoryFilter || undefined,
          merchant: merchantSearch || undefined,
          page,
          size: 8,
          sortBy: "transactionDate",
          direction: "DESC",
        },
      });
      setTransactions(response.data.content);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(0);
  }, [categoryFilter, merchantSearch]);

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setAmount("");
    setMerchant("");
    setCategory("Food & Dining");
    setDate(new Date().toISOString().substring(0, 16));
    setDescription("");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTransaction(t);
    setAmount(t.amount.toString());
    setMerchant(t.merchant);
    setCategory(t.category);
    setDate(t.transactionDate.substring(0, 16));
    setDescription(t.description || "");
    setFormError("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await api.delete(`/api/transactions/${id}`);
        fetchTransactions(currentPage);
      } catch (err) {
        console.error("Failed to delete transaction", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Please enter a valid positive amount");
      return;
    }
    if (!merchant.trim()) {
      setFormError("Please enter a merchant name");
      return;
    }
    if (!date) {
      setFormError("Please select a transaction date");
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      merchant,
      category,
      transactionDate: new Date(date).toISOString(),
      description,
    };

    try {
      if (editingTransaction) {
        await api.put(`/api/transactions/${editingTransaction.id}`, payload);
      } else {
        await api.post("/api/transactions", payload);
      }
      setShowModal(false);
      fetchTransactions(editingTransaction ? currentPage : 0);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save transaction");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your transaction history and details.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-muted-foreground flex items-center" />
          <input
            type="text"
            value={merchantSearch}
            onChange={(e) => setMerchantSearch(e.target.value)}
            placeholder="Search by merchant..."
            className="block w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-primary transition-all"
          />
        </div>
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary transition-all"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Merchant</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-muted-foreground">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2 border-b-2"></div>
                    <p className="mt-2 text-xs">Loading transactions...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-muted-foreground">
                    No transactions found. Click "Add Expense" to get started.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(t.transactionDate).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium">{t.merchant}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {t.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-foreground">
                      ₹{t.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 0 || loading}
                onClick={() => fetchTransactions(currentPage - 1)}
                className="p-2 border border-border rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage === totalPages - 1 || loading}
                onClick={() => fetchTransactions(currentPage + 1)}
                className="p-2 border border-border rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </h2>

            {formError && (
              <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Amount (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Merchant
                </label>
                <input
                  type="text"
                  required
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Merchant name"
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-primary transition-all"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes"
                  rows="3"
                  className="block w-full rounded-lg border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold hover:bg-secondary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerView;
