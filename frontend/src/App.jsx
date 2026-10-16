
import { useEffect, useState } from "react";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import StockMovements from "./pages/StockMovements";
import Reports from "./pages/Reports";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowLeftRight,
  Search,
  Bell,
  LogOut,
  Boxes,
  AlertTriangle,
  Wallet,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  LockKeyhole,
  Eye,
  EyeOff,
  Menu,
  X,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "./services/api";
import "./index.css";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Products", icon: Package },
  { label: "Categories", icon: Tags },
  { label: "Suppliers", icon: Truck },
  { label: "Stock Movements", icon: ArrowLeftRight },
  { label: "Reports", icon: ChartNoAxesCombined },
];


function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await api.post("auth/register/", {
          username: username.trim(),
          password,
        });

        setSuccess("Account created successfully. Please sign in.");
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        const response = await api.post("auth/login/", {
          username: username.trim(),
          password,
        });

        localStorage.setItem("access_token", response.data.access);
        localStorage.setItem("refresh_token", response.data.refresh);
        onLogin();
      }
    } catch (err) {
      const data = err.response?.data;

      if (data?.username) {
        setError(
          Array.isArray(data.username)
            ? data.username.join(" ")
            : String(data.username)
        );
      } else if (data?.password) {
        setError(
          Array.isArray(data.password)
            ? data.password.join(" ")
            : String(data.password)
        );
      } else if (data?.detail) {
        setError(String(data.detail));
      } else {
        setError(
          isRegister
            ? "Registration failed. Please check your details."
            : "Login failed. Please check your username and password."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-art">
        <div className="brand">
          <div className="brand-mark"><Boxes size={25} /></div>
          <span>STOCK<span className="brand-accent">FLOW</span></span>
        </div>

        <div className="login-art-content">
          <span className="eyebrow">
            <span className="live-dot" /> INVENTORY INTELLIGENCE
          </span>
          <h1>Your inventory.<br />Under control.</h1>
          <p>One clear view of your stock, suppliers, and daily operations.</p>
          <div className="art-stat">
            <div className="art-stat-icon"><Activity size={21} /></div>
            <div>
              <strong>Real-time visibility</strong>
              <span>Know what you have. Know what you need.</span>
            </div>
          </div>
        </div>

        <span className="login-footer">SMARTER STOCK MANAGEMENT</span>
      </section>

      <section className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mobile-brand brand">
            <div className="brand-mark"><Boxes size={23} /></div>
            <span>STOCK<span className="brand-accent">FLOW</span></span>
          </div>

          <span className="eyebrow">
            {isRegister ? "JOIN STOCKFLOW" : "WELCOME BACK"}
          </span>
          <h2>{isRegister ? "Create your account" : "Sign in to your workspace"}</h2>
          <p className="muted">
            {isRegister
              ? "Create an account to access your workspace."
              : "Enter your account details to continue."}
          </p>

          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            autoComplete="username"
            maxLength={150}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "Create a strong password" : "Enter your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isRegister && (
            <>
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter your password again"
                autoComplete="new-password"
                required
              />
            </>
          )}

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button
            className="primary-button login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? (isRegister ? "Creating account..." : "Signing in...")
              : (isRegister ? "Create account" : "Sign in to dashboard")}
          </button>

          <p className="muted" style={{ textAlign: "center", marginTop: "18px" }}>
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
                setSuccess("");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>

          <div className="secure-note">
            <LockKeyhole size={14} /> Protected with secure authentication
          </div>
        </form>
      </section>
    </main>
  );
}


function StatCard({ title, value, note, icon: Icon, accent, prefix = "" }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>
        <span className={`stat-icon ${accent}`}><Icon size={20} /></span>
      </div>
      <div className="stat-value">{prefix}{value}</div>
      <div className="stat-note"><span className="note-dot" />{note}</div>
    </article>
  );
}

function Dashboard({ onLogout, page, setPage }) {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, productsRes, transactionsRes] = await Promise.all([
        api.get("dashboard/summary/"),
        api.get("products/"),
        api.get("inventory/transactions/"),
      ]);

      setSummary(summaryRes.data);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.results || []);
      setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : transactionsRes.data.results || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        onLogout();
        return;
      }
      setError("Could not load dashboard data. Check that the Django server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const lowStock = products.filter((p) => p.is_low_stock || Number(p.stock_quantity) <= Number(p.reorder_level));
  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA");
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        incoming: transactions
          .filter((t) => String(t.created_at).slice(0, 10) === key && t.transaction_type === "IN")
          .reduce((sum, t) => sum + Number(t.quantity), 0),
        outgoing: transactions
          .filter((t) => String(t.created_at).slice(0, 10) === key && t.transaction_type === "OUT")
          .reduce((sum, t) => sum + Number(t.quantity), 0),
      });
    }
    return days;
  })();

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const dateText = (value) =>
    value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="app-shell">
      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand sidebar-brand">
          <div className="brand-mark"><Boxes size={24} /></div>
          <span>STOCK<span className="brand-accent">FLOW</span></span>
          <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${page === label ? "active" : ""}`}
              onClick={() => { setPage(label); setMobileNav(false); }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "Stock Movements" && <span className="nav-arrow">↗</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Activity size={18} /></div>
            <strong>Stay ahead of stock</strong>
            <p>Review low-stock items before they run out.</p>
            <button onClick={() => { setPage("Products"); setMobileNav(false); }}>Review products →</button>
          </div>
          <button className="nav-item logout-item" onClick={onLogout}><LogOut size={18} /><span>Sign out</span></button>
          <div className="sidebar-version">STOCKFLOW <span>•</span> INVENTORY SYSTEM</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          <div className="topbar-actions">
            <div className="system-status"><span className="live-dot" /> System online</div>
            <button className="icon-button" title="Refresh dashboard" onClick={loadDashboard}><RefreshCw size={18} /></button>
            <div className="avatar">SF</div>
          </div>
        </header>

        <div className="page-content">
          {page === "Overview" ? (
            <>
              <section className="welcome-row">
                <div>
                  <span className="eyebrow">YOUR INVENTORY AT A GLANCE</span>
                  <h1>Good to see you<span className="heading-dot">.</span></h1>
                  <p className="muted">Here’s what’s happening with your inventory today.</p>
                </div>
                <button className="secondary-button" onClick={loadDashboard}><RefreshCw size={16} /> Refresh data</button>
              </section>

              {error && <div className="error-banner"><AlertTriangle size={18} />{error}</div>}

              <section className="stats-grid">
                <StatCard title="Total products" value={loading ? "—" : summary?.total_products ?? products.length} note="Products in your catalog" icon={Package} accent="green" />
                <StatCard title="Total units in stock" value={loading ? "—" : Number(summary?.total_stock || 0).toLocaleString("en-IN")} note="Units currently available" icon={Boxes} accent="blue" />
                <StatCard title="Inventory value" value={loading ? "—" : money(summary?.stock_value)} note="Based on cost price" icon={Wallet} accent="purple" />
                <StatCard title="Low-stock items" value={loading ? "—" : summary?.low_stock_count ?? lowStock.length} note="Need your attention" icon={AlertTriangle} accent="orange" />
              </section>

              <section className="middle-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div><h2>Stock activity</h2><p>Incoming vs outgoing units · Last 7 days</p></div>
                    <span className="chart-badge"><Activity size={15} /> ACTIVITY</span>
                  </div>
                  <div className="chart-legend">
                    <span><i className="legend-in" /> Stock in</span>
                    <span><i className="legend-out" /> Stock out</span>
                  </div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="incomingFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#b8f34a" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#b8f34a" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="outgoingFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#79a8ff" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#79a8ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#29312d" strokeDasharray="3 5" vertical={false} />
                        <XAxis dataKey="day" stroke="#89938c" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis stroke="#89938c" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#171d19", border: "1px solid #343e37", borderRadius: 10, color: "#f3f6f2" }} />
                        <Area type="monotone" dataKey="incoming" name="Stock in" stroke="#b8f34a" strokeWidth={2.5} fill="url(#incomingFill)" />
                        <Area type="monotone" dataKey="outgoing" name="Stock out" stroke="#79a8ff" strokeWidth={2.5} fill="url(#outgoingFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="chart-footnote">Activity is calculated from recorded stock transactions.</p>
                </article>

                <article className="panel attention-panel">
                  <div className="panel-heading">
                    <div><h2>Needs attention</h2><p>Items at or below reorder level</p></div>
                    <span className="alert-count">{loading ? "—" : lowStock.length}</span>
                  </div>
                  {loading ? <div className="empty-state">Loading inventory…</div> : lowStock.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon"><Package size={22} /></span><strong>All clear!</strong><p>No low-stock items right now.</p></div>
                  ) : (
                    <div className="attention-list">
                      {lowStock.slice(0, 5).map((product) => (
                        <div className="attention-item" key={product.id}>
                          <div className="product-mini-icon"><Package size={18} /></div>
                          <div className="attention-info"><strong>{product.name}</strong><span>SKU: {product.sku}</span></div>
                          <div className="stock-remaining"><strong>{product.stock_quantity}</strong><span>left</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="text-link" onClick={() => setPage("Products")}>View product catalog <span>→</span></button>
                </article>
              </section>

              <section className="panel transactions-panel">
                <div className="panel-heading transaction-heading">
                  <div><h2>Recent stock movements</h2><p>Latest recorded inventory transactions</p></div>
                  <button className="secondary-button compact-button" onClick={() => setPage("Stock Movements")}>View all <span>→</span></button>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>PRODUCT</th><th>TYPE</th><th>QUANTITY</th><th>DATE & TIME</th><th>NOTE</th></tr></thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" className="table-empty">Loading transactions…</td></tr>
                      ) : transactions.length === 0 ? (
                        <tr><td colSpan="5" className="table-empty">No stock movements recorded yet.</td></tr>
                      ) : transactions.slice(0, 6).map((t) => (
                        <tr key={t.id}>
                          <td><div className="table-product"><div className="table-product-icon"><Package size={16} /></div><div><strong>{t.product_name || `Product #${t.product}`}</strong><span>{t.sku || "Inventory item"}</span></div></div></td>
                          <td><span className={`type-pill ${t.transaction_type === "IN" ? "type-in" : "type-out"}`}>{t.transaction_type === "IN" ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}{t.transaction_type === "IN" ? "Stock In" : "Stock Out"}</span></td>
                          <td><strong className={t.transaction_type === "IN" ? "quantity-in" : "quantity-out"}>{t.transaction_type === "IN" ? "+" : "−"}{t.quantity}</strong></td>
                          <td className="date-cell">{dateText(t.created_at)}</td>
                          <td className="note-cell">{t.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-footer">Showing {Math.min(transactions.length, 6)} of {transactions.length} transactions</div>
              </section>
            </>
          ) : page === "Products" ? (
            <Products />

          ) : page === "Categories" ? (
            <Categories />

          ) : page === "Suppliers" ? (
            <Suppliers />

          ) : page === "Stock Movements" ? (
              <StockMovements />
          ) : page === "Reports" ? (
            <Reports />

          ) : (
            <section className="placeholder-page panel">
              <div className="placeholder-icon"><Package size={28} /></div>
              <span className="eyebrow">STOCKFLOW WORKSPACE</span>
              <h1>{page}</h1>
              <p>This section is ready for the next development step. We’ll connect it to your existing Django APIs.</p>
              {page === "Products" && (
                <input className="placeholder-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by name or SKU..." />
              )}
              {page === "Products" && (
                <div className="table-scroll placeholder-table">
                  <table><thead><tr><th>PRODUCT</th><th>SKU</th><th>STOCK</th><th>STATUS</th></tr></thead>
                    <tbody>{filteredProducts.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.sku}</td><td>{p.stock_quantity}</td><td><span className={`type-pill ${(p.is_low_stock || Number(p.stock_quantity) <= Number(p.reorder_level)) ? "type-out" : "type-in"}`}>{(p.is_low_stock || Number(p.stock_quantity) <= Number(p.reorder_level)) ? "Low stock" : "In stock"}</span></td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {page === "Stock Movements" && (
                <div className="table-scroll placeholder-table">
                  <table><thead><tr><th>PRODUCT</th><th>TYPE</th><th>QUANTITY</th><th>DATE</th></tr></thead>
                    <tbody>{transactions.map((t) => <tr key={t.id}><td>{t.product_name || `Product #${t.product}`}</td><td>{t.transaction_type === "IN" ? "Stock In" : "Stock Out"}</td><td>{t.quantity}</td><td>{dateText(t.created_at)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {page !== "Products" && page !== "Stock Movements" && <p className="muted">Your backend API is already available for this module.</p>}
              <button className="primary-button placeholder-button" onClick={() => setPage("Overview")}>← Back to overview</button>
            </section>
          )}

          <footer className="page-footer"><span>STOCKFLOW INVENTORY MANAGEMENT</span><span>Built for smarter operations <span className="footer-heart">✳</span></span></footer>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem("access_token")));
  const [page, setPage] = useState("Overview");

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAuthenticated(false);
    setPage("Overview");
  }

  return authenticated
    ? <Dashboard onLogout={logout} page={page} setPage={setPage} />
    : <Login onLogin={() => setAuthenticated(true)} />;
}
