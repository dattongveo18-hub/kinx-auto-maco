const { BrowserWindow, session } = require("electron");

class RecaptchaSolver {
  constructor() {
    this.solverWindow = null;
  }

  findChrome() {
    return "Electron"; 
  }

 
  async createSolverWindow(targetUrl) {
    if (this.solverWindow && !this.solverWindow.isDestroyed()) {
      this.solverWindow.destroy();
    }

    this.solverWindow = new BrowserWindow({
      width: 360,
      height: 640,
      show: true,        
      x: -32000,         
      y: -32000,
      frame: false,
      skipTaskbar: true, 
      focusable: false,  
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false, 
        session: session.defaultSession, 
        webSecurity: false, 
        backgroundThrottling: false, 
      },
    });

    
    this.solverWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = Object.assign({}, details.responseHeaders);
     
      if (responseHeaders['content-security-policy']) delete responseHeaders['content-security-policy'];
      if (responseHeaders['x-frame-options']) delete responseHeaders['x-frame-options'];
      callback({ responseHeaders, cancel: false });
    });

  
    this.solverWindow.webContents.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );


    this.solverWindow.webContents.setAudioMuted(true);


    await this.solverWindow.loadURL(targetUrl);
  }

 
  async simulateHumanInteraction() {
    if (!this.solverWindow || this.solverWindow.isDestroyed()) return;
    
 
    const contents = this.solverWindow.webContents;
    try {
        contents.sendInputEvent({ type: 'mouseEnter', x: 10, y: 10 });
        contents.sendInputEvent({ type: 'mouseMove', x: 100, y: 100 });
        await new Promise(r => setTimeout(r, 100));
        contents.sendInputEvent({ type: 'mouseMove', x: 200, y: 150 });
        contents.sendInputEvent({ type: 'mouseDown', x: 200, y: 150, button: 'left', clickCount: 1 });
        await new Promise(r => setTimeout(r, 50));
        contents.sendInputEvent({ type: 'mouseUp', x: 200, y: 150, button: 'left', clickCount: 1 });
    } catch (e) {
       
    }
  }

  async getRecaptchaToken(websiteURL, websiteKey, pageAction) {
    try {
      
      await this.createSolverWindow(websiteURL);

      
      await this.simulateHumanInteraction();

      
      const token = await this.solverWindow.webContents.executeJavaScript(`
        (async function() {
          const siteKey = '${websiteKey}';
          const action = '${pageAction}';

         
          const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

         
          async function ensureLibrary() {
            if (window.grecaptcha && window.grecaptcha.execute) return;
            
            
            const old = document.getElementById('recaptcha-solver-script');
            if (old) old.remove();

            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.id = 'recaptcha-solver-script';
              script.src = 'https://www.google.com/recaptcha/api.js?render=' + siteKey;
              script.onload = () => {
                  // Đợi thêm 1s để library init xong
                  setTimeout(resolve, 1000);
              };
              script.onerror = () => reject("Load script failed");
              document.head.appendChild(script);
            });
          }

          try {
            await ensureLibrary();
            
            
            let attempts = 0;
            while (!window.grecaptcha || !window.grecaptcha.execute) {
                if (attempts++ > 20) throw new Error("Timeout waiting for grecaptcha");
                await wait(200);
            }

            return new Promise((resolve, reject) => {
               window.grecaptcha.ready(() => {
                  window.grecaptcha.execute(siteKey, { action: action })
                    .then(token => resolve(token))
                    .catch(err => reject("Execute Error: " + err.message));
               });
            });

          } catch (e) {
            return "ERROR: " + e.message;
          }
        })();
      `, true); 

      
      if (!token || typeof token !== 'string' || token.startsWith("ERROR:")) {
         throw new Error("Token lỗi: " + token);
      }

      console.log(`[ElectronSolver] => OK (${token.length} chars)`);
      
      this.close();
      return token;

    } catch (error) {
      console.error("[ElectronSolver] Lỗi:", error.message);
      this.close();
      return null; 
    }
  }

  async close() {
    if (this.solverWindow && !this.solverWindow.isDestroyed()) {
      this.solverWindow.destroy();
      this.solverWindow = null;
    }
  }
}

module.exports = RecaptchaSolver;