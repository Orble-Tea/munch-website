import { preventSpam } from "~/utils/preventSpam";

/**
 * Initialize the contact form: attach spam prevention and submit handler.
 * @returns {void}
 */
function initForm(): void {
  const form = document.querySelector("form");

  if (!form) {
    console.error("Form not found!");
    return;
  }

  preventSpam(form, { honeypotField: "website" });

  form.addEventListener("submit", (e) => {
    if (form.containsSpam()) {
      e.preventDefault();
      return;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initForm);
} else {
  initForm();
}
