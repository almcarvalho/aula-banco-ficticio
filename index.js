const { Client, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => {
    console.log('Server is running s on port: ' + port)
});

//comando pra corrigir a falha que não envia os botões:
//npm i github:pedroslopez/whatsapp-web.js#fix-buttons-list

//no site da heroku > settings > buildbacks > add:
//https://github.com/jontewks/puppeteer-heroku-buildpack

var clientes = [];

//criar nosso client para rodar local
// const client = new Client({
//     authStrategy: new LocalAuth()
// });

//client para rodar na heroku  
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
})

client.on('qr', qr => {
    qrcode.generate(qr, { small: true })
});

client.on('ready', () => {
    console.log('deu tudo certo! estamos conectados...')
});

client.on('message', msg => {
    //VERIFICAR SE A PESSOA TEM UMA CONTA ABERTA
    const encontrado = clientes.find(element => element.numero == msg.from);

    if (encontrado) {
        if (encontrado.momento == 1) { //saque
            if (encontrado.saldo > msg.body) {
                encontrado.saldo = encontrado.saldo - msg.body;
                client.sendMessage(msg.from, `💸 Contando cédulas... 
                Retire seu dinheiro... 
                Operação Finalizada com sucesso! 
                Envie qualquer coisa para continuar...`);
            } else {
                client.sendMessage(msg.from, `❌Saldo Insuficiente ou Valor Inválido ❌`);
            }
            encontrado.momento = 0;
            return;
        }
        if (encontrado.momento == 2) { //valor pix para transferir
            encontrado.destino = msg.body;
            client.sendMessage(msg.from, `Informe o valor que você deseja transferir`);
            encontrado.momento = 3;
            return;
        }
        if (encontrado.momento == 3) { //efetuando um pix
            if (encontrado.saldo > msg.body) {
                const destinoPix = clientes[encontrado.destino];
                if (destinoPix) {
                    encontrado.saldo = encontrado.saldo - msg.body;
                    //efetuo o pix
                    destinoPix.saldo = destinoPix.saldo + parseFloat(msg.body);
                    client.sendMessage(msg.from, `Pix de: ${msg.body} efetuado com sucesso para: ${destinoPix.nome}`);
                    //avisar a outra pessoa
                    client.sendMessage(destinoPix.numero, `Você recebeu um pix de: ${msg.body} de: ${encontrado.nome}`);

                } else {
                    client.sendMessage(msg.from, `❌ Chave pix não encontrada❌`);
                }
                client.sendMessage(msg.from, `💸 Operação finalizada com sucesso...`);
            } else {
                client.sendMessage(msg.from, `❌Valor inválido ou Saldo Insuficiente, efetue a operação novamente, operação finalizada ❌`);
            }
            encontrado.momento = 0;
            return;
        }


    }

    if (msg.body != '🚀 ABRIR CONTA 🚀'
        && msg.body != '💻 ACESSAR MINHA CONTA 💻'
        && msg.body != '💸 CONSULTAR SALDO 💸'
        && msg.body != '🏧 SACAR DINHEIRO 🏧'
        && msg.body != '💹 TRANSFERIR (PIX) 💹'
        && msg.body != '🧨 ENCERRAR CONTA 🧨') {

        var opcoes = [];

        if (encontrado) {
            opcoes = [
                { body: '💻 ACESSAR MINHA CONTA 💻' },
                { body: '🧨 ENCERRAR CONTA 🧨' }];
        } else {
            opcoes = [
                { body: '🚀 ABRIR CONTA 🚀' }];
        }

        let button = new Buttons('O que deseja fazer agora?', opcoes, `🏛 Olá, ${msg._data.notifyName} Seja bem vindo(a) ao Ficticious Bank 🏛 apenas para fins didáticos`);
        client.sendMessage(msg.from, button);
    }

    if (msg.body == '🧨 ENCERRAR CONTA 🧨') {
        //BUSCO O INDÍCE A SER REMOVIDO
        let index = clientes.findIndex((cliente) => cliente.numero === msg.from);
        //REMOVER O ELEMENTO DO ARRAY
        clientes.splice(index, 1);
        client.sendMessage(msg.from, `Sua conta e seu número foram removidos com sucesso! 👌`);
    }

    if (msg.body == '🚀 ABRIR CONTA 🚀') {
        var cliente = { numero: msg.from, nome: msg._data.notifyName, saldo: 1000, momento: 0, destino: 0 }
        if (!encontrado) {
            clientes.push(cliente);
            client.sendMessage(msg.from, `💸 Parabéns, ${cliente.nome} você acaba de criar sua conta no Ficticious Bank \n 
ganhou um saldo de R$:${cliente.saldo} reais`);
        } else {
            client.sendMessage(msg.from, `❌Você já possui uma conta aberta nesse banco! ❌`);
        }

    }

    if (msg.body == '💻 ACESSAR MINHA CONTA 💻') {
        if (encontrado) {
            let button = new Buttons('O que deseja fazer na sua conta?', [
                { body: '💸 CONSULTAR SALDO 💸' },
                { body: '🏧 SACAR DINHEIRO 🏧' },
                { body: '💹 TRANSFERIR (PIX) 💹' },
                { body: '🧨 ENCERRAR ATENDIMENTO 🧨' }], `🏛 Agência: 1100 Conta: 1234-x Cliente: ${msg._data.notifyName} 🏛`, 'digite fim para finalizar seu atendimento');
            client.sendMessage(msg.from, button);
        } else {
            client.sendMessage(msg.from, `💸 Você não possui conta nesse banco!`);
        }
    }

    if (msg.body == '💸 CONSULTAR SALDO 💸') {
        client.sendMessage(msg.from, `💸 ${encontrado.nome} SEU SALDO É DE R$:${encontrado.saldo} reais`);
    }

    if (msg.body == '🏧 SACAR DINHEIRO 🏧') {
        encontrado.momento = 1;
        client.sendMessage(msg.from, `💸 Informe o valor que você deseja sacar: `);
    }

    if (msg.body == '💹 TRANSFERIR (PIX) 💹') {
        //listar as pessoas que tem conta 0 - Fulano, 1 - Sicrano
        var resultado = ``;

        for (let index = 0; index < clientes.length; index++) {
            const element = clientes[index];

            if (element.numero != msg.from) {
                resultado = resultado + `\n Chave pix: ` + index + `-` + element.nome + ``;
            }
        }
        if (clientes) {
            if (clientes.length <= 1) {
                client.sendMessage(msg.from, `❌Pix Indisponível! ❌`);
                encontrado.momento = 0; //espero pela chave pix
            } else {
                client.sendMessage(msg.from, `${resultado} \n Informe a chave pix da pessoa que você quer transferir`);
                encontrado.momento = 2; //espero pela chave pix
            }
        }

    }

});

client.initialize();