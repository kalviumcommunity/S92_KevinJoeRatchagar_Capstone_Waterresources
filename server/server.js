const { app, startServer, runServer } = require("./index");

if (require.main === module) {
    runServer();
}

module.exports = {
    app,
    startServer,
};