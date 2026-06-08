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

    status.innerText = "Uploading... please wait.";
    status.style.color = "black";

    // Read the image and convert it to a base64 string
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;

        const payload = {
            action: 'upload',
            billNumber: billNum,
            filename: fileInput.name,
            image: base64Image
        };

        try {
            // Send the data to Google Apps Script
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    // Using text/plain prevents CORS preflight errors with Google Scripts
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
                status.innerText = "Error saving bill.";
                status.style.color = "red";
            }
        } catch (error) {
            status.innerText = "Connection error.";
            status.style.color = "red";
        }
    };
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
        // Send a GET request to Google Apps Script
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