var socket = {};

socket.init = function (server) {

    // socket.io setup
    var io = require('socket.io').listen(server);
    var ios = require('socket.io-express-session');
    var session = require("express-session");
    var ent = require('ent');

    var sessionMiddleware = session({
        secret: "my-secret",
        resave: true,
        saveUninitialized: true
    });

    io.use(ios(sessionMiddleware));

    io.sockets.on('connection', function (socket) {

        console.log("Quelqu'un s'est connecté : " + socket.handshake.session.pseudo);

        // On transmet le pseudo aux pages affichées

        socket.emit('pseudo', socket.handshake.session.pseudo);

        // Récupération du pseudo lors de la connexion
        socket.on('login', function (pseudo) {
            if (pseudo != '') {
                console.log(pseudo + " s'est connecté.");
                socket.handshake.session.pseudo = ent.encode(pseudo);
                socket.handshake.session.list = [];
                socket.handshake.session.save();
                console.log(socket.handshake.session.pseudo + " enregistré.")
                socket.emit('pseudo', socket.handshake.session.pseudo);
            }
        });

        // Supression du pseudo lors de la déconnexion
        socket.on('logout', function (pseudo) {
            if (socket.handshake.session.pseudo) {
                console.log(pseudo + " s'est déconnecté.");
                delete socket.handshake.session.pseudo;
                delete socket.handshake.session.list;
                socket.handshake.session.save();
                socket.emit('pseudo', socket.handshake.session.pseudo);
            }
        });

    });

}

module.exports = socket;