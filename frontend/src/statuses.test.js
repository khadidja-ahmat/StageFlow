import { afterEach, expect, test, vi } from "vitest";
import { STATUSES, formatDate, today } from "./statuses";

afterEach(() => vi.useRealTimers());

test("couvre exactement les cinq statuts de l'API, avec libellé et couleur", () => {
  expect(Object.keys(STATUSES)).toEqual([
    "TO_APPLY",
    "APPLIED",
    "INTERVIEW",
    "ACCEPTED",
    "REJECTED",
  ]);
  for (const status of Object.values(STATUSES)) {
    expect(status.label).toBeTruthy();
    expect(status.color).toBeTruthy();
  }
});

test("formatDate affiche une date ISO en français", () => {
  expect(formatDate("2026-09-29")).toMatch(/29\s+sept\.?\s+2026/);
});

test("today retourne la date locale au format yyyy-MM-dd, zéros compris", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 5, 23, 30));
  expect(today()).toBe("2026-01-05");
});
