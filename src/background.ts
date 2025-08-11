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

// Função principal que captura e envia o cookie
async function captureAndSendCookies() {
  await addLog('Iniciando captura...', 'INFO');
  await updateMetric('attempts');
  
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });

  // 1. Pega as configurações
  const { webhookUrl } = await chrome.storage.sync.get(['webhookUrl']);
  if (!webhookUrl) {
    await addLog('URL do webhook não configurada.', 'ERROR');
    await updateMetric('errors');
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    return;
  }

  // 2. Encontra a aba do MTE
  const [tab] = await chrome.tabs.query({ url: "https://imo.mte.gov.br/*" });
  if (!tab || !tab.url) {
    await addLog('Aba do MTE (imo.mte.gov.br) não encontrada.', 'INFO');
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  // 3. Pede o cookie JSESSIONID diretamente pelo nome
  try {
    const jsessionidCookie = await chrome.cookies.get({
      url: tab.url,
      name: 'JSESSIONID'
    });

    // 4. Se não encontrar, encerra a operação com um log
    if (!jsessionidCookie) {
      await addLog(`Cookie JSESSIONID não encontrado para ${tab.url}.`, 'INFO');
      chrome.action.setBadgeText({ text: '' }); // Limpa o badge
      return;
    }
    
    // 5. Prepara o payload APENAS com o JSESSIONID
    const payload = {
      capturedAt: new Date().toISOString(),
      pageUrl: tab.url,
      jsessionid: jsessionidCookie.value 
    };

    // 6. Envia os dados para o webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await addLog(`JSESSIONID enviado com sucesso!`, 'SUCCESS');
      await updateMetric('successes'); // MÉTRICA DE SUCESSO NO LUGAR CERTO
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    } else {
      await addLog(`Falha no envio para ${webhookUrl}: Status ${response.status}`, 'ERROR');
      await updateMetric('errors');
      chrome.action.setBadgeText({ text: 'FAIL' });
      chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    await addLog(`Erro ao processar cookies: ${errorMessage}`, 'ERROR');
    await updateMetric('errors');
    chrome.action.setBadgeText({ text: 'FAIL' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  } finally {
      // Limpa o badge depois de alguns segundos
      setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
  }
}

// Ouve o alarme para executar a função periodicamente
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cookie-collector') {
    captureAndSendCookies();
  }
});

console.log('Background script carregado e pronto.');

export {};