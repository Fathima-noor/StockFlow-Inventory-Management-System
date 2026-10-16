
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Package,
  Boxes,
  Wallet,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../services/api";

const getList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function downloadCSV(filename, rows) {
  if (!rows.length) {
    window.alert("No data available to export.");
    return;
  }

  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [transactionFilter, setTransactionFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const [summaryRes, productsRes, transactionsRes] =
        await Promise.all([
          api.get("dashboard/summary/"),
          api.get("products/"),
          api.get("inventory/transactions/"),
        ]);

      setSummary(summaryRes.data);
      setProducts(getList(productsRes.data));
      setTransactions(getList(transactionsRes.data));
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Your session has expired. Please sign in again."
          : "Could not load reports. Check the server and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const lowStock = useMemo(
    () =>
      products.filter(
        (product) =>
          product.is_low_stock ||
          Number(product.stock_quantity) <=
            Number(product.reorder_level)
      ),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = search.toLowerCase();

      const matchesSearch =
        `${product.name || ""} ${product.sku || ""}`
          .toLowerCase()
          .includes(query);

      const isLow =
        product.is_low_stock ||
        Number(product.stock_quantity) <=
          Number(product.reorder_level);

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW" && isLow) ||
        (stockFilter === "AVAILABLE" && !isLow);

      return matchesSearch && matchesStock;
    });
  }, [products, search, stockFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        `${item.product_name || ""} ${item.sku || ""} ${item.note || ""}`
          .toLowerCase()
          .includes(query);

      const matchesType =
        transactionFilter === "ALL" ||
        item.transaction_type === transactionFilter;

      const date = item.created_at
        ? getLocalDate(new Date(item.created_at))
        : "";

      const matchesStart = !startDate || date >= startDate;
      const matchesEnd = !endDate || date <= endDate;

      return (
        matchesSearch &&
        matchesType &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    transactions,
    search,
    transactionFilter,
    startDate,
    endDate,
  ]);

  const chartData = useMemo(() => {
    const grouped = {};

    filteredTransactions.forEach((item) => {
      if (!item.created_at) return;

      const date = getLocalDate(new Date(item.created_at));

      if (!grouped[date]) {
        grouped[date] = {
          date,
          stockIn: 0,
          stockOut: 0,
        };
      }

      if (item.transaction_type === "IN") {
        grouped[date].stockIn += Number(item.quantity || 0);
      } else if (item.transaction_type === "OUT") {
        grouped[date].stockOut += Number(item.quantity || 0);
      }
    });

    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        day: new Date(`${item.date}T00:00:00`).toLocaleDateString(
          "en-IN",
          { day: "2-digit", month: "short" }
        ),
      }));
  }, [filteredTransactions]);

  const stockInTotal = filteredTransactions
    .filter((item) => item.transaction_type === "IN")
    .reduce((total, item) => total + Number(item.quantity || 0), 0);

  const stockOutTotal = filteredTransactions
    .filter((item) => item.transaction_type === "OUT")
    .reduce((total, item) => total + Number(item.quantity || 0), 0);

  function exportInventory() {
    downloadCSV("stockflow-inventory-report.csv", [
      [
        "Product ID",
        "Product Name",
        "SKU",
        "Stock Quantity",
        "Reorder Level",
        "Cost Price",
        "Stock Status",
      ],
      ...filteredProducts.map((product) => {
        const isLow =
          product.is_low_stock ||
          Number(product.stock_quantity) <=
            Number(product.reorder_level);

        return [
          product.id,
          product.name,
          product.sku,
          product.stock_quantity,
          product.reorder_level,
          product.cost_price,
          isLow ? "Low Stock" : "Available",
        ];
      }),
    ]);
  }

  function exportTransactions() {
    downloadCSV("stockflow-stock-movements.csv", [
      [
        "Transaction ID",
        "Product",
        "SKU",
        "Transaction Type",
        "Quantity",
        "Note",
        "Date",
      ],
      ...filteredTransactions.map((item) => [
        item.id,
        item.product_name || `Product #${item.product}`,
        item.sku,
        item.transaction_type === "IN" ? "Stock In" : "Stock Out",
        item.quantity,
        item.note,
        formatDate(item.created_at),
      ]),
    ]);
  }

  function exportPDF() {
    window.print();
  }

  function clearFilters() {
    setSearch("");
    setStockFilter("ALL");
    setTransactionFilter("ALL");
    setStartDate("");
    setEndDate("");
  }

  const summaryCards = [
    {
      title: "Total products",
      value: summary?.total_products ?? products.length,
      note: "Products in catalog",
      icon: Package,
      color: "green",
    },
    {
      title: "Total stock units",
      value: Number(summary?.total_stock || 0).toLocaleString("en-IN"),
      note: "Current inventory quantity",
      icon: Boxes,
      color: "blue",
    },
    {
      title: "Inventory value",
      value: money(summary?.stock_value),
      note: "Based on cost price",
      icon: Wallet,
      color: "purple",
    },
    {
      title: "Low-stock items",
      value: summary?.low_stock_count ?? lowStock.length,
      note: "At or below reorder level",
      icon: AlertTriangle,
      color: "orange",
    },
  ];

  return (
    <div className="reports-page">
      <section className="reports-header">
        <div>
          <span className="eyebrow">INVENTORY INSIGHTS</span>
          <h1>
            Reports<span className="heading-dot">.</span>
          </h1>
          <p className="muted">
            Monitor inventory, review stock movements, and export reports.
          </p>
        </div>

        <div className="reports-header-actions">
          <button
            className="secondary-button"
            onClick={loadReports}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="primary-button reports-export"
            onClick={exportPDF}
            disabled={loading}
          >
            <Printer size={16} />
            Save as PDF
          </button>
        </div>
      </section>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="reports-stats">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="reports-stat" key={card.title}>
              <div className={`reports-stat-icon ${card.color}`}>
                <Icon size={20} />
              </div>
              <span>{card.title}</span>
              <strong>
                {loading ? "—" : card.value}
              </strong>
              <small>{card.note}</small>
            </article>
          );
        })}
      </section>

      <section className="panel reports-panel">
        <div className="reports-panel-heading">
          <div>
            <h2>
              <BarChart3 size={19} />
              Stock movement analytics
            </h2>
            <p>Daily stock quantities for the selected date range</p>
          </div>
        </div>

        <div className="reports-movement-summary">
          <div>
            <span className="movement-dot movement-in" />
            <span>Total stock in</span>
            <strong>{loading ? "—" : stockInTotal.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span className="movement-dot movement-out" />
            <span>Total stock out</span>
            <strong>{loading ? "—" : stockOutTotal.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="reports-chart">
          {loading ? (
            <p className="reports-chart-empty">Loading chart...</p>
          ) : chartData.length === 0 ? (
            <p className="reports-chart-empty">
              No stock transactions available for this date range.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#29312d"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#89938c"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#89938c"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#171d19",
                    border: "1px solid #343e37",
                    borderRadius: 10,
                    color: "#f3f6f2",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="stockIn"
                  name="Stock In"
                  fill="#b8f044"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="stockOut"
                  name="Stock Out"
                  fill="#79a8ff"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel reports-panel">
        <div className="reports-panel-heading">
          <div>
            <h2>
              <Package size={19} />
              Inventory report
            </h2>
            <p>Product quantities, cost prices, and stock status</p>
          </div>

          <button
            className="primary-button reports-export"
            onClick={exportInventory}
            disabled={loading}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="reports-toolbar">
          <div className="reports-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or SKU..."
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            aria-label="Filter inventory by stock status"
          >
            <option value="ALL">All products</option>
            <option value="LOW">Low stock</option>
            <option value="AVAILABLE">Above reorder level</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU</th>
                <th>STOCK</th>
                <th>REORDER LEVEL</th>
                <th>COST PRICE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    Loading inventory report...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty">
                    No matching products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow =
                    product.is_low_stock ||
                    Number(product.stock_quantity) <=
                      Number(product.reorder_level);

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="reports-product-name">
                          <Package size={16} />
                          <strong>{product.name}</strong>
                        </div>
                      </td>
                      <td>{product.sku || "—"}</td>
                      <td>{product.stock_quantity ?? 0}</td>
                      <td>{product.reorder_level ?? 0}</td>
                      <td>{money(product.cost_price)}</td>
                      <td>
                        <span
                          className={`type-pill ${
                            isLow ? "type-out" : "type-in"
                          }`}
                        >
                          {isLow ? "Low stock" : "Available"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="reports-table-footer">
          Showing {loading ? 0 : filteredProducts.length} of {products.length} products
        </div>
      </section>

      <section className="panel reports-panel">
        <div className="reports-panel-heading">
          <div>
            <h2>
              <FileText size={19} />
              Stock movement report
            </h2>
            <p>Filter transactions by date, product, and movement type</p>
          </div>

          <button
            className="primary-button reports-export"
            onClick={exportTransactions}
            disabled={loading}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="reports-date-filters">
          <label>
            From date
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label>
            To date
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>

          <button
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>

        <div className="reports-toolbar">
          <div className="reports-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, or note..."
            />
          </div>

          <select
            value={transactionFilter}
            onChange={(e) => setTransactionFilter(e.target.value)}
            aria-label="Filter transaction type"
          >
            <option value="ALL">All movements</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
          </select>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>TYPE</th>
                <th>QUANTITY</th>
                <th>DATE &amp; TIME</th>
                <th>NOTE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    No matching transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="reports-product-name">
                        <FileText size={16} />
                        <strong>
                          {item.product_name || `Product #${item.product}`}
                        </strong>
                      </div>
                      <small>{item.sku || ""}</small>
                    </td>
                    <td>
                      <span
                        className={`type-pill ${
                          item.transaction_type === "IN"
                            ? "type-in"
                            : "type-out"
                        }`}
                      >
                        {item.transaction_type === "IN" ? (
                          <ArrowDownToLine size={13} />
                        ) : (
                          <ArrowUpFromLine size={13} />
                        )}
                        {item.transaction_type === "IN" ? "Stock In" : "Stock Out"}
                      </span>
                    </td>
                    <td>
                      <strong
                        className={
                          item.transaction_type === "IN"
                            ? "quantity-in"
                            : "quantity-out"
                        }
                      >
                        {item.transaction_type === "IN" ? "+" : "−"}
                        {item.quantity}
                      </strong>
                    </td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>{item.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="reports-table-footer">
          Showing {loading ? 0 : filteredTransactions.length} of {transactions.length} transactions
        </div>
      </section>
    </div>
  );
}
