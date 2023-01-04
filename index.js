const { Client, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

//comando pra corrigir a falha que não envia os botões:
//npm i github:pedroslopez/whatsapp-web.js#fix-buttons-list

var clientes = [];

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
    //VERIFICAR SE A PESSOA TEM UMA CONTA ABERTA
    const encontrado = clientes.find(element => element.numero == msg.from);

    if (encontrado) {
        if (encontrado.momento == 1) {
            //validar
            if (encontrado.saldo > msg.body) {
                encontrado.saldo = encontrado.saldo - msg.body;
                client.sendMessage(msg.from, `💸 Contando cédulas... 
                Retire seu dinheiro... 
                Operação Finalizada com sucesso! 
                Envie qualquer coisa para continuar...`);
            } else {
                client.sendMessage(msg.from, `❌Saldo Insuficiente ❌`);
            }
            encontrado.momento = 0;
            return;
        }
        if (encontrado.momento == 2) {
            //recebo a chave pix #TODO validar depois se é um número
            encontrado.destino = msg.body;
            client.sendMessage(msg.from, `Informe o valor que você deseja transferir`);
            encontrado.momento = 3;
            return;
        }
        if (encontrado.momento == 3) {
            //validar
            if (encontrado.saldo > msg.body) {
                console.log('brooks was here');
                encontrado.saldo = encontrado.saldo - msg.body;
                //efetuo o pix
                const destinoPix = clientes[encontrado.destino];
                if (destinoPix) {
                    destinoPix.saldo = destinoPix.saldo + parseFloat(msg.body);
                    client.sendMessage(msg.from, `Pix de: ${msg.body} efetuado com sucesso para: ${destinoPix.nome}`);
                } else {
                    client.sendMessage(msg.from, `❌ Chave pix não encontrada❌`);
                }
                client.sendMessage(msg.from, `💸 Operação finalizada com sucesso...`);
            } else {
                client.sendMessage(msg.from, `❌Saldo Insuficiente ❌`);
            }
            encontrado.momento = 0;
            return;
        }


    }

    if (msg.body != '🚀 ABRIR CONTA 🚀'
        && msg.body != '💻 ACESSAR MINHA CONTA 💻'
        && msg.body != '💸 CONSULTAR SALDO 💸'
        && msg.body != '🏧 SACAR DINHEIRO 🏧'
        && msg.body != '💹 TRANSFERIR (PIX) 💹') {
        let button = new Buttons('O que deseja fazer agora?', [
            { body: '🚀 ABRIR CONTA 🚀' },
            { body: '💻 ACESSAR MINHA CONTA 💻' },
            { body: '🧨 ENCERRAR ATENDIMENTO 🧨' }], `🏛 Olá, ${msg._data.notifyName} Seja bem vindo(a) ao Ficticious Bank 🏛 apenas para fins didáticos`);
        client.sendMessage(msg.from, button);
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

        // clientes.forEach(currentItem => {
        //     resultado = `\n Chave pix: ` + pix + `-` + resultado + currentItem.nome + ``;
        // });

        for (let index = 0; index < clientes.length; index++) {
            const element = clientes[index];
            resultado = resultado + `\n Chave pix: ` + index + `-` + element.nome + ``;
        }

        client.sendMessage(msg.from, `${resultado} \n Informe a chave pix da pessoa que você quer transferir`);
        encontrado.momento = 2; //espero pela chave pix
    }



});

client.initialize();




