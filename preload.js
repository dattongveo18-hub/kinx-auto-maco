"use strict";
const {
  contextBridge: d,
  ipcRenderer: o,
  clipboard: i,
  shell: a,
} = require("electron");
d.exposeInMainWorld("electronAPI", {
  fetch: (e, t, n) => o.invoke("fetch-api", { url: e, cookie: t, options: n }),
  startBrowserAutomation: (e) => o.send("browser:start-automation", e),
  stopBrowserAutomation: () => o.send("browser:stop-automation"),
  videoCreateFromFrames: (e) => o.send("video:create-from-frames", e),
  videoCreateFromReferences: (e) => o.send("video:create-from-references", e),
  videoCreateExtended: (e) => o.send("extended-video:start", e),
  stopExtendedVideo: () => o.send("extended-video:stop"),
  mergeVideos: (e) => o.invoke("merge-videos", e),
  selectVideoFiles: () => o.invoke("select-video-files"),
  stopMerge: () => o.invoke("stop-merge"),
  getVideoMetadata: (e) => o.invoke("get-video-metadata", e),
  getLoadableVideoSrc: (e) => o.invoke("get-loadable-video-src", e),
  cutVideo: (e) => o.invoke("video:cut", e),
  extractFrames: (e) => o.invoke("video:extract-frames", e),
  stopCut: () => o.invoke("video:stop-cut"),
  downloadVideo: (e) => o.send("download-video", e),
  downloadImage: (e) => o.send("download-image", e),
  selectDownloadDirectory: () => o.invoke("select-download-directory"),
  importPromptsFromFile: () => o.invoke("import-prompts-from-file"),
  importJsonPromptsFromFile: () => o.invoke("import-prompts-from-json"),
  getAppVersion: () => o.invoke("get-app-version"),
  saveImageToDisk: (e, t, n, r) =>
    o.invoke("save-image-to-disk", {
      base64Data: e,
      savePath: t,
      filename: n,
      promptIndex: r,
    }),
  onDownloadComplete: (e) => {
    const t = (n, r) => e(r);
    return (
      o.on("download-complete", t),
      () => o.removeListener("download-complete", t)
    );
  },
  onBrowserLog: (e) => {
    const t = (n, r) => e(r);
    return o.on("browser:log", t), () => o.removeListener("browser:log", t);
  },
  onExtendedVideoLog: (e) => {
    const t = (n, r) => e(r);
    return (
      o.on("extended-video:log", t),
      () => o.removeListener("extended-video:log", t)
    );
  },
  onCookieUpdate: (e) => {
    const t = (n, r) => e(r);
    return (
      o.on("browser:cookie-update", t),
      () => o.removeListener("browser:cookie-update", t)
    );
  },
  onNavigateToView: (e) => {
    const t = (n, r) => e(r);
    return (
      o.on("navigate-to-view", t), () => o.removeListener("navigate-to-view", t)
    );
  },
  onMergeProgress: (e) => {
    const t = (n, r) => e(r);
    return (
      o.on("merge-progress", t), () => o.removeListener("merge-progress", t)
    );
  },
  onCutProgress: (e) => {
    const t = (n, r) => e(r);
    return o.on("cut-progress", t), () => o.removeListener("cut-progress", t);
  },
  checkForUpdates: () => o.send("check-for-updates"),
  downloadUpdate: () => o.send("download-update"),
  onUpdateMessage: (e) => {
    const t = (n, r, s) => e(r, s);
    return (
      o.on("update-message", t), () => o.removeListener("update-message", t)
    );
  },
  restartAndInstall: () => o.send("restart-and-install"),
  forceReloadWindow: () => o.send("app:force-reload-window"),
  copyText: (e) => i.writeText(e),
  openExternalLink: (e) => a.openExternal(e),
  // Gemini API methods
  geminiSaveApiKey: (key) => o.invoke("gemini:save-api-key", key),
  geminiGetApiKey: () => o.invoke("gemini:get-api-key"),
  geminiTestApiKey: (key) => o.invoke("gemini:test-api-key", key),
  geminiGenerateImage: (params) => o.invoke("gemini:generate-image", params),
  geminiGenerateVideo: (params) => o.invoke("gemini:generate-video", params),
  geminiPollVideoOperation: (operationName, apiKey) =>
    o.invoke("gemini:poll-video-operation", operationName, apiKey),
  geminiDownloadVideo: (videoUri, apiKey) =>
    o.invoke("gemini:download-video", videoUri, apiKey),
  upscaleVideo: (e) => o.invoke("video:upscale", e),
});
