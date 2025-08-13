const intervalInput = document.getElementById('interval') as HTMLInputElement;
const webhookUrlInput = document.getElementById('webhookUrl') as HTMLInputElement;
const saveButton = document.getElementById('save') as HTMLButtonElement;
const statusDiv = document.getElementById('status-options') as HTMLDivElement;

function saveOptions() {
  const interval = parseInt(intervalInput.value, 10);
  const webhookUrl = webhookUrlInput.value.trim();

  if (isNaN(interval) || interval < 10) {
    statusDiv.textContent = 'Erro: O intervalo deve ser de no mínimo 10 segundos.';
    statusDiv.style.color = 'var(--error-red)';
    return;
  }
  if (!webhookUrl.startsWith('https://') && !webhookUrl.startsWith('http://')) {
      statusDiv.textContent = 'Erro: A URL do webhook parece ser inválida.';
      statusDiv.style.color = 'var(--error-red)';
      return;
  }

  chrome.storage.sync.set(
    { interval, webhookUrl },
    () => {
      statusDiv.textContent = 'Configurações salvas com sucesso!';
      statusDiv.style.color = 'var(--success-green)';

      setTimeout(() => {
        statusDiv.textContent = '';
      }, 5000);
    }
  );
}

function restoreOptions() {
  chrome.storage.sync.get(
    { interval: 10, webhookUrl: 'https://n8n.msqualifica.ms.gov.br/webhook/imo' },
    (items) => {
      intervalInput.value = items.interval;
      webhookUrlInput.value = items.webhookUrl;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);

export {};
