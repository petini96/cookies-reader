function formatLogTimestamp(isoString: string): string {
    return new Date(isoString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

async function displayLogs() {
    const logsContent = document.getElementById('logs-content');
    if (!logsContent) return;

    const { logs = [] } = await chrome.storage.local.get('logs');
    
    if (logs.length === 0) {
        logsContent.innerHTML = '<div class="log-item">Nenhum log encontrado. Inicie uma captura.</div>';
        return;
    }

    logsContent.innerHTML = logs.map((log: any) => `
        <div class="log-item log-type-${log.type.toLowerCase()}">
            <span class="log-timestamp">${formatLogTimestamp(log.timestamp)}</span>
            <span class="log-type">[${log.type}]</span>
            <span class="log-message">${log.message}</span>
        </div>
    `).join('');

    // Rola para o log mais recente (o primeiro item)
    logsContent.scrollTop = 0; 
}

// --- LÓGICA DE ATUALIZAÇÃO EM TEMPO REAL ---

// Ouve por mudanças no chrome.storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    // Verifica se a mudança foi nos 'logs' e no armazenamento 'local'
    if (namespace === 'local' && changes.logs) {
        console.log('Logs atualizados, redesenhando a tela.');
        displayLogs(); // Chama a função para redesenhar os logs
    }
});

// Listener para o botão de limpar logs
document.getElementById('clear-logs')?.addEventListener('click', async () => {
    await chrome.storage.local.set({ logs: [] });
    // A linha acima vai disparar o 'onChanged', então displayLogs() será chamado automaticamente.
});

// Listener para o botão de atualizar (pode ser mantido por segurança ou removido do HTML)
document.getElementById('refresh-logs')?.addEventListener('click', displayLogs);

// Carrega os logs quando a página abre pela primeira vez
document.addEventListener('DOMContentLoaded', displayLogs);

export {};