let totalPercent = 0;
let totalEur = 0;
let countActions = 0;
let countEco = 0;

fetch('accions.json')
    .then(response => response.json())
    .then(data => renderActions(data.categories))
    .catch(error => console.error("Error carregant les accions:", error));

function renderActions(categories) {
    const container = document.getElementById('actions-container');
    if (!container) return;
    
    categories.forEach(cat => {
        // Tarjeta principal (Categoría) usando CSS custom
        let catHTML = `
            <div class="glass-card">
                <div class="category-header">
                    <span style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px;">${cat.icona}</span>
                    ${cat.titol}
                </div>
        `;
        
        // Iteramos las acciones
        cat.accions.forEach(accio => {
            catHTML += `
                <div class="action-item">
                    <input type="checkbox" id="${accio.id}" 
                           data-percent="${accio.estalvi_percent}" 
                           data-eur="${accio.estalvi_eur}" 
                           data-eco="${accio.circular}" 
                           onchange="updateCalculator(this)">
                    
                    <div class="action-details">
                        <h4><label for="${accio.id}">${accio.titol}</label></h4>
                        <p>${accio.descripcio}</p>
                        
                        <div class="badges-container">
                            <span class="badge badge-blue">-${accio.estalvi_percent}%</span>
                            <span class="badge badge-amber">📉 ${accio.estalvi_eur} €</span>
                            ${accio.circular ? `<span class="badge badge-emerald">♻️ Eco Circular</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        catHTML += `</div>`;
        container.innerHTML += catHTML;
    });
}

function updateCalculator(checkbox) {
    const percent = parseFloat(checkbox.getAttribute('data-percent'));
    const eur = parseFloat(checkbox.getAttribute('data-eur'));
    const isEco = checkbox.getAttribute('data-eco') === 'true';

    const globalPercentWeight = percent / 4; 

    if (checkbox.checked) {
        totalPercent += globalPercentWeight;
        totalEur += eur;
        countActions++;
        if (isEco) countEco++;
    } else {
        totalPercent -= globalPercentWeight;
        totalEur -= eur;
        countActions--;
        if (isEco) countEco--;
    }

    let displayPercent = totalPercent > 30 ? 30 : totalPercent;
    let percentatgeEco = countActions > 0 ? Math.round((countEco / countActions) * 100) : 0;
    let eurFormat = totalEur.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    let percentFormat = `-${displayPercent.toFixed(1)}%`;

    // Actualizar TARJETAS SUPERIORES
    document.getElementById('top-reduccio').innerText = percentFormat;
    document.getElementById('top-mesures').innerText = countActions;
    document.getElementById('top-eco').innerText = `${percentatgeEco}%`;

    // Actualizar BARRA FLOTANTE
    document.getElementById('bot-mesures').innerText = countActions;
    document.getElementById('bot-reduccio').innerText = percentFormat;
    document.getElementById('bot-estalvi').innerText = eurFormat;
    
    const botEco = document.getElementById('bot-eco');
    if(botEco) botEco.innerText = `${percentatgeEco}%`;
}