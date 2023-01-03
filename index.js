const { Client, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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
    //console.log(msg);
    msg.reply('Olá, seja bem vindo!')
});

client.initialize();




