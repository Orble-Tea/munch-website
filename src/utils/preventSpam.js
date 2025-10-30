export function preventSpam(
  form,
  { honeypotField = 'honeypot', honeypotDuration = 2000 } = {}
) {
  const startTime = Date.now();
  let hasInteraction = false;

  // Check for user interaction
  function checkForInteraction() {
    hasInteraction = true;
  }

  // Listen for a couple of events to check interaction
  const events = ['keydown', 'mousemove', 'touchstart', 'click'];
  events.forEach(event => {
    form.addEventListener(event, checkForInteraction, { once: true });
  });

  // Check for spam via all the available methods
  form.containsSpam = function () {
    const fillTime = Date.now() - startTime;
    const isTooFast = fillTime < honeypotDuration;
    const honeypotInput = form.querySelector(`[name="${honeypotField}"]`);
    const hasHoneypotValue = honeypotInput?.value?.trim();
    const noInteraction = !hasInteraction;

    // Clean up event listeners after use
    events.forEach(event => form.removeEventListener(event, checkForInteraction));

    return isTooFast || !!hasHoneypotValue || noInteraction;
  };
}