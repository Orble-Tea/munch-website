import { preventSpam } from '~/utils/preventSpam';

function initForm() {
  const form = document.querySelector('form');
  
  if (!form) {
    console.error("Form not found!");
    return;
  }

  preventSpam(form, { honeypotField: 'website' })
  
  console.log("Form after preventSpam:", form)

  form.addEventListener('submit', (e) => {
    if (form.containsSpam()) {
      e.preventDefault();
      return;
    }

  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initForm);
} else {
  initForm();
}