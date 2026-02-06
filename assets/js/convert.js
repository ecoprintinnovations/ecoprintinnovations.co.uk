// Form submission handler for contact form with file upload
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Create FormData from the form
    const formData = new FormData(form);

    // POST FormData to Apps Script Web App
    fetch('https://script.google.com/macros/d/AKfycbxGkwvPiC5c_7o_fI1f6s_8vVZfbPaTRXqeT3XRUcn5K7TlQjDEm7AF-mfIA/exec', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Hide form and show success message
        form.style.display = 'none';
        const successMsg = document.getElementById('form-success');
        if (successMsg) {
          successMsg.style.display = 'block';
        }
      } else {
        // Show error alert
        alert('Error: ' + (data.error || 'Submission failed'));
      }
    })
    .catch(error => {
      alert('Error submitting form: ' + error.message);
    });
  });
});
