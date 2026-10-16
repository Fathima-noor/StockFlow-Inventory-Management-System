
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Truck,
  X,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  UserRound,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSuppliers() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("suppliers/");
      setSuppliers(getList(response.data));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load suppliers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = search.trim().toLowerCase();

    return [
      supplier.name,
      supplier.contact_person,
      supplier.email,
      supplier.phone,
      supplier.address,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  function openAddModal() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
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
      setError("Please enter the supplier name.");
      return;
    }

    if (form.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(form.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        name,
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };

      if (editingId !== null) {
        await api.patch(`suppliers/${editingId}/`, payload);
      } else {
        await api.post("suppliers/", payload);
      }

      setModalOpen(false);
      setForm({ ...emptyForm });
      setSuccess(
        editingId !== null
          ? "Supplier updated successfully."
          : "Supplier added successfully."
      );

      await loadSuppliers();
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

        setError(messages || "Could not save supplier.");
      } else {
        setError("Could not save supplier. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${supplier.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`suppliers/${supplier.id}/`);
      setSuccess("Supplier deleted successfully.");
      await loadSuppliers();
    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.detail ||
          "Could not delete this supplier. It may be linked to existing products."
      );
    }
  }

  return (
    <div className="suppliers-page">
      <div className="suppliers-heading">
        <div>
          <h1>Suppliers</h1>
          <p>Manage your inventory suppliers and contact details.</p>
        </div>

        <button
          className="suppliers-primary-btn"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {error && !modalOpen && (
        <div className="suppliers-message suppliers-error">
          {error}
        </div>
      )}

      {success && (
        <div className="suppliers-message suppliers-success">
          {success}
        </div>
      )}

      <div className="suppliers-stats">
        <div className="suppliers-stat-icon">
          <Truck size={24} />
        </div>

        <div>
          <p>Total Suppliers</p>
          <h2>{suppliers.length}</h2>
        </div>
      </div>

      <div className="suppliers-panel">
        <div className="suppliers-toolbar">
          <div>
            <h2>All Suppliers</h2>
            <p>View and manage your suppliers</p>
          </div>

          <div className="suppliers-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            className="suppliers-icon-btn"
            onClick={loadSuppliers}
            title="Refresh suppliers"
            aria-label="Refresh suppliers"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="suppliers-empty">
            Loading suppliers...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="suppliers-empty">
            <Truck size={36} />
            <h3>No suppliers found</h3>
            <p>
              {search
                ? "Try a different search term."
                : "Add your first supplier to get started."}
            </p>
          </div>
        ) : (
          <div className="suppliers-table-wrap">
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div className="suppliers-name-cell">
                        <span className="suppliers-row-icon">
                          <Truck size={17} />
                        </span>
                        <strong>{supplier.name}</strong>
                      </div>
                    </td>

                    <td>
                      {supplier.contact_person || "—"}
                    </td>

                    <td>
                      {supplier.email ? (
                        <a
                          className="suppliers-contact-link"
                          href={`mailto:${supplier.email}`}
                        >
                          <Mail size={14} />
                          {supplier.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      {supplier.phone ? (
                        <a
                          className="suppliers-contact-link"
                          href={`tel:${supplier.phone}`}
                        >
                          <Phone size={14} />
                          {supplier.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <span
                        className="suppliers-address"
                        title={supplier.address || ""}
                      >
                        {supplier.address || "—"}
                      </span>
                    </td>

                    <td>
                      <div className="suppliers-actions">
                        <button
                          className="suppliers-edit-btn"
                          onClick={() => openEditModal(supplier)}
                          title="Edit supplier"
                          aria-label={`Edit ${supplier.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="suppliers-delete-btn"
                          onClick={() => handleDelete(supplier)}
                          title="Delete supplier"
                          aria-label={`Delete ${supplier.name}`}
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
          className="suppliers-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div
            className="suppliers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suppliers-modal-title"
          >
            <div className="suppliers-modal-heading">
              <div>
                <h2 id="suppliers-modal-title">
                  {editingId !== null
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>
                <p>
                  Enter the supplier's contact information.
                </p>
              </div>

              <button
                type="button"
                className="suppliers-icon-btn"
                onClick={() => setModalOpen(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            {error && (
              <div className="suppliers-message suppliers-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="suppliers-form-grid">
                <div className="suppliers-form-field suppliers-full-width">
                  <label htmlFor="supplier-name">
                    Supplier Name *
                  </label>
                  <input
                    id="supplier-name"
                    name="name"
                    type="text"
                    placeholder="e.g. ABC Electronics"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={150}
                  />
                </div>

                <div className="suppliers-form-field">
                  <label htmlFor="supplier-contact">
                    Contact Person
                  </label>
                  <div className="suppliers-input-icon">
                    <UserRound size={17} />
                    <input
                      id="supplier-contact"
                      name="contact_person"
                      type="text"
                      placeholder="Contact person's name"
                      value={form.contact_person}
                      onChange={handleChange}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="suppliers-form-field">
                  <label htmlFor="supplier-phone">
                    Phone Number
                  </label>
                  <div className="suppliers-input-icon">
                    <Phone size={17} />
                    <input
                      id="supplier-phone"
                      name="phone"
                      type="tel"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="suppliers-form-field suppliers-full-width">
                  <label htmlFor="supplier-email">
                    Email Address
                  </label>
                  <div className="suppliers-input-icon">
                    <Mail size={17} />
                    <input
                      id="supplier-email"
                      name="email"
                      type="email"
                      placeholder="supplier@example.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="suppliers-form-field suppliers-full-width">
                  <label htmlFor="supplier-address">
                    Address
                  </label>
                  <div className="suppliers-input-icon suppliers-textarea-icon">
                    <MapPin size={17} />
                    <textarea
                      id="supplier-address"
                      name="address"
                      placeholder="Enter supplier address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="suppliers-form-actions">
                <button
                  type="button"
                  className="suppliers-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="suppliers-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Save Changes"
                    : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
