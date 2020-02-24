"use strict";
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const url = require("url");
const globalShortcut = electron.globalShortcut;

let win;

function createWindow() {
  win = new BrowserWindow({
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    icon: "./WeatherOrNotIcon.ico",
    minHeight: 300,
    minWidth: 600
  });
  //win.webContents.openDevTools();
  win.removeMenu();

  //***//
  globalShortcut.register("f5", function() {
    console.log("f5 is pressed");
    win.reload();
  });
  globalShortcut.register("CommandOrControl+R", function() {
    console.log("CommandOrControl+R is pressed");
    win.reload();
  });

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file",
      slashes: true
    })
  );

  win.on("closed", () => {
    win = null;
  });

  win.once("ready-to-show", () => {
    win.show();
  });
}

app.on("ready", createWindow);
