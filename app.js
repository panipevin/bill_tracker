// YOUR GOOGLE APPS SCRIPT URL
const API_URL = "https://script.google.com/macros/s/AKfycbx6I7mEOzxNUbgbbrkKMzJydyX_qF5_Cf0NdIqBB1draJAi1xA0cUOo9wwhNWboHFUUzA/exec";

// This array acts as our "Shopping Cart" for photos
let queuedPhotos = [];

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

// NEW FUNCTION: Triggers every time you take a photo
async function queuePhoto(input) {
    const file = input.files[0];
    if (!file) return;

    const status = document.getElementById('uploadStatus');
    status.innerText = "Processing photo...";
    status.style.color = "black";

    // Instantly compress the photo so it doesn't crash the browser
    const compressedBase64 = await compressImage(file);
    
    // Add the photo to our staging array
    queuedPhotos.push({
        filename: file.name || `photo_${Date.now()}.jpg`,
        data: compressedBase64
    });

    // Show a small thumbnail on the screen
    const queueDiv = document.getElementById('photoQueue');
    const imgElement = document.createElement('img');
    imgElement.src = compressedBase64;
    imgElement.style.height = "80px";
    imgElement.style.borderRadius = "8px";
    imgElement.style.border = "1px solid #ccc";
    queueDiv.appendChild(imgElement);

    // Clear the camera input so you can immediately take another photo
    input.value = '';
    
    status.innerText = `${queuedPhotos.length} photo(s) ready in queue.`;
    status.style.color = "#ff9500";
}

async function uploadBill() {
    const billNum = document.getElementById('billNum').value;
    const status = document.getElementById('uploadStatus');

    if (queuedPhotos.length === 0 || !billNum) { 
        status.innerText = "Please provide a bill number and take at least one photo."; 
        status.style.color = "red";
        return; 
    }

    status.style.color = "black";
    let successCount = 0;
    const totalPhotos = queuedPhotos.length;

    // Loop through our array and upload them one by one
    for (let i = 0; i < totalPhotos; i++) {
        status.innerText = `Uploading photo ${i + 1} of ${totalPhotos}...`;
        
        const payload = {
            action: 'upload',
            billNumber: billNum,
            filename: `bill_${billNum}_part${i+1}.jpg`,
            image: queuedPhotos[i].data // Using data from our array
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

    if (successCount === totalPhotos) {
        status.innerText = `All ${totalPhotos} photos saved successfully!`;
        status.style.color = "green";
        
        // Reset everything for the next bill
        document.getElementById('billNum').value = '';
        queuedPhotos = []; 
        document.getElementById('photoQueue').innerHTML = '';
    } else {
        status.innerText = `Uploaded ${successCount} out of ${totalPhotos} photos. Some failed.`;
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
    gallery.innerHTML = ''; 

    try {
        const response = await fetch(`${API_URL}?billNumber=${billNum}`);
        const result = await response.json();

        if (result.success && result.urls.length > 0) {
            status.innerText = `Found ${result.urls.length} photo(s) for this bill!`;
            status.style.color = "green";
            
            result.urls.forEach((url, index) => {
                const link = document.createElement('a');
                link.href = url;
                link.target = "_blank";
                link.innerText = `📄 View Photo ${index + 1}`;
                link.className = "gallery-link"; 
                
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
