const { app, BrowserWindow, Menu } = require("electron")
const path = require("path")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "icon.png"),
    show: false,
  })

  mainWindow.loadFile("index.html")

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  // Open DevTools in development
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Create application menu
  createMenu()
}

function createMenu() {
  const template = [
    {
      label: "Arquivo",
      submenu: [
        {
          label: "Novo Orçamento",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.executeJavaScript(`
                            pricingSystem.switchTab('calculadora');
                            pricingSystem.clearForm();
                        `)
          },
        },
        {
          label: "Salvar Orçamento",
          accelerator: "CmdOrCtrl+S",
          click: () => {
            mainWindow.webContents.executeJavaScript("pricingSystem.saveBudget()")
          },
        },
        { type: "separator" },
        {
          label: "Exportar Dados",
          click: () => {
            mainWindow.webContents.executeJavaScript("pricingSystem.exportData()")
          },
        },
        { type: "separator" },
        {
          label: "Sair",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Desfazer" },
        { role: "redo", label: "Refazer" },
        { type: "separator" },
        { role: "cut", label: "Recortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Colar" },
        { role: "selectall", label: "Selecionar Tudo" },
      ],
    },
    {
      label: "Visualizar",
      submenu: [
        {
          label: "Calculadora",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            mainWindow.webContents.executeJavaScript(`pricingSystem.switchTab('calculadora')`)
          },
        },
        {
          label: "Histórico",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            mainWindow.webContents.executeJavaScript(`pricingSystem.switchTab('historico')`)
          },
        },
        {
          label: "Relatórios",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            mainWindow.webContents.executeJavaScript(`pricingSystem.switchTab('relatorios')`)
          },
        },
        {
          label: "Configurações",
          accelerator: "CmdOrCtrl+4",
          click: () => {
            mainWindow.webContents.executeJavaScript(`pricingSystem.switchTab('configuracoes')`)
          },
        },
        { type: "separator" },
        {
          label: "Alternar Tema",
          accelerator: "CmdOrCtrl+T",
          click: () => {
            mainWindow.webContents.executeJavaScript("pricingSystem.toggleTheme()")
          },
        },
        { type: "separator" },
        { role: "reload", label: "Recarregar" },
        { role: "forceReload", label: "Forçar Recarregamento" },
        { role: "toggleDevTools", label: "Ferramentas do Desenvolvedor" },
        { type: "separator" },
        { role: "resetZoom", label: "Zoom Real" },
        { role: "zoomIn", label: "Aumentar Zoom" },
        { role: "zoomOut", label: "Diminuir Zoom" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Tela Cheia" },
      ],
    },
    {
      label: "Janela",
      submenu: [
        { role: "minimize", label: "Minimizar" },
        { role: "close", label: "Fechar" },
      ],
    },
    {
      label: "Ajuda",
      submenu: [
        {
          label: "Sobre",
          click: () => {
            const { dialog } = require("electron")
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Sobre",
              message: "Sistema de Precificação",
              detail:
                "Versão 1.0.0\n\nSistema completo para cálculo de preços de trabalhos e serviços.\n\nDesenvolvido com Electron, HTML, CSS e JavaScript.",
            })
          },
        },
      ],
    },
  ]

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about", label: "Sobre " + app.getName() },
        { type: "separator" },
        { role: "services", label: "Serviços", submenu: [] },
        { type: "separator" },
        { role: "hide", label: "Ocultar " + app.getName() },
        { role: "hideothers", label: "Ocultar Outros" },
        { role: "unhide", label: "Mostrar Todos" },
        { type: "separator" },
        { role: "quit", label: "Sair do " + app.getName() },
      ],
    })

    // Window menu
    template[4].submenu = [
      { role: "close", label: "Fechar" },
      { role: "minimize", label: "Minimizar" },
      { role: "zoom", label: "Zoom" },
      { type: "separator" },
      { role: "front", label: "Trazer Todas para Frente" },
    ]
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault()
  })
})
