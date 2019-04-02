var express    = require('express');
var session    = require("express-session");
var RedisStore = require("connect-redis")(session);
var bodyParser = require('body-parser');
var exphbs     = require('express-handlebars');
var http       = require('http');
var fs         = require('fs');
var ent        = require('ent');

var app    = express();
var server = require('http').createServer(app);
var io     = require('socket.io')(server);
var ios    = require('socket.io-express-session');

var sessionMiddleware = session({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
});


// On attache notre session
app.use(sessionMiddleware);
// On passe notre session à socket.io
io.use(ios(sessionMiddleware));
// On applique le parseur de formulaire
app.use(bodyParser.urlencoded({ extended: false }));
// On met en place l'uilisate des template hundlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

/** Gestion des routes en-dessous **/

/* Affiche la page d'accueil */

app.get('/home', function (req, res) {
    res.render('home', {pseudo:req.session.pseudo});
});

/** Partie Todo List **/

/* Affiche la todo list */
app.get('/todo', function (req, res) {
    res.render('list-view', {list:req.session.list, pseudo:req.session.pseudo});
});

/* Ajoute une tâche */
app.post('/todo/ajouter', function (req, res) {
    if (req.body && req.body.task != ""){
        req.session.list.push(req.body.task);
    }
    res.redirect('/todo');
});

/* Supprime une tâche */
app.get('/todo/supprimer/:id', function (req, res) {
    if(isNumeric(req.params.id)) {
        req.session.list.splice(req.params.id, 1);
    }
    res.redirect('/todo');
});

/** Partie Super Chat **/

/* Affiche le chat */
app.get('/chat', function (req, res) {
    if(req.session.pseudo){
        res.render('chat', {pseudo:req.session.pseudo}); 
    } else {
        res.redirect('/chat/connection');
    }
});

/* Affiche le formulaire de connection au chat */
app.get('/chat/connection', function (req, res) {
    res.render('connexion');
});

app.post('/chat/connection/new', function (req, res) {
    req.session.pseudo = req.body.pseudo;
    res.redirect('/chat');
});

/* Envoie un message */
app.post('/chat/disconnection', function (req, res) {
    req.session.pseudo = '';
    res.redirect('/home');
});

/* Gère la redirection en cas d'URL incorrect */
app.use(function (req, res, next) {
    res.redirect('/home');
});



io.sockets.on('connection', function (socket) {
    
    socket.emit('pseudo',socket.handshake.session.pseudo)

    socket.on('login', function(pseudo) {
        socket.handshake.session.pseudo = pseudo;
        socket.handshake.session.save();
        console.log(pseudo + " viens de se connecter.");
    });

    socket.on('logout', function(pseudo) {
        if (socket.handshake.session.pseudo) {
            delete socket.handshake.session.pseudo;
            socket.handshake.session.save();
        }
    });


    socket.on('new-message', function(message) {
        socket.broadcast.emit('new-message', {pseudo: socket.pseudo, message: ent.encode(message)});
    });

});


server.listen(8080);

/* Fonction permettant de savoir si une variable est numérique */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

