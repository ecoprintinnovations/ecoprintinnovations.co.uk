// Form submission handler for contact form with file upload
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Create FormData from the form
    const formData = new FormData(form);

    // POST form text data first (no files)
    fetch('https://script.google.com/macros/d/AKfycbxGkwvP1C5c_7o_f1lf6s_8vVZfbPaTRXqeT3XRUcn5K7T1QjDEm7AF-mfIA/exec', {
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

        // Get the folder ID for file uploads
        const folderId = data.folderId;
        const fileInputs = form.querySelectorAll('input[type="file"]');
        
        // If there are files to upload, upload them directly to Google Drive
        if (fileInputs.length > 0) {
          uploadFilesToDrive(fileInputs, folderId);
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

function uploadFilesToDrive(fileInputs, folderId) {
  // For each file input, upload selected files to the folder
  let uploadPromises = [];
  
  fileInputs.forEach(input => {
    if (input.files && input.files.length > 0) {
      for (let file of input.files) {
        uploadPromises.push(uploadFileToFolder(file, folderId));
      }
    }
  });

  // Wait for all uploads to complete
  Promise.all(uploadPromises)
    .then(() => {
      console.log('All files uploaded successfully');
    })
    .catch(error => {
      console.error('Error uploading files:', error);
    });
}

function uploadFileToFolder(file, folderId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const fileContent = e.target.result;
      
      // Create a blob from the file content
      const blob = new Blob([fileContent], { type: file.type });
      
      // Create FormData for the file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', blob, file.name);
      uploadFormData.append('folderId', folderId);
      
      // Send file to Apps Script for upload to Drive
      fetch('https://script.google.com/macros/d/AKfycbxGkwvP1C5c_7o_f1lf6s_8vVZfbPaTRXqeT3XRUcn5K7T1QjDEm7AF-mfIA/exec', {
        method: 'POST',
        body: uploadFormData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('File uploaded: ' + file.name);
          resolve();
        } else {
          reject(new Error('Failed to upload ' + file.name));
        }
      })
      .catch(error => {
        reject(error);
      });
    };
    
    reader.onerror = function() {
      reject(new Error('Failed to read file: ' + file.name));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
