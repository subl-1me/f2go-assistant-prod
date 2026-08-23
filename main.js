const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");
const {
  initDatabases,
  write,
  read,
  removeReservationsCache,
  updateItem,
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


  // if test use localhost:4200 for angular
  
  await win.loadFile(path.join(__dirname, "/src/loader.html"));
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await win.loadFile(path.join(__dirname, "/dist/f2go-assistant/browser/index.html"));
      win.show();
      break;
    } catch (error) {
      if (i === maxAttempts - 1) {
        await win.loadFile(path.join(__dirname, "/src/error.html"));
        win.show();
        throw new Error('Angular dev server no responde');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
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

ipcMain.handle("updateIten", async (event, data) => {
  try {
    return await updateItem(data.reservation, data.updates);
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
