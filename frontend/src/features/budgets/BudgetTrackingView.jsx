import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { Sliders, AlertCircle, Save, CheckCircle, Info } from "lucide-react";

const CATEGORIES = ["Food & Dining", "Shopping", "Utilities", "Transportation", "Entertainment", "Healthcare", "Others"];

const BudgetTrackingView = () => {
  const [performances, setPerformances] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // Form states for adding/editing a category limit
  const [selectedCategory, setSelectedCategory] = useState("Food & Dining");
  const [limitAmount, setLimitAmount] = useState("");
  const [limitSuccess, setLimitSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const loadBudgetsAndSettings = async () => {
    setLoading(true);
    try {
      // 1. Fetch budget performance list
      const perfRes = await api.get("/api/budgets/performance");
      setPerformances(perfRes.data);

      // 2. Fetch baseline income settings
      const settingsRes = await api.get("/api/settings");
      setMonthlyIncome(settingsRes.data.monthlyIncome.toString());
    } catch (err) {
      console.error("Failed to load budget details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetsAndSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess("");
    try {
      await api.put("/api/settings", {
        monthlyIncome: parseFloat(monthlyIncome) || 0,
      });
      setSettingsSuccess("Income settings updated successfully!");
      // Reload budget performances as ideal burn rate scales with settings
      const perfRes = await api.get("/api/budgets/performance");
      setPerformances(perfRes.data);
    } catch (err) {
      console.error("Failed to update settings", err);
    }
  };

  const handleSaveLimit = async (e) => {
    e.preventDefault();
    setLimitSuccess("");
    setFormError("");

    if (!limitAmount || parseFloat(limitAmount) < 0) {
      setFormError("Please enter a valid limit amount");
      return;
    }

    try {
      await api.post("/api/budgets", {
        category: selectedCategory,
        limitAmount: parseFloat(limitAmount),
      });
      setLimitSuccess(`Budget limit updated for ${selectedCategory}!`);
      setLimitAmount("");
      // Reload budget performance
      const perfRes = await api.get("/api/budgets/performance");
      setPerformances(perfRes.data);
    } catch (err) {
      console.error("Failed to save limit", err);
      setFormError("Failed to update budget limit");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Budgets & Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up limit variables and track velocity-based alerts.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2"></div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Controls / Configurations Column */}
          <div className="space-y-6">
            {/* Income Baseline Config */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Monthly Baseline
              </h3>
              {settingsSuccess && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg p-2.5 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {settingsSuccess}
                </div>
              )}
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Baseline Monthly Income (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Update Income
                </button>
              </form>
            </div>

            {/* Set Category Limit Form */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4">Set Category Limits</h3>
              {limitSuccess && (
                <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg p-2.5 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {limitSuccess}
                </div>
              )}
              {formError && (
                <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-2.5">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSaveLimit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Select Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary transition-all"
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
                    Limit Amount (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-border bg-background py-2 px-3 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Set Budget
                </button>
              </form>
            </div>
          </div>

          {/* Performance list - 2 Columns wide */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold">Predictive Budget Alerts</h3>
              <p className="text-xs text-muted-foreground">
                Examines spending velocity against the ideal month trajectory.
              </p>
            </div>

            {performances.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                No active category limits have been set yet.
              </div>
            ) : (
              <div className="space-y-6">
                {performances.map((perf) => {
                  const spent = perf.spentAmount;
                  const limit = perf.limitAmount;
                  const percent = perf.percentageExhausted;
                  const remaining = perf.remainingAmount;
                  const warning = perf.isOverBurnRate;

                  return (
                    <div key={perf.id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <span className="font-bold text-foreground text-sm">{perf.category}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            Limit: ₹{limit.toFixed(2)}
                          </span>
                        </div>
                        {warning && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            <AlertCircle className="h-3 w-3" />
                            Over Ideal Burn Velocity
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            warning ? "bg-destructive" : percent > 85 ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                        <span>Spent: ₹{spent.toFixed(2)} ({percent.toFixed(0)}%)</span>
                        <span className={remaining >= 0 ? "text-emerald-500" : "text-destructive"}>
                          {remaining >= 0 ? `Remaining: ₹${remaining.toFixed(2)}` : `Over Budget: ₹${Math.abs(remaining).toFixed(2)}`}
                        </span>
                      </div>

                      {/* Burn speed info text */}
                      <div className="mt-2 text-[11px] text-muted-foreground flex items-start gap-1.5 bg-muted/40 p-2 rounded-lg">
                        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <p>
                          At this point in the month, the ideal burn rate is <strong>₹{perf.idealBurnRate.toFixed(2)}</strong>.
                          {warning
                            ? " Your spend speed is too high. If you maintain this velocity, you will exceed your targeted limit."
                            : " Your spending is currently safe and running at a stable trajectory."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetTrackingView;
