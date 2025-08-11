const intervalInput = document.getElementById('interval') as HTMLInputElement;
const webhookUrlInput = document.getElementById('webhookUrl') as HTMLInputElement;
const saveButton = document.getElementById('save') as HTMLButtonElement;
const statusDiv = document.getElementById('status-options') as HTMLDivElement;

function saveOptions() {
  const interval = parseInt(intervalInput.value, 10);
  const webhookUrl = webhookUrlInput.value.trim();

  // Validação
  if (isNaN(interval) || interval < 5) {
    statusDiv.textContent = 'Erro: O intervalo deve ser de no mínimo 5 segundos.';
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
      // Exibe a mensagem de sucesso com estilo
      statusDiv.textContent = 'Configurações salvas com sucesso!';
      statusDiv.style.color = 'var(--success-green)';
      
      // Limpa a mensagem após 5 segundos
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 5000);
    }
  );
}

function restoreOptions() {
  chrome.storage.sync.get(
    { interval: 15, webhookUrl: '' }, // Padrão de 15 segundos
    (items) => {
      intervalInput.value = items.interval;
      webhookUrlInput.value = items.webhookUrl;
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);

export {};