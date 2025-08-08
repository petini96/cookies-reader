let countdownInterval: number | null = null; // Para controlar o nosso cronômetro

async function displayMetrics() {
  const attemptsEl = document.getElementById('attempts-count');
  const successesEl = document.getElementById('success-count');
  const errorsEl = document.getElementById('error-count');

  const metrics = await chrome.storage.local.get({ attempts: 0, successes: 0, errors: 0 });

  if(attemptsEl) attemptsEl.textContent = metrics.attempts.toString();
  if(successesEl) successesEl.textContent = metrics.successes.toString();
  if(errorsEl) errorsEl.textContent = metrics.errors.toString();
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

async function updateStatus(statusDiv: HTMLDivElement) {
  try {
    const alarm = await chrome.alarms.get('cookie-collector');
    if (alarm) {
      // Usamos alarm.periodInMinutes que foi usado para criar o alarme
      const periodInMinutes = alarm.periodInMinutes ?? 1; // fallback to 1 minute if undefined
      const intervalInSeconds = periodInMinutes * 60;
      statusDiv.textContent = `ATIVO (a cada ${intervalInSeconds} seg)`;
      statusDiv.style.color = 'green';
      startCountdown();
    } else {
      statusDiv.textContent = 'INATIVO';
      statusDiv.style.color = 'red';
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

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start') as HTMLButtonElement;
  const stopBtn = document.getElementById('stop') as HTMLButtonElement;
  const optionsLink = document.getElementById('optionsLink') as HTMLAnchorElement;
  const logsLink = document.getElementById('logsLink') as HTMLAnchorElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  const resetBtn = document.getElementById('reset-metrics') as HTMLButtonElement;

  startBtn.addEventListener('click', async () => {
    // Pega o intervalo em segundos do storage, com um padrão de 60s
    const { interval } = await chrome.storage.sync.get({ interval: 60 });
    // A API de alarme usa minutos, então convertemos. Chrome aceita valores fracionados.
    const periodInMinutes = interval / 60;
    
    // Para evitar spam, o Chrome impõe um limite. 0.1 min (6s) é um valor seguro.
    chrome.alarms.create('cookie-collector', { periodInMinutes: Math.max(0.1, periodInMinutes) });
    updateStatus(statusDiv);
  });

  stopBtn.addEventListener('click', () => {
    chrome.alarms.clear('cookie-collector');
    if(countdownInterval) clearInterval(countdownInterval); // Para o cronômetro imediatamente
    updateStatus(statusDiv);
  });

  optionsLink.addEventListener('click', () => { chrome.runtime.openOptionsPage(); });

  logsLink.addEventListener('click', () => {
      chrome.tabs.create({ url: 'logs.html' });
  });

  resetBtn.addEventListener('click', async () => {
      await chrome.storage.local.set({ attempts: 0, successes: 0, errors: 0, logs: [] });
      displayMetrics();
      // Opcional: notifica o usuário
      resetBtn.textContent = 'Limpo!';
      setTimeout(() => { resetBtn.textContent = 'Resetar'; }, 1500);
  });

  // Funções iniciais ao abrir o popup
  updateStatus(statusDiv);
  displayMetrics();
});

export {};