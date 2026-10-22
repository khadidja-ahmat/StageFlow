import { useCallback, useEffect, useState } from "react";
import { applicationsApi } from "./api";
import { STATUSES } from "./statuses";
import ApplicationCard from "./components/ApplicationCard";
import ApplicationForm from "./components/ApplicationForm";
import Modal from "./components/Modal";

export default function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setApplications(await applicationsApi.list());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const close = useCallback(() => {
    setEditor(null);
    setDeleting(null);
    setActionError(null);
  }, []);
  const openEditor = (application = {}) => {
    setActionError(null);
    setNotice("");
    setEditor(application);
  };

  async function save(values) {
    setBusy(true);
    setActionError(null);
    try {
      const saved = editor.id
        ? await applicationsApi.update(editor.id, values)
        : await applicationsApi.create(values);
      setApplications((current) => [
        ...current.filter((item) => item.id !== saved.id),
        saved,
      ]);
      setQuery("");
      setStatus("ALL");
      setNotice(
        editor.id ? "Candidature mise à jour." : "Candidature ajoutée.",
      );
      close();
    } catch (error) {
      setActionError(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setActionError(null);
    try {
      await applicationsApi.remove(deleting.id);
      setApplications((current) =>
        current.filter((item) => item.id !== deleting.id),
      );
      setNotice("Candidature supprimée.");
      close();
    } catch (error) {
      setActionError(error);
    } finally {
      setBusy(false);
    }
  }

  const normalized = query.trim().toLocaleLowerCase("fr");
  const filtered = applications
    .filter(
      (item) =>
        (status === "ALL" || item.status === status) &&
        `${item.company} ${item.position} ${item.location}`
          .toLocaleLowerCase("fr")
          .includes(normalized),
    )
    .sort(
      (a, b) =>
        b.applicationDate.localeCompare(a.applicationDate) || b.id - a.id,
    );
  const count = (value) =>
    applications.filter((item) => item.status === value).length;

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Aller aux candidatures
      </a>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="StageFlow, accueil">
          <span className="brand-symbol">
            s<span>f</span>
          </span>
          StageFlow<span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">ESPACE PERSONNEL</div>
        <nav aria-label="Navigation principale">
          <a className="nav-item active" href="#main">
            <span aria-hidden="true">▦</span> Mes candidatures{" "}
            <span className="nav-count">{applications.length}</span>
          </a>
        </nav>
        <footer className="sidebar-footer">
          Application locale : les candidatures sont enregistrées dans ta base
          MySQL.
        </footer>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            StageFlow <span className="breadcrumb">/</span>{" "}
            <strong>Mes candidatures</strong>
          </span>
        </header>
        <main id="main">
          <section className="page-heading">
            <div>
              <h1>
                Mes candidatures<span>.</span>
              </h1>
              <p>Suis chaque offre, de la candidature à la réponse.</p>
            </div>
            <button
              className="button primary"
              onClick={() => openEditor()}
              disabled={loading || !!loadError}
            >
              <span aria-hidden="true">＋</span> Nouvelle candidature
            </button>
          </section>
          <section className="stats" aria-label="Vue d'ensemble">
            <div className="stat">
              <span>Total des candidatures</span>
              <strong>
                {loading || loadError ? "—" : applications.length}
              </strong>
              <small>Toutes étapes confondues</small>
              <span className="stat-icon slate" aria-hidden="true">
                ▤
              </span>
            </div>
            <div className="stat">
              <span>Candidatures envoyées</span>
              <strong>{loading || loadError ? "—" : count("APPLIED")}</strong>
              <small>En attente d’une réponse</small>
              <span className="stat-icon blue" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="stat">
              <span>Entretiens</span>
              <strong>{loading || loadError ? "—" : count("INTERVIEW")}</strong>
              <small>Étape en cours</small>
              <span className="stat-icon amber" aria-hidden="true">
                ◎
              </span>
            </div>
            <div className="stat">
              <span>Réponses positives</span>
              <strong>{loading || loadError ? "—" : count("ACCEPTED")}</strong>
              <small>Offres obtenues</small>
              <span className="stat-icon green" aria-hidden="true">
                ✓
              </span>
            </div>
            <div className="stat">
              <span>Candidatures refusées</span>
              <strong>{loading || loadError ? "—" : count("REJECTED")}</strong>
              <small>Pas retenues</small>
              <span className="stat-icon rose" aria-hidden="true">
                ✕
              </span>
            </div>
          </section>
          <section
            className="applications-section"
            aria-labelledby="list-title"
          >
            <div className="section-heading">
              <div>
                <h2 id="list-title">
                  Toutes les candidatures <span>{filtered.length}</span>
                </h2>
              </div>
              <span className="sort-hint">Plus récentes en premier ↓</span>
            </div>
            <div className="toolbar">
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Rechercher"
                  placeholder="Rechercher une entreprise, un poste, une ville…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="status-filter">
                <span>Statut</span>
                <select
                  aria-label="Filtrer par statut"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="ALL">Tous les statuts</option>
                  {Object.entries(STATUSES).map(([value, item]) => (
                    <option value={value} key={value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {notice && (
              <p className="success-banner" role="status">
                ✓ {notice}
              </p>
            )}
            {loading ? (
              <div className="empty-state" role="status">
                <span className="loading-dot" />
                Chargement des candidatures…
              </div>
            ) : loadError ? (
              <div className="empty-state">
                <p role="alert" className="error-banner">
                  {loadError}
                </p>
                <button className="button secondary" onClick={load}>
                  Réessayer
                </button>
              </div>
            ) : filtered.length ? (
              <div className="cards">
                {filtered.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onEdit={openEditor}
                    onDelete={(item) => {
                      setActionError(null);
                      setDeleting(item);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">
                  ↗
                </span>
                <h3>
                  {applications.length
                    ? "Aucun résultat"
                    : "Aucune candidature pour l’instant"}
                </h3>
                <p>
                  {applications.length
                    ? "Essaie une autre recherche ou un autre statut."
                    : "Ajoute ta première candidature pour commencer ton suivi."}
                </p>
                <button
                  className="button secondary"
                  onClick={() => {
                    if (applications.length) {
                      setQuery("");
                      setStatus("ALL");
                    } else openEditor();
                  }}
                >
                  {applications.length
                    ? "Réinitialiser les filtres"
                    : "Ajouter une candidature"}
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
      {editor && (
        <Modal
          title={editor.id ? "Modifier la candidature" : "Nouvelle candidature"}
          onClose={close}
          busy={busy}
        >
          <ApplicationForm
            application={editor}
            onSave={save}
            onCancel={close}
            busy={busy}
            error={actionError}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Supprimer cette candidature ?"
          onClose={close}
          busy={busy}
        >
          <p className="delete-copy">
            La candidature chez <strong>{deleting.company}</strong> sera
            définitivement supprimée.
          </p>
          {actionError && (
            <p role="alert" className="error-banner">
              {actionError.message}
            </p>
          )}
          <footer className="modal-actions">
            <button
              className="button secondary"
              onClick={close}
              disabled={busy}
            >
              Annuler
            </button>
            <button className="button danger" onClick={remove} disabled={busy}>
              {busy ? "Suppression…" : "Supprimer"}
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
