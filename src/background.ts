async function addNewLogEntry(logEntry: { timestamp: string; status: string; message: string; }) {
  const { logs = [] } = await chrome.storage.local.get('logs');
  const updatedLogs = [logEntry, ...logs].slice(0, 100);
  await chrome.storage.local.set({ logs: updatedLogs });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { webhookUrl } = await chrome.storage.sync.get('webhookUrl');
  if (!webhookUrl) {
    await chrome.storage.sync.set({ webhookUrl: 'https://n8n.msqualifica.ms.gov.br/webhook/imo' });
    console.log('Default webhookUrl set.');
  }
});

async function startIntegration() {
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });

  const { webhookUrl } = await chrome.storage.sync.get(['webhookUrl']);
  if (!webhookUrl) {
    const logEntry = { timestamp: new Date().toISOString(), status: 'ERROR', message: 'URL do webhook não configurada.' };
    await addNewLogEntry(logEntry);
    await chrome.storage.local.set({ lastIntegrationMessage: logEntry.message });
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    return;
  }

  const [tab] = await chrome.tabs.query({ url: "https://imo.mte.gov.br/*" });
  if (!tab || !tab.url) {
    await chrome.storage.local.set({ lastIntegrationMessage: 'Aba do IMO não encontrada. Verifique se está aberta.' });
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  try {
    const jsessionidCookie = await chrome.cookies.get({
      url: tab.url,
      name: 'JSESSIONID'
    });

    if (!jsessionidCookie) {
      await chrome.storage.local.set({ lastIntegrationMessage: `Cookie JSESSIONID não encontrado. Faça o login no IMO.` });
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const payload = {
      jsessionid: jsessionidCookie.value
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log(responseData);

    const logStatus = responseData.status?.toLowerCase() === 'ok' ? 'SUCCESS' : 'FAIL';

    if (response.ok) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            status: logStatus,
            message: responseData.message || 'Resposta sem mensagem.'
        };
        await addNewLogEntry(logEntry);
        await chrome.storage.local.set({ lastIntegrationMessage: logEntry.message });

        if (logStatus === 'SUCCESS') {
            chrome.action.setBadgeText({ text: 'OK' });
            chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
        } else {
            chrome.action.setBadgeText({ text: 'FAIL' });
            chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
        }
    } else {
      const logEntry = {
          timestamp: new Date().toISOString(),
          status: 'ERROR',
          message: `Falha no envio para webhook: Status ${response.status}`
      };
      await addNewLogEntry(logEntry);
      await chrome.storage.local.set({ lastIntegrationMessage: logEntry.message });
      chrome.action.setBadgeText({ text: 'FAIL' });
      chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
    }

  } catch (error) {
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    const logEntry = {
        timestamp: new Date().toISOString(),
        status: 'ERROR',
        message: `Erro na execução: ${errorMessage}`
    };
    await addNewLogEntry(logEntry);
    await chrome.storage.local.set({ lastIntegrationMessage: logEntry.message });
    chrome.action.setBadgeText({ text: 'FAIL' });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' });
  } finally {
      setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cookie-collector') {
    startIntegration();
  }
});

console.log('Background script carregado e pronto.');

export {};
