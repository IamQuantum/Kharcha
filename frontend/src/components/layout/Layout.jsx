import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import {
  LayoutDashboard,
  Receipt,
  Sliders,
  LogOut,
  Menu,
  X,
  Wallet
} from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Ledger", path: "/ledger", icon: Receipt },
    { name: "Budgets & Settings", path: "/budgets", icon: Sliders },
  ];

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center px-6 border-b border-border gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-wider text-primary">QUANTUM EXPENSE</span>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold uppercase">
              {user?.email?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 md:hidden">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-wider text-primary">QUANTUM EXPENSE</span>
          </div>
          <button onClick={toggleMobile} className="text-foreground focus:outline-none">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={toggleMobile}>
            <div
              className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-6 shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-16 items-center gap-2 border-b border-border -mx-6 -mt-6 px-6">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg tracking-wider text-primary">QUANTUM EXPENSE</span>
              </div>
              <nav className="flex-1 space-y-1 py-6">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={toggleMobile}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold uppercase">
                    {user?.email?.charAt(0) || "U"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleMobile();
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
