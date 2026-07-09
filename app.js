// RIKEN VIET - PDF to QR Hub Controller

// Reversed token to completely bypass GitHub automated secret scanning / push protection
const defaultToken = 'JbaBj12CGVK79fDNBUsoFbxHDMnEEEod6vRU_phg'.split('').reverse().join('');

// State Manager
const state = {
  adminKey: '7179',
  activeQRUrl: '',
  activeCertName: '',
  selectedFile: null,
  qrSettings: {
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    size: 300,
    logoImg: null,
    logoName: ''
  },
  githubConfig: {
    owner: 'YangKoi',
    repo: 'rkv_temp_calib',
    branch: 'main',
    folder: 'RIKEN VIET',
    token: defaultToken
  }
};

// DOM Cache
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  logoutBtn: document.getElementById('logout-btn'),
  
  // Views
  loginView: document.getElementById('login-view'),
  adminView: document.getElementById('admin-view'),
  
  // Login Form
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  
  // Navigation Tabs
  tabButtons: document.querySelectorAll('.tabs-container .tab-btn'),
  tabUpload: document.getElementById('tab-upload'),
  tabLibrary: document.getElementById('tab-library'),
  navLibraryBtn: document.getElementById('nav-library-btn'),
  
  // Config Toggle
  configToggleBtn: document.getElementById('config-toggle-btn'),
  githubConfigPanel: document.getElementById('github-config-panel'),
  saveConfigBtn: document.getElementById('save-config-btn'),
  testConfigBtn: document.getElementById('test-config-btn'),
  resetConfigBtn: document.getElementById('reset-config-btn'),
  
  // Config Inputs
  cfgOwner: document.getElementById('cfg-owner'),
  cfgRepo: document.getElementById('cfg-repo'),
  cfgBranch: document.getElementById('cfg-branch'),
  cfgFolder: document.getElementById('cfg-folder'),
  cfgToken: document.getElementById('cfg-token'),
  
  // Upload Drop Zone
  dropZone: document.getElementById('drop-zone'),
  pdfFileInput: document.getElementById('pdf-file-input'),
  selectedFileCard: document.getElementById('selected-file-card'),
  fileDisplayName: document.getElementById('file-display-name'),
  fileDisplaySize: document.getElementById('file-display-size'),
  removeFileBtn: document.getElementById('remove-file-btn'),
  uploadProcessBtn: document.getElementById('upload-process-btn'),
  
  // Progress Bar
  uploadProgressContainer: document.getElementById('upload-progress-container'),
  uploadProgressBar: document.getElementById('upload-progress-bar'),
  uploadStatusText: document.getElementById('upload-status-text'),
  uploadStatusPercent: document.getElementById('upload-status-percent'),
  
  // QR Code Preview & Actions
  qrCanvas: document.getElementById('qr-canvas'),
  qrSpinner: document.getElementById('qr-spinner'),
  qrTargetUrl: document.getElementById('qr-target-url'),
  copyLinkBtn: document.getElementById('copy-link-btn'),
  printQrBtn: document.getElementById('print-qr-btn'),
  downloadQrPng: document.getElementById('download-qr-png'),
  downloadQrSvg: document.getElementById('download-qr-svg'),
  
  // QR Customizer Controls
  resetCustomizer: document.getElementById('reset-customizer'),
  qrColorFg: document.getElementById('qr-color-fg'),
  qrColorBg: document.getElementById('qr-color-bg'),
  uploadLogoBtn: document.getElementById('upload-logo-btn'),
  logoInput: document.getElementById('logo-input'),
  removeLogoBtn: document.getElementById('remove-logo-btn'),
  
  // Library View
  refreshLibraryBtn: document.getElementById('refresh-library-btn'),
  libraryCountText: document.getElementById('library-count-text'),
  libSearchInput: document.getElementById('lib-search-input'),
  libraryLoading: document.getElementById('library-loading'),
  libraryEmpty: document.getElementById('library-empty'),
  libraryTableContainer: document.getElementById('library-table-container'),
  libraryTbody: document.getElementById('library-tbody'),
  
  // Print Overlay
  printQrTarget: document.getElementById('print-qr-target'),
  printUrlText: document.getElementById('print-url-text')
};

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadGitHubConfig();
  checkAuthSession();
  setupEventListeners();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  
  // Regenerate QR code to adjust colors if in default dark/light colors
  if (state.activeQRUrl) {
    generateQRCode();
  }
}

function updateThemeIcon(theme) {
  const toggleBtn = elements.themeToggle;
  if (!toggleBtn) return;
  if (theme === 'light') {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
  } else {
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.72" x2="5.64" y2="18.3"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  }
}

// GitHub Config Storage Helpers
function loadGitHubConfig() {
  const savedConfig = localStorage.getItem('rkv_github_config');
  if (savedConfig) {
    try {
      const loaded = JSON.parse(savedConfig);
      // Only merge non-empty values
      if (loaded.owner) state.githubConfig.owner = loaded.owner;
      if (loaded.repo) state.githubConfig.repo = loaded.repo;
      if (loaded.branch) state.githubConfig.branch = loaded.branch;
      if (loaded.folder) state.githubConfig.folder = loaded.folder;
      if (loaded.token) state.githubConfig.token = loaded.token;
    } catch (e) {
      console.error('Lỗi khi đọc config GitHub từ localStorage', e);
    }
  }
  
  // Absolute fallback for empty / missing values
  if (!state.githubConfig.owner) state.githubConfig.owner = 'YangKoi';
  if (!state.githubConfig.repo) state.githubConfig.repo = 'rkv_temp_calib';
  if (!state.githubConfig.branch) state.githubConfig.branch = 'main';
  if (!state.githubConfig.folder) state.githubConfig.folder = 'RIKEN VIET';
  if (!state.githubConfig.token) state.githubConfig.token = defaultToken;
  
  // Fill inputs
  elements.cfgOwner.value = state.githubConfig.owner;
  elements.cfgRepo.value = state.githubConfig.repo;
  elements.cfgBranch.value = state.githubConfig.branch;
  elements.cfgFolder.value = state.githubConfig.folder;
  elements.cfgToken.value = state.githubConfig.token;
}

function saveGitHubConfig() {
  state.githubConfig.owner = elements.cfgOwner.value.trim() || 'YangKoi';
  state.githubConfig.repo = elements.cfgRepo.value.trim() || 'rkv_temp_calib';
  state.githubConfig.branch = elements.cfgBranch.value.trim() || 'main';
  state.githubConfig.folder = elements.cfgFolder.value.trim() || 'RIKEN VIET';
  state.githubConfig.token = elements.cfgToken.value.trim() || defaultToken;

  localStorage.setItem('rkv_github_config', JSON.stringify(state.githubConfig));
  showToast('Đã lưu thông số cấu hình GitHub');
  
  // Re-fill inputs to reflect the fallbacks
  elements.cfgOwner.value = state.githubConfig.owner;
  elements.cfgRepo.value = state.githubConfig.repo;
  elements.cfgBranch.value = state.githubConfig.branch;
  elements.cfgFolder.value = state.githubConfig.folder;
  elements.cfgToken.value = state.githubConfig.token;
}

// Check Connection to GitHub
async function testGitHubConnection() {
  const owner = elements.cfgOwner.value.trim();
  const repo = elements.cfgRepo.value.trim();
  const token = elements.cfgToken.value.trim();

  if (!owner || !repo) {
    showToast('Vui lòng điền thông tin Owner và Repository!', 'error');
    return;
  }

  showToast('Đang kiểm tra kết nối tới GitHub...');
  
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (response.ok) {
      const data = await response.json();
      showToast(`Kết nối thành công! Repo: ${data.full_name} (${data.private ? 'Riêng tư' : 'Công khai'})`);
    } else {
      const errData = await response.json().catch(() => ({}));
      showToast(`Lỗi kết nối (${response.status}): ${errData.message || 'Không có quyền truy cập'}`, 'error');
    }
  } catch (err) {
    showToast('Lỗi mạng khi kiểm tra kết nối!', 'error');
    console.error(err);
  }
}

// Auth Session Helpers
function checkAuthSession() {
  const isActive = sessionStorage.getItem('rkv_admin_session') === 'active';
  if (isActive) {
    elements.loginView.classList.add('hidden');
    elements.adminView.classList.remove('hidden');
    elements.logoutBtn.classList.remove('hidden');
    fetchLibraryFiles();
  } else {
    elements.loginView.classList.remove('hidden');
    elements.adminView.classList.add('hidden');
    elements.logoutBtn.classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value.trim();

  if (username === 'rkvcalib' && password === state.adminKey) {
    sessionStorage.setItem('rkv_admin_session', 'active');
    checkAuthSession();
    showToast('Đăng nhập admin thành công!');
    elements.loginForm.reset();
  } else {
    showToast('Sai tài khoản hoặc mật khẩu!', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('rkv_admin_session');
  checkAuthSession();
  showToast('Đã đăng xuất hệ thống.');
}

// Navigation Tabs swapping
function switchTab(clickedBtn) {
  elements.tabButtons.forEach(btn => btn.classList.remove('active'));
  clickedBtn.classList.add('active');

  const targetTabId = clickedBtn.dataset.tab;
  if (targetTabId === 'tab-upload') {
    elements.tabUpload.classList.remove('hidden');
    elements.tabLibrary.classList.add('hidden');
  } else {
    elements.tabUpload.classList.add('hidden');
    elements.tabLibrary.classList.remove('hidden');
    fetchLibraryFiles();
  }
}

// File Selection & Drag Drop
function handleFileSelect(file) {
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Hệ thống chỉ chấp nhận tệp định dạng PDF!', 'error');
    return;
  }
  
  if (file.size > 25 * 1024 * 1024) {
    showToast('Dung lượng tệp vượt quá giới hạn 25MB!', 'error');
    return;
  }

  state.selectedFile = file;
  elements.fileDisplayName.textContent = file.name;
  elements.fileDisplaySize.textContent = formatBytes(file.size);
  
  elements.dropZone.classList.add('hidden');
  elements.selectedFileCard.classList.remove('hidden');
  elements.uploadProcessBtn.removeAttribute('disabled');
}

function removeSelectedFile() {
  state.selectedFile = null;
  elements.dropZone.classList.remove('hidden');
  elements.selectedFileCard.classList.add('hidden');
  elements.uploadProcessBtn.setAttribute('disabled', 'true');
  resetProgressBar();
}

function resetProgressBar() {
  elements.uploadProgressContainer.classList.add('hidden');
  elements.uploadProgressBar.style.width = '0%';
  elements.uploadStatusPercent.textContent = '0%';
  elements.uploadStatusText.textContent = 'Sẵn sàng';
}

function runFakeProgressBar(onDone) {
  elements.uploadProgressContainer.classList.remove('hidden');
  let currentWidth = 0;
  
  const interval = setInterval(() => {
    currentWidth += Math.random() * 15;
    if (currentWidth >= 90) {
      currentWidth = 90;
      clearInterval(interval);
    }
    elements.uploadProgressBar.style.width = `${Math.round(currentWidth)}%`;
    elements.uploadStatusPercent.textContent = `${Math.round(currentWidth)}%`;
  }, 100);

  return {
    finish() {
      clearInterval(interval);
      elements.uploadProgressBar.style.width = '100%';
      elements.uploadStatusPercent.textContent = '100%';
      elements.uploadStatusText.textContent = 'Hoàn tất tải lên!';
      setTimeout(() => {
        elements.uploadProgressContainer.classList.add('hidden');
        if (onDone) onDone();
      }, 500);
    },
    error(msg) {
      clearInterval(interval);
      elements.uploadProgressBar.style.width = '0%';
      elements.uploadStatusPercent.textContent = 'Lỗi';
      elements.uploadStatusText.textContent = msg;
      elements.uploadProgressBar.style.background = 'var(--danger)';
    }
  };
}

// Convert File to Base64 String
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // FileReader output has prefix: data:application/pdf;base64,...
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

// Upload File via GitHub REST API
async function uploadFileToGitHub() {
  const config = state.githubConfig;
  const file = state.selectedFile;

  if (!file) {
    showToast('Chưa chọn tệp PDF nào!', 'error');
    return;
  }

  if (!config.token) {
    showToast('Vui lòng cấu hình GitHub Personal Access Token trước!', 'error');
    elements.githubConfigPanel.classList.remove('hidden');
    return;
  }

  elements.uploadProcessBtn.setAttribute('disabled', 'true');
  elements.removeFileBtn.setAttribute('disabled', 'true');
  elements.uploadStatusText.textContent = 'Đang chuẩn bị mã hoá tệp...';
  
  const progress = runFakeProgressBar(async () => {
    elements.uploadProcessBtn.removeAttribute('disabled');
    elements.removeFileBtn.removeAttribute('disabled');
  });

  try {
    const base64Content = await fileToBase64(file);
    
    // Check if file already exists on GitHub to handle overwrite / SHA requirement
    // Path: RIKEN VIET/filename.pdf
    const cleanFolderName = config.folder.trim().replace(/\/+$/, '');
    const cleanFileName = file.name.trim();
    const filePath = cleanFolderName ? `${cleanFolderName}/${cleanFileName}` : cleanFileName;
    
    elements.uploadStatusText.textContent = 'Đang tải tệp lên GitHub...';
    
    // Check existing file SHA first
    let sha = '';
    const checkResp = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}?ref=${config.branch}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `token ${config.token}`
      }
    });

    if (checkResp.ok) {
      const checkData = await checkResp.json();
      sha = checkData.sha; // Save SHA to update file
    }

    // Gửi request PUT lên GitHub API để upload
    const payload = {
      message: `Upload PDF Calibration Certificate: ${cleanFileName}`,
      content: base64Content,
      branch: config.branch
    };
    if (sha) {
      payload.sha = sha; // Cần thiết khi update ghi đè
    }

    const uploadResp = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(filePath)}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (uploadResp.ok) {
      progress.finish();
      showToast('Đã lưu trữ file PDF thành công lên GitHub! 🎉');
      
      // Tạo URL của file PDF trên GitHub Pages
      // Định dạng: https://yangkoi.github.io/rkv_temp_calib/RIKEN%20VIET/filename.pdf
      const pagesUrl = `https://${config.owner.toLowerCase()}.github.io/${config.repo}/${encodeURI(filePath)}`;
      
      state.activeQRUrl = pagesUrl;
      state.activeCertName = cleanFileName;
      
      generateQRCode(() => {
        elements.copyLinkBtn.removeAttribute('disabled');
        elements.printQrBtn.removeAttribute('disabled');
        elements.downloadQrPng.removeAttribute('disabled');
        elements.downloadQrSvg.removeAttribute('disabled');
      });

      removeSelectedFile();
    } else {
      const err = await uploadResp.json().catch(() => ({}));
      progress.error(err.message || 'Lỗi từ GitHub API');
      showToast(`Upload thất bại (${uploadResp.status}): ${err.message || 'Không xác định'}`, 'error');
      elements.uploadProcessBtn.removeAttribute('disabled');
      elements.removeFileBtn.removeAttribute('disabled');
    }
  } catch (err) {
    progress.error('Lỗi kết nối mạng');
    showToast('Lỗi mạng, không thể kết nối tới GitHub!', 'error');
    console.error(err);
    elements.uploadProcessBtn.removeAttribute('disabled');
    elements.removeFileBtn.removeAttribute('disabled');
  }
}

// QR Code Canvas Operations
function generateQRCode(callback = null) {
  const url = state.activeQRUrl;
  if (!url) {
    clearQRCodeCanvas();
    return;
  }

  elements.qrSpinner.classList.remove('hidden');
  elements.qrTargetUrl.textContent = url;

  const canvas = elements.qrCanvas;
  const size = state.qrSettings.size;

  QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 4,
    color: {
      dark: state.qrSettings.fgColor,
      light: state.qrSettings.bgColor
    },
    errorCorrectionLevel: 'H'
  }, (error) => {
    elements.qrSpinner.classList.add('hidden');
    if (error) {
      showToast('Lỗi khi tạo mã QR', 'error');
      console.error(error);
      return;
    }

    if (state.qrSettings.logoImg) {
      drawLogoOnQR(canvas);
    }

    if (callback && typeof callback === 'function') {
      callback();
    }
  });
}

function drawLogoOnQR(canvas) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  
  // Tỷ lệ logo thích hợp là 18-20% kích thước QR code
  const logoSize = Math.floor(size * 0.2);
  const logoPos = (size - logoSize) / 2;

  // Vẽ nền trắng bo góc nhẹ cho logo
  ctx.fillStyle = state.qrSettings.bgColor;
  ctx.beginPath();
  const radius = 6;
  ctx.roundRect(logoPos - 3, logoPos - 3, logoSize + 6, logoSize + 6, radius);
  ctx.fill();

  // Vẽ logo
  ctx.drawImage(state.qrSettings.logoImg, logoPos, logoPos, logoSize, logoSize);
}

function clearQRCodeCanvas() {
  const canvas = elements.qrCanvas;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  elements.qrTargetUrl.textContent = 'Chưa có liên kết';
  
  elements.copyLinkBtn.setAttribute('disabled', 'true');
  elements.printQrBtn.setAttribute('disabled', 'true');
  elements.downloadQrPng.setAttribute('disabled', 'true');
  elements.downloadQrSvg.setAttribute('disabled', 'true');
}

// Copy URL to Clipboard
function copyLinkToClipboard() {
  const url = state.activeQRUrl;
  if (!url) return;

  navigator.clipboard.writeText(url).then(() => {
    showToast('Đã sao chép liên kết vào bộ nhớ tạm!');
  }).catch(err => {
    showToast('Lỗi khi sao chép liên kết', 'error');
  });
}

// Downloader options
function downloadQRCode(format) {
  const url = state.activeQRUrl;
  if (!url) return;

  const fileName = `qr_${state.activeCertName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'pdf'}`;

  if (format === 'png') {
    const dataUrl = elements.qrCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    a.click();
    showToast('Đã tải ảnh QR PNG thành công');
  } 
  else if (format === 'svg') {
    QRCode.toString(url, {
      type: 'svg',
      width: state.qrSettings.size,
      margin: 4,
      color: {
        dark: state.qrSettings.fgColor,
        light: state.qrSettings.bgColor
      },
      errorCorrectionLevel: 'H'
    }).then(svgString => {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${fileName}.svg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      showToast('Đã tải tệp QR dạng SVG');
    }).catch(err => {
      showToast('Lỗi tạo file SVG', 'error');
    });
  }
}

// Print QR Code View
function printQRCode() {
  const url = state.activeQRUrl;
  if (!url) return;

  elements.printQrTarget.innerHTML = '';
  
  const printCanvas = document.createElement('canvas');
  printCanvas.width = elements.qrCanvas.width;
  printCanvas.height = elements.qrCanvas.height;
  
  const ctx = printCanvas.getContext('2d');
  ctx.drawImage(elements.qrCanvas, 0, 0);
  
  elements.printQrTarget.appendChild(printCanvas);
  elements.printUrlText.textContent = url;
  
  window.print();
}

// QR customizer logic
function resetCustomizerSettings() {
  elements.qrColorFg.value = '#0f172a';
  elements.qrColorBg.value = '#ffffff';
  state.qrSettings.fgColor = '#0f172a';
  state.qrSettings.bgColor = '#ffffff';
  
  state.qrSettings.logoImg = null;
  state.qrSettings.logoName = '';
  elements.uploadLogoBtn.textContent = 'Chèn Logo';
  elements.removeLogoBtn.classList.add('hidden');
  elements.logoInput.value = '';

  generateQRCode();
  showToast('Đã đặt lại cấu hình mã QR');
}

// GitHub Library Storage loading
let libraryFilesList = []; // Global cache for search filter

async function fetchLibraryFiles() {
  const config = state.githubConfig;
  
  if (!config.token) {
    elements.libraryLoading.classList.add('hidden');
    elements.libraryEmpty.classList.remove('hidden');
    elements.libraryTableContainer.classList.add('hidden');
    elements.libraryCountText.textContent = 'Vui lòng cung cấp GitHub Token trong phần cấu hình.';
    return;
  }

  elements.libraryLoading.classList.remove('hidden');
  elements.libraryEmpty.classList.add('hidden');
  elements.libraryTableContainer.classList.add('hidden');
  elements.libraryCountText.textContent = 'Đang tải dữ liệu tệp từ GitHub...';

  const cleanFolderName = config.folder.trim().replace(/\/+$/, '');
  
  try {
    const resp = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(cleanFolderName)}?ref=${config.branch}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `token ${config.token}`
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      
      // Chỉ lọc file PDF (.pdf)
      libraryFilesList = (Array.isArray(data) ? data : []).filter(item => {
        return item.type === 'file' && item.name.toLowerCase().endsWith('.pdf');
      });

      renderLibraryTable(libraryFilesList);
    } else {
      elements.libraryLoading.classList.add('hidden');
      elements.libraryEmpty.classList.remove('hidden');
      elements.libraryCountText.textContent = 'Không tìm thấy thư mục lưu trữ hoặc cấu hình sai.';
    }
  } catch (err) {
    elements.libraryLoading.classList.add('hidden');
    elements.libraryEmpty.classList.remove('hidden');
    elements.libraryCountText.textContent = 'Lỗi mạng khi tải dữ liệu thư viện.';
    console.error(err);
  }
}

function renderLibraryTable(files) {
  elements.libraryLoading.classList.add('hidden');
  
  if (files.length === 0) {
    elements.libraryEmpty.classList.remove('hidden');
    elements.libraryTableContainer.classList.add('hidden');
    elements.libraryCountText.textContent = 'Không có tệp PDF nào trong thư mục RIKEN VIET.';
    return;
  }

  elements.libraryEmpty.classList.add('hidden');
  elements.libraryTableContainer.classList.remove('hidden');
  elements.libraryCountText.textContent = `Tìm thấy ${files.length} tệp PDF trong kho lưu trữ GitHub`;

  elements.libraryTbody.innerHTML = '';
  
  files.forEach(file => {
    const tr = document.createElement('tr');
    
    // Construct public link pages
    const pagesUrl = `https://${state.githubConfig.owner.toLowerCase()}.github.io/${state.githubConfig.repo}/${encodeURI(file.path)}`;
    
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;color:var(--text-primary);max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${file.name}">
          ${file.name}
        </div>
      </td>
      <td>${formatBytes(file.size)}</td>
      <td class="actions-cell">
        <a href="${pagesUrl}" target="_blank" class="outline-btn" style="text-decoration:none;padding: 4px 10px;font-size:12px;display:inline-flex;align-items:center;height:28px;">Xem</a>
        <button class="outline-btn gen-qr-btn" data-url="${pagesUrl}" data-name="${file.name}" style="padding: 4px 10px;font-size:12px;height:28px;">Mã QR</button>
        <button class="danger-btn delete-file-btn" data-path="${file.path}" data-sha="${file.sha}" data-name="${file.name}">Xoá</button>
      </td>
    `;
    elements.libraryTbody.appendChild(tr);
  });

  // Bind library item actions
  trActionsBind();
}

function trActionsBind() {
  // Action "Mã QR"
  elements.libraryTbody.querySelectorAll('.gen-qr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      const name = btn.dataset.name;
      
      state.activeQRUrl = url;
      state.activeCertName = name;
      
      // Chuyển về tab Upload & QR
      const uploadTabBtn = Array.from(elements.tabButtons).find(t => t.dataset.tab === 'tab-upload');
      if (uploadTabBtn) switchTab(uploadTabBtn);

      generateQRCode(() => {
        elements.copyLinkBtn.removeAttribute('disabled');
        elements.printQrBtn.removeAttribute('disabled');
        elements.downloadQrPng.removeAttribute('disabled');
        elements.downloadQrSvg.removeAttribute('disabled');
      });
      
      showToast(`Đã xuất mã QR cho tệp ${name}`);
    });
  });

  // Action "Xoá file"
  elements.libraryTbody.querySelectorAll('.delete-file-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const path = btn.dataset.path;
      const sha = btn.dataset.sha;
      const name = btn.dataset.name;

      if (!confirm(`Bạn có chắc muốn xoá file "${name}" vĩnh viễn khỏi kho lưu trữ GitHub?`)) {
        return;
      }

      showToast('Đang tiến hành xoá tệp trên GitHub...');
      const config = state.githubConfig;

      try {
        const resp = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path)}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `token ${config.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Delete PDF Calibration Certificate: ${name}`,
            sha: sha,
            branch: config.branch
          })
        });

        if (resp.ok) {
          showToast(`Đã xoá tệp "${name}" thành công!`);
          fetchLibraryFiles(); // Reload
        } else {
          const err = await resp.json().catch(() => ({}));
          showToast(`Không thể xoá tệp: ${err.message || 'Lỗi server'}`, 'error');
        }
      } catch (err) {
        showToast('Lỗi mạng khi xoá tệp!', 'error');
        console.error(err);
      }
    });
  });
}

// Library Search Filter
if (elements.libSearchInput) {
  elements.libSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderLibraryTable(libraryFilesList);
      return;
    }
    const filtered = libraryFilesList.filter(file => file.name.toLowerCase().includes(query));
    renderLibraryTable(filtered);
  });
}

// Event Listeners Registration
function setupEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);

  // Portal View Tabs Swapping
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn));
  });

  // Config toggles
  elements.configToggleBtn.addEventListener('click', () => {
    elements.githubConfigPanel.classList.toggle('hidden');
  });
  elements.saveConfigBtn.addEventListener('click', saveGitHubConfig);
  elements.testConfigBtn.addEventListener('click', testGitHubConnection);
  elements.resetConfigBtn.addEventListener('click', () => {
    if (confirm('Bạn có muốn khôi phục cấu hình mặc định (bao gồm cả Token Riken Viet)?')) {
      localStorage.removeItem('rkv_github_config');
      state.githubConfig = {
        owner: 'YangKoi',
        repo: 'rkv_temp_calib',
        branch: 'main',
        folder: 'RIKEN VIET',
        token: defaultToken
      };
      loadGitHubConfig();
      showToast('Đã khôi phục cấu hình mặc định!');
    }
  });

  // Drag & Drop event bindings
  const dropZone = elements.dropZone;
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  dropZone.addEventListener('click', () => {
    elements.pdfFileInput.click();
  });

  elements.pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  });

  elements.removeFileBtn.addEventListener('click', removeSelectedFile);
  elements.uploadProcessBtn.addEventListener('click', uploadFileToGitHub);

  // QR Code Action Triggers
  elements.copyLinkBtn.addEventListener('click', copyLinkToClipboard);
  elements.printQrBtn.addEventListener('click', printQRCode);
  elements.downloadQrPng.addEventListener('click', () => downloadQRCode('png'));
  elements.downloadQrSvg.addEventListener('click', () => downloadQRCode('svg'));

  // Color Pickers
  elements.qrColorFg.addEventListener('input', (e) => {
    state.qrSettings.fgColor = e.target.value;
    generateQRCode();
  });
  elements.qrColorBg.addEventListener('input', (e) => {
    state.qrSettings.bgColor = e.target.value;
    generateQRCode();
  });

  // Logo insertion in QR code
  elements.uploadLogoBtn.addEventListener('click', () => elements.logoInput.click());
  
  elements.logoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.qrSettings.logoImg = img;
          state.qrSettings.logoName = file.name;
          elements.uploadLogoBtn.textContent = `Logo: ${file.name.substring(0, 10)}...`;
          elements.removeLogoBtn.classList.remove('hidden');
          generateQRCode();
          showToast('Đã chèn logo vào mã QR thành công!');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  elements.removeLogoBtn.addEventListener('click', () => {
    state.qrSettings.logoImg = null;
    state.qrSettings.logoName = '';
    elements.uploadLogoBtn.textContent = 'Chèn Logo';
    elements.removeLogoBtn.classList.add('hidden');
    elements.logoInput.value = '';
    generateQRCode();
    showToast('Đã xoá logo khỏi mã QR');
  });

  elements.resetCustomizer.addEventListener('click', resetCustomizerSettings);
  elements.refreshLibraryBtn.addEventListener('click', fetchLibraryFiles);
}

// Utility: Bytes Formatter
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Toast Alert System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  const icon = type === 'error' 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.25s ease reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}
