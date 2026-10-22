import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";

const initial = {
  id: 1,
  company: "Capgemini",
  position: "Développeur Java",
  location: "Paris",
  offerUrl: "https://example.com",
  applicationDate: "2026-09-29",
  status: "APPLIED",
  notes: "À relancer",
};
let entries;

beforeEach(() => {
  entries = [{ ...initial }];
  // Seule la frontière HTTP est simulée ; les composants et formulaires sont réels.
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      const id = Number(url.split("/").pop());
      let body;
      if (method === "POST") {
        body = { ...JSON.parse(options.body), id: 2 };
        entries.push(body);
      } else if (method === "PUT") {
        body = { ...JSON.parse(options.body), id };
        entries = entries.map((entry) => (entry.id === id ? body : entry));
      } else if (method === "DELETE") {
        entries = entries.filter((entry) => entry.id !== id);
      } else body = [...entries];
      return {
        ok: true,
        status: method === "DELETE" ? 204 : 200,
        json: async () => body,
      };
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

test("affiche les candidatures et filtre la liste", async () => {
  render(<App />);
  expect(await screen.findByText("Capgemini")).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Rechercher"), "inconnue");
  expect(screen.queryByText("Capgemini")).not.toBeInTheDocument();
  expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText("Rechercher"));
  await userEvent.selectOptions(
    screen.getByLabelText("Filtrer par statut"),
    "INTERVIEW",
  );
  expect(screen.queryByText("Capgemini")).not.toBeInTheDocument();
});

test("crée une candidature depuis le formulaire", async () => {
  render(<App />);
  await screen.findByText("Capgemini");
  await userEvent.click(
    screen.getByRole("button", { name: /Nouvelle candidature/ }),
  );
  await userEvent.type(screen.getByLabelText("Entreprise *"), "Thales");
  await userEvent.type(screen.getByLabelText("Poste *"), "Alternant React");
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(await screen.findByText("Thales")).toBeInTheDocument();
  expect(screen.getByText("Alternant React")).toBeInTheDocument();
});

test("modifie une candidature et confirme sa suppression", async () => {
  render(<App />);
  await screen.findByText("Capgemini");
  await userEvent.click(
    screen.getByRole("button", { name: "Modifier Capgemini" }),
  );
  await userEvent.selectOptions(screen.getByLabelText("Statut *"), "INTERVIEW");
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(
    within(screen.getByRole("article")).getByText("Entretien"),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Supprimer Capgemini" }),
  );
  await userEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Supprimer",
    }),
  );
  await waitFor(() =>
    expect(screen.queryByText("Capgemini")).not.toBeInTheDocument(),
  );
});

test("affiche une erreur réseau et permet de réessayer", async () => {
  fetch.mockRejectedValueOnce(new Error("offline"));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(/connexion/i);
  await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(await screen.findByText("Capgemini")).toBeInTheDocument();
});

test("conserve le formulaire si la sauvegarde échoue", async () => {
  render(<App />);
  await screen.findByText("Capgemini");
  await userEvent.click(
    screen.getByRole("button", { name: "Modifier Capgemini" }),
  );
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => ({ message: "Saisie invalide", errors: {} }),
  });
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Saisie invalide");
  expect(screen.getByLabelText("Entreprise *")).toHaveValue("Capgemini");
});

test("garde le focus dans la fenêtre pendant une sauvegarde", async () => {
  render(<App />);
  await screen.findByText("Capgemini");
  await userEvent.click(
    screen.getByRole("button", { name: "Modifier Capgemini" }),
  );
  let finish;
  fetch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  await userEvent.tab();
  const dialog = screen.getByRole("dialog");
  expect(dialog.contains(document.activeElement)).toBe(true);
  finish({ ok: true, status: 200, json: async () => initial });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
});

test("affiche les compteurs par statut, refus compris", async () => {
  entries.push({ ...initial, id: 2, company: "Thales", status: "REJECTED" });
  render(<App />);
  await screen.findByText("Thales");
  const refused = screen.getByText("Candidatures refusées").closest(".stat");
  expect(within(refused).getByText("1")).toBeInTheDocument();
  const sent = screen.getByText("Candidatures envoyées").closest(".stat");
  expect(within(sent).getByText("1")).toBeInTheDocument();
});

test("relie l'erreur à son champ sans l'ajouter au nom du champ", async () => {
  render(<App />);
  await screen.findByText("Capgemini");
  await userEvent.click(
    screen.getByRole("button", { name: "Modifier Capgemini" }),
  );
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    json: async () => ({
      message: "Vérifie les champs du formulaire.",
      errors: { company: "L'entreprise est obligatoire." },
    }),
  });
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  const input = await screen.findByRole("textbox", { name: "Entreprise *" });
  expect(input).toHaveAccessibleDescription("L'entreprise est obligatoire.");
});
