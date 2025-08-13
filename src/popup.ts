let countdownInterval: number | null = null; // Para controlar o nosso cronômetro

async function displayMetrics() {
  const attemptsEl = document.getElementById('attempts-count');
  const successesEl = document.getElementById('success-count');
  const errorsEl = document.getElementById('error-count');
  const messageEl = document.getElementById('last-integration-message-content');

  const data = await chrome.storage.local.get({ attempts: 0, successes: 0, errors: 0, lastIntegrationMessage: '' });

  if(attemptsEl) attemptsEl.textContent = data.attempts.toString();
  if(successesEl) successesEl.textContent = data.successes.toString();
  if(errorsEl) errorsEl.textContent = data.errors.toString();
  if(messageEl) messageEl.textContent = data.lastIntegrationMessage;
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

async function startCountdown() {
    const countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    if (countdownInterval) clearInterval(countdownInterval);

    const alarm = await chrome.alarms.get('cookie-collector');
    if (!alarm) {
        countdownEl.textContent = "--:--";
        return;
    }

    countdownInterval = setInterval(() => {
        const remainingSeconds = (alarm.scheduledTime - Date.now()) / 1000;
        if (remainingSeconds > 0) {
            countdownEl.textContent = formatTime(remainingSeconds);
        } else {
            countdownEl.textContent = "Aguarde...";
            if (countdownInterval) clearInterval(countdownInterval);
        }
    }, 1000);
}

async function updateStatus(statusDiv: HTMLDivElement, toggleBtn: HTMLButtonElement) {
  try {
    const alarm = await chrome.alarms.get('cookie-collector');
    if (alarm) {
      const periodInMinutes = alarm.periodInMinutes ?? 1;
      const intervalInSeconds = periodInMinutes * 60;
      statusDiv.textContent = `ATIVO (a cada ${intervalInSeconds} seg)`;
      statusDiv.style.color = 'var(--success-green)';
      toggleBtn.textContent = 'Parar Integração';
      toggleBtn.classList.remove('inactive');
      toggleBtn.classList.add('active');
      startCountdown();
    } else {
      statusDiv.textContent = 'INATIVO';
      statusDiv.style.color = 'var(--error-red)';
      toggleBtn.textContent = 'Iniciar Integração';
      toggleBtn.classList.remove('active');
      toggleBtn.classList.add('inactive');
      if(countdownInterval) clearInterval(countdownInterval);
      const countdownEl = document.getElementById('countdown');
      if(countdownEl) countdownEl.textContent = '--:--';
    }
  } catch (error) {
    console.error("Erro ao tentar atualizar o status:", error);
    statusDiv.textContent = "Erro ao carregar status.";
    statusDiv.style.color = 'orange';
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cookie-collector') {
    const statusDiv = document.getElementById('status') as HTMLDivElement;
    const toggleBtn = document.getElementById('toggle-integration') as HTMLButtonElement;
    if (statusDiv && toggleBtn) {
      setTimeout(() => updateStatus(statusDiv, toggleBtn), 1000);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-integration') as HTMLButtonElement;
  const optionsLink = document.getElementById('optionsLink') as HTMLAnchorElement;
  const logsLink = document.getElementById('logsLink') as HTMLAnchorElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  const resetBtn = document.getElementById('reset-metrics') as HTMLButtonElement;

  toggleBtn.addEventListener('click', async () => {
    const alarm = await chrome.alarms.get('cookie-collector');
    if (alarm) {
      chrome.alarms.clear('cookie-collector');
    } else {
      const { interval } = await chrome.storage.sync.get({ interval: 60 });
      const periodInMinutes = interval / 60;
      chrome.alarms.create('cookie-collector', { periodInMinutes: Math.max(0.1, periodInMinutes) });
    }
    updateStatus(statusDiv, toggleBtn);
  });

  optionsLink.addEventListener('click', () => { chrome.runtime.openOptionsPage(); });

  logsLink.addEventListener('click', () => {
      chrome.tabs.create({ url: 'logs.html' });
  });

  resetBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ attempts: 0, successes: 0, errors: 0, logs: [], lastIntegrationMessage: '' });
      displayMetrics();
      resetBtn.textContent = 'Limpo!';
      setTimeout(() => { resetBtn.textContent = 'Resetar'; }, 1500);
  });

  updateStatus(statusDiv, toggleBtn);
  displayMetrics();
});

export {};
