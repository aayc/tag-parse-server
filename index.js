var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

if (!['production', 'local', 'test'].includes(process.env.NODE_ENV)) {
  console.log("Error: no environment specified");
  process.exit();
}

async function main() {
  // TODO when taking this to production, how to setup env?
  require('dotenv').config()
  const config = JSON.parse(process.env.CONFIGS)[process.env.NODE_ENV]

  if (['production', 'local'].includes(process.env.NODE_ENV)) {
    console.log("Using above configuration as-is.");
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    var mongo = new MongoMemoryServer();
    var dbUri = await mongo.getConnectionString();
    config.databaseURI = dbUri;
  }

  console.log("Environment:", process.env.NODE_ENV)
  console.log("Configuration:", config)
  var api = new ParseServer({
    databaseURI: config.databaseURI,
    cloud: config.cloud,
    appId: config.appId,
    masterKey: config.masterKey,
    serverURL: config.serverURL,
    liveQuery: config.liveQuery
  });

  // Client-keys like the javascript key or the .NET key are not necessary with parse-server
  // If you wish you require them, you can set them as options in the initialization above:
  // javascriptKey, restAPIKey, dotNetKey, clientKey
  var app = express();
  app.use('/public', express.static(path.join(__dirname, '/public')));

  /* TEST only */
  /* app.get('/test', function(req, res) {
    res.sendFile(path.join(__dirname, '/public/test.html'));
  });*/

  var mountPath = process.env.PARSE_MOUNT || '/parse';
  app.use(mountPath, api);
  var httpServer = require('http').createServer(app);
  httpServer.listen(config.port, function() {
    console.log('tag server running on port ' + config.port + '.');
  });
  ParseServer.createLiveQueryServer(httpServer);
}

main();
