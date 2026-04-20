document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('projectionChart').getContext('2d');

    // Datos base (puedes reemplazarlos con fetch al JSON si lo prefieres)
    const labels = ['Electricitat', 'Aigua', 'Oficina', 'Neteja'];
    const dataHistoric = [12171, 2597, 752, 1060];
    const dataProjectio = [13968, 2980, 792, 1247];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Despesa Històrica (€)',
                    data: dataHistoric,
                    backgroundColor: 'rgba(148, 163, 184, 0.2)', // Gris de tu --text-muted
                    borderColor: 'rgba(148, 163, 184, 0.5)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Previsió Pròxim Any (€)',
                    data: dataProjectio,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)', // Verde Esmeralda de tu CSS
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#f1f5f9', font: { size: 13, family: 'Segoe UI' } }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.raw.toLocaleString('ca-ES') + ' €';
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) { return value.toLocaleString('ca-ES') + ' €'; }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { weight: 'bold' } }
                }
            }
        }
    });
});