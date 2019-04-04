var express    = require('express');
var session    = require("express-session");
var RedisStore = require("connect-redis")(session);
var bodyParser = require('body-parser');
var exphbs     = require('express-handlebars');
var http       = require('http');
var path       = require('path');
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

var todolist = ["jambon","beurre"];

// On attache notre session
app.use(sessionMiddleware);
// On passe notre session à socket.io
io.use(ios(sessionMiddleware));
// On applique le parseur de formulaire
app.use(bodyParser.urlencoded({ extended: false }));
// On met en place l'uilisate des template hundlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//Permet la lecture des fichiers css, js et des photos
app.use(express.static(path.join(__dirname, 'public')));

/** Gestion des routes en-dessous **/

/* Affiche la page d'accueil */

app.get('/home', function (req, res) {
    res.render('home', {pseudo:req.session.pseudo});
});

/** Partie Todo List **/

/* Affiche la todo list */
app.get('/todo', function (req, res) {
    if(req.session.pseudo){
        res.render('list-view', {list:req.session.list, pseudo:req.session.pseudo});
    } else {
        res.redirect('/home');
    }
});

/* Ajoute une tâche */
app.post('/todo/ajouter', function (req, res) {
    if(req.session.pseudo){
        if (req.body && req.body.task != ""){
            req.session.list.push(req.body.task);
        }
        res.redirect('/todo');
    } else {
        res.redirect('/home');
    }
});

/* Supprime une tâche */
app.get('/todo/supprimer/:id', function (req, res) {
    if(req.session.pseudo){
        if(isNumeric(req.params.id)) {
            req.session.list.splice(req.params.id, 1);
        }
        res.redirect('/todo');
    } else {
        res.redirect('/home');
    }
});

/** Partie Super Chat **/

/* Affiche le chat */
app.get('/chat', function (req, res) {
    if(req.session.pseudo){
        res.render('chat', {pseudo:req.session.pseudo}); 
    } else {
        res.redirect('/home');
    }
});

/* Affiche le chat */
app.get('/stodo', function (req, res) {
    if(req.session.pseudo){
        res.render('stodo', {pseudo:req.session.pseudo}); 
    } else {
        res.redirect('/home');
    }
});


/* Gère la redirection en cas d'URL incorrect */
app.use(function (req, res, next) {
    res.redirect('/home');
});



io.sockets.on('connection', function (socket) {

    socket.emit('pseudo',socket.handshake.session.pseudo)

    socket.on('login', function(pseudo) {
        if(pseudo != ''){
            console.log(pseudo + " viens de se connecter.");
            socket.handshake.session.pseudo =ent.encode(pseudo);
            socket.handshake.session.list = [];
            socket.handshake.session.save();
        }

    });

    socket.on('logout', function(pseudo) {
        if (socket.handshake.session.pseudo) {
            console.log(pseudo + " viens de se déconnecter.");
            delete socket.handshake.session.pseudo;
            delete socket.handshake.session.list;
            socket.handshake.session.save();
        }
    });

    socket.on('new-chat-connexion', function(){
        console.log(socket.handshake.session.pseudo + " viens de se connecter au chat.");
        socket.broadcast.emit('new-chat-connexion', socket.handshake.session.pseudo);
    })

    socket.on('new-message', function(message) {
        socket.broadcast.emit('new-message', {pseudo: socket.handshake.session.pseudo, message: ent.encode(message)});
    });

    socket.on('new-todo-connexion', function(){
        console.log(socket.handshake.session.pseudo + " viens de se connecter a la todolist.");
        socket.emit('new-todo-connexion', todolist);
    })

    socket.on('new-task', function(task) {
        console.log("tache : " + task);
        todolist.push(task);
        socket.broadcast.emit('new-task', ent.encode(task));
    });

});


server.listen(8080);

/* Fonction permettant de savoir si une variable est numérique */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

