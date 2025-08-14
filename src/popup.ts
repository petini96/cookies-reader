let countdownInterval: number | null = null;

async function displayLastMessage() {
  const messageEl = document.getElementById('last-integration-message-content');
  if (!messageEl) return;

  const data = await chrome.storage.local.get({ lastIntegrationMessage: 'Nenhuma integração executada ainda.' });
  messageEl.textContent = data.lastIntegrationMessage;
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return "--:--";
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function startCountdownVisuals(alarm: chrome.alarms.Alarm, countdownEl: HTMLElement, popupIcon: HTMLImageElement) {
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        const remainingSeconds = (alarm.scheduledTime - Date.now()) / 1000;
        if (remainingSeconds > 0) {
            countdownEl.textContent = formatTime(remainingSeconds);
            if (popupIcon.src.endsWith("loading.gif")) {
                popupIcon.src = "images/icon128.png";
            }
        } else {
            countdownEl.textContent = "Integrando...";
            popupIcon.src = "images/loading.gif";
            if (countdownInterval) clearInterval(countdownInterval);
        }
    }, 1000);
}

async function updateUi() {
    const statusDiv = document.getElementById('status') as HTMLDivElement;
    const toggleBtn = document.getElementById('toggle-integration') as HTMLButtonElement;
    const countdownEl = document.getElementById('countdown');
    const popupIcon = document.getElementById('popupIcon') as HTMLImageElement;

    if (!statusDiv || !toggleBtn || !countdownEl || !popupIcon) return;

    const { integrationActive } = await chrome.storage.local.get({ integrationActive: false });
    const alarm = await chrome.alarms.get('cookie-collector');

    if (integrationActive) {
        toggleBtn.textContent = 'Parar Integração';
        toggleBtn.classList.remove('inactive');
        toggleBtn.classList.add('active');

        if (alarm) {
            const { interval } = await chrome.storage.sync.get({ interval: 10 });
            statusDiv.textContent = `ATIVO (a cada ${interval} seg)`;
            statusDiv.style.color = 'var(--success-green)';
            startCountdownVisuals(alarm, countdownEl, popupIcon);
        } else {
            // Active, but no alarm -> processing
            statusDiv.textContent = 'ATIVO';
            statusDiv.style.color = 'var(--success-green)';
            countdownEl.textContent = "Integrando...";
            popupIcon.src = "images/loading.gif";
            if (countdownInterval) clearInterval(countdownInterval);
        }
    } else {
        statusDiv.textContent = 'INATIVO';
        statusDiv.style.color = 'var(--error-red)';
        toggleBtn.textContent = 'Iniciar Integração';
        toggleBtn.classList.remove('active');
        toggleBtn.classList.add('inactive');
        if (countdownInterval) clearInterval(countdownInterval);
        countdownEl.textContent = '--:--';
        popupIcon.src = "images/icon128.png";
    }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "integrationFinished") {
    updateUi();
    displayLastMessage();
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.lastIntegrationMessage) {
    displayLastMessage();
  }
  if (namespace === 'local' && changes.integrationActive) {
    updateUi();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-integration') as HTMLButtonElement;
  const optionsLink = document.getElementById('optionsLink') as HTMLAnchorElement;
  const logsLink = document.getElementById('logsLink') as HTMLAnchorElement;

  toggleBtn.addEventListener('click', async () => {
    const { integrationActive } = await chrome.storage.local.get({ integrationActive: false });
    if (integrationActive) {
      chrome.runtime.sendMessage({ action: "stopIntegration" });
    } else {
      chrome.runtime.sendMessage({ action: "startIntegration" });
    }
  });

  optionsLink.addEventListener('click', () => { chrome.runtime.openOptionsPage(); });

  logsLink.addEventListener('click', () => {
      chrome.tabs.create({ url: 'logs.html' });
  });

  updateUi();
  displayLastMessage();
});

export {};