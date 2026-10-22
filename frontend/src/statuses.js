export const STATUSES = {
  TO_APPLY: { label: "À postuler", color: "slate" },
  APPLIED: { label: "Envoyée", color: "blue" },
  INTERVIEW: { label: "Entretien", color: "amber" },
  ACCEPTED: { label: "Acceptée", color: "green" },
  REJECTED: { label: "Refusée", color: "rose" },
};

export function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
