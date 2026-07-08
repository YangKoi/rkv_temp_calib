# RKV PDF to QR Hub 📄➡️🔳

A premium, highly interactive web application designed to store PDF documents and instantly map them to customizable QR codes. 

This repository hosts a client-server solution designed for seamless document sharing, featuring dual-theme styling (Light & Dark Mode) and modern glassmorphic aesthetics.

---

## 🌟 Key Features

1. **Dual Sharing Modes**:
   - **Local Wi-Fi Mode**: Hosts the uploaded PDFs on the local Express server. It automatically detects the host's local network IP (e.g., `192.168.1.X`) and generates a QR code. Devices connected to the same Wi-Fi network can scan the QR code to instantly view and download the PDF.
   - **Cloud Mode**: Uploads the PDF anonymously to `tmpfiles.org`. Generates a globally accessible QR code that is secure and automatically expires after 60 minutes.
   - **Direct Link Mode**: Paste any online PDF URL to generate a QR code instantly.

2. **Persistent PDF Storage Library**:
   - Fulfills the file storage requirement by listing all uploaded PDFs in a library.
   - Allows users to select any previously uploaded document to re-generate its QR code or view a preview without re-uploading.
   - Includes options to preview page-by-page or delete documents securely from storage.

3. **In-Browser PDF Preview**:
   - Integrated with `pdf.js` to render a visual preview of PDF pages directly in a modal overlay, complete with pagination.

4. **Rich QR Customization Options**:
   - Change QR foreground and background colors in real-time.
   - Adjust the QR code scale/size.
   - **Center Logo Overlay**: Drag or select a custom image logo (such as a company branding icon) to overlay at the center of the QR code.
   - Adjustable Margin and Error Correction Levels (ECC L/M/Q/H) to guarantee scanning accuracy even with centered logos.

5. **Export Options**:
   - **Download PNG**: High-resolution image format.
   - **Download SVG**: High-fidelity vector format (automatically embeds center logos as base64 inside the SVG markup).
   - **Copy Link**: Copies the sharing URL with visual confirmation.
   - **Print Badge**: Standardized formatting that prints a physical QR code placard/badge, hiding the browser UI automatically.

---

## 🚀 Quick Start

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation
1. Clone this repository (if not already done):
   ```bash
   git clone https://github.com/YangKoi/rkv_temp_calib.git
   cd rkv_temp_calib
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open in browser:
   - Access locally: `http://localhost:3000`
   - Access from the local network: `http://<your-local-ip>:3000` (e.g., `http://192.168.1.50:3000`, shown in the server startup logs).

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, Multer, Cors
- **Frontend**: Vanilla HTML5, CSS3 Variables & Custom Transitions, JavaScript ES6
- **External Libraries (via CDN)**:
  - [qrcode.js](https://github.com/soldair/node-qrcode) - Robust browser QR generation
  - [pdf.js](https://mozilla.github.io/pdf.js/) - Client-side PDF rendering
