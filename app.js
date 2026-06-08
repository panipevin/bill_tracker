// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const API_URL = "https://script.google.com/macros/s/AKfycbx6I7mEOzxNUbgbbrkKMzJydyX_qF5_Cf0NdIqBB1draJAi1xA0cUOo9wwhNWboHFUUzA/exec";

async function uploadBill() {
    const fileInput = document.getElementById('fileInput').files[0];
    const billNum = document.getElementById('billNum').value;
    const status = document.getElementById('uploadStatus');

    if (!fileInput || !billNum) { 
        status.innerText = "Please provide both a bill number and a photo."; 
        status.style.color = "red";
        return; 
    }

    status.innerText = "Compressing photo... please wait.";
    status.style.color = "black";

    const reader = new FileReader();
    reader.onload = function(e) {
        // Create an image object to hold the original photo
        const img = new Image();
        img.onload = async function() {
            // Create a hidden canvas to resize the image
            const canvas = document.createElement('canvas');
            
            // Set a maximum width for the bill (1024px is plenty for reading text)
            const MAX_WIDTH = 1024;
            const scaleSize = MAX_WIDTH / img.width;
            
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            // Draw the resized image onto the canvas
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert the canvas back to a base64 string, compressing it to 70% quality JPEG
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            status.innerText = "Uploading to Cloud...";

            const payload = {
                action: 'upload',
                billNumber: billNum,
                filename: fileInput.name || 'bill_photo.jpg',
                image: compressedBase64 // Sending the lightweight image
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8',
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    status.innerText = "Bill saved successfully!";
                    status.style.color = "green";
                    document.getElementById('billNum').value = '';
                    document.getElementById('fileInput').value = '';
                } else {
                    status.innerText = "Error saving bill: " + result.error;
                    status.style.color = "red";
                }
            } catch (error) {
                status.innerText = "Connection error. File might still be too large or network is weak.";
                status.style.color = "red";
                console.error(error);
            }
        };
        // Trigger the image load
        img.src = e.target.result;
    };
    // Read the file chosen by the user
    reader.readAsDataURL(fileInput);
}

async function searchBill() {
    const billNum = document.getElementById('searchNum').value;
    const status = document.getElementById('searchStatus');
    const link = document.getElementById('resultLink');

    if (!billNum) return;
    status.innerText = "Searching...";
    link.style.display = "none";

    try {
        const response = await fetch(`${API_URL}?billNumber=${billNum}`);
        const result = await response.json();

        if (result.success) {
            status.innerText = "Bill found!";
            status.style.color = "green";
            link.href = result.url;
            link.style.display = "inline-block";
        } else {
            status.innerText = "Bill not found.";
            status.style.color = "red";
        }
    } catch (error) {
        status.innerText = "Connection error.";
        status.style.color = "red";
    }
}
