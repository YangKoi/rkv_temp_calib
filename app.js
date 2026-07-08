// RKV Calibration Certificate Hub - Frontend Application Logic

// Application State
const state = {
  isStaticMode: false,
  adminKey: '7179',
  activeQRUrl: '',
  activeCertName: '',
  qrSettings: {
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    size: 300,
    logoImg: null,
    logoName: ''
  },
  certificates: [] // Loaded list
};

// DOM Elements Cache
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  logoutBtn: document.getElementById('logout-btn'),
  
  // Views
  loginView: document.getElementById('login-view'),
  adminView: document.getElementById('admin-view'),
  publicView: document.getElementById('public-view'),
  
  // Login Form
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  
  // Admin Portal Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabCreate: document.getElementById('tab-create'),
  tabLibrary: document.getElementById('tab-library'),
  
  // Form Inputs
  certForm: document.getElementById('cert-form'),
  clearFormBtn: document.getElementById('clear-form-btn'),
  submitCertBtn: document.getElementById('submit-cert-btn'),
  
  // QR Output Panel
  qrCanvas: document.getElementById('qr-canvas'),
  qrSpinner: document.getElementById('qr-spinner'),
  qrTargetUrl: document.getElementById('qr-target-url'),
  copyLinkBtn: document.getElementById('copy-link-btn'),
  downloadQrBtn: document.getElementById('download-qr-btn'),
  downloadOptions: document.querySelectorAll('.download-options button'),
  printQrBtn: document.getElementById('print-qr-btn'),
  
  // QR Customizer Controls
  resetCustomizer: document.getElementById('reset-customizer'),
  qrColorFg: document.getElementById('qr-color-fg'),
  qrColorBg: document.getElementById('qr-color-bg'),
  uploadLogoBtn: document.getElementById('upload-logo-btn'),
  logoInput: document.getElementById('logo-input'),
  removeLogoBtn: document.getElementById('remove-logo-btn'),
  
  // Stored Library
  refreshLibraryBtn: document.getElementById('refresh-library-btn'),
  libraryLoading: document.getElementById('library-loading'),
  libraryEmpty: document.getElementById('library-empty'),
  libraryTableContainer: document.getElementById('library-table-container'),
  libraryTbody: document.getElementById('library-tbody'),
  
  // Public View
  publicViewLoading: document.getElementById('public-view-loading'),
  publicViewError: document.getElementById('public-view-error'),
  publicCertCard: document.getElementById('public-cert-card'),
  btnPrintPublicSheet: document.getElementById('btn-print-public-sheet'),
  
  // Footer & Status
  serverIpStatus: document.getElementById('server-ip-status'),
  printQrTarget: document.getElementById('print-qr-target'),
  printUrlText: document.getElementById('print-url-text')
};

// UTF-8 Base64 Encoding Helpers (Prevents accents/unicode crashes)
const utf8Base64 = {
  encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  },
  decode(str) {
    return decodeURIComponent(escape(atob(str)));
  }
};

// -------------------------------------------------------------
// Initialize App
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  checkEnvironmentAndRoute();
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
  showToast(`Giao diện: ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`);
}

// -------------------------------------------------------------
// Routing & Env Detection
// -------------------------------------------------------------
async function checkEnvironmentAndRoute() {
  // 1. Detect if running statically (GitHub Pages) or locally
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      elements.serverIpStatus.textContent = `http://${data.localIP}:${data.port}`;
      state.isStaticMode = false;
    } else {
      throw new Error('Not running Express server');
    }
  } catch (err) {
    state.isStaticMode = true;
    elements.serverIpStatus.textContent = 'Chạy chế độ Tĩnh (GitHub Pages)';
  }

  // 2. Check URL parameters for Public Read View
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const data = urlParams.get('data');

  if (id || data) {
    // Show public view, hide login/admin
    elements.loginView.classList.add('hidden');
    elements.adminView.classList.add('hidden');
    elements.publicView.classList.remove('hidden');
    elements.logoutBtn.classList.add('hidden');
    
    loadPublicCertificate(id, data);
  } else {
    // Standard access - require login
    checkAuthSession();
  }
}

// -------------------------------------------------------------
// Public View: Load & Render Single Certificate
// -------------------------------------------------------------
async function loadPublicCertificate(id, base64Data) {
  elements.publicViewLoading.classList.remove('hidden');
  elements.publicViewError.classList.add('hidden');
  elements.publicCertCard.classList.add('hidden');

  try {
    let cert = null;

    if (id) {
      // Local Server mode: Fetch from API
      if (state.isStaticMode) {
        throw new Error('Không thể tìm chứng chỉ bằng ID trên máy chủ tĩnh.');
      }
      
      const res = await fetch(`/api/certificates/${id}`);
      if (!res.ok) throw new Error('Không tìm thấy chứng chỉ.');
      
      const resJson = await res.json();
      cert = resJson.certificate;
    } 
    else if (base64Data) {
      // GitHub Pages mode: Decode data from URL parameter
      const jsonStr = utf8Base64.decode(base64Data);
      cert = JSON.parse(jsonStr);
    }

    if (!cert) throw new Error('Không tìm thấy dữ liệu.');

    // Populate Read-Only Table Cells
    document.getElementById('lbl-object').innerHTML = formatTextLine(cert.object);
    document.getElementById('lbl-code').textContent = cert.code || 'N/A';
    document.getElementById('lbl-type').textContent = cert.type || 'N/A';
    document.getElementById('lbl-serial').textContent = cert.serial || 'N/A';
    document.getElementById('lbl-manufacture').textContent = cert.manufacture || 'N/A';
    document.getElementById('lbl-range').textContent = cert.range || 'N/A';
    document.getElementById('lbl-resolution').textContent = cert.resolution || 'N/A';
    document.getElementById('lbl-tag').textContent = cert.tag || 'N/A';
    document.getElementById('lbl-cer').textContent = cert.cer || 'N/A';
    document.getElementById('lbl-stamp').textContent = cert.stamp || 'N/A';
    document.getElementById('lbl-method').textContent = cert.method || 'N/A';
    document.getElementById('lbl-valid').textContent = cert.valid || 'N/A';
    document.getElementById('lbl-customer').innerHTML = formatTextLine(cert.customer);
    document.getElementById('lbl-address').innerHTML = formatTextLine(cert.address);
    document.getElementById('lbl-place').innerHTML = formatTextLine(cert.place);
    document.getElementById('lbl-conclusion').textContent = cert.conclusion || 'N/A';
    document.getElementById('lbl-executed').textContent = cert.executed || 'N/A';
    document.getElementById('lbl-d-execution').textContent = cert.d_execution || 'N/A';
    document.getElementById('lbl-inspector').textContent = cert.inspector || 'N/A';
    document.getElementById('lbl-d-inspector').textContent = cert.d_inspector || 'N/A';
    document.getElementById('lbl-approve').textContent = cert.approve || 'N/A';
    document.getElementById('lbl-d-issue').textContent = cert.d_issue || 'N/A';

    // Show table
    elements.publicViewLoading.classList.add('hidden');
    elements.publicCertCard.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    elements.publicViewLoading.classList.add('hidden');
    elements.publicViewError.classList.remove('hidden');
  }
}

// Convert newlines to break tags for multiline table display
function formatTextLine(text) {
  if (!text) return 'N/A';
  return text.replace(/\n/g, '<br>');
}

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
function checkAuthSession() {
  const isActive = sessionStorage.getItem('rkv_admin_session') === 'active';
  if (isActive) {
    elements.loginView.classList.add('hidden');
    elements.adminView.classList.remove('hidden');
    elements.publicView.classList.add('hidden');
    elements.logoutBtn.classList.remove('hidden');
    
    // Clear state inputs and fetch library files
    resetCertificateForm();
    fetchLibraryFiles();
  } else {
    elements.loginView.classList.remove('hidden');
    elements.adminView.classList.add('hidden');
    elements.publicView.classList.add('hidden');
    elements.logoutBtn.classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value.trim();

  if (username === 'rkvcalib' && password === '7179') {
    sessionStorage.setItem('rkv_admin_session', 'active');
    showToast('Đăng nhập quản trị thành công!');
    checkAuthSession();
    
    // Clear fields
    elements.loginUsername.value = '';
    elements.loginPassword.value = '';
  } else {
    showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('rkv_admin_session');
  showToast('Đã đăng xuất tài khoản.');
  checkAuthSession();
}

// -------------------------------------------------------------
// Admin Tab Actions & Library Fetching
// -------------------------------------------------------------
function switchTab(btn) {
  const targetTab = btn.dataset.tab;
  
  elements.tabButtons.forEach(b => b.classList.toggle('active', b === btn));
  
  if (targetTab === 'create') {
    elements.tabCreate.classList.remove('hidden');
    elements.tabLibrary.classList.add('hidden');
  } else if (targetTab === 'library') {
    elements.tabCreate.classList.add('hidden');
    elements.tabLibrary.classList.remove('hidden');
    fetchLibraryFiles();
  }
}

async function fetchLibraryFiles() {
  elements.libraryLoading.classList.remove('hidden');
  elements.libraryTableContainer.classList.add('hidden');
  elements.libraryEmpty.classList.add('hidden');

  try {
    if (state.isStaticMode) {
      // Static mode: Read from localStorage
      const localData = localStorage.getItem('rkv_local_certs');
      state.certificates = JSON.parse(localData || '[]');
    } 
    else {
      // Local Server mode: Fetch from backend API
      const res = await fetch('/api/certificates', {
        headers: { 'x-admin-key': state.adminKey }
      });
      if (!res.ok) throw new Error('Không thể tải danh sách chứng chỉ.');
      
      const data = await res.json();
      state.certificates = data.certificates || [];
    }

    elements.libraryLoading.classList.add('hidden');

    if (state.certificates.length === 0) {
      elements.libraryEmpty.classList.remove('hidden');
    } else {
      // Sort most recent first
      state.certificates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderLibraryTable();
      elements.libraryTableContainer.classList.remove('hidden');
    }
  } catch (err) {
    elements.libraryLoading.classList.add('hidden');
    elements.libraryEmpty.classList.remove('hidden');
    showToast(err.message, 'error');
  }
}

function renderLibraryTable() {
  elements.libraryTbody.innerHTML = '';
  
  state.certificates.forEach((cert, index) => {
    const tr = document.createElement('tr');
    
    const date = new Date(cert.createdAt);
    const dateString = date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    tr.innerHTML = `
      <td><strong>${cert.id}</strong></td>
      <td class="text-bold">${cert.cer}</td>
      <td class="file-name" title="${cert.object}">${cert.object}</td>
      <td class="file-name" title="${cert.customer}">${cert.customer}</td>
      <td>${dateString}</td>
      <td class="actions-col">
        <div class="lib-action-buttons">
          <button class="primary-btn lib-action-btn btn-view" title="Xem chứng chỉ">Xem</button>
          <button class="secondary-btn lib-action-btn btn-print-qr" title="In nhãn QR">In QR</button>
          <button class="remove-btn lib-action-btn btn-delete" title="Xóa chứng chỉ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.8rem;height:0.8rem;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;

    // Click: Open Public page in new tab
    tr.querySelector('.btn-view').addEventListener('click', () => {
      let url = '';
      if (state.isStaticMode) {
        url = cert.url;
      } else {
        url = `${window.location.origin}/?id=${cert.id}`;
      }
      window.open(url, '_blank');
    });

    // Click: Render QR on canvas and print
    tr.querySelector('.btn-print-qr').addEventListener('click', () => {
      let url = '';
      if (state.isStaticMode) {
        url = cert.url;
      } else {
        url = `${window.location.origin}/?id=${cert.id}`;
      }
      state.activeQRUrl = url;
      state.activeCertName = cert.cer;
      
      // Generate QR on display canvas first, then print
      generateQRCode(() => {
        printQRCode();
      });
    });

    // Click: Delete
    tr.querySelector('.btn-delete').addEventListener('click', async () => {
      if (confirm(`Bạn có chắc muốn xóa chứng chỉ số "${cert.cer}"?`)) {
        await deleteCertificate(cert.id);
      }
    });

    elements.libraryTbody.appendChild(tr);
  });
}

async function deleteCertificate(id) {
  try {
    if (state.isStaticMode) {
      let localCerts = JSON.parse(localStorage.getItem('rkv_local_certs') || '[]');
      localCerts = localCerts.filter(c => c.id !== id);
      localStorage.setItem('rkv_local_certs', JSON.stringify(localCerts));
      showToast('Xóa chứng chỉ thành công!');
      fetchLibraryFiles();
    } else {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': state.adminKey }
      });
      if (!res.ok) throw new Error('Không thể xóa chứng chỉ khỏi máy chủ.');

      showToast('Xóa chứng chỉ thành công!');
      fetchLibraryFiles();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// -------------------------------------------------------------
// Form Operations (Submit & Export QR)
// -------------------------------------------------------------
async function handleFormSubmit() {
  // Verify fields are filled
  const formFields = [
    'inp-object', 'inp-code', 'inp-type', 'inp-serial', 'inp-manufacture', 
    'inp-range', 'inp-resolution', 'inp-tag', 'inp-cer', 'inp-stamp', 
    'inp-method', 'inp-valid', 'inp-customer', 'inp-address', 'inp-place', 
    'inp-conclusion', 'inp-executed', 'inp-d-execution', 'inp-inspector', 
    'inp-d-inspector', 'inp-approve', 'inp-d-issue'
  ];

  let isValid = true;
  formFields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input.value.trim()) {
      input.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
      isValid = false;
    } else {
      input.style.backgroundColor = '';
    }
  });

  if (!isValid) {
    showToast('Vui lòng nhập đầy đủ thông tin chứng chỉ!', 'error');
    return;
  }

  // Build Cert JSON
  const certData = {
    object: document.getElementById('inp-object').value.trim(),
    code: document.getElementById('inp-code').value.trim(),
    type: document.getElementById('inp-type').value.trim(),
    serial: document.getElementById('inp-serial').value.trim(),
    manufacture: document.getElementById('inp-manufacture').value.trim(),
    range: document.getElementById('inp-range').value.trim(),
    resolution: document.getElementById('inp-resolution').value.trim(),
    tag: document.getElementById('inp-tag').value.trim(),
    cer: document.getElementById('inp-cer').value.trim(),
    stamp: document.getElementById('inp-stamp').value.trim(),
    method: document.getElementById('inp-method').value.trim(),
    valid: document.getElementById('inp-valid').value.trim(),
    customer: document.getElementById('inp-customer').value.trim(),
    address: document.getElementById('inp-address').value.trim(),
    place: document.getElementById('inp-place').value.trim(),
    conclusion: document.getElementById('inp-conclusion').value.trim(),
    executed: document.getElementById('inp-executed').value.trim(),
    d_execution: document.getElementById('inp-d-execution').value.trim(),
    inspector: document.getElementById('inp-inspector').value.trim(),
    d_inspector: document.getElementById('inp-d-inspector').value.trim(),
    approve: document.getElementById('inp-approve').value.trim(),
    d_issue: document.getElementById('inp-d-issue').value.trim()
  };

  elements.qrSpinner.classList.remove('hidden');

  try {
    if (state.isStaticMode) {
      // 1. Static Mode: Encode data directly into QR link
      const base64Data = utf8Base64.encode(JSON.stringify(certData));
      // Construct Pages url
      const certUrl = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;
      
      // Save locally
      let localCerts = JSON.parse(localStorage.getItem('rkv_local_certs') || '[]');
      const certId = `RKV-${Date.now()}`;
      const newCert = {
        id: certId,
        createdAt: new Date().toISOString(),
        ...certData,
        url: certUrl
      };
      localCerts.push(newCert);
      localStorage.setItem('rkv_local_certs', JSON.stringify(localCerts));

      // Trigger QR generator
      state.activeQRUrl = certUrl;
      state.activeCertName = certData.cer;
      generateQRCode();
      showToast('Đã xuất và lưu chứng chỉ tĩnh!');
    } 
    else {
      // 2. Server Mode: Save to server JSON DB
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': state.adminKey
        },
        body: JSON.stringify(certData)
      });

      if (!res.ok) throw new Error('Không thể lưu chứng chỉ lên máy chủ.');

      const response = await res.json();
      if (response.success) {
        state.activeQRUrl = response.url;
        state.activeCertName = response.certificate.cer;
        generateQRCode();
        showToast('Đã lưu chứng chỉ đo lường và xuất QR!');
      } else {
        throw new Error(response.error);
      }
    }
  } catch (err) {
    showToast(err.message, 'error');
    elements.qrSpinner.classList.add('hidden');
  }
}

function resetCertificateForm() {
  elements.certForm.reset();
  
  // Clear red backgrounds
  const inputs = elements.certForm.querySelectorAll('input');
  inputs.forEach(inp => inp.style.backgroundColor = '');

  state.activeQRUrl = '';
  state.activeCertName = '';
  clearQRCodeCanvas();
}

// -------------------------------------------------------------
// QR Canvas Operations & Exporting
// -------------------------------------------------------------
function generateQRCode(callback = null) {
  const url = state.activeQRUrl;
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

  QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 4,
    color: {
      dark: state.qrSettings.fgColor,
      light: state.qrSettings.bgColor
    },
    errorCorrectionLevel: 'H' // Force High ECC for logo support
  }, (error) => {
    elements.qrSpinner.classList.add('hidden');
    if (error) {
      showToast('Lỗi khi tạo mã QR. Đường link quá dài.', 'error');
      console.error(error);
      return;
    }

    // Draw custom logo if available
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
  const logo = state.qrSettings.logoImg;
  
  const logoSize = size * 0.18;
  const cx = size / 2;
  const cy = size / 2;

  ctx.save();
  
  // Draw white rounded border mask
  ctx.fillStyle = state.qrSettings.bgColor;
  ctx.beginPath();
  const maskSize = logoSize + 10;
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(cx - maskSize / 2, cy - maskSize / 2, maskSize, maskSize, 8);
  } else {
    ctx.rect(cx - maskSize / 2, cy - maskSize / 2, maskSize, maskSize);
  }
  ctx.fill();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw Logo Image
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
  
  elements.qrTargetUrl.textContent = 'Chưa tạo chứng chỉ';
  elements.copyLinkBtn.setAttribute('disabled', 'true');
  elements.downloadQrBtn.setAttribute('disabled', 'true');
  elements.printQrBtn.setAttribute('disabled', 'true');
}

function resetCustomizerSettings() {
  state.qrSettings.fgColor = '#0f172a';
  state.qrSettings.bgColor = '#ffffff';
  state.qrSettings.logoImg = null;
  state.qrSettings.logoName = '';

  elements.qrColorFg.value = '#0f172a';
  elements.qrColorBg.value = '#ffffff';
  elements.logoInput.value = '';
  elements.removeLogoBtn.classList.add('hidden');
  elements.uploadLogoBtn.textContent = 'Chèn Logo';

  generateQRCode();
  showToast('Đã khôi phục cài đặt mã QR');
}

// -------------------------------------------------------------
// QR Actions: Copy, Download, Print
// -------------------------------------------------------------
function copyLinkToClipboard() {
  const url = state.activeQRUrl;
  if (!url) return;

  navigator.clipboard.writeText(url)
    .then(() => showToast('Đã sao chép liên kết chứng chỉ!'))
    .catch(() => showToast('Không thể sao chép liên kết.', 'error'));
}

function downloadQRCode(format) {
  const url = state.activeQRUrl;
  if (!url) return;

  const fileName = `qr_${state.activeCertName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'cert'}`;

  if (format === 'png') {
    const dataUrl = elements.qrCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${fileName}.png`;
    a.click();
    showToast('Đã tải QR dạng PNG');
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
      // Embed logo base64 if configured
      if (state.qrSettings.logoImg) {
        svgString = injectLogoIntoSVG(svgString);
      }

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${fileName}.svg`;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      showToast('Đã tải QR dạng SVG');
    }).catch(err => {
      showToast('Không thể tạo file SVG', 'error');
      console.error(err);
    });
  }
}

function injectLogoIntoSVG(svgString) {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = svgDoc.documentElement;
    
    const width = parseFloat(svgEl.getAttribute('width') || '300');
    const height = parseFloat(svgEl.getAttribute('height') || '300');

    const logoSize = width * 0.18;
    const cx = width / 2;
    const cy = height / 2;
    const maskSize = logoSize + 10;

    // Background circle rect
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

    // Image tag
    const imageEl = svgDoc.createElementNS("http://www.w3.org/2000/svg", "image");
    imageEl.setAttribute("x", cx - logoSize / 2);
    imageEl.setAttribute("y", cy - logoSize / 2);
    imageEl.setAttribute("width", logoSize);
    imageEl.setAttribute("height", logoSize);
    imageEl.setAttribute("href", state.qrSettings.logoImg.src);
    
    // Rounded clip path
    const clipId = `logo-clip-${Date.now()}`;
    const defs = svgDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = svgDoc.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", clipId);
    
    const clipRect = svgDoc.createElementNS("http://www.w3.org/2000/svg", "rect");
    clipRect.setAttribute("x", cx - logoSize / 2);
    clipRect.setAttribute("y", cy - logoSize / 2);
    clipRect.setAttribute("width", logoSize);
    clipRect.setAttribute("height", logoSize);
    clipRect.setAttribute("rx", 6);
    
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svgEl.appendChild(defs);
    
    imageEl.setAttribute("clip-path", `url(#${clipId})`);
    svgEl.appendChild(imageEl);

    return new XMLSerializer().serializeToString(svgEl);
  } catch (err) {
    console.error("SVG inject error: ", err);
    return svgString;
  }
}

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

// -------------------------------------------------------------
// Event Listeners Wire-up
// -------------------------------------------------------------
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Login Form
  elements.loginForm.addEventListener('submit', handleLogin);
  
  // Admin Logout
  elements.logoutBtn.addEventListener('click', handleLogout);

  // Admin Tab Navigation
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn));
  });

  // Form actions
  elements.clearFormBtn.addEventListener('click', resetCertificateForm);
  elements.submitCertBtn.addEventListener('click', handleFormSubmit);

  // Refresh library
  elements.refreshLibraryBtn.addEventListener('click', fetchLibraryFiles);

  // QR Actions
  elements.copyLinkBtn.addEventListener('click', copyLinkToClipboard);
  elements.printQrBtn.addEventListener('click', printQRCode);
  elements.downloadOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      downloadQRCode(format);
    });
  });

  // QR Color Picker
  elements.qrColorFg.addEventListener('input', (e) => {
    state.qrSettings.fgColor = e.target.value;
    generateQRCode();
  });

  elements.qrColorBg.addEventListener('input', (e) => {
    state.qrSettings.bgColor = e.target.value;
    generateQRCode();
  });

  // Logo uploading logic
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
    elements.uploadLogoBtn.textContent = 'Chèn Logo';
    elements.removeLogoBtn.classList.add('hidden');
    elements.logoInput.value = '';
    generateQRCode();
    showToast('Đã xóa logo');
  });

  elements.resetCustomizer.addEventListener('click', resetCustomizerSettings);

  // Print read-only sheet
  elements.btnPrintPublicSheet.addEventListener('click', () => {
    window.print();
  });
}

// -------------------------------------------------------------
// Toast & String Utilities
// -------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  const icon = type === 'error' 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 3s
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.25s ease reverse forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}
