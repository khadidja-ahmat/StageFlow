import { afterEach, expect, test, vi } from "vitest";
import { applicationsApi } from "./api";

afterEach(() => vi.unstubAllGlobals());

function stubFetch(response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

test("envoie du JSON vers l'URL de la candidature ciblée", async () => {
  const fetchMock = stubFetch({
    ok: true,
    status: 200,
    json: async () => ({}),
  });
  await applicationsApi.update(7, { company: "Acme" });
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/applications/7",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ company: "Acme" }),
      headers: { "Content-Type": "application/json" },
    }),
  );
});

test("retourne null après une suppression (204 sans contenu)", async () => {
  stubFetch({ ok: true, status: 204 });
  expect(await applicationsApi.remove(3)).toBeNull();
});

test("expose le message et les erreurs de champ renvoyés par l'API", async () => {
  stubFetch({
    ok: false,
    status: 400,
    json: async () => ({
      message: "Vérifie les champs du formulaire.",
      errors: { company: "L'entreprise est obligatoire." },
    }),
  });
  const error = await applicationsApi.create({}).catch((e) => e);
  expect(error.message).toBe("Vérifie les champs du formulaire.");
  expect(error.fields).toEqual({ company: "L'entreprise est obligatoire." });
});

test("utilise un message par défaut si l'erreur n'est pas du JSON", async () => {
  stubFetch({
    ok: false,
    status: 500,
    json: async () => {
      throw new Error("pas du JSON");
    },
  });
  const error = await applicationsApi.list().catch((e) => e);
  expect(error.message).toMatch(/La demande a échoué/);
  expect(error.fields).toEqual({});
});

test("signale un backend injoignable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));
  const error = await applicationsApi.list().catch((e) => e);
  expect(error.message).toMatch(/Connexion impossible/);
});
