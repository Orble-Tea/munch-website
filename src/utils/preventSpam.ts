import { SPAM } from "~/utils/config";

/**
 * Attaches anti-spam checks to a form using a honeypot field and interaction timing.
 *
 * @param form - The HTML form element to protect.
 * @param overrides - Optional overrides for SPAM config (honeypot field name, duration).
 */
export function preventSpam(
  form: HTMLFormElement,
  overrides: Partial<typeof SPAM> = {},
): void {
  const config = { ...SPAM, ...overrides };
  const { honeypotField, honeypotDuration } = config;

  const startTime = Date.now();
  let hasInteraction = false;

  /**
   * Marks that the user has interacted with the form.
   */
  function checkForInteraction(): void {
    hasInteraction = true;
  }

  // Listen for a couple of events to check interaction
  const events: Array<keyof HTMLElementEventMap> = [
    "keydown",
    "mousemove",
    "touchstart",
    "click",
  ];
  events.forEach((event) => {
    form.addEventListener(event, checkForInteraction, { once: true });
  });

  /**
   * Checks whether the form is likely filled by a bot.
   * @returns True if the form is considered spam, false otherwise.
   */
  form.containsSpam = function (): boolean {
    const fillTime = Date.now() - startTime;
    const isTooFast = fillTime < honeypotDuration;
    const honeypotInput = form.querySelector<HTMLInputElement>(
      `[name="${honeypotField}"]`,
    );
    const hasHoneypotValue = honeypotInput?.value?.trim();
    const noInteraction = !hasInteraction;

    // Clean up event listeners after use
    events.forEach((event) =>
      form.removeEventListener(event, checkForInteraction),
    );

    return isTooFast || !!hasHoneypotValue || noInteraction;
  };
}
