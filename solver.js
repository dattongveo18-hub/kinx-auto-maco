/**
 * reCAPTCHA v3 Direct Token Solver
 * Lấy token reCAPTCHA v3 TRỰC TIẾP từ Google (không qua dịch vụ bên thứ 3)
 * Sử dụng Puppeteer để gọi grecaptcha.execute()
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

class RecaptchaSolver {
  constructor() {
    this.browser = null;
  }

  /**
   * Tìm Chrome/Edge (Hỗ trợ cả Windows và macOS)
   */
  findChrome() {
    let possiblePaths = [];

    // --- PHẦN SỬA ĐỔI: Kiểm tra hệ điều hành ---
    if (process.platform === "darwin") {
      // Đường dẫn cho macOS
      possiblePaths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        path.join(process.env.HOME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
      ];
    } else {
      // Đường dẫn gốc cho Windows (Code cũ của bạn)
      possiblePaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        path.join(
          process.env.LOCALAPPDATA || "", // Thêm || "" để tránh lỗi nếu biến môi trường này không tồn tại
          "Google\\Chrome\\Application\\chrome.exe"
        ),
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      ];
    }
    // ---------------------------------------------

    for (const chromePath of possiblePaths) {
      if (fs.existsSync(chromePath)) {
        console.log("[ReCAPTCHA] Tìm thấy browser:", chromePath);
        return chromePath;
      }
    }

    throw new Error(
      "Không tìm thấy Chrome hoặc Edge. Vui lòng cài đặt Chrome!"
    );
  }

  /**
   * Lấy token reCAPTCHA v3 trực tiếp
   * @param {string} websiteURL - URL của website (VD: https://labs.google)
   * @param {string} websiteKey - Site key của reCAPTCHA
   * @param {string} pageAction - Action name (VD: FLOW_GENERATION)
   * @returns {Promise<string>} reCAPTCHA token
   */
  async getRecaptchaToken(websiteURL, websiteKey, pageAction) {
    let page = null;

    try {
      console.log("[ReCAPTCHA] Đang khởi động browser...");

      // Khởi động browser
      if (!this.browser) {
        const executablePath = this.findChrome();

        this.browser = await puppeteer.launch({
          headless: false, // Hiển thị browser để debug, có thể đổi thành true
          executablePath: executablePath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--start-minimized", // Thêm dòng này để thu nhỏ ngay lập tức
            "--window-size=1,1", // Đặt kích thước cửa sổ siêu nhỏ (1x1 pixel)
            "--window-position=-9999,-9999", // Đẩy cửa sổ ra khỏi phạm vi màn hình
          ],
        });
      }

      page = await this.browser.newPage();

      // Set user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      );

      console.log("[ReCAPTCHA] Đang tải trang:", websiteURL);

      // Tải trang website
      await page.goto(websiteURL, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      console.log("[ReCAPTCHA] Đang inject reCAPTCHA script...");

      // Inject reCAPTCHA v3 script và lấy token
      const token = await page.evaluate(
        async (siteKey, action) => {
          return new Promise((resolve, reject) => {
            // Load reCAPTCHA API script
            const script = document.createElement("script");
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;

            script.onload = () => {
              console.log("[Browser] reCAPTCHA script loaded");

              // Đợi grecaptcha ready
              window.grecaptcha.ready(() => {
                console.log("[Browser] grecaptcha ready, executing...");

                // Execute reCAPTCHA
                window.grecaptcha
                  .execute(siteKey, { action: action })
                  .then((token) => {
                    console.log("[Browser] Token received!");
                    resolve(token);
                  })
                  .catch((error) => {
                    console.error("[Browser] Execute error:", error);
                    reject(error);
                  });
              });
            };

            script.onerror = (error) => {
              console.error("[Browser] Script load error:", error);
              reject(new Error("Failed to load reCAPTCHA script"));
            };

            document.head.appendChild(script);
          });
        },
        websiteKey,
        pageAction
      );

      console.log("[ReCAPTCHA] ✓ Đã lấy token thành công!");
      console.log("[ReCAPTCHA] Token length:", token.length);

      await page.close();

      return token;
    } catch (error) {
      console.error("[ReCAPTCHA] ❌ Lỗi:", error.message);

      if (page) {
        await page.close();
      }

      throw error;
    }
  }

  /**
   * Đóng browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log("[ReCAPTCHA] Browser đã đóng");
    }
  }
}

// ============================================
// CÁCH SỬ DỤNG
// ============================================

async function example() {
  const solver = new RecaptchaSolver();

  try {
    console.log("\n=================================");
    console.log("🚀 Bắt đầu lấy token reCAPTCHA v3...");
    console.log("=================================\n");

    const token = await solver.getRecaptchaToken(
      "https://labs.google", // Website URL
      "6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV", // Site Key
      "FLOW_GENERATION" // Action
    );

    console.log("\n=================================");
    console.log("✅ TOKEN RECAPTCHA:");
    console.log("=================================");
    console.log(token);
    console.log("=================================\n");

    // Đóng browser
    await solver.close();

    return token;
  } catch (error) {
    console.error("\n❌ LỖI:", error.message);
    await solver.close();
  }
}

// Export
module.exports = RecaptchaSolver;

// Test ngay khi chạy file
if (require.main === module) {
  example();
}