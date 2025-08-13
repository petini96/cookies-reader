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

async function startCountdown() {
    const countdownEl = document.getElementById('countdown');
    const popupIcon = document.getElementById('popupIcon') as HTMLImageElement; // Get the image element
    if (!countdownEl || !popupIcon) return;

    if (countdownInterval) clearInterval(countdownInterval);

    const alarm = await chrome.alarms.get('cookie-collector');
    if (!alarm) {
        countdownEl.textContent = "--:--";
        popupIcon.src = "images/icon128.png";
        return;
    }

    countdownInterval = setInterval(() => {
        const remainingSeconds = (alarm.scheduledTime - Date.now()) / 1000;
        if (remainingSeconds > 0) {
            countdownEl.textContent = formatTime(remainingSeconds);
            popupIcon.src = "images/icon128.png";
        } else {
            countdownEl.textContent = "Aguarde...";
            popupIcon.src = "images/loading.gif";
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
      const popupIcon = document.getElementById('popupIcon') as HTMLImageElement;
      if(popupIcon && popupIcon.src.endsWith("images/loading.gif")) { 
          popupIcon.src = "images/icon128.png";
      }
    }
  } catch (error) {
    console.error("Erro ao tentar atualizar o status:", error);
    statusDiv.textContent = "Erro ao carregar status.";
    statusDiv.style.color = 'orange';
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "pauseCountdown") {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      countdownEl.textContent = "Aguardando resposta...";
      const popupIcon = document.getElementById('popupIcon') as HTMLImageElement;
      if (popupIcon && popupIcon.src.endsWith("images/icon128.png")) {
          popupIcon.src = "images/loading.gif";
      }
    }
  } else if (request.action === "resumeCountdown") {
    const statusDiv = document.getElementById('status') as HTMLDivElement;
    const toggleBtn = document.getElementById('toggle-integration') as HTMLButtonElement;
    if (statusDiv && toggleBtn) {
      updateStatus(statusDiv, toggleBtn);
    }
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.lastIntegrationMessage) {
    displayLastMessage();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-integration') as HTMLButtonElement;
  const optionsLink = document.getElementById('optionsLink') as HTMLAnchorElement;
  const logsLink = document.getElementById('logsLink') as HTMLAnchorElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;

  toggleBtn.addEventListener('click', async () => {
    const alarm = await chrome.alarms.get('cookie-collector');
    if (alarm) {
      chrome.alarms.clear('cookie-collector');
    } else {
      const { interval } = await chrome.storage.sync.get({ interval: 10 });
      const periodInMinutes = interval / 60;
      chrome.alarms.create('cookie-collector', { periodInMinutes: Math.max(1 / 60, periodInMinutes) });
    }
    updateStatus(statusDiv, toggleBtn);
  });

  optionsLink.addEventListener('click', () => { chrome.runtime.openOptionsPage(); });

  logsLink.addEventListener('click', () => {
      chrome.tabs.create({ url: 'logs.html' });
  });

  updateStatus(statusDiv, toggleBtn);
  displayLastMessage();
});

export {};
