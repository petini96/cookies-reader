# Coletor de Cookies para Webhook

Uma extensão para o Google Chrome que captura cookies de uma aba ativa em intervalos de tempo configuráveis e os envia para um webhook (como n8n, Zapier, etc.) para automação e integração de dados.

## ✨ Funcionalidades

- **Captura Periódica:** Inicia um processo em segundo plano que executa a captura de cookies em intervalos de tempo definidos pelo usuário.
- **Envio para Webhook:** Envia os dados coletados (URL da página e cookies) em formato JSON para qualquer URL de webhook.
- **Totalmente Configurável:** Permite que o usuário defina o intervalo de tempo e a URL do webhook através de uma página de opções dedicada.
- **Feedback Visual:** Utiliza badges no ícone da extensão para fornecer feedback em tempo real sobre o status da operação (enviando, sucesso, falha).
- **Controle Simples:** Interface de popup para iniciar e parar o processo de captura com um clique.

## 🚀 Instalação e Configuração

Siga os passos abaixo para instalar e rodar a extensão em seu ambiente de desenvolvimento.

### Pré-requisitos

- **Node.js** e **npm** instalados. Você pode baixá-los [aqui](https://nodejs.org/).
- **Google Chrome**.

### Passos

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/petini96/cookies-reader.git](https://github.com/petini96/cookies-reader.git)
    cd cookies-reader
    ```

2.  **Instale as Dependências:**
    Execute o comando abaixo para instalar as ferramentas de desenvolvimento (`typescript`, `copyfiles`).
    ```bash
    npm install
    ```

3.  **Compile o Projeto:**
    Este comando compila os arquivos TypeScript para JavaScript e copia todos os arquivos necessários para a pasta `dist`.
    ```bash
    npm run build
    ```

4.  **Carregue a Extensão no Chrome:**
    - Abra o Google Chrome e navegue para `chrome://extensions`.
    - Ative o **"Modo de desenvolvedor"** no canto superior direito.
    - Clique no botão **"Carregar sem compactação"** (ou "Load unpacked").
    - Selecione a pasta **`dist`** que foi criada dentro do diretório do projeto.

## 🛠️ Como Usar

Após a instalação, a extensão estará pronta para ser configurada e usada.

1.  **Configurar a Extensão:**
    - Clique com o botão direito do mouse no ícone da extensão na barra de ferramentas do Chrome.
    - Selecione **"Opções"**.
    - Na página de configurações, insira o **intervalo de tempo** (em minutos) e a **URL do seu webhook**.
    - Clique em **"Salvar"**. A aba de opções se fechará automaticamente.

2.  **Iniciar a Captura:**
    - Clique no ícone da extensão para abrir o popup.
    - Clique no botão **"Iniciar Captura Automática"**.
    - O status mudará para "ATIVO".

3.  **Monitorar:**
    - O ícone da extensão exibirá um "badge" para indicar o status das tentativas de envio:
      - `...` (Laranja): Enviando dados.
      - `OK` (Verde): Envio bem-sucedido.
      - `FAIL` (Vermelho): Falha no envio.
    - Verifique seu serviço de webhook (n8n) para confirmar o recebimento dos dados.

## 📁 Estrutura do Projeto

- **`/src`**: Contém todo o código-fonte da extensão escrito em TypeScript e HTML.
- **`/dist`**: Contém o código final compilado e pronto para ser carregado no Chrome. **Esta é a pasta que deve ser usada para instalar a extensão.**
- **`/images`**: Contém os ícones da extensão.

## 👨‍💻 Autor

Feito por **Vinícius dos Santos Petini**

- **GitHub:** [@petini96](https://github.com/petini96)
- **LinkedIn:** [Vinícius Petini](https://www.linkedin.com/in/viniciuspetini/)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT.