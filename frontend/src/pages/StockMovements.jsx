
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  PackagePlus,
  PackageMinus,
  Search,
  RefreshCw,
  X,
  CalendarDays,
  Boxes,
  History,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  product: "",
  transaction_type: "IN",
  quantity: "1",
  note: "",
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockMovements() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [transactionResponse, productResponse] = await Promise.all([
        api.get("inventory/transactions/"),
        api.get("products/"),
      ]);

      setTransactions(getList(transactionResponse.data));
      setProducts(getList(productResponse.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load stock movements. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((item) => {
      const matchesType =
        typeFilter === "ALL" ||
        item.transaction_type === typeFilter;

      const matchesSearch = [
        item.product_name,
        item.sku,
        item.note,
        String(item.id),
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      return matchesType && matchesSearch;
    });
  }, [transactions, search, typeFilter]);

  const totalIn = transactions
    .filter((item) => item.transaction_type === "IN")
    .reduce((total, item) => total + Number(item.quantity || 0), 0);

  const totalOut = transactions
    .filter((item) => item.transaction_type === "OUT")
    .reduce((total, item) => total + Number(item.quantity || 0), 0);

  function openModal(type = "IN") {
    setForm({
      ...emptyForm,
      transaction_type: type,
      product: products.length ? String(products[0].id) : "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const selectedProduct = products.find(
    (product) => String(product.id) === String(form.product)
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.product) {
      setError("Please select a product.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (
      form.transaction_type === "OUT" &&
      selectedProduct &&
      quantity > Number(selectedProduct.stock_quantity || 0)
    ) {
      setError(
        `Insufficient stock. Available quantity: ${selectedProduct.stock_quantity}.`
      );
      return;
    }

    setSaving(true);

    try {
      await api.post("inventory/transactions/", {
        product: Number(form.product),
        transaction_type: form.transaction_type,
        quantity,
        note: form.note.trim(),
      });

      setModalOpen(false);
      setForm({ ...emptyForm });
      setSuccess(
        form.transaction_type === "IN"
          ? "Stock added successfully."
          : "Stock removed successfully."
      );

      await loadData();
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(" ")
              : typeof value === "object"
              ? JSON.stringify(value)
              : String(value);

            return `${field}: ${message}`;
          })
          .join(" ");

        setError(messages || "Could not save stock movement.");
      } else {
        setError("Could not save stock movement. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stock-page">
      <div className="stock-heading">
        <div>
          <h1>Stock Movements</h1>
          <p>Track stock in, stock out, and inventory changes.</p>
        </div>

        <div className="stock-heading-actions">
          <button
            className="stock-btn stock-btn-secondary"
            onClick={() => openModal("OUT")}
          >
            <PackageMinus size={17} />
            Stock Out
          </button>

          <button
            className="stock-btn stock-btn-primary"
            onClick={() => openModal("IN")}
          >
            <PackagePlus size={17} />
            Stock In
          </button>
        </div>
      </div>

      {error && !modalOpen && (
        <div className="stock-message stock-error">{error}</div>
      )}

      {success && (
        <div className="stock-message stock-success">{success}</div>
      )}

      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <History size={22} />
          </div>
          <div>
            <p>Total Transactions</p>
            <h2>{transactions.length}</h2>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <PackagePlus size={22} />
          </div>
          <div>
            <p>Total Stock In</p>
            <h2>{totalIn.toLocaleString("en-IN")}</h2>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <PackageMinus size={22} />
          </div>
          <div>
            <p>Total Stock Out</p>
            <h2>{totalOut.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      </div>

      <div className="stock-panel">
        <div className="stock-toolbar">
          <div>
            <h2>Transaction History</h2>
            <p>Review and search inventory movements.</p>
          </div>

          <div className="stock-toolbar-actions">
            <div className="stock-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search product, SKU, note..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="stock-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter transaction type"
            >
              <option value="ALL">All Types</option>
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
            </select>

            <button
              className="stock-icon-btn"
              onClick={loadData}
              title="Refresh"
              aria-label="Refresh stock movements"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="stock-empty">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="stock-empty">
            <ArrowLeftRight size={36} />
            <h3>No stock movements found</h3>
            <p>
              {search || typeFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Use Stock In or Stock Out to record your first movement."}
            </p>
          </div>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Note</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((item) => (
                  <tr key={item.id}>
                    <td className="stock-id">#{item.id}</td>

                    <td>
                      <div className="stock-product-cell">
                        <span className="stock-product-icon">
                          <Boxes size={17} />
                        </span>
                        <strong>{item.product_name || "Unknown product"}</strong>
                      </div>
                    </td>

                    <td>{item.sku || "—"}</td>

                    <td>
                      <span
                        className={
                          item.transaction_type === "IN"
                            ? "stock-type-badge stock-type-in"
                            : "stock-type-badge stock-type-out"
                        }
                      >
                        {item.transaction_type === "IN"
                          ? "Stock In"
                          : "Stock Out"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          item.transaction_type === "IN"
                            ? "stock-quantity stock-quantity-in"
                            : "stock-quantity stock-quantity-out"
                        }
                      >
                        {item.transaction_type === "IN" ? "+" : "−"}
                        {item.quantity}
                      </span>
                    </td>

                    <td>
                      <span className="stock-note">
                        {item.note || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="stock-date">
                        <CalendarDays size={14} />
                        {formatDate(item.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredTransactions.length > 0 && (
          <div className="stock-table-footer">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="stock-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div
            className="stock-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-modal-title"
          >
            <div className="stock-modal-heading">
              <div>
                <h2 id="stock-modal-title">
                  {form.transaction_type === "IN"
                    ? "Record Stock In"
                    : "Record Stock Out"}
                </h2>
                <p>
                  {form.transaction_type === "IN"
                    ? "Add quantity to existing inventory."
                    : "Remove quantity from available inventory."}
                </p>
              </div>

              <button
                type="button"
                className="stock-icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            {error && (
              <div className="stock-message stock-error">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="stock-form-field">
                <label htmlFor="stock-product">Select Product *</label>
                <select
                  id="stock-product"
                  name="product"
                  value={form.product}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>

                {selectedProduct && (
                  <p className="stock-available">
                    Available stock:{" "}
                    <strong>{selectedProduct.stock_quantity ?? 0}</strong>
                  </p>
                )}
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-type">Movement Type *</label>
                <select
                  id="stock-type"
                  name="transaction_type"
                  value={form.transaction_type}
                  onChange={handleChange}
                  required
                >
                  <option value="IN">Stock In — Add quantity</option>
                  <option value="OUT">Stock Out — Remove quantity</option>
                </select>
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-quantity">Quantity *</label>
                <input
                  id="stock-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="stock-form-field">
                <label htmlFor="stock-note">Note</label>
                <textarea
                  id="stock-note"
                  name="note"
                  rows={3}
                  maxLength={255}
                  placeholder="e.g. New stock received or item sold"
                  value={form.note}
                  onChange={handleChange}
                />
              </div>

              {products.length === 0 && (
                <div className="stock-message stock-error">
                  No products are available. Add a product before recording a stock movement.
                </div>
              )}

              <div className="stock-form-actions">
                <button
                  type="button"
                  className="stock-btn stock-btn-cancel"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="stock-btn stock-btn-primary"
                  disabled={saving || products.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : form.transaction_type === "IN"
                    ? "Confirm Stock In"
                    : "Confirm Stock Out"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
