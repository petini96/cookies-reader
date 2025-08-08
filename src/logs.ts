function formatLogTimestamp(isoString: string): string {
    return new Date(isoString).toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

async function displayLogs() {
    const logsContent = document.getElementById('logs-content');
    if (!logsContent) return;

    const { logs = [] } = await chrome.storage.local.get('logs');
    
    if (logs.length === 0) {
        logsContent.innerHTML = '<div class="log-item">Nenhum log encontrado.</div>';
        return;
    }

    logsContent.innerHTML = logs.map((log: any) => `
        <div class="log-item log-type-${log.type.toLowerCase()}">
            <span class="log-timestamp">${formatLogTimestamp(log.timestamp)}</span>
            <span class="log-type">[${log.type}]</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clear-logs');
    const refreshBtn = document.getElementById('refresh-logs');

    clearBtn?.addEventListener('click', async () => {
        await chrome.storage.local.set({ logs: [] });
        displayLogs();
    });

    refreshBtn?.addEventListener('click', displayLogs);

    displayLogs();
});

export {};