const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

let whatsappClient = null;

async function initializeWhatsApp() {
  try {
    const SESSION_DIR = path.join(__dirname, '../data/sessions');

    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: SESSION_DIR
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    whatsappClient.on('qr', (qr) => {
      console.log('\n📱 ===== QR CODE DO WHATSAPP =====');
      console.log('Escaneie o QR Code abaixo com seu WhatsApp:');
      qrcode.generate(qr, { small: true });
      console.log('================================\n');
    });

    whatsappClient.on('ready', () => {
      console.log('✅ WhatsApp conectado e pronto para uso!');
    });

    whatsappClient.on('authenticated', () => {
      console.log('🔐 WhatsApp autenticado com sucesso!');
    });

    whatsappClient.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação do WhatsApp:', msg);
    });

    whatsappClient.on('disconnected', (reason) => {
      console.log('🔴 WhatsApp desconectado:', reason);
      console.log('🔄 Tentando reconectar em 10 segundos...');
      setTimeout(() => {
        initializeWhatsApp();
      }, 10000);
    });

    await whatsappClient.initialize();
    return whatsappClient;
  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error);
    // Não vamos crashar o servidor se o WhatsApp falhar
    console.log('⚠️ Sistema continuará funcionando sem WhatsApp');
    return null;
  }
}

function getWhatsAppClient() {
  return whatsappClient;
}

module.exports = { initializeWhatsApp, getWhatsAppClient };