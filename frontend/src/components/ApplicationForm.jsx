import { useState } from "react";
import { STATUSES, today } from "../statuses";

export default function ApplicationForm({
  application,
  onSave,
  onCancel,
  busy,
  error,
}) {
  const [values, setValues] = useState(() => ({
    company: application?.company || "",
    position: application?.position || "",
    location: application?.location || "",
    offerUrl: application?.offerUrl || "",
    applicationDate: application?.applicationDate || today(),
    status: application?.status || "TO_APPLY",
    notes: application?.notes || "",
  }));
  const update = (event) =>
    setValues({ ...values, [event.target.name]: event.target.value });
  const field = (name, label, type = "text", maxLength) => (
    <div className="field">
      <label htmlFor={`field-${name}`}>{label}</label>
      <input
        id={`field-${name}`}
        name={name}
        type={type}
        value={values[name]}
        onChange={update}
        maxLength={maxLength}
        required={["company", "position", "applicationDate"].includes(name)}
        aria-invalid={!!error?.fields?.[name]}
        aria-describedby={error?.fields?.[name] ? `${name}-error` : undefined}
      />
      {error?.fields?.[name] && (
        <small className="field-error" id={`${name}-error`}>
          {error.fields[name]}
        </small>
      )}
    </div>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(values);
      }}
    >
      <p className="form-help">Les champs marqués * sont obligatoires.</p>
      {error && (
        <p role="alert" className="error-banner">
          {error.message}
        </p>
      )}
      <fieldset disabled={busy} className="form-grid">
        {field("company", "Entreprise *", "text", 120)}
        {field("position", "Poste *", "text", 160)}
        {field("location", "Ville", "text", 160)}
        {field("applicationDate", "Date de candidature *", "date")}
        <label className="field">
          Statut *
          <select
            name="status"
            value={values.status}
            onChange={update}
            required
          >
            {Object.entries(STATUSES).map(([value, status]) => (
              <option key={value} value={value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        {field("offerUrl", "Lien de l'offre", "url", 2048)}
        <label className="field full-width">
          Notes
          <textarea
            name="notes"
            rows="4"
            maxLength={5000}
            value={values.notes}
            onChange={update}
            placeholder="Contact, prochaine étape, impressions…"
          />
          <small>{values.notes.length} / 5 000 caractères</small>
        </label>
      </fieldset>
      <footer className="modal-actions">
        <button
          className="button secondary"
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          Annuler
        </button>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </footer>
    </form>
  );
}
