// Your live API link is preserved below
const API_URL = "https://script.google.com/macros/s/AKfycbx6I7mEOzxNUbgbbrkKMzJydyX_qF5_Cf0NdIqBB1draJAi1xA0cUOo9wwhNWboHFUUzA/exec";

// Helper function to compress a single image
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                let scaleSize = 1;
                
                if (img.width > MAX_WIDTH) {
                    scaleSize = MAX_WIDTH / img.width;
                }
                
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function uploadBill() {
    const files = document.getElementById('fileInput').files;
    const billNum = document.getElementById('billNum').value;
    const status = document.getElementById('uploadStatus');

    if (files.length === 0 || !billNum) { 
        status.innerText = "Please provide both a bill number and at least one photo."; 
        status.style.color = "red";
        return; 
    }

    status.style.color = "black";
    let successCount = 0;

    // Loop through each selected file and upload them one by one
    for (let i = 0; i < files.length; i++) {
        status.innerText = `Compressing and uploading photo ${i + 1} of ${files.length}...`;
        
        const compressedBase64 = await compressImage(files[i]);
        
        const payload = {
            action: 'upload',
            billNumber: billNum,
            filename: `bill_${billNum}_part${i+1}.jpg`,
            image: compressedBase64
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                successCount++;
            }
        } catch (error) {
            console.error(`Error uploading file ${i + 1}:`, error);
        }
    }

    if (successCount === files.length) {
        status.innerText = `All ${files.length} photos saved successfully!`;
        status.style.color = "green";
        document.getElementById('billNum').value = '';
        document.getElementById('fileInput').value = '';
    } else {
        status.innerText = `Uploaded ${successCount} out of ${files.length} photos. Some failed.`;
        status.style.color = "red";
    }
}

async function searchBill() {
    const billNum = document.getElementById('searchNum').value;
    const status = document.getElementById('searchStatus');
    const gallery = document.getElementById('imageGallery');

    if (!billNum) return;
    
    status.innerText = "Searching...";
    status.style.color = "black";
    gallery.innerHTML = ''; // Clear previous images

    try {
        const response = await fetch(`${API_URL}?billNumber=${billNum}`);
        const result = await response.json();

        if (result.success && result.urls.length > 0) {
            status.innerText = `Found ${result.urls.length} photo(s) for this bill!`;
            status.style.color = "green";
            
            // Create a clickable link for each photo found
            result.urls.forEach((url, index) => {
                const link = document.createElement('a');
                link.href = url;
                link.target = "_blank";
                link.innerText = `📄 View Photo ${index + 1}`;
                link.className = "gallery-link"; // Applying the new CSS class
                
                gallery.appendChild(link);
            });
        } else {
            status.innerText = "Bill not found.";
            status.style.color = "red";
        }
    } catch (error) {
        status.innerText = "Connection error.";
        status.style.color = "red";
    }
}
