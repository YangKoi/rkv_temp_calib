// RKV Calibration Certificate Hub - Frontend Application Logic (RIKEN VIET 2-Page Certificate)

// Short-key mapping for URL Base64 compression (reduces string length by ~60%)
const keyMapping = {
  reportNo: 'rn',
  object: 'o', model: 'm', serial: 's', manufacturer: 'mf', mfgDate: 'md', specs: 'sp',
  r_hc: 'rh', i_hc: 'ih', r_co: 'rc', i_co: 'ic', r_h2s: 'ry', i_h2s: 'iy', r_voc: 'rv', i_voc: 'iv', r_no2: 'rn2', i_no2: 'in2',
  flowRate: 'fr', adjMethod: 'am', customer: 'cu', envCondition: 'ec', readjDue: 'rd', reportPlaceDate: 'rpd', techHead: 'th',
  gas_id_1: 'g1i', gas_name_1: 'g1n', gas_acc_1: 'g1a', gas_due_1: 'g1d',
  gas_id_2: 'g2i', gas_name_2: 'g2n', gas_acc_2: 'g2a', gas_due_2: 'g2d',
  gas_id_3: 'g3i', gas_name_3: 'g3n', gas_acc_3: 'g3a', gas_due_3: 'g3d',
  gas_id_4: 'g4i', gas_name_4: 'g4n', gas_acc_4: 'g4a', gas_due_4: 'g4d',
  chkOutside: 'co1', chkTech: 'ct1', calEnvHours: 'ceh', calFlowRate: 'cfr',
  s_m_hc: 'mhc', s_m_co: 'mco', s_m_h2s: 'my', s_m_voc: 'mv', s_m_no2: 'mn2',
  s_s_hc: 'shc', s_s_co: 'sco', s_s_h2s: 'sy', s_s_voc: 'sv', s_s_no2: 'sn2',
  s_r_hc: 'rhc', s_r_co: 'rco', s_r_h2s: 'ryy', s_r_voc: 'rvo', s_r_no2: 'rn0',
  s_c_hc: 'chc', s_c_co: 'cco', s_c_h2s: 'cyy', s_c_voc: 'cvo', s_c_no2: 'cn0',
  s_d_hc: 'dhc', s_d_co: 'dco', s_d_h2s: 'dyy', s_d_voc: 'dvo', s_d_no2: 'dn0',
  s_a_hc: 'ahc', s_a_co: 'aco', s_a_h2s: 'ayy', s_a_voc: 'avo', s_a_no2: 'an0',
  s_al_hc: 'lhc', s_al_co: 'lco', s_al_h2s: 'lyy', s_al_voc: 'lvo', s_al_no2: 'ln0',
  replacementParts: 'rp', operator: 'op'
};

// State Manager
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
  certificates: []
};

// Form Fields List
const formFieldIds = [
  'report-no', 'object', 'model', 'serial', 'manufacturer', 'mfg-date', 'specs',
  'r-hc', 'i-hc', 'r-co', 'i-co', 'r-h2s', 'i-h2s', 'r-voc', 'i-voc', 'r-no2', 'i-no2',
  'flow-rate', 'adj-method', 'customer', 'gas-id-1', 'gas-name-1', 'gas-acc-1', 'gas-due-1',
  'gas-id-2', 'gas-name-2', 'gas-acc-2', 'gas-due-2', 'gas-id-3', 'gas-name-3', 'gas-acc-3', 'gas-due-3',
  'gas-id-4', 'gas-name-4', 'gas-acc-4', 'gas-due-4', 'env-condition', 'readj-due', 'report-place-date',
  'tech-head', 'chk-outside', 'chk-tech', 'cal-env-hours', 'cal-flow-rate',
  's-m-hc', 's-m-co', 's-m-h2s', 's-m-voc', 's-m-no2',
  's-s-hc', 's-s-co', 's-s-h2s', 's-s-voc', 's-s-no2',
  's-r-hc', 's-r-co', 's-r-h2s', 's-r-voc', 's-r-no2',
  's-c-hc', 's-c-co', 's-c-h2s', 's-c-voc', 's-c-no2',
  's-d-hc', 's-d-co', 's-d-h2s', 's-d-voc', 's-d-no2',
  's-a-hc', 's-a-co', 's-a-h2s', 's-a-voc', 's-a-no2',
  's-al-hc', 's-al-co', 's-al-h2s', 's-al-voc', 's-al-no2',
  'replacement-parts', 'operator'
];

// DOM Cache
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  logoutBtn: document.getElementById('logout-btn'),
  
  // Views
  loginView: document.getElementById('login-view'),
  adminView: document.getElementById('admin-view'),
  publicView: document.getElementById('public-view'),
  
  // Login
  loginForm: document.getElementById('login-form'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  
  // Admin Navigation Tabs
  tabButtons: document.querySelectorAll('.tabs-container .tab-btn'),
  tabCreate: document.getElementById('tab-create'),
  tabLibrary: document.getElementById('tab-library'),
  
  // Form Editor
  certForm: document.getElementById('cert-form'),
  clearFormBtn: document.getElementById('clear-form-btn'),
  submitCertBtn: document.getElementById('submit-cert-btn'),
  exportExcelBtn: document.getElementById('export-excel-btn'),
  formSecButtons: document.querySelectorAll('.form-sec-btn'),
  formSecPage1: document.getElementById('form-sec-page1'),
  formSecPage2: document.getElementById('form-sec-page2'),
  
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
  
  // Library List
  refreshLibraryBtn: document.getElementById('refresh-library-btn'),
  libraryLoading: document.getElementById('library-loading'),
  libraryEmpty: document.getElementById('library-empty'),
  libraryTableContainer: document.getElementById('library-table-container'),
  libraryTbody: document.getElementById('library-tbody'),

  // Template Upload
  templateFileInput: document.getElementById('template-file-input'),
  templateStatusText: document.getElementById('template-status-text'),
  templateUploadLabel: document.getElementById('template-upload-label'),
  templateDeleteBtn: document.getElementById('template-delete-btn'),
  togglePlaceholderGuideBtn: document.getElementById('toggle-placeholder-guide-btn'),
  templatePlaceholderGuide: document.getElementById('template-placeholder-guide'),
  
  // Public Viewer
  publicViewLoading: document.getElementById('public-view-loading'),
  publicViewError: document.getElementById('public-view-error'),
  publicCertCard: document.getElementById('public-cert-card'),
  btnPrintPublicSheet: document.getElementById('btn-print-public-sheet'),
  btnViewPage1: document.getElementById('btn-view-page1'),
  btnViewPage2: document.getElementById('btn-view-page2'),
  certPage1: document.getElementById('cert-page1'),
  certPage2: document.getElementById('cert-page2'),
  
  // Footer & Status
  serverIpStatus: document.getElementById('server-ip-status'),
  printQrTarget: document.getElementById('print-qr-target'),
  printUrlText: document.getElementById('print-url-text')
};

// UTF-8 Base64 Helpers
const utf8Base64 = {
  encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  },
  decode(str) {
    return decodeURIComponent(escape(atob(str)));
  }
};

// Key Compression Helpers (reduces payload size for QR codes)
function compressCertificate(cert) {
  const compressed = {};
  for (const [fullKey, value] of Object.entries(cert)) {
    const shortKey = keyMapping[fullKey] || fullKey;
    compressed[shortKey] = value;
  }
  return compressed;
}

function decompressCertificate(compressed) {
  const decompressed = {};
  // Create reverse mapping
  const reverseMapping = {};
  for (const [fullKey, shortKey] of Object.entries(keyMapping)) {
    reverseMapping[shortKey] = fullKey;
  }
  
  for (const [shortKey, value] of Object.entries(compressed)) {
    const fullKey = reverseMapping[shortKey] || shortKey;
    decompressed[fullKey] = value;
  }
  return decompressed;
}

// -------------------------------------------------------------
// App Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  checkEnvironmentAndRoute();
});

// Theme Toggle
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

// Env & Route Routing
async function checkEnvironmentAndRoute() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      elements.serverIpStatus.textContent = `http://${data.localIP}:${data.port}`;
      state.isStaticMode = false;
    } else {
      throw new Error();
    }
  } catch (err) {
    state.isStaticMode = true;
    elements.serverIpStatus.textContent = 'Chạy chế độ Tĩnh (GitHub Pages)';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const data = urlParams.get('data');

  if (id || data) {
    elements.loginView.classList.add('hidden');
    elements.adminView.classList.add('hidden');
    elements.publicView.classList.remove('hidden');
    elements.logoutBtn.classList.add('hidden');
    
    // Always default to Page 1 view in public viewer
    switchPublicViewPage('page1');
    loadPublicCertificate(id, data);
  } else {
    checkAuthSession();
  }
}

// -------------------------------------------------------------
// Public View: Load & Render 2 Pages
// -------------------------------------------------------------
async function loadPublicCertificate(id, base64Data) {
  elements.publicViewLoading.classList.remove('hidden');
  elements.publicViewError.classList.add('hidden');
  elements.publicCertCard.classList.add('hidden');

  try {
    let cert = null;

    if (id) {
      if (state.isStaticMode) throw new Error();
      const res = await fetch(`/api/certificates/${id}`);
      if (!res.ok) throw new Error();
      
      const resJson = await res.json();
      cert = resJson.certificate;
    } 
    else if (base64Data) {
      const jsonStr = utf8Base64.decode(base64Data);
      const compressed = JSON.parse(jsonStr);
      cert = decompressCertificate(compressed);
    }

    if (!cert) throw new Error();

    // Populate Page 1 Elements
    document.getElementById('lbl-report-no').textContent = cert.reportNo || 'N/A';
    document.getElementById('lbl-object').textContent = cert.object || 'N/A';
    document.getElementById('lbl-model').textContent = cert.model || 'N/A';
    document.getElementById('lbl-serial').textContent = cert.serial || 'N/A';
    document.getElementById('lbl-manufacturer').textContent = cert.manufacturer || 'N/A';
    document.getElementById('lbl-mfg-date').textContent = cert.mfgDate || 'N/A';
    document.getElementById('lbl-specs').textContent = cert.specs || 'N/A';
    
    // Ranges & Increments (Page 1)
    document.getElementById('lbl-r-hc').textContent = cert.r_hc || 'N/A';
    document.getElementById('lbl-i-hc').textContent = cert.i_hc || 'N/A';
    document.getElementById('lbl-r-co').textContent = cert.r_co || 'N/A';
    document.getElementById('lbl-i-co').textContent = cert.i_co || 'N/A';
    document.getElementById('lbl-r-h2s').textContent = cert.r_h2s || 'N/A';
    document.getElementById('lbl-i-h2s').textContent = cert.i_h2s || 'N/A';
    document.getElementById('lbl-r-voc').textContent = cert.r_voc || 'N/A';
    document.getElementById('lbl-i-voc').textContent = cert.i_voc || 'N/A';
    document.getElementById('lbl-r-no2').textContent = cert.r_no2 || 'N/A';
    document.getElementById('lbl-i-no2').textContent = cert.i_no2 || 'N/A';

    document.getElementById('lbl-flow-rate').textContent = cert.flowRate || 'N/A';
    document.getElementById('lbl-adj-method').textContent = cert.adjMethod || 'N/A';
    document.getElementById('lbl-customer').textContent = cert.customer || 'N/A';
    document.getElementById('lbl-env-condition').textContent = cert.envCondition || 'N/A';
    document.getElementById('lbl-readj-due').textContent = cert.readjDue || 'N/A';
    document.getElementById('lbl-sig-place-date').textContent = cert.reportPlaceDate || 'N/A';
    document.getElementById('lbl-sig-tech-head').textContent = cert.techHead || 'N/A';

    // Populate Gases table on Page 1
    const gasTbody = document.getElementById('gas-table-tbody');
    gasTbody.innerHTML = '';
    
    for (let i = 1; i <= 4; i++) {
      const gId = cert[`gas_id_${i}`];
      const gName = cert[`gas_name_${i}`];
      const gAcc = cert[`gas_acc_${i}`];
      const gDue = cert[`gas_due_${i}`];
      
      if (gId || gName || gAcc || gDue) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-bold">${gId || ''}</td>
          <td>${gName || ''}</td>
          <td>${gAcc || ''}</td>
          <td>${gDue || ''}</td>
        `;
        gasTbody.appendChild(tr);
      }
    }

    // Populate Page 2 Elements
    document.getElementById('lbl-p2-object').textContent = cert.object || 'N/A';
    document.getElementById('lbl-p2-model').textContent = cert.model || 'N/A';
    document.getElementById('lbl-p2-serial').textContent = cert.serial || 'N/A';
    document.getElementById('lbl-p2-manufacturer').textContent = cert.manufacturer || 'N/A';
    
    document.getElementById('lbl-chk-outside').textContent = cert.chkOutside || 'N/A';
    document.getElementById('lbl-chk-tech').textContent = cert.chkTech || 'N/A';
    document.getElementById('lbl-cal-env-hours').textContent = cert.calEnvHours || 'N/A';
    document.getElementById('lbl-p2-cal-flow-rate').textContent = cert.calFlowRate || 'N/A';

    // Populate Measurement Results (Page 2 Table)
    const gases = ['hc', 'co', 'h2s', 'voc', 'no2'];
    gases.forEach(g => {
      document.getElementById(`lbl-s-m-${g}`).textContent = cert[`s_m_${g}`] || '-';
      document.getElementById(`lbl-s-s-${g}`).textContent = cert[`s_s_${g}`] || '-';
      document.getElementById(`lbl-s-r-${g}`).textContent = cert[`s_r_${g}`] || '-';
      document.getElementById(`lbl-s-c-${g}`).textContent = cert[`s_c_${g}`] || '-';
      document.getElementById(`lbl-s-d-${g}`).textContent = cert[`s_d_${g}`] || '-';
      document.getElementById(`lbl-s-a-${g}`).textContent = cert[`s_a_${g}`] || '-';
      document.getElementById(`lbl-s-al-${g}`).textContent = cert[`s_al_${g}`] || '-';
    });

    // Replacement parts multiline text (Page 2)
    document.getElementById('lbl-replacement-parts').textContent = cert.replacementParts || 'Không thay thế / None';
    document.getElementById('lbl-sig-operator').textContent = cert.operator || 'N/A';
    document.getElementById('lbl-p2-footer-report-no').innerHTML = `Kèm theo GCN hiệu chỉnh số/<em>attached to Report No</em>: <strong>${cert.reportNo || 'N/A'}</strong> ngày ${cert.reportPlaceDate ? cert.reportPlaceDate.replace(/.*,\s*ngày\s*/, '') : '...'}`;

    // Reveal Card
    elements.publicViewLoading.classList.add('hidden');
    elements.publicCertCard.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    elements.publicViewLoading.classList.add('hidden');
    elements.publicViewError.classList.remove('hidden');
  }
}

function switchPublicViewPage(page) {
  if (page === 'page1') {
    elements.btnViewPage1.classList.add('active');
    elements.btnViewPage2.classList.remove('active');
    elements.certPage1.classList.remove('hidden');
    elements.certPage2.classList.add('hidden');
  } else {
    elements.btnViewPage1.classList.remove('active');
    elements.btnViewPage2.classList.add('active');
    elements.certPage1.classList.add('hidden');
    elements.certPage2.classList.remove('hidden');
  }
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
    
    resetCertificateForm();
    fetchLibraryFiles();
    checkTemplateStatus();
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
    showToast('Đăng nhập thành công!');
    checkAuthSession();
    elements.loginUsername.value = '';
    elements.loginPassword.value = '';
  } else {
    showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
  }
}

function handleLogout() {
  sessionStorage.removeItem('rkv_admin_session');
  showToast('Đã đăng xuất.');
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
  } else {
    elements.tabCreate.classList.add('hidden');
    elements.tabLibrary.classList.remove('hidden');
    fetchLibraryFiles();
  }
}

function switchFormSection(btn) {
  const sec = btn.dataset.sec;
  elements.formSecButtons.forEach(b => b.classList.toggle('active', b === btn));
  
  if (sec === 'page1') {
    elements.formSecPage1.classList.remove('hidden');
    elements.formSecPage2.classList.add('hidden');
  } else {
    elements.formSecPage1.classList.add('hidden');
    elements.formSecPage2.classList.remove('hidden');
  }
}

async function fetchLibraryFiles() {
  elements.libraryLoading.classList.remove('hidden');
  elements.libraryTableContainer.classList.add('hidden');
  elements.libraryEmpty.classList.add('hidden');

  try {
    if (state.isStaticMode) {
      const localData = localStorage.getItem('rkv_local_certs');
      state.certificates = JSON.parse(localData || '[]');
    } else {
      const res = await fetch('/api/certificates', {
        headers: { 'x-admin-key': state.adminKey }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      state.certificates = data.certificates || [];
    }

    elements.libraryLoading.classList.add('hidden');

    if (state.certificates.length === 0) {
      elements.libraryEmpty.classList.remove('hidden');
    } else {
      state.certificates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderLibraryTable();
      elements.libraryTableContainer.classList.remove('hidden');
    }
  } catch (err) {
    elements.libraryLoading.classList.add('hidden');
    elements.libraryEmpty.classList.remove('hidden');
    showToast('Không thể kết nối lấy thư viện', 'error');
  }
}

function renderLibraryTable() {
  elements.libraryTbody.innerHTML = '';
  
  state.certificates.forEach(cert => {
    const tr = document.createElement('tr');
    const date = new Date(cert.createdAt);
    const dateString = date.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    tr.innerHTML = `
      <td><strong>${cert.reportNo}</strong></td>
      <td>${cert.object}</td>
      <td class="text-bold">${cert.model}</td>
      <td>${cert.customer}</td>
      <td>${dateString}</td>
      <td class="actions-col">
        <div class="lib-action-buttons">
          <button class="primary-btn lib-action-btn btn-view">Xem</button>
          <button class="secondary-btn lib-action-btn btn-print-qr">In QR</button>
          <button class="remove-btn lib-action-btn btn-delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.8rem;height:0.8rem;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-view').addEventListener('click', () => {
      const url = state.isStaticMode ? cert.url : `${window.location.origin}/?id=${cert.id}`;
      window.open(url, '_blank');
    });

    tr.querySelector('.btn-print-qr').addEventListener('click', () => {
      state.activeQRUrl = state.isStaticMode ? cert.url : `${window.location.origin}/?id=${cert.id}`;
      state.activeCertName = cert.reportNo;
      generateQRCode(() => printQRCode());
    });

    tr.querySelector('.btn-delete').addEventListener('click', async () => {
      if (confirm(`Bạn có chắc chắn muốn xóa báo cáo số "${cert.reportNo}"?`)) {
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
      showToast('Đã xóa chứng chỉ!');
      fetchLibraryFiles();
    } else {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': state.adminKey }
      });
      if (!res.ok) throw new Error();
      showToast('Đã xóa chứng chỉ khỏi máy chủ!');
      fetchLibraryFiles();
    }
  } catch (err) {
    showToast('Xóa thất bại', 'error');
  }
}

// -------------------------------------------------------------
// Form Operations & QR Creation
// -------------------------------------------------------------
function readFormValues() {
  const data = {};
  let isValid = true;

  formFieldIds.forEach(id => {
    const input = document.getElementById(`inp-${id}`);
    const val = input.value.trim();
    
    // Convert hyphened IDs to camelCase for state mapping
    const stateKey = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    data[stateKey] = val;

    // Check required fields (except Gas 4 which can be empty)
    if (input.hasAttribute('required') && !val) {
      input.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
      isValid = false;
    } else {
      input.style.backgroundColor = '';
    }
  });

  return { data, isValid };
}

async function handleFormSubmit() {
  const { data, isValid } = readFormValues();

  if (!isValid) {
    showToast('Vui lòng điền đầy đủ thông tin chứng chỉ các trang!', 'error');
    return;
  }

  elements.qrSpinner.classList.remove('hidden');

  try {
    if (state.isStaticMode) {
      // Static Base64 payload (compressed keys)
      const compressedData = compressCertificate(data);
      const base64Data = utf8Base64.encode(JSON.stringify(compressedData));
      const certUrl = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;
      
      // Save locally
      let localCerts = JSON.parse(localStorage.getItem('rkv_local_certs') || '[]');
      const certId = `RKV-${Date.now()}`;
      localCerts.push({
        id: certId,
        createdAt: new Date().toISOString(),
        url: certUrl,
        ...data
      });
      localStorage.setItem('rkv_local_certs', JSON.stringify(localCerts));

      state.activeQRUrl = certUrl;
      state.activeCertName = data.reportNo;
      generateQRCode();
      showToast('Đã lưu offline & xuất mã QR!');
    } 
    else {
      // Local Server DB
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': state.adminKey
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error();
      const response = await res.json();
      
      if (response.success) {
        state.activeQRUrl = response.url;
        state.activeCertName = response.certificate.reportNo;
        generateQRCode();
        showToast('Đã lưu lên máy chủ & xuất mã QR!');
      } else {
        throw new Error(response.error);
      }
    }
  } catch (err) {
    showToast('Lỗi lưu trữ dữ liệu', 'error');
    elements.qrSpinner.classList.add('hidden');
  }
}

function resetCertificateForm() {
  elements.certForm.reset();
  formFieldIds.forEach(id => {
    const input = document.getElementById(`inp-${id}`);
    if (input) input.style.backgroundColor = '';
  });
  
  state.activeQRUrl = '';
  state.activeCertName = '';
  clearQRCodeCanvas();
}

// -------------------------------------------------------------
// SheetJS Excel Export (Template-based or fallback)
// -------------------------------------------------------------

/**
 * Build a flat data map of all placeholder -> value pairs.
 * Keys match the {{placeholder}} names listed in the guide.
 */
function buildPlaceholderMap(data) {
  return {
    reportNo: data.reportNo || '',
    object: data.object || '',
    model: data.model || '',
    serial: data.serial || '',
    manufacturer: data.manufacturer || '',
    mfgDate: data.mfgDate || '',
    specs: data.specs || '',
    rHc: data.rHc || '', iHc: data.iHc || '',
    rCo: data.rCo || '', iCo: data.iCo || '',
    rH2s: data.rH2s || '', iH2s: data.iH2s || '',
    rVoc: data.rVoc || '', iVoc: data.iVoc || '',
    rNo2: data.rNo2 || '', iNo2: data.iNo2 || '',
    flowRate: data.flowRate || '',
    adjMethod: data.adjMethod || '',
    customer: data.customer || '',
    envCondition: data.envCondition || '',
    readjDue: data.readjDue || '',
    reportPlaceDate: data.reportPlaceDate || '',
    techHead: data.techHead || '',
    operator: data.operator || '',
    gasId1: data.gasId1 || '', gasName1: data.gasName1 || '', gasAcc1: data.gasAcc1 || '', gasDue1: data.gasDue1 || '',
    gasId2: data.gasId2 || '', gasName2: data.gasName2 || '', gasAcc2: data.gasAcc2 || '', gasDue2: data.gasDue2 || '',
    gasId3: data.gasId3 || '', gasName3: data.gasName3 || '', gasAcc3: data.gasAcc3 || '', gasDue3: data.gasDue3 || '',
    gasId4: data.gasId4 || '', gasName4: data.gasName4 || '', gasAcc4: data.gasAcc4 || '', gasDue4: data.gasDue4 || '',
    chkOutside: data.chkOutside || '',
    chkTech: data.chkTech || '',
    calEnvHours: data.calEnvHours || '',
    calFlowRate: data.calFlowRate || '',
    sMHc: data.sMHc || '', sMCo: data.sMCo || '', sMH2s: data.sMH2s || '', sMVoc: data.sMVoc || '', sMNo2: data.sMNo2 || '',
    sSHc: data.sSHc || '', sSCo: data.sSCo || '', sSH2s: data.sSH2s || '', sSVoc: data.sSVoc || '', sSNo2: data.sSNo2 || '',
    sRHc: data.sRHc || '', sRCo: data.sRCo || '', sRH2s: data.sRH2s || '', sRVoc: data.sRVoc || '', sRNo2: data.sRNo2 || '',
    sCHc: data.sCHc || '', sCCo: data.sCCo || '', sCH2s: data.sCH2s || '', sCVoc: data.sCVoc || '', sCNo2: data.sCNo2 || '',
    sDHc: data.sDHc || '', sDCo: data.sDCo || '', sDH2s: data.sDH2s || '', sDVoc: data.sDVoc || '', sDNo2: data.sDNo2 || '',
    sAHc: data.sAHc || '', sACo: data.sACo || '', sAH2s: data.sAH2s || '', sAVoc: data.sAVoc || '', sANo2: data.sANo2 || '',
    sAlHc: data.sAlHc || '', sAlCo: data.sAlCo || '', sAlH2s: data.sAlH2s || '', sAlVoc: data.sAlVoc || '', sAlNo2: data.sAlNo2 || '',
    replacementParts: data.replacementParts || '',
    signedStamp: 'ĐÃ KÝ điện tử (SIGNED)'
  };
}

/**
 * Replace all {{key}} occurrences in every text cell of the workbook.
 */
function fillTemplatePlaceholders(wb, placeholders) {
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    Object.keys(ws).forEach(cellAddr => {
      if (cellAddr.startsWith('!')) return;
      const cell = ws[cellAddr];
      if (cell && cell.t === 's' && typeof cell.v === 'string') {
        let val = cell.v;
        let changed = false;
        for (const [key, replacement] of Object.entries(placeholders)) {
          const regex = new RegExp(`\\{\\{${key}\\}}`, 'g');
          if (regex.test(val)) {
            val = val.replace(new RegExp(`\\{\\{${key}\\}}`, 'g'), replacement);
            changed = true;
          }
        }
        if (changed) {
          cell.v = val;
          cell.w = val; // update formatted text too
        }
      }
    });
  });
  return wb;
}

async function handleExcelExport() {
  const { data } = readFormValues();
  if (!data.reportNo) {
    showToast('Vui lòng điền số báo cáo trước khi xuất Excel!', 'error');
    return;
  }

  const placeholders = buildPlaceholderMap(data);
  const safeReportNo = data.reportNo.replace(/[^a-zA-Z0-9_-]/g, '_');

  // ---- Try template-based export first ----
  try {
    const resp = await fetch('/api/template', {
      headers: { 'x-admin-key': state.adminKey }
    });

    if (resp.ok) {
      const arrayBuffer = await resp.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true, cellFormula: true });
      fillTemplatePlaceholders(wb, placeholders);
      XLSX.writeFile(wb, `RIKEN_Report_${safeReportNo}.xlsx`);
      showToast('Đã xuất Excel từ template thành công! ✅');
      return;
    }
  } catch (err) {
    // If network error or no template, fall through to built-in export
    console.warn('Template fetch failed, using built-in export:', err);
  }

  // ---- Fallback: built-in generated sheet ----
  try {
    const wsData = [
      ["CÔNG TY TNHH CÔNG NGHỆ MÁY ĐO KHÍ RIKEN VIỆT", "", "", ""],
      ["GIẤY CHỨNG NHẬN HIỆU CHỈNH (ADJUSTMENT REPORT)", "", "", ""],
      ["Giấy CNHC số / Report No:", data.reportNo, "", ""],
      ["", "", "", ""],
      ["TRANG 1: THÔNG TIN CHUNG", "", "", ""],
      ["Tên thiết bị (Object):", data.object, "", ""],
      ["Kiểu (Model):", data.model, "Số máy (Serial Number):", data.serial],
      ["Nơi chế tạo (Manufacturer):", data.manufacturer, "Ngày sản xuất (Mfg. Date):", data.mfgDate],
      ["Đặc trưng kỹ thuật (Specifications):", data.specs, "", ""],
      ["", "", "", ""],
      ["PHẠM VI ĐO (MEASURING RANGE)", "", "ĐỘ CHIA ĐỘ (INCREMENT VALUE)", ""],
      ["HC Range:", data.rHc, "HC Increment:", data.iHc],
      ["CO Range:", data.rCo, "CO Increment:", data.iCo],
      ["H2S Range:", data.rH2s, "H2S Increment:", data.iH2s],
      ["VOC Range:", data.rVoc, "VOC Increment:", data.iVoc],
      ["NO2 Range:", data.rNo2, "NO2 Increment:", data.iNo2],
      ["", "", "", ""],
      ["Lưu lượng (Flow rate):", data.flowRate, "", ""],
      ["Phương pháp hiệu chỉnh:", data.adjMethod, "", ""],
      ["Đơn vị sử dụng (Customer):", data.customer, "", ""],
      ["", "", "", ""],
      ["KHÍ CHUẨN SỬ DỤNG (STANDARD GASES USED)", "", "", ""],
      ["Mã số/ID (Lot)", "Khí chuẩn (Standard gases)", "Độ chính xác (Accuracy)", "Hiệu lực (Due date)"],
      [data.gasId1, data.gasName1, data.gasAcc1, data.gasDue1],
      [data.gasId2, data.gasName2, data.gasAcc2, data.gasDue2],
      [data.gasId3, data.gasName3, data.gasAcc3, data.gasDue3],
      [data.gasId4, data.gasName4, data.gasAcc4, data.gasDue4],
      ["", "", "", ""],
      ["Điều kiện hiệu chỉnh:", data.envCondition, "Ngày hiệu chỉnh đề nghị:", data.readjDue],
      ["Nơi & Ngày lập:", data.reportPlaceDate, "Phụ trách kỹ thuật:", data.techHead],
      ["Trạng thái ký tên:", "ĐÃ KÝ điện tử (SIGNED)", "", ""],
      ["", "", "", ""],
      ["TRANG 2: KẾT QUẢ ĐO CHI TIẾT", "", "", ""],
      ["1. Kiểm tra bên ngoài (Check outside):", data.chkOutside, "", ""],
      ["2. Kiểm tra kỹ thuật (Technical inspection):", data.chkTech, "", ""],
      ["3. Kiểm tra đo lường: Thời gian lưu mẫu:", data.calEnvHours, "Lưu lượng khí vào máy:", data.calFlowRate],
      ["", "", "", ""],
      ["CHI TIẾT ĐO LƯỜNG CẢM BIẾN (SENSORS DETAILED VALUES)", "", "", ""],
      ["Thông số", "HC (%LEL)", "CO (ppm)", "H2S (ppm)", "VOC (ppm)", "NO2 (ppm)"],
      ["Cảm biến Model", data.sMHc, data.sMCo, data.sMH2s, data.sMVoc, data.sMNo2],
      ["Cảm biến Serial", data.sSHc, data.sSCo, data.sSH2s, data.sSVoc, data.sSNo2],
      ["Thang đo (Range)", data.sRHc, data.sRCo, data.sRH2s, data.sRVoc, data.sRNo2],
      ["Nồng độ khí chuẩn", data.sCHc, data.sCCo, data.sCH2s, data.sCVoc, data.sCNo2],
      ["Giá trị hiển thị", data.sDHc, data.sDCo, data.sDH2s, data.sDVoc, data.sDNo2],
      ["Giá trị điều chỉnh", data.sAHc, data.sACo, data.sAH2s, data.sAVoc, data.sANo2],
      ["Giá trị cảnh báo", data.sAlHc, data.sAlCo, data.sAlH2s, data.sAlVoc, data.sAlNo2],
      ["", "", "", ""],
      ["Phụ tùng đã được thay thế (Replacement parts):", data.replacementParts, "", ""],
      ["Người thực hiện (Operator):", data.operator, "Trạng thái ký tên:", "ĐÃ KÝ điện tử (SIGNED)"]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [40, 25, 25, 25].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Adjustment Report');
    XLSX.writeFile(wb, `RIKEN_Report_${safeReportNo}.xlsx`);
    showToast('Đã xuất Excel (built-in) thành công!');
  } catch (err) {
    console.error(err);
    showToast('Lỗi khi xuất tệp Excel', 'error');
  }
}

// -------------------------------------------------------------
// QR Canvas Operations
// -------------------------------------------------------------
function generateQRCode(callback = null) {
  const url = state.activeQRUrl;
  if (!url) {
    clearQRCodeCanvas();
    return;
  }

  elements.qrSpinner.classList.remove('hidden');
  elements.qrTargetUrl.textContent = url;
  
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
  const logo = state.qrSettings.logoImg;
  
  const logoSize = size * 0.18;
  const cx = size / 2;
  const cy = size / 2;

  ctx.save();
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

function copyLinkToClipboard() {
  const url = state.activeQRUrl;
  if (!url) return;

  navigator.clipboard.writeText(url)
    .then(() => showToast('Đã sao chép liên kết chứng chỉ!'))
    .catch(() => showToast('Sao chép liên kết thất bại', 'error'));
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
    showToast('Đã tải PNG');
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
      showToast('Đã tải SVG');
    }).catch(err => {
      showToast('Lỗi tạo file SVG', 'error');
    });
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
// Event Wire-up
// -------------------------------------------------------------
function setupEventListeners() {
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.logoutBtn.addEventListener('click', handleLogout);

  // Admin Portal View Tabs
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn));
  });

  // Admin Form Sections Swap (Page 1 vs Page 2 editor)
  elements.formSecButtons.forEach(btn => {
    btn.addEventListener('click', () => switchFormSection(btn));
  });

  // Form buttons
  elements.clearFormBtn.addEventListener('click', resetCertificateForm);
  elements.submitCertBtn.addEventListener('click', handleFormSubmit);
  elements.exportExcelBtn.addEventListener('click', handleExcelExport);

  // Library reload
  elements.refreshLibraryBtn.addEventListener('click', fetchLibraryFiles);

  // QR Actions
  elements.copyLinkBtn.addEventListener('click', copyLinkToClipboard);
  elements.printQrBtn.addEventListener('click', printQRCode);
  elements.downloadOptions.forEach(btn => {
    btn.addEventListener('click', () => downloadQRCode(btn.dataset.format));
  });

  // Color Pickers
  elements.qrColorFg.addEventListener('input', (e) => {
    state.qrSettings.fgColor = e.target.value;
    generateQRCode();
  });
  elements.qrColorBg.addEventListener('input', (e) => {
    state.qrSettings.bgColor = e.target.value;
    generateQRCode();
  });

  // Logo upload
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
          showToast('Đã chèn logo vào mã QR');
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

  // Public Viewer Tab switches
  elements.btnViewPage1.addEventListener('click', () => switchPublicViewPage('page1'));
  elements.btnViewPage2.addEventListener('click', () => switchPublicViewPage('page2'));
  
  elements.btnPrintPublicSheet.addEventListener('click', () => {
    window.print();
  });

  // ---- Template Upload Events ----
  if (elements.templateFileInput) {
    elements.templateFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('template', file);

      const label = elements.templateUploadLabel;
      if (label) label.textContent = 'Đang tải lên...';

      try {
        const resp = await fetch('/api/template', {
          method: 'POST',
          headers: { 'x-admin-key': state.adminKey },
          body: formData
        });
        const result = await resp.json();
        if (result.success) {
          showToast('Template đã được upload thành công! ✅');
          checkTemplateStatus();
        } else {
          showToast(result.error || 'Lỗi khi upload template', 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối server khi upload', 'error');
      } finally {
        e.target.value = '';
        if (label) label.textContent = 'Thay thế Template';
      }
    });
  }

  if (elements.templateDeleteBtn) {
    elements.templateDeleteBtn.addEventListener('click', async () => {
      if (!confirm('Bạn có chắc muốn xoá file template hiện tại không?')) return;
      try {
        const resp = await fetch('/api/template', {
          method: 'DELETE',
          headers: { 'x-admin-key': state.adminKey }
        });
        const result = await resp.json();
        if (result.success) {
          showToast('Template đã được xoá.');
          checkTemplateStatus();
        } else {
          showToast(result.error || 'Lỗi xoá template', 'error');
        }
      } catch (err) {
        showToast('Không thể kết nối server', 'error');
      }
    });
  }

  if (elements.togglePlaceholderGuideBtn) {
    elements.togglePlaceholderGuideBtn.addEventListener('click', () => {
      const guide = elements.templatePlaceholderGuide;
      const btn = elements.togglePlaceholderGuideBtn;
      if (guide.classList.contains('hidden')) {
        guide.classList.remove('hidden');
        btn.textContent = 'Ẩn danh sách placeholder';
      } else {
        guide.classList.add('hidden');
        btn.textContent = 'Xem danh sách placeholder';
      }
    });
  }
}

// Check template status on server and update UI
async function checkTemplateStatus() {
  if (!elements.templateStatusText) return;
  try {
    const resp = await fetch('/api/template/info', {
      headers: { 'x-admin-key': state.adminKey }
    });
    const result = await resp.json();
    if (result.success && result.exists) {
      const kb = Math.round(result.size / 1024);
      const updated = new Date(result.updatedAt).toLocaleString('vi-VN');
      elements.templateStatusText.textContent = `✅ Template: excel_template.xlsx (${kb} KB) – Cập nhật: ${updated}`;
      if (elements.templateDeleteBtn) elements.templateDeleteBtn.classList.remove('hidden');
      if (elements.templateUploadLabel) elements.templateUploadLabel.querySelector('span') && (elements.templateUploadLabel.querySelector('span').textContent = 'Thay thế Template');
    } else {
      elements.templateStatusText.textContent = 'Chưa có template. Hãy tải lên file Excel mẫu (.xlsx).';
      if (elements.templateDeleteBtn) elements.templateDeleteBtn.classList.add('hidden');
      if (elements.templateUploadLabel) {
        const span = elements.templateUploadLabel.querySelector('span');
        if (span) span.textContent = 'Tải lên Template';
      }
    }
  } catch (err) {
    // Silently ignore if not admin or server error
  }
}

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  const icon = type === 'error' 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.25s ease reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}
