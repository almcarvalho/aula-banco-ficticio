const { Client, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

//comando pra corrigir a falha que não envia os botões:
//npm i github:pedroslopez/whatsapp-web.js#fix-buttons-list

//criar nosso client
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true })
});

client.on('ready', () => {
    console.log('deu tudo certo! estamos conectados...')
});

client.on('message', msg => {
    if (msg.body == '1') {
        let button = new Buttons('O que deseja fazer agora?', [{ body: '🚀 ABRIR CONTA 🚀' }, { body: '💻 ACESSAR MINHA CONTA 💻' }, { body: '🧨 ENCERRAR ATENDIMENTO 🧨' }], `🏛 Olá, ${msg._data.notifyName} Seja bem vindo(a) ao Ficticious Bank 🏛 apenas para fins didáticos`);
        client.sendMessage(msg.from, button);
    }
});

client.initialize();




