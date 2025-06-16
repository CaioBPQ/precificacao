// Sistema de Precificação - JavaScript Vanilla
class PricingSystem {
editBudget(id) {
    const budget = this.budgets.find(b => b.id === id);
    if (!budget) return;

    this.editingId = id;

    // Preenche os campos principais
    document.getElementById("cliente").value = budget.client;
    document.getElementById("descricao").value = budget.description;
    document.getElementById("categoria").value = budget.category;
    document.getElementById("horas").value = budget.hours;
    document.getElementById("valor-hora").value = budget.hourlyRate;
    document.getElementById("margem-lucro").value = budget.profitMargin;
    document.getElementById("impostos").value = budget.taxes;
    document.getElementById("despesas-fixas").value = budget.fixedCosts;
    document.getElementById("rendimento").value = budget.rendimento || "";

    // Preenche os materiais
    this.materials = budget.materials.map(material => ({ ...material })); // Deep copy
    this.renderMaterials();

    this.updateCalculations();

    // Muda texto do botão
    const saveBtn = document.getElementById("save-budget");
    saveBtn.textContent = "Atualizar Orçamento";
    saveBtn.classList.remove("btn-success");
    saveBtn.classList.add("btn-warning");

    // Troca pra aba Calculadora
    this.switchTab("calculadora");
}

  constructor() {
    this.materials = [];
    this.budgets = this.loadBudgets();
    this.settings = this.loadSettings();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTheme();
    this.loadDefaultSettings();
    this.updateCalculations();
    this.renderBudgetsList();
    this.updateReports();
  }

  // Event Listeners
  setupEventListeners() {
    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => this.toggleTheme());

    // Tab navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchTab(e.currentTarget.dataset.tab));
    });

    // Calculator inputs
    const calculatorInputs = ["horas", "valor-hora", "margem-lucro", "impostos", "despesas-fixas"];
    calculatorInputs.forEach((id) => {
      document.getElementById(id).addEventListener("input", () => this.updateCalculations());
    });

    // Material management
    document.getElementById("add-material").addEventListener("click", () => this.addMaterial());

    // Budget management
    document.getElementById("save-budget").addEventListener("click", () => this.saveBudget());
    document.getElementById("search-budgets").addEventListener("input", (e) => this.searchBudgets(e.target.value));
    document.getElementById("export-csv").addEventListener("click", () => this.exportCSV());

    // Settings
    document.getElementById("save-settings").addEventListener("click", () => this.saveSettings());
    document.getElementById("export-data").addEventListener("click", () => this.exportData());
    document
      .getElementById("import-data")
      .addEventListener("click", () => document.getElementById("import-file").click());
    document.getElementById("import-file").addEventListener("change", (e) => this.importData(e));
    document.getElementById("clear-data").addEventListener("click", () => this.clearAllData());

    // Reports
    document.getElementById("period-filter").addEventListener("change", (e) => this.updateReports(e.target.value));

    // Modal
    document.querySelector(".modal-close").addEventListener("click", () => this.closeModal());
    document.getElementById("budget-modal").addEventListener("click", (e) => {
      if (e.target.id === "budget-modal") this.closeModal();
    });
  }

  // Theme Management
  setupTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    this.setTheme(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const icon = document.getElementById("theme-icon");
    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  // Tab Management
  switchTab(tabName) {
    // Update buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update content
    document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");

    // Update reports when switching to reports tab
    if (tabName === "relatorios") {
      this.updateReports();
    }
  }

  // Mapeamento de conversão de unidades para a menor unidade base (gramas ou mililitros)
  getConversionFactor(unit) {
    const factors = {
      kg: 1000,
      g: 1,
      l: 1000,
      ml: 1,
      un: 1,
    };
    return factors[unit] || 1;
  }

  // Material Management
  addMaterial() {
    const material = {
      id: Date.now().toString(),
      name: "",
      // Novos campos para cálculo proporcional
      productPrice: 0, // Preço do produto comprado (ex: 21.90)
      productQuantity: 1, // Quantidade do produto comprado (ex: 5)
      productUnit: "kg", // Unidade do produto comprado (ex: 'kg')
      usedQuantity: 0, // Quantidade usada na receita (ex: 200)
      usedUnit: "g", // Unidade usada na receita (ex: 'g')
      total: 0, // Custo final do material para a receita
    };

    this.materials.push(material);
    this.renderMaterials();
    this.updateCalculations();
  }

  removeMaterial(id) {
    this.materials = this.materials.filter((m) => m.id !== id);
    this.renderMaterials();
    this.updateCalculations();
  }

  updateMaterial(id, field, value) {
    const material = this.materials.find((m) => m.id === id);
    if (material) {
      if (field === "name" || field.includes("Unit")) {
        material[field] = value;
      } else {
        material[field] = Number.parseFloat(value) || 0;
      }

      // Recalcula o custo do material sempre que um campo relevante é alterado
      material.total = this.calculateMaterialCost(material);

      this.renderMaterials(); // Re-renderiza para atualizar o campo "Custo"
      this.updateCalculations();
    }
  }

  calculateMaterialCost(material) {
    const { productPrice, productQuantity, productUnit, usedQuantity, usedUnit } = material;

    if (productPrice <= 0 || productQuantity <= 0 || usedQuantity <= 0) {
      return 0;
    }

    const productConversion = this.getConversionFactor(productUnit);
    const usedConversion = this.getConversionFactor(usedUnit);
    
    // Calcula o valor total do produto na sua unidade base (g ou ml)
    const totalBaseProductQuantity = productQuantity * productConversion;
    const pricePerBaseUnit = productPrice / totalBaseProductQuantity;

    // Calcula o custo com base na quantidade usada e sua unidade base
    const totalBaseUsedQuantity = usedQuantity * usedConversion;
    
    // Verifica se as unidades são compatíveis (peso com peso, volume com volume, unidade com unidade)
    const isWeight = ['kg', 'g'].includes(productUnit) && ['kg', 'g'].includes(usedUnit);
    const isVolume = ['l', 'ml'].includes(productUnit) && ['l', 'ml'].includes(usedUnit);
    const isUnit = productUnit === 'un' && usedUnit === 'un';

    if (isWeight || isVolume || isUnit) {
        return pricePerBaseUnit * totalBaseUsedQuantity;
    }

    // Retorna 0 se as unidades forem incompatíveis (ex: kg e ml)
    return 0;
  }

  renderMaterials() {
    const container = document.getElementById("materials-list");

    if (this.materials.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum material adicionado</p>';
      return;
    }

    const unitOptions = `
        <option value="kg">Quilo (kg)</option>
        <option value="g">Grama (g)</option>
        <option value="l">Litro (l)</option>
        <option value="ml">Mililitro (ml)</option>
        <option value="un">Unidade (un)</option>
    `;

    container.innerHTML = this.materials
      .map(
        (material) => `
            <div class="material-item">
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label>Material</label>
                    <input type="text" value="${material.name}" 
                           onchange="pricingSystem.updateMaterial('${material.id}', 'name', this.value)"
                           placeholder="Ex: Arroz">
                </div>
                <div class="form-group">
                    <label>Preço Total Prod.</label>
                    <input type="number" value="${material.productPrice}" min="0" step="0.01"
                           onchange="pricingSystem.updateMaterial('${material.id}', 'productPrice', this.value)"
                           placeholder="Ex: 21.90">
                </div>
                <div class="form-group">
                    <label>Qtd Total Prod.</label>
                    <input type="number" value="${material.productQuantity}" min="0" step="0.01"
                           onchange="pricingSystem.updateMaterial('${material.id}', 'productQuantity', this.value)"
                           placeholder="Ex: 5">
                </div>
                <div class="form-group">
                    <label>Unidade Prod.</label>
                    <select onchange="pricingSystem.updateMaterial('${material.id}', 'productUnit', this.value)">
                        ${unitOptions.replace(`value="${material.productUnit}"`, `value="${material.productUnit}" selected`)}
                    </select>
                </div>
                 <div class="form-group">
                    <label>Qtd Usada</label>
                    <input type="number" value="${material.usedQuantity}" min="0" step="0.01"
                           onchange="pricingSystem.updateMaterial('${material.id}', 'usedQuantity', this.value)"
                           placeholder="Ex: 200">
                </div>
                <div class="form-group">
                    <label>Unidade Usada</label>
                    <select onchange="pricingSystem.updateMaterial('${material.id}', 'usedUnit', this.value)">
                         ${unitOptions.replace(`value="${material.usedUnit}"`, `value="${material.usedUnit}" selected`)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Custo</label>
                    <input type="text" value="R$ ${material.total.toFixed(2)}" readonly style="background-color: var(--bg-tertiary);">
                </div>
                <button class="btn btn-danger" onclick="pricingSystem.removeMaterial('${material.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `,
      )
      .join("");
  }


  // Calculations
  updateCalculations() {
    const hours = Number.parseFloat(document.getElementById("horas").value) || 0;
    const hourlyRate = Number.parseFloat(document.getElementById("valor-hora").value) || 0;
    const profitMargin = Number.parseFloat(document.getElementById("margem-lucro").value) || 0;
    const taxes = Number.parseFloat(document.getElementById("impostos").value) || 0;
    const fixedCosts = Number.parseFloat(document.getElementById("despesas-fixas").value) || 0;

    const materialsCost = this.materials.reduce((sum, m) => sum + m.total, 0);
    const laborCost = hours * hourlyRate;
    const totalCost = materialsCost + laborCost + fixedCosts;

    const profitValue = totalCost * (profitMargin / 100);
    const subtotal = totalCost + profitValue;
    const taxValue = subtotal * (taxes / 100);
    const finalPrice = subtotal + taxValue;

    // Update display
    document.getElementById("total-materiais").textContent = `R$ ${materialsCost.toFixed(2)}`;
    document.getElementById("total-mao-obra").textContent = `R$ ${laborCost.toFixed(2)}`;
    document.getElementById("total-despesas").textContent = `R$ ${fixedCosts.toFixed(2)}`;
    document.getElementById("custo-total").textContent = `R$ ${totalCost.toFixed(2)}`;
    document.getElementById("valor-lucro").textContent = `R$ ${profitValue.toFixed(2)}`;
    document.getElementById("valor-impostos").textContent = `R$ ${taxValue.toFixed(2)}`;
    document.getElementById("preco-final").textContent = `R$ ${finalPrice.toFixed(2)}`;

    return {
      materialsCost,
      laborCost,
      fixedCosts,
      totalCost,
      profitValue,
      taxValue,
      finalPrice,
    };
  }

  // Budget Management
saveBudget() {
  const client = document.getElementById("cliente").value.trim();
  const description = document.getElementById("descricao").value.trim();
  const category = document.getElementById("categoria").value;

  if (!client || !description) {
    this.showToast("Preencha pelo menos o cliente e a descrição do trabalho", "error");
    return;
  }

  // Se estiver editando um orçamento existente, remove o antigo antes de salvar
  if (this.editingId) {
    const existingIndex = this.budgets.findIndex(b => b.id === this.editingId);
    if (existingIndex !== -1) {
      this.budgets.splice(existingIndex, 1);
    }
  }

  const calculations = this.updateCalculations();
  const budget = {
    id: this.editingId || Date.now().toString(), // Mantém o ID original se for edição
    client,
    description,
    category,
    rendimento: document.getElementById("rendimento").value.trim(),
    materials: JSON.parse(JSON.stringify(this.materials)), // Deep copy dos materiais
    hours: Number.parseFloat(document.getElementById("horas").value) || 0,
    hourlyRate: Number.parseFloat(document.getElementById("valor-hora").value) || 0,
    profitMargin: Number.parseFloat(document.getElementById("margem-lucro").value) || 0,
    taxes: Number.parseFloat(document.getElementById("impostos").value) || 0,
    fixedCosts: Number.parseFloat(document.getElementById("despesas-fixas").value) || 0,
    totalCost: calculations.totalCost,
    finalPrice: calculations.finalPrice,
    date: new Date().toISOString(),
  };

  this.budgets.push(budget);
  this.saveBudgets();
  this.showToast(this.editingId ? "Orçamento atualizado com sucesso!" : "Orçamento salvo com sucesso!", "success");

  // Reseta o modo edição
  this.editingId = null;
  const saveBtn = document.getElementById("save-budget");
  saveBtn.textContent = "Salvar Orçamento";
  saveBtn.classList.remove("btn-warning");
  saveBtn.classList.add("btn-success");

  this.clearForm();
  this.renderBudgetsList();
  this.updateReports();
}

  clearForm() {
    document.getElementById("cliente").value = "";
    document.getElementById("descricao").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("horas").value = "0";
    
    // Reseta para valores padrão das configurações, se existirem
    const defaultHourlyRate = this.settings.defaults?.hourlyRate || "0";
    const defaultFixedCosts = this.settings.defaults?.fixedCosts || "0";
    const defaultProfitMargin = this.settings.defaults?.profitMargin || "30";
    const defaultTaxes = this.settings.defaults?.taxes || "8";
    
    document.getElementById("valor-hora").value = defaultHourlyRate;
    document.getElementById("despesas-fixas").value = defaultFixedCosts;
    document.getElementById("margem-lucro").value = defaultProfitMargin;
    document.getElementById("impostos").value = defaultTaxes;
    
    this.materials = [];
    this.renderMaterials();
    this.updateCalculations();
  }

  deleteBudget(id) {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      this.budgets = this.budgets.filter((b) => b.id !== id);
      this.saveBudgets();
      this.renderBudgetsList();
      this.updateReports();
      this.showToast("Orçamento excluído com sucesso", "success");
    }
  }

  viewBudgetDetails(id) {
    const budget = this.budgets.find((b) => b.id === id);
    if (!budget) return;

    const modal = document.getElementById("budget-modal");
    const details = document.getElementById("budget-details");

    details.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                
            <p><strong>Rendimento:</strong> ${budget.rendimento || "Não informado"}</p>

                  <div>
                    <h4 style="margin-bottom: 1rem;">Informações Gerais</h4>
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <p><strong>Cliente:</strong> ${budget.client}</p>
                        <p><strong>Categoria:</strong> ${budget.category}</p>
                        <p><strong>Data:</strong> ${new Date(budget.date).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Descrição:</strong> ${budget.description}</p>
                    </div>
                </div>
                <div>
                    <h4 style="margin-bottom: 1rem;">Valores</h4>
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <p><strong>Horas:</strong> ${budget.hours}h</p>
                        <p><strong>Valor/Hora:</strong> R$ ${budget.hourlyRate.toFixed(2)}</p>
                        <p><strong>Margem de Lucro:</strong> ${budget.profitMargin}%</p>
                        <p><strong>Impostos:</strong> ${budget.taxes}%</p>
                        <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                            <p><strong>Custo Total:</strong> R$ ${budget.totalCost.toFixed(2)}</p>
                            <p style="color: var(--success);"><strong>Preço Final:</strong> R$ ${budget.finalPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
            ${
              budget.materials && budget.materials.length > 0
                ? `
                <div>
                    <h4 style="margin-bottom: 1rem;">Materiais</h4>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="text-align: left; padding: 0.5rem;">Material</th>
                                    <th style="text-align: right; padding: 0.5rem;">Qtd Usada</th>
                                    <th style="text-align: right; padding: 0.5rem;">Custo</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${budget.materials
                                  .map(
                                    (material) => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 0.5rem;">${material.name}</td>
                                        <td style="text-align: right; padding: 0.5rem;">${material.usedQuantity} ${material.usedUnit}</td>
                                        <td style="text-align: right; padding: 0.5rem;">R$ ${material.total.toFixed(2)}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `
                : ""
            }
        `;

    modal.classList.add("active");
  }

  closeModal() {
    document.getElementById("budget-modal").classList.remove("active");
  }

  renderBudgetsList(budgets = this.budgets) {
    const container = document.getElementById("budgets-list");

    if (budgets.length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum orçamento encontrado</p>';
      return;
    }

    container.innerHTML = budgets
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordena por data mais recente
      .map(
        (budget) => `
            <div class="budget-item">
                <div class="budget-header">
                    <div class="budget-info">
                        <h4>${budget.client}</h4>
                        <span class="budget-category">${budget.category}</span>
                    </div>
                    <div class="budget-actions">
                        <button class="btn btn-secondary" onclick="pricingSystem.viewBudgetDetails('${budget.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-primary" onclick="pricingSystem.editBudget('${budget.id}')">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-danger" onclick="pricingSystem.deleteBudget('${budget.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="budget-description">${budget.description}</p>
                <div class="budget-details">
                    <span>Data: ${new Date(budget.date).toLocaleDateString("pt-BR")}</span>
                    <span>Custo: R$ ${budget.totalCost.toFixed(2)}</span>
                    <span style="color: var(--success); font-weight: 600;">Preço: R$ ${budget.finalPrice.toFixed(2)}</span>
                </div>
            </div>
        `,
      )
      .join("");
  }

  searchBudgets(query) {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = this.budgets.filter(
      (budget) =>
        budget.client.toLowerCase().includes(lowerCaseQuery) ||
        budget.description.toLowerCase().includes(lowerCaseQuery) ||
        budget.category.toLowerCase().includes(lowerCaseQuery),
    );
    this.renderBudgetsList(filtered);
  }

  exportCSV() {
    if (this.budgets.length === 0) {
        this.showToast("Nenhum orçamento para exportar", "warning");
        return;
    }
    const headers = ["Cliente", "Descrição", "Categoria", "Custo Total", "Preço Final", "Data"];
    const rows = this.budgets.map((budget) => [
      `"${budget.client}"`,
      `"${budget.description}"`,
      `"${budget.category}"`,
      budget.totalCost.toFixed(2),
      budget.finalPrice.toFixed(2),
      new Date(budget.date).toLocaleDateString("pt-BR"),
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    this.downloadFile(csvContent, "orcamentos.csv", "text/csv;charset=utf-8;");
    this.showToast("CSV exportado com sucesso!", "success");
  }

  // Reports
  updateReports(period = "todos") {
    const filteredBudgets = this.filterBudgetsByPeriod(period);

    const totalBudgets = filteredBudgets.length;
    const totalValue = filteredBudgets.reduce((sum, b) => sum + b.finalPrice, 0);
    const totalCost = filteredBudgets.reduce((sum, b) => sum + b.totalCost, 0);
    const totalProfit = totalValue - totalCost;
    const averageTicket = totalBudgets > 0 ? totalValue / totalBudgets : 0;

    // Update stats display
    document.getElementById("total-orcamentos").textContent = totalBudgets;
    document.getElementById("valor-total").textContent = `R$ ${totalValue.toFixed(2)}`;
    document.getElementById("lucro-total").textContent = `R$ ${totalProfit.toFixed(2)}`;
    document.getElementById("ticket-medio").textContent = `R$ ${averageTicket.toFixed(2)}`;

    // Update categories chart
    this.updateCategoriesChart(filteredBudgets);

    // Update top clients
    this.updateTopClients(filteredBudgets);
  }

  filterBudgetsByPeriod(period) {
    if (period === "todos") return this.budgets;

    const days = Number.parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.budgets.filter((budget) => new Date(budget.date) >= cutoffDate);
  }

  updateCategoriesChart(budgets) {
    const categories = {};

    budgets.forEach((budget) => {
        if (!budget.category) return; // Pula orçamentos sem categoria
        if (!categories[budget.category]) {
            categories[budget.category] = { count: 0, value: 0 };
        }
        categories[budget.category].count++;
        categories[budget.category].value += budget.finalPrice;
    });

    const container = document.getElementById("categories-chart");

    if (Object.keys(categories).length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum dado disponível</p>';
      return;
    }

    const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b.value - a.value);

    container.innerHTML = sortedCategories
      .map(
        ([category, data]) => `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-badge">${category}</span>
                    <span class="category-count">${data.count} orçamento${data.count !== 1 ? "s" : ""}</span>
                </div>
                <span class="category-value">R$ ${data.value.toFixed(2)}</span>
            </div>
        `,
      )
      .join("");
  }

  updateTopClients(budgets) {
    const clients = {};

    budgets.forEach((budget) => {
      if (!clients[budget.client]) {
        clients[budget.client] = { count: 0, value: 0 };
      }
      clients[budget.client].count++;
      clients[budget.client].value += budget.finalPrice;
    });

    const container = document.getElementById("top-clients");

    if (Object.keys(clients).length === 0) {
      container.innerHTML = '<p class="empty-state">Nenhum dado disponível</p>';
      return;
    }

    const sortedClients = Object.entries(clients)
      .sort(([, a], [, b]) => b.value - a.value)
      .slice(0, 5);

    container.innerHTML = sortedClients
      .map(
        ([client, data], index) => `
            <div class="client-item">
                <div class="client-info">
                    <span class="client-rank ${index === 0 ? "first" : ""}">${index + 1}</span>
                    <div class="client-details">
                        <h5>${client}</h5>
                        <p>${data.count} orçamento${data.count !== 1 ? "s" : ""}</p>
                    </div>
                </div>
                <span class="client-value">R$ ${data.value.toFixed(2)}</span>
            </div>
        `,
      )
      .join("");
  }

  // Settings Management
  loadDefaultSettings() {
    if (this.settings.defaults) {
      document.getElementById("margem-lucro").value = this.settings.defaults.profitMargin || 30;
      document.getElementById("impostos").value = this.settings.defaults.taxes || 8;
      document.getElementById("valor-hora").value = this.settings.defaults.hourlyRate || 50;
      document.getElementById("despesas-fixas").value = this.settings.defaults.fixedCosts || 0;
    }

    if (this.settings.company) {
      document.getElementById("empresa-nome").value = this.settings.company.name || "";
      document.getElementById("empresa-cnpj").value = this.settings.company.cnpj || "";
      document.getElementById("empresa-endereco").value = this.settings.company.address || "";
      document.getElementById("empresa-telefone").value = this.settings.company.phone || "";
      document.getElementById("empresa-email").value = this.settings.company.email || "";
    }

    // Carrega os valores padrão na própria aba de configurações
    document.getElementById("config-margem").value = this.settings.defaults?.profitMargin || 30;
    document.getElementById("config-impostos").value = this.settings.defaults?.taxes || 8;
    document.getElementById("config-valor-hora").value = this.settings.defaults?.hourlyRate || 50;
    document.getElementById("config-despesas").value = this.settings.defaults?.fixedCosts || 0;
    
    this.updateCalculations();
  }

  saveSettings() {
    const settings = {
      company: {
        name: document.getElementById("empresa-nome").value,
        cnpj: document.getElementById("empresa-cnpj").value,
        address: document.getElementById("empresa-endereco").value,
        phone: document.getElementById("empresa-telefone").value,
        email: document.getElementById("empresa-email").value,
      },
      defaults: {
        profitMargin: Number.parseFloat(document.getElementById("config-margem").value) || 30,
        taxes: Number.parseFloat(document.getElementById("config-impostos").value) || 8,
        hourlyRate: Number.parseFloat(document.getElementById("config-valor-hora").value) || 50,
        fixedCosts: Number.parseFloat(document.getElementById("config-despesas").value) || 0,
      },
    };

    this.settings = settings;
    localStorage.setItem("pricingSettings", JSON.stringify(settings));
    this.showToast("Configurações salvas com sucesso!", "success");
    this.loadDefaultSettings(); // Recarrega os padrões no formulário principal
  }

  exportData() {
    const data = {
      budgets: this.budgets,
      settings: this.settings,
      exportDate: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const fileName = `backup-precificacao-${new Date().toISOString().split("T")[0]}.json`;

    this.downloadFile(jsonContent, fileName, "application/json");
    this.showToast("Backup criado com sucesso!", "success");
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (confirm("Importar dados irá sobrescrever os dados atuais. Deseja continuar?")) {
            if (Array.isArray(data.budgets)) {
                this.budgets = data.budgets;
                this.saveBudgets();
                this.renderBudgetsList();
            }

            if (data.settings) {
                this.settings = data.settings;
                localStorage.setItem("pricingSettings", JSON.stringify(data.settings));
                this.loadDefaultSettings();
            }

            this.updateReports();
            this.showToast("Dados importados com sucesso!", "success");
        }
      } catch (error) {
        console.error("Erro ao importar dados:", error);
        this.showToast("Arquivo inválido ou corrompido", "error");
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  }

  clearAllData() {
    if (confirm("TEM CERTEZA?\nEsta ação apagará TODOS os orçamentos e configurações salvos. Esta ação não pode ser desfeita.")) {
      if(confirm("Confirmação final: Deseja realmente apagar TODOS os dados?")){
        localStorage.removeItem("pricingBudgets");
        localStorage.removeItem("pricingSettings");

        this.budgets = [];
        this.settings = {}; // Reseta para um objeto vazio
        this.materials = [];

        this.renderBudgetsList();
        this.renderMaterials();
        
        // Limpa formulários de configurações e calculadora
        document.querySelectorAll("#configuracoes input, #configuracoes textarea").forEach((input) => {
            input.value = "";
        });
        this.clearForm(); // Limpa e reseta o formulário principal
        this.loadDefaultSettings(); // Carrega as configurações padrão (vazias agora)
        this.updateReports();

        this.showToast("Todos os dados foram removidos", "success");
      }
    }
  }

  // Storage Management
  loadBudgets() {
    const saved = localStorage.getItem("pricingBudgets");
    try {
        return saved ? JSON.parse(saved) : [];
    } catch(e){
        console.error("Erro ao carregar orçamentos:", e);
        return [];
    }
  }

  saveBudgets() {
    localStorage.setItem("pricingBudgets", JSON.stringify(this.budgets));
  }

  loadSettings() {
    const saved = localStorage.getItem("pricingSettings");
    const defaultSettings = {
          company: {},
          defaults: {
            profitMargin: 30,
            taxes: 8,
            hourlyRate: 50,
            fixedCosts: 0,
          },
        };
    try {
        return saved ? JSON.parse(saved) : defaultSettings;
    } catch(e) {
        console.error("Erro ao carregar configurações:", e);
        return defaultSettings;
    }
  }

  // Utility Functions
  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon =
      type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle";

    toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease forwards';
        toast.addEventListener('animationend', () => {
            if(toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }, 3000);
  }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Export for global access from HTML (onclick) and Electron's main process
    window.pricingSystem = new PricingSystem();

    // Prevent form submission on Enter key, except for textareas
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
            e.preventDefault();
        }
    });
});