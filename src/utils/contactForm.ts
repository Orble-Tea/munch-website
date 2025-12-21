import { preventSpam } from "~/utils/preventSpam";

/**
 * Display error messages in the form
 * @param errors - a mapping of field names to error messages
 * @returns {void}
 */
function displayErrors(errors: Record<string, string>): void {
  document.querySelectorAll(".error-message").forEach((el) => {
    el.textContent = "";
  });

  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = document.querySelector(`[data-field="${field}"]`);
    if (errorEl) errorEl.textContent = message;
  });
}

/**
 * Update the form message header
 * @param message - message to display
 * @param isError - true if message indicates an error
 * @returns {void}
 */
function updateMessage(message: string, isError = false): void {
  const messageEl = document.getElementById("form-message");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.classList.toggle("text-red-500", isError);
}

/**
 * Validate form data client-side
 * @param formData - form data as key-value pairs
 * @returns {Object} - validation result
 */
function validateForm(formData: Record<string, string>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!formData.FirstName || formData.FirstName.trim().length < 1)
    errors.firstName = "Please enter your first name.";

  if (!formData.LastName || formData.LastName.trim().length < 1)
    errors.lastName = "Please enter your last name.";

  if (
    !formData.Email ||
    !formData.Email.includes("@") ||
    !formData.Email.includes(".")
  )
    errors.email = "Please enter a valid email address.";

  if (!formData.Subject) errors.subject = "Please select a subject.";

  if (!formData.Message || formData.Message.trim().length < 1)
    errors.message = "Please enter your message.";

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Initialize the contact form: attach spam prevention and submit handler.
 * @returns {void}
 */
function initForm(): void {
  const form = document.querySelector<HTMLFormElement>("#contact-form");
  const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

  if (!form) {
    console.error("Form not found!");
    return;
  }

  preventSpam(form, { honeypotField: "website" });

  // Type augmentation for containsSpam
  type SpamForm = HTMLFormElement & { containsSpam?: () => boolean };
  const spamForm = form as SpamForm;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "SENDING...";
    }

    displayErrors({});

    const honeypotValue =
      (form.querySelector('[name="website"]') as HTMLInputElement)?.value || "";

    // Check if spam
    const isSpam =
      honeypotValue.length > 0 || spamForm.containsSpam?.() || false;

    // Collect form data
    const formData: Record<string, string> = {};
    new FormData(form).forEach((value, key) => {
      formData[key] = String(value);
    });

    // Track Umami
    try {
      if (typeof umami !== "undefined") {
        umami.track("form_submission", {
          honeypot_value: honeypotValue ? "true" : "false",
          is_spam: String(isSpam),
        });
      }
    } catch (err) {
      console.warn("Umami tracking failed:", err);
    }

    if (isSpam) {
      console.log("Spam detected, faking success");
      updateMessage("Form submitted successfully!");
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "SEND MESSAGE";
      }
      return;
    }

    const validation = validateForm(formData);
    if (!validation.isValid) {
      displayErrors(validation.errors);
      updateMessage("Please fix the errors below.", true);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "SEND MESSAGE";
      }
      return;
    }

    const content = `First Name: ${formData.FirstName}
Last Name: ${formData.LastName}
Phone Number: ${formData.PhoneNumber || "N/A"}
Email: ${formData.Email}

Subject: ${formData.Subject}

Message: ${formData.Message}`;

    const emailData = {
      subject: `Customer Inquiry Form Submission: ${formData.Subject}`,
      text: content,
      "h:Reply-To": formData.Email,
      website: honeypotValue,
      userAgent: navigator.userAgent, // include browser UA
    };

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        updateMessage("Form submitted successfully!");
        form.reset();
      } else {
        throw new Error(result.message || "Failed to send email");
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      updateMessage(
        "Error: " +
          (err instanceof Error ? err.message : "An unknown error occurred"),
        true,
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "SEND MESSAGE";
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initForm);
} else {
  initForm();
}
