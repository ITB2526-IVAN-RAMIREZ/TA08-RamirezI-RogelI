let fullData = null;
let chartInstance = null;

// FÓRMULES DE CÀLCUL I ESTIMACIONS
const IPC_ESTIMAT = 0.032; // +3.2% d'inflació en preus
const VARIACIO_HISTORICA_CONSUM = 0.015; // +1.5% d'augment en el consum físic

// Costos unitaris estimats per traduir € a mètriques físiques o a l'inrevés
const PREU_AIGUA_M3 = 2.10; // € per m3
const PREU_ELEC_KWH = 0.18; // € per kWh
const PREU_PAQUET_FOLIS = 5.00; // € aproximat per paquet de paper
const PREU_KG_NETEJA = 3.50; // € aproximat per Kg o Litre de producte neteja
const PREU_INTERVENCIO = 150.00; // € aproximat per intervenció de manteniment

async function fetchData() {
    try {
        // S'utilitza el nom d'arxiu indicat: dades.json
        const response = await fetch('dades.json');
        if (!response.ok) throw new Error('Fitxer dades.json no detectat al directori');
        fullData = await response.json();
        renderApp();
    } catch (error) {
        console.error(error);
        document.getElementById('app-content').innerHTML = `
            <div class="h-screen flex items-center justify-center p-10 text-center bg-[#0f172a]">
                <div class="max-w-md">
                    <div class="text-6xl mb-6">📂</div>
                    <h1 class="text-2xl font-bold mb-2 text-white">Error de dades</h1>
                    <p class="text-slate-500">No s'ha pogut carregar el fitxer <code class="bg-slate-800 p-1 rounded text-blue-400">dades.json</code>.</p>
                    <p class="text-xs text-slate-600 mt-4">Assegura't que el fitxer JSON està a la mateixa carpeta i que utilitzes un servidor local.</p>
                </div>
            </div>`;
    }
}

function renderApp() {
    if (!fullData) return;

    // Actualitzem els badges visuals
    document.getElementById('badge-ipc').innerText = `IPC Aplicat: ${(IPC_ESTIMAT * 100).toFixed(1)}%`;
    document.getElementById('badge-hist').innerText = `Tendència Consum: +${(VARIACIO_HISTORICA_CONSUM * 100).toFixed(1)}%`;

    document.getElementById('header-titol').innerText = fullData.centre || "Calculadora de Consums";
    document.getElementById('header-periode').innerText = `Període ${fullData.periode || "Curs 24/25"}`;
    document.getElementById('header-font').innerText = fullData.font || "Dades ITB";

    // 1. OBTENIR DADES BASE (Diàries o Mensuals depenent del paràmetre)
    const indResum = fullData.indicadors_resum?.indicadors || [];
    const baseAiguaL_diari = indResum[0]?.valor_base || 0;
    const baseEleckWh_diari = indResum[1]?.valor_base_consum || 0;

    const baseOficinaEUR_mensual = (fullData.consumibles_oficina?.resum?.total_gastat_EUR || 0) / 12;
    const baseNetejaEUR_mensual = (fullData.productes_neteja?.resum?.total_gastat_EUR || 0) / 12;
    const baseMantEUR_mensual = (fullData.manteniment?.resum?.total_gastat_manteniment_EUR || 0) / 12;
    const baseTelecomEUR_mensual = fullData.telecomunicacions?.resum?.cost_mensual_telecomunicacions_EUR || 0;

    const diesAny = 365;
    const mesosAny = 12;

    // Fòrmula d'aplicació globals
    const factorCost = 1 + IPC_ESTIMAT;
    const factorConsum = 1 + VARIACIO_HISTORICA_CONSUM;

    // Funcions de formateig
    const formatEur = (v) => v.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    const formatFisic = (v, isM3) => v.toLocaleString('ca-ES', { maximumFractionDigits: isM3 ? 1 : 0 });

    // 2. CONSTRUIR ESTRUCTURA UNIFICADA (Històric vs Projecció amb Costs i Unitats Físiques)
    const histElecKWh = baseEleckWh_diari * diesAny;
    const histAiguaM3 = (baseAiguaL_diari * diesAny) / 1000;
    const histOficinaEur = baseOficinaEUR_mensual * mesosAny;
    const histNetejaEur = baseNetejaEUR_mensual * mesosAny;
    const histMantEur = baseMantEUR_mensual * mesosAny;

    const evalItems = [
        {
            titol: 'Consum Elèctric', icon: '⚡',
            valPrinHist: histElecKWh, unitPrin: 'kWh', isM3: false,
            valPrinProj: histElecKWh * factorConsum,
            valSecHist: histElecKWh * PREU_ELEC_KWH, unitSec: '€',
            valSecProj: (histElecKWh * factorConsum) * (PREU_ELEC_KWH * factorCost),
            costHist: histElecKWh * PREU_ELEC_KWH,
            costProj: (histElecKWh * factorConsum) * (PREU_ELEC_KWH * factorCost),
            labelF: 'ús i preu'
        },
        {
            titol: 'Consum d\\'Aigua', icon: '💧',
            valPrinHist: histAiguaM3, unitPrin: 'm³', isM3: true,
            valPrinProj: histAiguaM3 * factorConsum,
            valSecHist: histAiguaM3 * PREU_AIGUA_M3, unitSec: '€',
            valSecProj: (histAiguaM3 * factorConsum) * (PREU_AIGUA_M3 * factorCost),
            costHist: histAiguaM3 * PREU_AIGUA_M3,
            costProj: (histAiguaM3 * factorConsum) * (PREU_AIGUA_M3 * factorCost),
            labelF: 'ús i preu'
        },
        {
            titol: 'Material Oficina', icon: '📄',
            valPrinHist: histOficinaEur, unitPrin: '€', isM3: false,
            valPrinProj: (histOficinaEur / PREU_PAQUET_FOLIS * factorConsum) * (PREU_PAQUET_FOLIS * factorCost),
            valSecHist: histOficinaEur / PREU_PAQUET_FOLIS, unitSec: 'paquets',
            valSecProj: (histOficinaEur / PREU_PAQUET_FOLIS) * factorConsum,
            costHist: histOficinaEur,
            costProj: (histOficinaEur / PREU_PAQUET_FOLIS * factorConsum) * (PREU_PAQUET_FOLIS * factorCost),
            labelF: 'desgast i IPC'
        },
        {
            titol: 'Productes Neteja', icon: '🧼',
            valPrinHist: histNetejaEur, unitPrin: '€', isM3: false,
            valPrinProj: (histNetejaEur / PREU_KG_NETEJA * factorConsum) * (PREU_KG_NETEJA * factorCost),
            valSecHist: histNetejaEur / PREU_KG_NETEJA, unitSec: 'kg prod.',
            valSecProj: (histNetejaEur / PREU_KG_NETEJA) * factorConsum,
            costHist: histNetejaEur,
            costProj: (histNetejaEur / PREU_KG_NETEJA * factorConsum) * (PREU_KG_NETEJA * factorCost),
            labelF: 'desgast i IPC'
        },
        {
            titol: 'Manteniment', icon: '🔧',
            valPrinHist: histMantEur, unitPrin: '€', isM3: false,
            valPrinProj: (histMantEur / PREU_INTERVENCIO * factorConsum) * (PREU_INTERVENCIO * factorCost),
            valSecHist: histMantEur / PREU_INTERVENCIO, unitSec: 'intervencions',
            valSecProj: (histMantEur / PREU_INTERVENCIO) * factorConsum,
            costHist: histMantEur,
            costProj: (histMantEur / PREU_INTERVENCIO * factorConsum) * (PREU_INTERVENCIO * factorCost),
            labelF: 'ús i IPC'
        }
    ];

    const renderValPrin = (val, unit, isM3) => unit === '€' ? formatEur(val) : formatFisic(val, isM3);
    const renderValSec = (val, unit) => unit === '€' ? formatEur(val) : formatFisic(val, false);
    const renderUnitTextPrin = (unit) => unit === '€' ? '' : unit;
    const renderUnitTextSec = (unit) => unit === '€' ? '' : unit;

    // Generació de la secció d'avaluació amb la lògica unificada sobre el HTML fosc
    const evalContainer = document.getElementById('evaluacio-container');
    evalContainer.innerHTML = evalItems.map(item => `
        <div class="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/[0.08] transition-colors">
            <div class="flex items-center gap-3 mb-6">
                <span class="text-3xl">${item.icon}</span>
                <h4 class="text-xl font-bold text-white">${item.titol}</h4>
            </div>
            <div class="space-y-6">
                <div class="p-4 bg-slate-900/50 rounded-2xl">
                    <span class="block text-xs uppercase text-slate-500 font-bold mb-2 tracking-wider">Històric (Curs 24/25)</span>
                    <div class="flex items-baseline gap-2">
                        <span class="text-4xl font-black mono text-white">${renderValPrin(item.valPrinHist, item.unitPrin, item.isM3)}</span>
                        <span class="text-sm font-medium text-slate-400">${renderUnitTextPrin(item.unitPrin)}</span>
                    </div>
                    <div class="mt-2 text-xs text-slate-400 bg-black/20 p-2 rounded-lg inline-block">
                        ≈ <span class="font-mono font-bold">${renderValSec(item.valSecHist, item.unitSec)}</span> ${renderUnitTextSec(item.unitSec)}
                    </div>
                </div>
                <div class="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative">
                    <div class="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">
                        + ${item.labelF}
                    </div>
                    <span class="block text-xs uppercase text-emerald-500/60 font-bold mb-2 tracking-wider">Projectat (Curs 25/26)</span>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-black mono text-emerald-400">${renderValPrin(item.valPrinProj, item.unitPrin, item.isM3)}</span>
                        <span class="text-sm font-medium text-emerald-500/60">${renderUnitTextPrin(item.unitPrin)}</span>
                    </div>
                    <div class="mt-2 text-xs text-emerald-600/80 bg-emerald-900/20 p-2 rounded-lg inline-block">
                        ≈ <span class="font-mono font-bold text-emerald-500">${renderValSec(item.valSecProj, item.unitSec)}</span> ${renderUnitTextSec(item.unitSec)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Gràfica comparativa de COSTOS (€)
    renderChart(evalItems);

    // CÀLCULS GLOBALS
    const telecomHist = baseTelecomEUR_mensual * mesosAny;
    const telecomProj = telecomHist * factorCost;

    const costProjectat = evalItems.reduce((acc, item) => acc + item.costProj, 0) + telecomProj;
    const costMillora = costProjectat * 0.7; // Objectiu estalvi 30%
    const estalviNet = costProjectat - costMillora;

    document.getElementById('total-actual').innerText = formatEur(costProjectat);
    document.getElementById('total-millora').innerText = formatEur(costMillora);
    document.getElementById('total-estalvi-valor').innerText = formatEur(estalviNet);

    // Secció Solar i Context
    const s = fullData.consum_electric_solar?.resum_gener_2025;
    if (s) {
        document.getElementById('solar-cobertura').innerText = `${s["cobertura_solar_mitjana_%"]}%`;
        document.getElementById('solar-co2').innerText = `${s.CO2_evitat_total_t}t`;
        document.getElementById('solar-obs').innerText = s.observacions || '';
    }

    document.getElementById('anomalies-list').innerHTML = `
        <div class="flex gap-3 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            <div class="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
            <p class="text-xs text-slate-300"><strong class="text-white">Aigua:</strong> ${fullData.consum_aigua?.resum?.anomalia_detectada || "Cap anomalia registrada"}</p>
        </div>
        <div class="flex gap-3 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <div class="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
            <p class="text-xs text-slate-300"><strong class="text-white">Oficina:</strong> ${fullData.consumibles_oficina?.resum?.observacio || "Sense observacions"}</p>
        </div>
    `;

    document.getElementById('context-text').innerText = `Projecció calculada aplicant un IPC estimat del ${(IPC_ESTIMAT*100).toFixed(1)}% als costos econòmics i una tendència de variació històrica del ${(VARIACIO_HISTORICA_CONSUM*100).toFixed(1)}% al consum físic.`;

    // Plans d'Acció (Extrets del resum si existeixen)
    if(indResum && indResum.length > 0) {
        document.getElementById('plan-details').innerHTML = indResum.map(ind => `
            <div class="p-4 rounded-2xl bg-white/5 border border-white/5">
                <h4 class="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-tighter">${ind.nom}</h4>
                <p class="text-[10px] text-slate-400 leading-tight">${ind.potencial_estalvi || 'Avaluació pendent d\\'optimització.'}</p>
            </div>
        `).join('');
    }
}

function renderChart(items) {
    const ctx = document.getElementById('consumptionChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: items.map(i => i.titol),
            datasets: [
                {
                    label: 'Cost Històric (Curs 24/25)',
                    data: items.map(i => i.costHist),
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    borderRadius: 8,
                },
                {
                    label: 'Cost Projectat (Curs 25/26)',
                    data: items.map(i => i.costProj),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 8,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#f1f5f9' } }
            }
        }
    });
}

window.onload = fetchData;