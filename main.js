const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");
const {
  initDatabases,
  write,
  read,
  removeReservationsCache,
} = require("./localDatabase");
const { ipcMain } = require("electron");

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await win.loadFile(path.join(__dirname, "/src/loader.html"));
  await win.loadURL("http://localhost:4200/");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("init-db", async () => {
  return await initDatabases();
});

ipcMain.handle("write", async (event, data) => {
  try {
    return await write(data);
  } catch (err) {
    console.log(err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("read", async (event) => {
  try {
    return await read();
  } catch (err) {
    console.log(err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("removeReservationsCache", async (event) => {
  try {
    return await removeReservationsCache();
  } catch (err) {
    console.log(err);
    return { success: false, error: err.message };
  }
});
