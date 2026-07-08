// RKV PDF to QR Hub - Frontend Application Logic

// Configure PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application State
const state = {
  currentMode: 'local', // 'local' | 'cloud' | 'link'
  activeFile: null,
  activeFileName: '',
  activeFileUrl: '',
  qrSettings: {
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    size: 300,
    ecc: 'H',
    margin: 4,
    logoImg: null,
    logoName: ''
  },
  libraryFiles: [],
  pdfDoc: null,
  pdfCurrentPage: 1,
  pdfTotalPages: 1
};

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  modeInfoBoxes: {
    local: document.getElementById('info-local'),
    cloud: document.getElementById('info-cloud'),
    link: document.getElementById('info-link')
  },
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('file-input'),
  linkInputContainer: document.getElementById('link-input-container'),
  directUrlInput: document.getElementById('direct-url'),
  generateLinkBtn: document.getElementById('generate-link-btn'),
  uploadProgressContainer: document.getElementById('upload-progress-container'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  progressPercent: document.getElementById('progress-percent'),
  progressStatus: document.querySelector('.progress-status'),
  activeFileCard: document.getElementById('active-file-card'),
  activeFileName: document.getElementById('active-file-name'),
  activeFileSize: document.getElementById('active-file-size'),
  btnPreviewModal: document.getElementById('btn-preview-modal'),
  removeFileBtn: document.getElementById('remove-file-btn'),
  
  // Library elements
  libraryCount: document.getElementById('library-count'),
  refreshLibraryBtn: document.getElementById('refresh-library-btn'),
  libraryLoading: document.getElementById('library-loading'),
  libraryEmpty: document.getElementById('library-empty'),
  libraryList: document.getElementById('library-list'),
  
  // QR elements
  qrCanvas: document.getElementById('qr-canvas'),
  qrSpinner: document.getElementById('qr-spinner'),
  qrTargetUrl: document.getElementById('qr-target-url'),
  copyLinkBtn: document.getElementById('copy-link-btn'),
  downloadQrBtn: document.getElementById('download-qr-btn'),
  downloadOptions: document.querySelectorAll('.download-options button'),
  printQrBtn: document.getElementById('print-qr-btn'),
  
  // Customizer elements
  resetCustomizer: document.getElementById('reset-customizer'),
  qrColorFg: document.getElementById('qr-color-fg'),
  fgColorHex: document.getElementById('fg-color-hex'),
  qrColorBg: document.getElementById('qr-color-bg'),
  bgColorHex: document.getElementById('bg-color-hex'),
  qrSizeSlider: document.getElementById('qr-size-slider'),
  sizeValueDisplay: document.getElementById('size-value-display'),
  logoInput: document.getElementById('logo-input'),
  uploadLogoBtn: document.getElementById('upload-logo-btn'),
  logoNameDisplay: document.getElementById('logo-name-display'),
  removeLogoBtn: document.getElementById('remove-logo-btn'),
  qrEcc: document.getElementById('qr-ecc'),
  qrMargin: document.getElementById('qr-margin'),
  
  // Footer & Print
  serverIpStatus: document.getElementById('server-ip-status'),
  printQrTarget: document.getElementById('print-qr-target'),
  printUrlText: document.getElementById('print-url-text'),
  
  // Modal Elements
  previewModal: document.getElementById('preview-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  modalTitle: document.getElementById('modal-title'),
  pdfPreviewCanvas: document.getElementById('pdf-preview-canvas'),
  pdfRenderingIndicator: document.getElementById('pdf-rendering-indicator'),
  pdfPrevPage: document.getElementById('pdf-prev-page'),
  pdfNextPage: document.getElementById('pdf-next-page'),
  pdfPageNum: document.getElementById('pdf-page-num')
};

// -------------------------------------------------------------
// Initialize App
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  fetchServerConfig();
  fetchLibraryFiles();
});

// -------------------------------------------------------------
// Theme Management (Light / Dark)
// -------------------------------------------------------------
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  showToast(`Đã chuyển sang giao diện ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`);
}

// -------------------------------------------------------------
// Fetch Server Config & Library Files
// -------------------------------------------------------------
async function fetchServerConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      elements.serverIpStatus.textContent = `http://${data.localIP}:${data.port}`;
    } else {
      elements.serverIpStatus.textContent = window.location.origin;
    }
  } catch (err) {
    elements.serverIpStatus.textContent = window.location.origin;
  }
}

async function fetchLibraryFiles() {
  try {
    elements.libraryLoading.classList.remove('hidden');
    elements.libraryList.classList.add('hidden');
    elements.libraryEmpty.classList.add('hidden');

    const res = await fetch('/api/files');
    if (!res.ok) throw new Error('Không thể tải thư viện tệp.');

    const data = await res.json();
    state.libraryFiles = data.files || [];
    
    // Update count badge
    elements.libraryCount.textContent = state.libraryFiles.length;
    elements.libraryLoading.classList.add('hidden');

    if (state.libraryFiles.length === 0) {
      elements.libraryEmpty.classList.remove('hidden');
    } else {
      renderLibrary();
      elements.libraryList.classList.remove('hidden');
    }
  } catch (err) {
    elements.libraryLoading.classList.add('hidden');
    elements.libraryEmpty.classList.remove('hidden');
    showToast(err.message, 'error');
  }
}

function renderLibrary() {
  elements.libraryList.innerHTML = '';
  state.libraryFiles.forEach(file => {
    const isSelected = state.activeFileUrl === file.url;
    
    const date = new Date(file.uploadedAt);
    const dateString = date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const sizeString = formatBytes(file.size);

    const item = document.createElement('div');
    item.className = `library-item ${isSelected ? 'selected' : ''}`;
    item.dataset.url = file.url;
    item.dataset.filename = file.filename;
    item.dataset.original = file.originalName;

    item.innerHTML = `
      <div class="lib-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      </div>
      <div class="lib-details">
        <span class="lib-name" title="${file.originalName}">${file.originalName}</span>
        <div class="lib-meta">
          <span>${sizeString}</span>
          <span class="dot-separator">•</span>
          <span>${dateString}</span>
        </div>
      </div>
      <div class="lib-actions">
        <button class="lib-btn btn-lib-preview" title="Xem trước PDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="lib-btn btn-lib-delete" title="Xóa tệp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;

    // Click on item selects it
    item.addEventListener('click', (e) => {
      // Prevent selection if delete action is clicked
      if (e.target.closest('.btn-lib-delete')) return;
      if (e.target.closest('.btn-lib-preview')) {
        previewPdfFromUrl(file.url, file.originalName);
        return;
      }

      selectLibraryFile(file);
    });

    // Wire delete button
    item.querySelector('.btn-lib-delete').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Bạn có chắc chắn muốn xóa file "${file.originalName}" khỏi thư viện?`)) {
        await deleteLibraryFile(file.filename);
      }
    });

    elements.libraryList.appendChild(item);
  });
}

function selectLibraryFile(file) {
  state.activeFileUrl = file.url;
  state.activeFileName = file.originalName;
  
  // Show file card
  elements.activeFileName.textContent = file.originalName;
  elements.activeFileSize.textContent = formatBytes(file.size);
  elements.activeFileCard.classList.remove('hidden');
  
  // Update state modes
  state.activeFile = null; // Clear local raw file
  
  // Update UI selection classes
  document.querySelectorAll('.library-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.url === file.url);
  });

  generateQRCode();
  showToast(`Đã chọn file: ${file.originalName}`);
}

async function deleteLibraryFile(filename) {
  try {
    const res = await fetch(`/api/files/${filename}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa file.');

    showToast('Xóa tệp thành công');
    
    // If deleted file was currently active, reset the QR
    const activeFileEnding = state.activeFileUrl.substring(state.activeFileUrl.lastIndexOf('/') + 1);
    if (activeFileEnding === filename) {
      resetFileSelector();
    }
    
    fetchLibraryFiles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// Drag & Drop & Upload Handling
// -------------------------------------------------------------
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Tabs
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      switchMode(mode);
    });
  });

  // Dropzone drag/drop
  ['dragenter', 'dragover'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      elements.dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    elements.dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      elements.dropzone.classList.remove('dragover');
    }, false);
  });

  elements.dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleFileSelection(file);
  });

  elements.dropzone.addEventListener('click', () => {
    elements.fileInput.click();
  });

  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Direct Link Button
  elements.generateLinkBtn.addEventListener('click', () => {
    const url = elements.directUrlInput.value.trim();
    if (!url) {
      showToast('Vui lòng nhập đường dẫn URL hợp lệ', 'error');
      return;
    }
    
    state.activeFileUrl = url;
    state.activeFileName = url.substring(url.lastIndexOf('/') + 1) || 'document.pdf';
    generateQRCode();
    showToast('Đã tạo mã QR từ liên kết');
  });

  // Remove Active File Card
  elements.removeFileBtn.addEventListener('click', resetFileSelector);

  // Refresh library
  elements.refreshLibraryBtn.addEventListener('click', fetchLibraryFiles);

  // QR Action Buttons
  elements.copyLinkBtn.addEventListener('click', copyLinkToClipboard);
  
  elements.downloadOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      downloadQRCode(format);
    });
  });

  elements.printQrBtn.addEventListener('click', printQRCode);

  // Customizer inputs
  elements.qrColorFg.addEventListener('input', (e) => {
    state.qrSettings.fgColor = e.target.value;
    elements.fgColorHex.textContent = e.target.value.toUpperCase();
    generateQRCode();
  });

  elements.qrColorBg.addEventListener('input', (e) => {
    state.qrSettings.bgColor = e.target.value;
    elements.bgColorHex.textContent = e.target.value.toUpperCase();
    generateQRCode();
  });

  elements.qrSizeSlider.addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    state.qrSettings.size = size;
    elements.sizeValueDisplay.textContent = `${size} x ${size} px`;
    generateQRCode();
  });

  // Logo file loading
  elements.uploadLogoBtn.addEventListener('click', () => {
    elements.logoInput.click();
  });

  elements.logoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.qrSettings.logoImg = img;
          state.qrSettings.logoName = file.name;
          elements.logoNameDisplay.textContent = file.name;
          elements.logoNameDisplay.classList.remove('logo-status');
          elements.removeLogoBtn.classList.remove('hidden');
          generateQRCode();
          showToast('Đã thêm Logo ở giữa mã QR');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  elements.removeLogoBtn.addEventListener('click', () => {
    state.qrSettings.logoImg = null;
    state.qrSettings.logoName = '';
    elements.logoNameDisplay.textContent = 'Chưa có logo';
    elements.logoNameDisplay.classList.add('logo-status');
    elements.removeLogoBtn.classList.add('hidden');
    elements.logoInput.value = '';
    generateQRCode();
    showToast('Đã xóa logo khỏi mã QR');
  });

  elements.qrEcc.addEventListener('change', (e) => {
    state.qrSettings.ecc = e.target.value;
    generateQRCode();
  });

  elements.qrMargin.addEventListener('change', (e) => {
    state.qrSettings.margin = parseInt(e.target.value, 10);
    generateQRCode();
  });

  elements.resetCustomizer.addEventListener('click', resetCustomizerSettings);

  // PDF Preview & Modal triggers
  elements.btnPreviewModal.addEventListener('click', () => {
    if (state.activeFile) {
      previewPdfFromFile(state.activeFile);
    } else if (state.activeFileUrl) {
      previewPdfFromUrl(state.activeFileUrl, state.activeFileName);
    }
  });

  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.previewModal.addEventListener('click', (e) => {
    if (e.target === elements.previewModal) closeModal();
  });

  elements.pdfPrevPage.addEventListener('click', () => {
    if (state.pdfDoc && state.pdfCurrentPage > 1) {
      state.pdfCurrentPage--;
      renderPdfPage(state.pdfCurrentPage);
    }
  });

  elements.pdfNextPage.addEventListener('click', () => {
    if (state.pdfDoc && state.pdfCurrentPage < state.pdfTotalPages) {
      state.pdfCurrentPage++;
      renderPdfPage(state.pdfCurrentPage);
    }
  });
}

// -------------------------------------------------------------
// Mode Switching & Input UI states
// -------------------------------------------------------------
function switchMode(mode) {
  state.currentMode = mode;
  
  // Update tabs visual state
  elements.tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Update mode info descriptions
  Object.keys(elements.modeInfoBoxes).forEach(key => {
    elements.modeInfoBoxes[key].classList.toggle('active', key === mode);
  });

  // Switch input fields
  if (mode === 'link') {
    elements.dropzone.classList.add('hidden');
    elements.linkInputContainer.classList.remove('hidden');
    elements.activeFileCard.classList.add('hidden');
  } else {
    elements.dropzone.classList.remove('hidden');
    elements.linkInputContainer.classList.add('hidden');
    
    // If there was an active file, restore it
    if (state.activeFile || (state.activeFileUrl && state.activeFileUrl.includes(window.location.host))) {
      if (mode === 'local' && state.activeFileUrl.includes('tmpfiles.org')) {
        // Uploaded in cloud, clear active card for local mode
        elements.activeFileCard.classList.add('hidden');
      } else {
        elements.activeFileCard.classList.remove('hidden');
      }
    }
  }

  // Clear URL inputs or reset states
  resetFileSelector();
}

function resetFileSelector() {
  state.activeFile = null;
  state.activeFileName = '';
  state.activeFileUrl = '';
  elements.activeFileCard.classList.add('hidden');
  elements.fileInput.value = '';
  elements.directUrlInput.value = '';
  elements.progressBarFill.style.width = '0%';
  elements.uploadProgressContainer.classList.add('hidden');

  // De-select library list
  document.querySelectorAll('.library-item').forEach(el => el.classList.remove('selected'));

  clearQRCodeCanvas();
}

function handleFileSelection(file) {
  if (!file) return;

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Chỉ chấp nhận file định dạng PDF!', 'error');
    return;
  }

  state.activeFile = file;
  state.activeFileName = file.name;

  // Show active file card
  elements.activeFileName.textContent = file.name;
  elements.activeFileSize.textContent = formatBytes(file.size);
  elements.activeFileCard.classList.remove('hidden');

  // Execute Upload depending on active Mode
  if (state.currentMode === 'local') {
    uploadToLocalServer(file);
  } else if (state.currentMode === 'cloud') {
    uploadToCloudServer(file);
  }
}

// -------------------------------------------------------------
// API upload requests (Local / Cloud)
// -------------------------------------------------------------
function uploadToLocalServer(file) {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  
  elements.uploadProgressContainer.classList.remove('hidden');
  elements.progressBarFill.style.width = '0%';
  elements.progressPercent.textContent = '0%';
  elements.progressStatus.textContent = 'Đang tải lên local server...';

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      elements.progressBarFill.style.width = `${percent}%`;
      elements.progressPercent.textContent = `${percent}%`;
    }
  };

  xhr.onload = () => {
    elements.uploadProgressContainer.classList.add('hidden');
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          state.activeFileUrl = response.url;
          generateQRCode();
          fetchLibraryFiles(); // Refresh PDF library
          showToast('Tải lên local server thành công!');
        } else {
          showToast(response.error || 'Tải file lên thất bại', 'error');
        }
      } catch (err) {
        showToast('Lỗi phản hồi dữ liệu từ máy chủ', 'error');
      }
    } else {
      showToast('Lỗi kết nối tới máy chủ local', 'error');
    }
  };

  xhr.onerror = () => {
    elements.uploadProgressContainer.classList.add('hidden');
    showToast('Lỗi kết nối mạng, vui lòng thử lại', 'error');
  };

  xhr.open('POST', '/api/upload', true);
  xhr.send(formData);
}

function uploadToCloudServer(file) {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();

  elements.uploadProgressContainer.classList.remove('hidden');
  elements.progressBarFill.style.width = '0%';
  elements.progressPercent.textContent = '0%';
  elements.progressStatus.textContent = 'Đang tải lên Cloud (tmpfiles.org)...';

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      elements.progressBarFill.style.width = `${percent}%`;
      elements.progressPercent.textContent = `${percent}%`;
    }
  };

  xhr.onload = () => {
    elements.uploadProgressContainer.classList.add('hidden');
    if (xhr.status === 200) {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.status === 'success' && response.data && response.data.url) {
          // Replace view link with download link
          const downloadUrl = response.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
          state.activeFileUrl = downloadUrl;
          generateQRCode();
          showToast('Tải lên Cloud thành công! File hết hạn sau 60 phút.');
        } else {
          showToast('Lỗi upload từ server đám mây', 'error');
        }
      } catch (err) {
        showToast('Lỗi parse phản hồi máy chủ cloud', 'error');
      }
    } else {
      showToast('Không thể upload lên Cloud. Vui lòng kiểm tra internet.', 'error');
    }
  };

  xhr.onerror = () => {
    elements.uploadProgressContainer.classList.add('hidden');
    showToast('Lỗi mạng, kiểm tra kết nối internet', 'error');
  };

  xhr.open('POST', 'https://tmpfiles.org/api/v1/upload', true);
  xhr.send(formData);
}

// -------------------------------------------------------------
// QR Code Rendering & Customization
// -------------------------------------------------------------
function generateQRCode() {
  const url = state.activeFileUrl;
  if (!url) {
    clearQRCodeCanvas();
    return;
  }

  elements.qrSpinner.classList.remove('hidden');
  elements.qrTargetUrl.textContent = url;
  
  // Enable buttons
  elements.copyLinkBtn.removeAttribute('disabled');
  elements.downloadQrBtn.removeAttribute('disabled');
  elements.printQrBtn.removeAttribute('disabled');

  const canvas = elements.qrCanvas;
  const size = state.qrSettings.size;

  // Render QR Code onto canvas
  QRCode.toCanvas(canvas, url, {
    width: size,
    margin: state.qrSettings.margin,
    color: {
      dark: state.qrSettings.fgColor,
      light: state.qrSettings.bgColor
    },
    errorCorrectionLevel: state.qrSettings.ecc
  }, (error) => {
    elements.qrSpinner.classList.add('hidden');
    if (error) {
      showToast('Không thể tạo mã QR. Vui lòng giảm bớt độ dài đường link.', 'error');
      console.error(error);
      return;
    }

    // Draw custom logo if configured
    if (state.qrSettings.logoImg) {
      drawLogoOnQR(canvas);
    }
  });
}

function drawLogoOnQR(canvas) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  
  const logo = state.qrSettings.logoImg;
  
  // Calculate size (18% of QR size is recommended for scannability with ECC H)
  const logoSize = size * 0.18;
  const cx = size / 2;
  const cy = size / 2;

  ctx.save();
  
  // 1. Draw solid rounded border mask (matches background color)
  ctx.fillStyle = state.qrSettings.bgColor;
  ctx.beginPath();
  const maskSize = logoSize + 10;
  
  // Using roundRect if supported, otherwise normal rect
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(cx - maskSize / 2, cy - maskSize / 2, maskSize, maskSize, 8);
  } else {
    ctx.rect(cx - maskSize / 2, cy - maskSize / 2, maskSize, maskSize);
  }
  ctx.fill();

  // 2. Draw subtle border outline
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. Draw Logo Image centered and clipped inside a rounded rectangle
  ctx.beginPath();
  const logoRadius = 6;
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize, logoRadius);
  } else {
    ctx.rect(cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
  }
  ctx.clip();
  ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);

  ctx.restore();
}

function clearQRCodeCanvas() {
  const canvas = elements.qrCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  elements.qrTargetUrl.textContent = 'Chưa có liên kết QR';
  elements.copyLinkBtn.setAttribute('disabled', 'true');
  elements.downloadQrBtn.setAttribute('disabled', 'true');
  elements.printQrBtn.setAttribute('disabled', 'true');
}

function resetCustomizerSettings() {
  state.qrSettings.fgColor = '#0f172a';
  state.qrSettings.bgColor = '#ffffff';
  state.qrSettings.size = 300;
  state.qrSettings.ecc = 'H';
  state.qrSettings.margin = 4;
  state.qrSettings.logoImg = null;
  state.qrSettings.logoName = '';

  elements.qrColorFg.value = '#0f172a';
  elements.fgColorHex.textContent = '#0F172A';
  elements.qrColorBg.value = '#ffffff';
  elements.bgColorHex.textContent = '#FFFFFF';
  elements.qrSizeSlider.value = 300;
  elements.sizeValueDisplay.textContent = '300 x 300 px';
  elements.logoInput.value = '';
  elements.logoNameDisplay.textContent = 'Chưa có logo';
  elements.logoNameDisplay.classList.add('logo-status');
  elements.removeLogoBtn.classList.add('hidden');
  elements.qrEcc.value = 'H';
  elements.qrMargin.value = '4';

  generateQRCode();
  showToast('Đã khôi phục cài đặt mã QR mặc định');
}

// -------------------------------------------------------------
// QR Actions (Copy, Download, Print)
// -------------------------------------------------------------
function copyLinkToClipboard() {
  const url = state.activeFileUrl;
  if (!url) return;

  navigator.clipboard.writeText(url)
    .then(() => {
      showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
    })
    .catch(() => {
      showToast('Không thể sao chép liên kết.', 'error');
    });
}

function downloadQRCode(format) {
  const url = state.activeFileUrl;
  if (!url) return;

  const baseName = state.activeFileName.replace(/\.[^/.]+$/, "");
  const fileName = `qr_${baseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  if (format === 'png') {
    // Generate simple download link from canvas
    const dataUrl = elements.qrCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    a.click();
    showToast('Đã tải mã QR dạng PNG');
  } 
  else if (format === 'svg') {
    // Render as SVG using qrcode library
    QRCode.toString(url, {
      type: 'svg',
      width: state.qrSettings.size,
      margin: state.qrSettings.margin,
      color: {
        dark: state.qrSettings.fgColor,
        light: state.qrSettings.bgColor
      },
      errorCorrectionLevel: state.qrSettings.ecc
    }).then(svgString => {
      // If there is a logo image, we need to inject it as an SVG <image> tag into the middle of the generated SVG!
      // This is a premium touch to ensure the SVG is an exact match to the Canvas view.
      if (state.qrSettings.logoImg) {
        svgString = injectLogoIntoSVG(svgString);
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${fileName}.svg`;
      a.click();
      
      // Clean up object URL after download completes
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      showToast('Đã tải mã QR dạng SVG');
    }).catch(err => {
      showToast('Không thể tạo file SVG', 'error');
      console.error(err);
    });
  }
}

// Injects the logo image as base64 into the middle of the SVG string
function injectLogoIntoSVG(svgString) {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = svgDoc.documentElement;
    
    // Get SVG dimensions
    const width = parseFloat(svgEl.getAttribute('width') || '300');
    const height = parseFloat(svgEl.getAttribute('height') || '300');

    // Create container mask and image group
    const logoSize = width * 0.18;
    const cx = width / 2;
    const cy = height / 2;
    const logoRadius = 6;
    const maskSize = logoSize + 10;

    // Draw white background backing
    const rectBg = svgDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectBg.setAttribute("x", cx - maskSize / 2);
    rectBg.setAttribute("y", cy - maskSize / 2);
    rectBg.setAttribute("width", maskSize);
    rectBg.setAttribute("height", maskSize);
    rectBg.setAttribute("rx", 8);
    rectBg.setAttribute("fill", state.qrSettings.bgColor);
    rectBg.setAttribute("stroke", "#e2e8f0");
    rectBg.setAttribute("stroke-width", "1.5");
    svgEl.appendChild(rectBg);

    // Draw base64 image
    const imageEl = svgDoc.createElementNS("http://www.w3.org/2000/svg", "image");
    imageEl.setAttribute("x", cx - logoSize / 2);
    imageEl.setAttribute("y", cy - logoSize / 2);
    imageEl.setAttribute("width", logoSize);
    imageEl.setAttribute("height", logoSize);
    imageEl.setAttribute("href", state.qrSettings.logoImg.src);
    
    // Apply rounded clip path inside SVG
    const clipId = `logo-clip-${Date.now()}`;
    const defs = svgDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = svgDoc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", clipId);
    
    const clipRect = svgDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
    clipRect.setAttribute("x", cx - logoSize / 2);
    clipRect.setAttribute("y", cy - logoSize / 2);
    clipRect.setAttribute("width", logoSize);
    clipRect.setAttribute("height", logoSize);
    clipRect.setAttribute("rx", logoRadius);
    
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svgEl.appendChild(defs);
    
    imageEl.setAttribute("clip-path", `url(#${clipId})`);
    svgEl.appendChild(imageEl);

    return new XMLSerializer().serializeToString(svgEl);
  } catch (err) {
    console.error("Error embedding logo to SVG: ", err);
    return svgString;
  }
}

function printQRCode() {
  const url = state.activeFileUrl;
  if (!url) return;

  // Clear previous print children
  elements.printQrTarget.innerHTML = '';
  
  // Clone active canvas onto printable page
  const printCanvas = document.createElement('canvas');
  printCanvas.width = elements.qrCanvas.width;
  printCanvas.height = elements.qrCanvas.height;
  
  const ctx = printCanvas.getContext('2d');
  ctx.drawImage(elements.qrCanvas, 0, 0);
  
  elements.printQrTarget.appendChild(printCanvas);
  
  // Update label text
  elements.printUrlText.textContent = url;
  
  // Open browser print window
  window.print();
}

// -------------------------------------------------------------
// PDF.js rendering & Modal Actions
// -------------------------------------------------------------
function previewPdfFromFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const typedarray = new Uint8Array(e.target.result);
    loadPdfDoc(typedarray, file.name);
  };
  reader.readAsArrayBuffer(file);
}

function previewPdfFromUrl(url, originalName) {
  loadPdfDoc(url, originalName);
}

function loadPdfDoc(pdfSource, fileName) {
  elements.previewModal.classList.remove('hidden');
  elements.pdfRenderingIndicator.classList.remove('hidden');
  elements.modalTitle.textContent = fileName || 'Xem trước tài liệu';
  
  state.pdfCurrentPage = 1;
  state.pdfDoc = null;
  
  // Load document using PDFJS
  pdfjsLib.getDocument(pdfSource).promise.then(pdf => {
    state.pdfDoc = pdf;
    state.pdfTotalPages = pdf.numPages;
    elements.pdfPageNum.textContent = `Trang ${state.pdfCurrentPage} / ${state.pdfTotalPages}`;
    
    renderPdfPage(state.pdfCurrentPage);
  }).catch(err => {
    elements.pdfRenderingIndicator.classList.add('hidden');
    showToast('Lỗi nạp tài liệu PDF để xem trước', 'error');
    console.error(err);
  });
}

function renderPdfPage(pageNum) {
  if (!state.pdfDoc) return;
  
  elements.pdfRenderingIndicator.classList.remove('hidden');
  
  // Toggle pagination buttons
  elements.pdfPrevPage.disabled = (pageNum <= 1);
  elements.pdfNextPage.disabled = (pageNum >= state.pdfTotalPages);
  elements.pdfPageNum.textContent = `Trang ${pageNum} / ${state.pdfTotalPages}`;

  state.pdfDoc.getPage(pageNum).then(page => {
    const canvas = elements.pdfPreviewCanvas;
    const ctx = canvas.getContext('2d');
    
    // Dynamically calculate view scaling to fit modal container width
    const containerWidth = document.getElementById('pdf-viewer-container').clientWidth;
    const initialViewport = page.getViewport({ scale: 1 });
    
    // Scale viewport
    const scale = (containerWidth - 40) / initialViewport.width;
    const viewport = page.getViewport({ scale: Math.min(scale, 1.5) });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    page.render(renderContext).promise.then(() => {
      elements.pdfRenderingIndicator.classList.add('hidden');
    });
  });
}

function closeModal() {
  elements.previewModal.classList.add('hidden');
  
  // Clean preview canvas
  const canvas = elements.pdfPreviewCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  state.pdfDoc = null;
}

// -------------------------------------------------------------
// Helper Functions (Formatting & Toasts)
// -------------------------------------------------------------
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  const icon = type === 'error' 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem;height:1.25rem;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.25rem;height:1.25rem;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 3s
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s ease reverse forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}
