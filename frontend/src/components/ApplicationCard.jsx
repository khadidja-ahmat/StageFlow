import { STATUSES, formatDate } from "../statuses";

export default function ApplicationCard({ application, onEdit, onDelete }) {
  const status = STATUSES[application.status];
  const safeUrl = /^https?:\/\//i.test(application.offerUrl || "")
    ? application.offerUrl
    : null;
  return (
    <article className="application-card">
      <div className="card-top">
        <div className="company-mark" aria-hidden="true">
          {application.company.slice(0, 2).toUpperCase()}
        </div>
        <span className={`badge ${status.color}`}>
          <span aria-hidden="true">●</span> {status.label}
        </span>
      </div>
      <h3>{application.company}</h3>
      <p className="position">{application.position}</p>
      <div className="card-meta">
        <span>{application.location || "Ville non précisée"}</span>
        <span>·</span>
        <time dateTime={application.applicationDate}>
          {formatDate(application.applicationDate)}
        </time>
      </div>
      {application.notes && (
        <details className="notes">
          <summary>Voir les notes</summary>
          <p>{application.notes}</p>
        </details>
      )}
      <footer className="card-footer">
        {safeUrl ? (
          <a
            className="offer-link"
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir l’offre <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="no-link">Sans lien d’offre</span>
        )}
        <div className="card-actions">
          <button
            className="text-button"
            onClick={() => onEdit(application)}
            aria-label={`Modifier ${application.company}`}
          >
            Modifier
          </button>
          <button
            className="text-button danger-text"
            onClick={() => onDelete(application)}
            aria-label={`Supprimer ${application.company}`}
          >
            Supprimer
          </button>
        </div>
      </footer>
    </article>
  );
}
