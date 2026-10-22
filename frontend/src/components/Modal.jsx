import { useEffect, useRef } from "react";

export default function Modal({ title, onClose, busy, children }) {
  const ref = useRef(null);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusable = () =>
      [
        ...dialog.querySelectorAll("button, input, select, textarea, a[href]"),
      ].filter((element) => !element.matches(":disabled"));
    focusable()[0]?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busyRef.current) onClose();
      }
      if (event.key === "Tab") {
        const elements = focusable();
        const first = elements[0];
        const last = elements.at(-1);
        if (!first) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    dialog.addEventListener("keydown", handleKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("keydown", handleKey);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (busy) ref.current?.focus();
  }, [busy]);

  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Fermer"
            onClick={onClose}
            disabled={busy}
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
