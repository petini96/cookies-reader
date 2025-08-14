function getStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s === 'success' || s === 'ok') {
        return 'log-type-success';
    }
    if (s === 'fail' || s === 'error') {
        return 'log-type-error';
    }
    return 'log-type-info';
}

async function displayLogs() {
    const logsContent = document.getElementById('logs-content');
    if (!logsContent) return;

    const { logs = [] } = await chrome.storage.local.get('logs');

    logsContent.innerHTML = '';

    if (logs.length === 0) {
        logsContent.innerHTML = '<div class="log-item">Nenhum log encontrado.</div>';
        return;
    }

    for (const log of logs) {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';

        const timestamp = new Date(log.timestamp).toLocaleString('pt-BR');
        const statusClass = getStatusClass(log.status);

        logItem.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-type ${statusClass}">${log.status.toUpperCase()}</span>
            <span class="log-message">${log.message}</span>
        `;

        logsContent.appendChild(logItem);
    }
}

async function clearLogs() {
    await chrome.storage.local.set({
        logs: [],
        lastIntegrationMessage: 'Nenhuma integração executada ainda.'
    });
    await displayLogs();
}

document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.getElementById('clear-logs');
    if (clearButton) {
        clearButton.addEventListener('click', clearLogs);
    }
    displayLogs();
});

export {};