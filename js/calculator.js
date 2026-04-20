/**
 * Reduction.js — Lògica de la Calculadora de reducció amb sumatori a temps real.
 */

(function () {
  'use strict';

  let rawData = null;
  let indicadors = null;
  let globalBaseCost = 0;
  let costPerCategoria = {};
  let selectedActions = new Set();

  const reductionActions = [
    { id: 'el1', cat: 'electricitat', title: 'Sensors de presència en banys i passadissos', percent: 12, icon: '💡' },
    { id: 'el2', cat: 'electricitat', title: 'Substitució integral per lluminàries LED', percent: 25, icon: '🔦' },
    { id: 'el3', cat: 'electricitat', title: 'Apagat automàtic d\'equips i servidors (Nit)', percent: 10, icon: '🖥️' },
    { id: 'el4', cat: 'electricitat', title: 'Ajust temperatura climatització (±1ºC)', percent: 15, icon: '🌡️' },
    { id: 'ai1', cat: 'aigua', title: 'Instal·lació d\'airejadors a les aixetes', percent: 30, icon: '🚰' },
    { id: 'ai2', cat: 'aigua', title: 'Doble polsador a totes les cisternes', percent: 20, icon: '🚽' },
    { id: 'ai3', cat: 'aigua', title: 'Aprofitament d\'aigua de pluja pel reg', percent: 15, icon: '🌧️' },
    { id: 'pa1', cat: 'paper', title: 'Política "Paper Zero" en tràmits administratius', percent: 45, icon: '📄' },
    { id: 'pa2', cat: 'paper', title: 'Impressió a doble cara i b/n per defecte', percent: 20, icon: '🖨️' },
    { id: 'ne1', cat: 'neteja', title: 'Compra de productes a granel i concentrats', percent: 20, icon: '🧴' },
    { id: 'ne2', cat: 'neteja', title: 'Implementació de dosificadors automàtics', percent: 15, icon: '💧' }
  ];

  document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();

    // Actualitza anys dinàmics a l'HTML
    if (window.Calculator && window.Calculator.updateDynamicYearsText) {
      window.Calculator.updateDynamicYearsText();
    }

    rawData = await window.Calculator.carregarDades();

    if (!rawData) {
      document.getElementById('calc-grid').innerHTML = `
        <div class="error-container" style="grid-column: 1/-1;">
          <div class="error-icon">⚠️</div>
          <h2>Error carregant les dades</h2>
          <p>No s'ha pogut carregar el fitxer de dades JSON per calcular l'estalvi.</p>
        </div>`;
      return;
    }

    indicadors = window.Calculator.processarTotsIndicadors(rawData);

    // Agrupar els costos totals del JSON en categories per fer els càlculs
    Object.keys(indicadors).forEach(key => {
      const ind = indicadors[key];
      let cat = ind.nom.toLowerCase().includes('elèctric') ? 'electricitat' :
                ind.nom.toLowerCase().includes('aigua') ? 'aigua' :
                ind.nom.toLowerCase().includes('paper') ? 'paper' : 'neteja';

      let cost = 0;
      ind.mensual.forEach(m => cost += m.cost);
      costPerCategoria[cat] = (costPerCategoria[cat] || 0) + cost;
      globalBaseCost += cost;
    });

    renderCentreName();
    renderCalculatorGrid();
    updateCalculatorSummary(); // Init a zero
  });

  function setupNavigation() {
    const hamburger = document.querySelector('.nav-hamburger');
    const links = document.querySelector('.nav-links');
    if (hamburger && links) {
      hamburger.addEventListener('click', () => links.classList.toggle('open'));
    }
  }

  function renderCentreName() {
    const el = document.getElementById('centre-name');
    if (el && rawData.centre) el.textContent = rawData.centre;
  }

  function renderCalculatorGrid() {
    const grid = document.getElementById('calc-grid');
    grid.innerHTML = reductionActions.map(action => {
      const costCat = costPerCategoria[action.cat] || 0;
      const estalviEuro = costCat * (action.percent / 100);

      return `
        <div class="calc-card" id="card-${action.id}" onclick="window.toggleAction('${action.id}')">
          <input type="checkbox" id="chk-${action.id}">
          <div class="calc-details">
            <h4>${action.icon} ${action.title}</h4>
            <span class="calc-badge">-${action.percent}% en ${action.cat}</span>
            <span class="calc-saving">Aporta +${window.Calculator.formatCurrency(estalviEuro)} d'estalvi anual</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Funció global per gestionar els clics a les targetes
  window.toggleAction = function(actionId) {
    const card = document.getElementById(`card-${actionId}`);
    const chk = document.getElementById(`chk-${actionId}`);

    if (selectedActions.has(actionId)) {
      selectedActions.delete(actionId);
      card.classList.remove('active');
      chk.checked = false;
    } else {
      selectedActions.add(actionId);
      card.classList.add('active');
      chk.checked = true;
    }
    updateCalculatorSummary();
  };

  function updateCalculatorSummary() {
    let totalEstalviEuros = 0;

    // Calcular suma en euros basant-se en els % de cada categoria
    selectedActions.forEach(actionId => {
      const action = reductionActions.find(a => a.id === actionId);
      const costCat = costPerCategoria[action.cat] || 0;
      totalEstalviEuros += costCat * (action.percent / 100);
    });

    // Percentatge sobre el pressupost base global
    const percentatgeGlobal = globalBaseCost > 0 ? (totalEstalviEuros / globalBaseCost) * 100 : 0;

    // Actualitzar variables a la barra inferior (Sticky Footer)
    document.getElementById('sum-count').textContent = selectedActions.size;
    document.getElementById('sum-percent').textContent = `-${percentatgeGlobal.toFixed(1)}%`;
    document.getElementById('sum-savings').textContent = window.Calculator.formatCurrency(totalEstalviEuros);

    // Actualitzar les estadístiques de la secció inferior
    const globalTargetEl = document.getElementById('global-reduction-target');
    const countEl = document.getElementById('active-actions-count');
    if (globalTargetEl) globalTargetEl.textContent = `-${percentatgeGlobal.toFixed(1)}%`;
    if (countEl) countEl.textContent = selectedActions.size;
  }

})();