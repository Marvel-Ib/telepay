const express = require('express')
const app = express()
const port = 3001
const dotenv = require('dotenv');
dotenv.config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require("fs");
const path = require('path')
const { Telegraf } = require('telegraf');


const bot = new Telegraf(process.env.TELEGRAM_API)


const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

const packageDefinition = protoLoader.loadSync('lightning.proto', loaderOptions);

// Load lnd macaroon

let m = fs.readFileSync(process.env.LND_MACAROON);
let macaroon = m.toString('hex');

// Build meta data credentials
let metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
let macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});

// Combine credentials

let lndCert = fs.readFileSync(process.env.LND_CERT);
let sslCreds = grpc.credentials.createSsl(lndCert);
let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Create client
let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
let client = new lnrpc.Lightning('127.0.0.1:10001', credentials);

bot.command('start', ctx => {
  console.log(ctx.from)
  bot.telegram.sendMessage(ctx.chat.id, `Hello ${ctx.from.first_name}, \n Welcome to  boltpay. here are the list of available shops: \n /qalaShop`, {
  })
})


bot.command('qalaShop', ctx => {

  bot.telegram.sendMessage(ctx.chat.id, 'hi welcome to qala shop ').then(() => {
    bot.telegram.sendMessage(ctx.chat.id, 'here are the list of current pictures and there prices \n  \n stephan - 50 dollars \n jack - 10 dollars \n dunxen - 30 dollars \n jonas - 20 dollars \n peter - 25 dollars ').then(() => {
      bot.telegram.sendMessage(ctx.chat.id, '/stephan \n \n /jack \n \n /dunxen \n \n /jonas \n \n /peter');
    })
  });


})

bot.command('stephan', ctx => {
  const sat = "209650"
  let request = {
    value: sat,
    memo: `stephan:${ctx.from.id}:${ctx.from.first_name}`
  };

  client.addInvoice(request, function (err, response) {

    bot.telegram.sendMessage(ctx.chat.id, 'pay your lightning invoice and you will get your picture').then(() => {
      bot.telegram.sendMessage(ctx.chat.id, 'here is your lightning invoice').then(() => {
        bot.telegram.sendMessage(ctx.chat.id, response.payment_request);
      });

    });


  });
})

bot.command('peter', ctx => {
  const sat = "104491"
  let request = {
    value: sat,
    memo: `peter:${ctx.from.id}:${ctx.from.first_name}`
  };

  client.addInvoice(request, function (err, response) {

    bot.telegram.sendMessage(ctx.chat.id, 'pay your lightning invoice and you will get your picture').then(() => {
      bot.telegram.sendMessage(ctx.chat.id, 'here is your lightning invoice').then(() => {
        bot.telegram.sendMessage(ctx.chat.id, response.payment_request);
      });

    });
  });
})

bot.command('jonas', ctx => {
  const sat = "83860.01"
  let request = {
    value: sat,
    memo: `jonas:${ctx.from.id}:${ctx.from.first_name}`
  };

  client.addInvoice(request, function (err, response) {
    bot.telegram.sendMessage(ctx.chat.id, 'pay your lightning invoice and you will get your picture').then(() => {
      bot.telegram.sendMessage(ctx.chat.id, 'here is your lightning invoice').then(() => {
        bot.telegram.sendMessage(ctx.chat.id, response.payment_request);
      });

    });
  });
})

bot.command('dunxen', ctx => {
  const sat = "125790"
  let request = {
    value: sat,
    memo: `dunxen:${ctx.from.id}:${ctx.from.first_name}`
  };

  client.addInvoice(request, function (err, response) {

    bot.telegram.sendMessage(ctx.chat.id, 'pay your lightning invoice and you will get your picture').then(() => {
      bot.telegram.sendMessage(ctx.chat.id, 'here is your lightning invoice').then(() => {
        bot.telegram.sendMessage(ctx.chat.id, response.payment_request);
      });

    });
  });
})


bot.command('jack', ctx => {
  const sat = "41930"
  let request = {
    value: sat,
    memo: `jack:${ctx.from.id}:${ctx.from.first_name}`
  };

  client.addInvoice(request, function (err, response) {

    bot.telegram.sendMessage(ctx.chat.id, 'pay your lightning invoice and you will get your picture').then(() => {
      bot.telegram.sendMessage(ctx.chat.id, 'here is your lightning invoice').then(() => {
        bot.telegram.sendMessage(ctx.chat.id, response.payment_request);
      });

    });
  });
})




let request = {
  add_index: 0,
  settle_index: 0,
};
let call = client.subscribeInvoices(request);
call.on('data', function (response) {
  if (response.state == "SETTLED") {
    [picture, id, username] = response.memo.split(":")
    console.log(picture, id, username, "omo");
    bot.telegram.sendMessage(id, `Hello ${username} payment received,  \n  Thank you for shopping with qala, here is your picture:`).then(() => {
      bot.telegram.sendPhoto(id, {
        source: `./static/${picture}.jpeg`
      }).then(() => {
        bot.telegram.sendMessage(id, `you can shop again with us \n /qalaShop`);
      })
    });



  }
  // state: 'SETTLED',
});
call.on('status', function (status) {
  // The current status of the stream.
  console.log("current status of the stream ")

});
call.on('end', function () {
  // The server has closed the stream.
  console.log("server has closed the stream");
});


bot.launch();


app.get('/getinfo', async (req, res) => {
  try {
    client.getInfo({}, function (err, response) {
      if (err) {
        console.log('Error: ' + err);
      }
      res.json(response);
    });
  } catch (e) {
    console.log(e)
  }
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
