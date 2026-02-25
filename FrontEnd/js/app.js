let appConfig = null;
let currentUser = null;
let totalCashback = 0.00;
let selectedFile = null;

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const uploadPrompt = document.getElementById('uploadPrompt');
const previewImg = document.getElementById('previewImg');
const fileMeta = document.getElementById('fileMeta');
const uploadBtn = document.getElementById('uploadBtn');
const counterValue = document.getElementById('counterValue');

// Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `<span style="font-size:1.2rem;">${type === 'success' ? '✅' : '⚠️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    
    // Allow DOM update before animating
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Counter Animation
function animateCashback(start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Ease out quad
        const easeOut = progress * (2 - progress);
        const currentVal = (start + (end - start) * easeOut).toFixed(2);
        
        counterValue.innerHTML = `${appConfig.ui.currencySymbol}${currentVal}`;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialization
async function initApp() {
    try {
        // Load configuration
        const res = await fetch('config.json');
        appConfig = await res.json();
        
        // Initialize File Input Accept Types
        fileInput.accept = appConfig.ui.acceptedFileTypes.join(', ');
        
        // Load cached user session
        const cachedUser = localStorage.getItem('bacash_user');
        if (cachedUser) {
            currentUser = JSON.parse(cachedUser);
        }
        
        // Load Google Identity Services Script dynamically
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            google.accounts.id.initialize({
                client_id: appConfig.auth.googleClientId,
                callback: handleCredentialResponse
            });
            updateUI();
        };
        document.head.appendChild(script);
        
    } catch (err) {
        console.error("Failed to load app config:", err);
        showToast('Failed to load application configuration.', 'error');
    }
}

// Authentication Handlers
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    if (payload) {
        currentUser = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        };
        localStorage.setItem('bacash_user', JSON.stringify(currentUser));
        updateUI();
        showToast('Successfully signed in!', 'success');
    }
}

function signOut() {
    google.accounts.id.disableAutoSelect();
    localStorage.removeItem('bacash_user');
    currentUser = null;
    updateUI();
    
    // Reset dashboard state
    resetUploadZone();
}

// Update Interface based on Auth State
function updateUI() {
    const navAuth = document.getElementById('navAuthArea');
    const gate = document.getElementById('loginGate');
    const userHeader = document.getElementById('userHeader');

    if (currentUser) {
        gate.classList.add('hidden');
        userHeader.classList.remove('hidden');
        
        // Update User Profile Header
        userHeader.innerHTML = `
            <img src="${currentUser.picture}" class="user-avatar" alt="${currentUser.name}" referrerpolicy="no-referrer">
            <span class="user-name">Welcome, ${currentUser.name}</span>
        `;
        
        // Update Navbar
        navAuth.innerHTML = `
            <div style="display:flex; align-items:center; gap: 12px;">
                <img src="${currentUser.picture}" style="width:32px; height:32px; border-radius:50%; border:1px solid #E5E7EB;" referrerpolicy="no-referrer">
                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.85rem;" onclick="signOut()">Sign Out</button>
            </div>
        `;
    } else {
        gate.classList.remove('hidden');
        userHeader.classList.add('hidden');
        
        // Render Google GIS Buttons
        navAuth.innerHTML = '<div id="navGoogleBtn"></div>';
        
        // Give DOM a small tick to mount elements before rendering
        setTimeout(() => {
            const navBtnEl = document.getElementById('navGoogleBtn');
            const gateBtnEl = document.getElementById('gateGoogleBtn');
            
            if (navBtnEl) {
                google.accounts.id.renderButton(navBtnEl, { theme: 'outline', size: 'medium', shape: 'rectangular' });
            }
            if (gateBtnEl) {
                gateBtnEl.innerHTML = ''; // Clear prior if any
                google.accounts.id.renderButton(gateBtnEl, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with' });
            }
        }, 50);
    }
}

// Drag & Drop Handlers
dropZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileSelection(fileInput.files[0]);
    }
});

// File Selection & Validation
function handleFileSelection(file) {
    // Validate File Type
    if (!appConfig.ui.acceptedFileTypes.includes(file.type)) {
        showToast('Unsupported file type. Please upload an image or PDF.', 'error');
        return;
    }
    
    // Validate File Size
    if (file.size > appConfig.ui.maxFileSizeMB * 1024 * 1024) {
        showToast(`File is too large. Max size is ${appConfig.ui.maxFileSizeMB}MB.`, 'error');
        return;
    }
    
    selectedFile = file;
    
    // Update UI to Preview
    uploadPrompt.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    uploadBtn.classList.remove('hidden');
    
    fileMeta.innerText = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        // PDF fallback (no live preview natively inside the img tag like this)
        previewImg.classList.add('hidden');
        fileMeta.innerText = '📄 ' + fileMeta.innerText;
    }
}

// Reset the Upload Zone to initial state
function resetUploadZone() {
    selectedFile = null;
    fileInput.value = '';
    uploadPrompt.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    previewImg.src = '';
    uploadBtn.classList.add('hidden');
}

// Simulate File Upload Network Interaction
function uploadReceipt() {
    if (!selectedFile) return;
    
    // Set Button Loading State
    uploadBtn.innerHTML = '<span class="spinner"></span> <span style="margin-left:8px">Processing Receipt...</span>';
    uploadBtn.disabled = true;
    dropZone.style.pointerEvents = 'none';
    dropZone.style.opacity = '0.7';
    
    // Mock Upload Delay
    setTimeout(() => {
        // Generate mocked random cashback between $1.50 and $8.00
        const earned = Math.random() * (8.00 - 1.50) + 1.50;
        
        const oldTotal = totalCashback;
        totalCashback += earned;
        
        // Animate Counter
        animateCashback(oldTotal, totalCashback, 1000);
        
        // Notification & UI Reset
        showToast(`Receipt processed! You earned ${appConfig.ui.currencySymbol}${earned.toFixed(2)} cashback`, 'success');
        document.getElementById('counterSubtext').innerText = "Awesome! Keep uploading to earn more.";
        
        resetUploadZone();
        
        // Restore Button and Dropzone
        uploadBtn.innerHTML = 'Upload Receipt';
        uploadBtn.disabled = false;
        dropZone.style.pointerEvents = 'auto';
        dropZone.style.opacity = '1';

    }, 2000); // 2-second mock API latency
}

// Bootstrap the application on load
window.addEventListener('DOMContentLoaded', initApp);
