const intervalInput = document.getElementById('interval') as HTMLInputElement;
const webhookUrlInput = document.getElementById('webhookUrl') as HTMLInputElement;
const saveButton = document.getElementById('save') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

function saveOptions() {
  const interval = parseInt(intervalInput.value, 10);
  const webhookUrl = webhookUrlInput.value;

  if (interval < 1) {
    statusDiv.textContent = 'Erro: O intervalo deve ser de no mínimo 1 minuto.';
    return;
  }
  if (!webhookUrl.startsWith('http')) {
      statusDiv.textContent = 'Erro: A URL do webhook parece ser inválida.';
      return;
  }

  chrome.storage.sync.set(
    { interval, webhookUrl },
    () => {
      // Exibe a mensagem de sucesso
      statusDiv.textContent = 'Opções salvas! Fechando em 2 segundos...';
      
      // Espera 2 segundos e depois fecha a aba
      setTimeout(async () => {
        // Encontra a aba atual (a própria página de opções)
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          chrome.tabs.remove(tab.id);
        }
      }, 2000);
    }
  );
}

function restoreOptions() {
  chrome.storage.sync.get(
    { interval: 15, webhookUrl: '' },
    (items) => {
      intervalInput.value = items.interval;
      webhookUrlInput.value = items.webhookUrl;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);

export {};