const BASE_URL = "/api/applications";

async function request(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error(
      "Connexion impossible. Vérifie que le backend est démarré.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(
      body.message || "La demande a échoué. Réessaie dans un instant.",
    );
    error.fields = body.errors || {};
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export const applicationsApi = {
  list: () => request(),
  create: (application) =>
    request("", { method: "POST", body: JSON.stringify(application) }),
  update: (id, application) =>
    request(`/${id}`, { method: "PUT", body: JSON.stringify(application) }),
  remove: (id) => request(`/${id}`, { method: "DELETE" }),
};
