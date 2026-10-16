
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  supplier: "",
  cost_price: "",
  selling_price: "",
  reorder_level: "5",
  description: "",
};

function getList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productRes, categoryRes, supplierRes] =
        await Promise.all([
          api.get("products/"),
          api.get("categories/"),
          api.get("suppliers/"),
        ]);

      setProducts(getList(productRes.data));
      setCategories(getList(categoryRes.data));
      setSuppliers(getList(supplierRes.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load products. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) =>
      `${product.name || ""} ${product.sku || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [products, search]);

  function openAddForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(product) {
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category ?? "",
      supplier: product.supplier ?? "",
      cost_price: product.cost_price ?? "",
      selling_price: product.selling_price ?? "",
      reorder_level: product.reorder_level ?? 5,
      description: product.description || "",
    });

    setEditingId(product.id);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      Number(form.cost_price) < 0 ||
      Number(form.selling_price) < 0 ||
      Number(form.reorder_level) < 0
    ) {
      setError("Prices and reorder level cannot be negative.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: Number(form.category),
      supplier: form.supplier ? Number(form.supplier) : null,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      reorder_level: Number(form.reorder_level),
      description: form.description.trim(),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await api.patch(`products/${editingId}/`, payload);
        setSuccess("Product updated successfully.");
      } else {
        await api.post("products/", payload);
        setSuccess("Product added successfully.");
      }

      setShowForm(false);
      setForm({ ...emptyForm });
      setEditingId(null);
      await loadData();
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data).map(([field, value]) => {
          const message = Array.isArray(value)
            ? value.join(", ")
            : String(value);

          return `${field}: ${message}`;
        });

        setError(messages.join(" | "));
      } else {
        setError("Could not save product. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`products/${product.id}/`);
      setSuccess("Product deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not delete this product. It may be linked to stock transactions."
      );
    }
  }

  function isLowStock(product) {
    return (
      product.is_low_stock ||
      Number(product.stock_quantity) <= Number(product.reorder_level)
    );
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  return (
    <section className="products-page">
      <div className="products-heading">
        <div>
          <span className="eyebrow">INVENTORY MANAGEMENT</span>
          <h1>Products<span className="heading-dot">.</span></h1>
          <p className="muted">
            Manage your product catalogue and monitor stock levels.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          <Plus size={17} /> Add product
        </button>
      </div>

      <div className="products-toolbar panel">
        <div className="product-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by product name or SKU..."
          />
          {search && (
            <button
              className="icon-button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="secondary-button"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {success && (
        <div className="success-banner" role="status">
          {success}
        </div>
      )}

      <div className="products-summary">
        <article className="panel product-summary-card">
          <Package size={20} />
          <div>
            <span>Total products</span>
            <strong>{products.length}</strong>
          </div>
        </article>

        <article className="panel product-summary-card">
          <AlertTriangle size={20} />
          <div>
            <span>Low-stock products</span>
            <strong>
              {products.filter(isLowStock).length}
            </strong>
          </div>
        </article>
      </div>

      <div className="panel products-table-panel">
        <div className="panel-heading">
          <div>
            <h2>Product catalogue</h2>
            <p>
              {filteredProducts.length} product(s) found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={30} />
            <strong>No products found</strong>
            <p>Add a product or change your search.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SKU</th>
                  <th>COST PRICE</th>
                  <th>SELLING PRICE</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        <div className="table-product-icon">
                          <Package size={17} />
                        </div>
                        <div>
                          <strong>{product.name}</strong>
                          <span>
                            {categories.find(
                              (item) => item.id === Number(product.category)
                            )?.name || "Uncategorised"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{product.sku}</td>
                    <td>{money(product.cost_price)}</td>
                    <td>{money(product.selling_price)}</td>
                    <td>
                      <strong>{product.stock_quantity ?? 0}</strong>
                    </td>
                    <td>
                      <span
                        className={`type-pill ${
                          isLowStock(product) ? "type-out" : "type-in"
                        }`}
                      >
                        {isLowStock(product) ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button
                          className="icon-button"
                          title="Edit product"
                          onClick={() => openEditForm(product)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="icon-button delete-button"
                          title="Delete product"
                          onClick={() => deleteProduct(product)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div
          className="product-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="product-modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
          >
            <div className="product-modal-heading">
              <div>
                <span className="eyebrow">PRODUCT DETAILS</span>
                <h2 id="product-form-title">
                  {editingId !== null ? "Edit product" : "Add product"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="product-form-grid">
                <label>
                  Product name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    required
                    maxLength={150}
                    placeholder="e.g. Wireless Mouse"
                  />
                </label>

                <label>
                  SKU *
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={updateField}
                    required
                    maxLength={100}
                    placeholder="e.g. ACC-001"
                  />
                </label>

                <label>
                  Category *
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Supplier
                  <select
                    name="supplier"
                    value={form.supplier}
                    onChange={updateField}
                  >
                    <option value="">No supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cost price (₹) *
                  <input
                    type="number"
                    name="cost_price"
                    value={form.cost_price}
                    onChange={updateField}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Selling price (₹) *
                  <input
                    type="number"
                    name="selling_price"
                    value={form.selling_price}
                    onChange={updateField}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Reorder level *
                  <input
                    type="number"
                    name="reorder_level"
                    value={form.reorder_level}
                    onChange={updateField}
                    min="0"
                    step="1"
                    required
                  />
                </label>

                <label className="full-width-field">
                  Description
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows="3"
                    placeholder="Enter product details..."
                  />
                </label>
              </div>

              {error && (
                <div className="error-banner" role="alert">
                  {error}
                </div>
              )}

              <div className="product-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Save changes"
                    : "Create product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
