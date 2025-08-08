console.log("Script de raspagem carregado e pronto.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Verifica se a mensagem é a que queremos
  if (request.action === "scrape") {
    // --- LÓGICA DE RASPAGEM ---
    // Esta parte tem acesso total ao 'document' da página
    const pageTitle = document.title;
    const firstH1 = document.querySelector('h1')?.innerText || 'Nenhum H1 encontrado';

    // Envia os dados coletados de volta para o popup
    sendResponse({
      title: pageTitle,
      h1: firstH1
    });
  }
  // Retornar 'true' é importante para indicar que a resposta será enviada de forma assíncrona
  return true;
});