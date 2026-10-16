
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Tags,
  X,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  description: "",
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("categories/");
      setCategories(getList(response.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load categories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const query = search.toLowerCase();

    return (
      category.name?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
  });

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(category) {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name,
        description: form.description.trim(),
      };

      if (editingId !== null) {
        await api.patch(`categories/${editingId}/`, payload);
        setSuccess("Category updated successfully.");
      } else {
        await api.post("categories/", payload);
        setSuccess("Category added successfully.");
      }

      setModalOpen(false);
      setForm(emptyForm);
      await loadCategories();
      setSuccess(
        editingId !== null
          ? "Category updated successfully."
          : "Category added successfully."
      );
    } catch (err) {
      const data = err.response?.data;

      if (data && typeof data === "object") {
        const messages = Object.entries(data)
          .map(([field, value]) => {
            const message = Array.isArray(value)
              ? value.join(" ")
              : String(value);

            return `${field}: ${message}`;
          })
          .join(" ");

        setError(messages || "Could not save category.");
      } else {
        setError("Could not save category. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`categories/${category.id}/`);
      setSuccess("Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
          "Could not delete this category. It may be linked to existing products."
      );
    }
  }

  return (
    <div className="categories-page">
      <div className="categories-heading">
        <div>
          <h1>Categories</h1>
          <p>Organize your inventory by product category.</p>
        </div>

        <button className="categories-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {error && !modalOpen && (
        <div className="categories-message categories-error">
          {error}
        </div>
      )}

      {success && (
        <div className="categories-message categories-success">
          {success}
        </div>
      )}

      <div className="categories-stats">
        <div className="categories-stat-icon">
          <Tags size={23} />
        </div>
        <div>
          <p>Total Categories</p>
          <h2>{categories.length}</h2>
        </div>
      </div>

      <div className="categories-panel">
        <div className="categories-toolbar">
          <div>
            <h2>All Categories</h2>
            <p>Manage your product categories</p>
          </div>

          <div className="categories-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="categories-icon-btn"
            onClick={loadCategories}
            title="Refresh categories"
            aria-label="Refresh categories"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="categories-empty">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="categories-empty">
            <Tags size={35} />
            <h3>No categories found</h3>
            <p>
              {search
                ? "Try another search term."
                : "Add your first category to get started."}
            </p>
          </div>
        ) : (
          <div className="categories-table-wrap">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>ID</th>
                  <th className="categories-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="categories-name-cell">
                        <span className="categories-row-icon">
                          <Tags size={17} />
                        </span>
                        <strong>{category.name}</strong>
                      </div>
                    </td>

                    <td>
                      {category.description || "No description"}
                    </td>

                    <td>#{category.id}</td>

                    <td>
                      <div className="categories-actions">
                        <button
                          className="categories-edit-btn"
                          onClick={() => openEditModal(category)}
                          title="Edit category"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="categories-delete-btn"
                          onClick={() => handleDelete(category)}
                          title="Delete category"
                          aria-label={`Delete ${category.name}`}
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

      {modalOpen && (
        <div
          className="categories-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div
            className="categories-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="categories-modal-title"
          >
            <div className="categories-modal-heading">
              <div>
                <h2 id="categories-modal-title">
                  {editingId !== null ? "Edit Category" : "Add Category"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update category information."
                    : "Enter the details for the new category."}
                </p>
              </div>

              <button
                className="categories-icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            {error && (
              <div className="categories-message categories-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="categories-form-field">
                <label htmlFor="category-name">Category Name *</label>
                <input
                  id="category-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Electronics"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="categories-form-field">
                <label htmlFor="category-description">Description</label>
                <textarea
                  id="category-description"
                  name="description"
                  placeholder="Enter a short description..."
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="categories-form-actions">
                <button
                  type="button"
                  className="categories-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="categories-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Save Changes"
                    : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
