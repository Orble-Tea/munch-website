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
    const isSpam = form.containsSpam();
    const honeypotValue = (form.querySelector('[name="website"]') as HTMLInputElement)?.value || '';
    
    // Track form submission with Umami
    try {
      umami.track('form_submission', {
        honeypot_value: honeypotValue,
        is_spam: isSpam
      });
    } catch (err) {
      console.warn("Umami tracking failed:", err);
    }

    if (isSpam) {
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
