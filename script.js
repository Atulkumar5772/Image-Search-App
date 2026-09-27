// Get Access Key from config or prompt if missing
const accessKey = (window.CONFIG && window.CONFIG.UNSPLASH_ACCESS_KEY) 
  ? window.CONFIG.UNSPLASH_ACCESS_KEY 
  : 'QMl2HIatl3M3a2C6vNW3e59io7SyEbMfV5CUWWmmbQo';

const searchForm = document.getElementById('search-form');
const searchBox = document.getElementById('search-box');
const imageResults = document.getElementById('image-results');

// Modal Elements
const modal = document.getElementById('image-modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalImg = document.getElementById('modal-img');
const modalAuthor = document.getElementById('modal-author').querySelector('span');
const downloadBtn = document.getElementById('download-btn');

let currentDownloadUrl = '';
let currentImageTitle = 'downloaded-image';

searchForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const query = searchBox.value.trim();
  if (query) {
    searchImages(query);
  }
});

function searchImages(query) {
  imageResults.innerHTML = `<p style="grid-column: 1/-1; color: #94a3b8; font-size: 1.1rem; padding: 20px;">Fetching beautiful images for "${query}"...</p>`;
  
  const url = `https://api.unsplash.com/search/photos?page=1&query=${encodeURIComponent(query)}&client_id=${accessKey}&per_page=16`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      imageResults.innerHTML = "";
      
      if (!data.results || data.results.length === 0) {
        imageResults.innerHTML = `<p style="grid-column: 1/-1; color: #ef4444; font-size: 1.1rem; padding: 20px;">No images found for "${query}". Try another search!</p>`;
        return;
      }
      
      data.results.forEach(photo => {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const img = document.createElement('img');
        img.src = photo.urls.small;
        img.alt = photo.alt_description || "Unsplash Photo";
        img.loading = "lazy";
        
        const overlay = document.createElement('div');
        overlay.className = 'image-overlay';
        overlay.innerHTML = `
          <span class="overlay-text">📷 ${photo.user.name || 'Photographer'}</span>
          <i class="fa-solid fa-expand overlay-icon"></i>
        `;
        
        card.appendChild(img);
        card.appendChild(overlay);
        
        // On click, open enlarged modal preview
        card.addEventListener('click', () => {
          openModal(photo);
        });
        
        imageResults.appendChild(card);
      });
    })
    .catch(error => {
      console.error("Error fetching images:", error);
      imageResults.innerHTML = `<p style="grid-column: 1/-1; color: #ef4444; font-size: 1.1rem; padding: 20px;">Failed to load images. Please verify your API Key / Internet connection.</p>`;
    });
}

// Open Modal with high-res image & download support
function openModal(photo) {
  modalImg.src = photo.urls.regular || photo.urls.small;
  modalImg.alt = photo.alt_description || "Enlarged Image";
  modalAuthor.textContent = photo.user.name || "Anonymous";
  
  currentDownloadUrl = photo.urls.full || photo.urls.regular;
  currentImageTitle = (photo.alt_description || 'unsplash-image').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close Modal
function closeModal() {
  modal.classList.remove('active');
  modalImg.src = "";
  document.body.style.overflow = 'auto';
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Close on Escape key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});

// Direct Image Download Handler
downloadBtn.addEventListener('click', () => {
  if (!currentDownloadUrl) return;
  
  const originalText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Downloading...`;
  downloadBtn.style.pointerEvents = 'none';
  
  fetch(currentDownloadUrl)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${currentImageTitle || 'image'}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      
      downloadBtn.innerHTML = `<i class="fa-solid fa-check"></i> Downloaded!`;
      setTimeout(() => {
        downloadBtn.innerHTML = originalText;
        downloadBtn.style.pointerEvents = 'auto';
      }, 2000);
    })
    .catch(err => {
      console.error("Download failed:", err);
      // Fallback direct open
      window.open(currentDownloadUrl, '_blank');
      downloadBtn.innerHTML = originalText;
      downloadBtn.style.pointerEvents = 'auto';
    });
});