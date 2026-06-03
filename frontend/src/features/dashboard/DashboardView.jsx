import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import { TrendingUp, Wallet, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardView = () => {
  const [summary, setSummary] = useState({ totalSpent: 0, categoryBreakdown: [] });
  const [settings, setSettings] = useState({ monthlyIncome: 0, currency: "INR" });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart data state
  const [dailyData, setDailyData] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current month summary
      const summaryRes = await api.get("/api/transactions/summary");
      setSummary(summaryRes.data);

      // 2. Fetch User Settings
      const settingsRes = await api.get("/api/settings");
      setSettings(settingsRes.data);

      // 3. Fetch Recent Transactions (first page of size 5)
      const transRes = await api.get("/api/transactions", {
        params: { page: 0, size: 5, sortBy: "transactionDate", direction: "DESC" },
      });
      setRecentTransactions(transRes.data.content);

      // 4. Fetch all transactions for this month to construct the SVG chart
      const allMonthRes = await api.get("/api/transactions", {
        params: {
          startDate: summaryRes.data.startDate,
          endDate: summaryRes.data.endDate,
          page: 0,
          size: 100, // retrieve up to 100 for the chart
        },
      });
      generateChartData(allMonthRes.data.content, settingsRes.data.monthlyIncome);

    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (transactionsList, income) => {
    const daysInMonth = new Date().getDate(); // number of days up to today
    const aggregates = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, amount: 0 }));

    // Accumulate transactions by day of month
    transactionsList.forEach((t) => {
      const day = new Date(t.transactionDate).getDate();
      if (day >= 1 && day <= 30) {
        aggregates[day - 1].amount += t.amount;
      }
    });

    // Generate cumulative spending
    let runningTotal = 0;
    const cumulative = aggregates.map((item) => {
      runningTotal += item.amount;
      return {
        day: item.day,
        amount: runningTotal,
      };
    });

    setDailyData(cumulative);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSpent = summary.totalSpent || 0;
  const income = settings.monthlyIncome || 0;
  const remaining = income - totalSpent;
  const progressPercent = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;

  // Chart SVG Coordinates Calculation
  const width = 500;
  const height = 180;
  const padding = 20;

  // Find max value for Y scaling
  const maxVal = Math.max(...dailyData.map((d) => d.amount), income, 1000);

  const getSvgCoordinates = () => {
    if (dailyData.length === 0) return "";
    return dailyData
      .map((d) => {
        const x = padding + ((d.day - 1) / 29) * (width - padding * 2);
        const y = height - padding - (d.amount / maxVal) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  };

  const points = getSvgCoordinates();
  const closedPoints = points ? `${padding},${height - padding} ${points} ${width - padding},${height - padding}` : "";

  // Ideal Burn Line Coordinates
  const idealLineY = height - padding - (income / maxVal) * (height - padding * 2);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Command Centre</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back! Here is a summary of your financial status.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2 border-b-2"></div>
        </div>
      ) : (
        <>
          {/* Card Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Monthly Income Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Baseline Income
                </p>
                <h3 className="text-3xl font-bold mt-1">
                  ₹{income.toFixed(2)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configured baseline monthly income
                </p>
              </div>
            </div>

            {/* Total Spent Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Spent
                </p>
                <h3 className="text-3xl font-bold mt-1 text-primary">
                  ₹{totalSpent.toFixed(2)}
                </h3>
                <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {progressPercent.toFixed(1)}% of baseline income spent
                </p>
              </div>
            </div>

            {/* Remaining Budget Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex items-start gap-4">
              <div
                className={`rounded-lg p-3 ${
                  remaining >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                }`}
              >
                {remaining >= 0 ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Remaining Balance
                </p>
                <h3 className={`text-3xl font-bold mt-1 ${remaining >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  ₹{remaining.toFixed(2)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {remaining >= 0 ? "Under baseline limit" : "Exceeded baseline income!"}
                </p>
              </div>
            </div>
          </div>

          {/* Main Analytics Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart Area */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold">Spending Trajectory</h3>
                <p className="text-xs text-muted-foreground">
                  Cumulative monthly spending vs baseline income.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {dailyData.length > 0 ? (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--color-border)" strokeWidth="0.5" />
                    <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--color-border)" strokeWidth="0.5" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />

                    {/* Ideal Budget Boundary (Dotted) */}
                    {income > 0 && (
                      <line
                        x1={padding}
                        y1={idealLineY}
                        x2={width - padding}
                        y2={idealLineY}
                        stroke="var(--color-destructive)"
                        strokeDasharray="4,4"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Area path */}
                    {closedPoints && <polygon points={closedPoints} fill="url(#areaGrad)" />}

                    {/* Line path */}
                    {points && <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />}

                    {/* Horizontal Labels */}
                    <text x={padding} y={height - 5} fill="var(--color-muted-foreground)" fontSize="9" textAnchor="middle">
                      Day 1
                    </text>
                    <text x={width / 2} y={height - 5} fill="var(--color-muted-foreground)" fontSize="9" textAnchor="middle">
                      Day 15
                    </text>
                    <text x={width - padding} y={height - 5} fill="var(--color-muted-foreground)" fontSize="9" textAnchor="middle">
                      Day 30
                    </text>

                    {/* Y Labels */}
                    {income > 0 && (
                      <text x={width - padding - 5} y={idealLineY - 4} fill="var(--color-destructive)" fontSize="8" textAnchor="end">
                        Limit: ₹{income}
                      </text>
                    )}
                  </svg>
                ) : (
                  <p className="text-xs text-muted-foreground">Not enough data to map trajectory.</p>
                )}
              </div>
            </div>

            {/* Category Breakdown list */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold">Category Distribution</h3>
                <p className="text-xs text-muted-foreground">
                  Where your money goes this month.
                </p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[190px] pr-2">
                {summary.categoryBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No data in this period
                  </div>
                ) : (
                  summary.categoryBreakdown.map((item, idx) => {
                    const pct = totalSpent > 0 ? ((item.amount / totalSpent) * 100).toFixed(0) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>{item.category}</span>
                          <span className="text-muted-foreground">₹{item.amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Recent Invoices</h3>
                <p className="text-xs text-muted-foreground">
                  Your last 5 ledger logs.
                </p>
              </div>
              <Link
                to="/ledger"
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Full Ledger <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-border text-sm">
              {recentTransactions.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground text-xs">
                  No records to display.
                </div>
              ) : (
                recentTransactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3 hover:bg-muted/10 transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{t.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} • {new Date(t.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">₹{t.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardView;
