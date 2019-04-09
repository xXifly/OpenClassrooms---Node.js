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

var todolist = [
  {
    "task" : "Faire les courses",
    "done" : false
  },
  {
    "task" : "Finir le tuto Openclassrooms",
    "done" : true
  }
];

// On attache notre session
app.use(sessionMiddleware);
// On passe notre session à socket.io
io.use(ios(sessionMiddleware));
// On applique le parseur de formulaire
app.use(bodyParser.urlencoded({ extended: false }));
// On met en place l'utilisation des templates hundlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// On permet la lecture des fichiers css et js via le repertoire public
app.use(express.static(path.join(__dirname, 'public')));


/** Gestion des routes en-dessous **/

/* Affiche la page d'accueil */
app.get('/home', function (req, res) {
    res.render('home', {pseudo:req.session.pseudo});
});

/* Affiche la todolist */
app.get('/todo', function (req, res) {
    if(req.session.pseudo){
        res.render('todo', {list:req.session.list, pseudo:req.session.pseudo});
    } else {
        res.redirect('/home');
    }
});

/* Ajoute une tâche à la todolist */
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

/* Supprime une tâche à la todolist */
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

/* Affiche le chat */
app.get('/chat', function (req, res) {
    if(req.session.pseudo){
        res.render('chat', {pseudo:req.session.pseudo}); 
    } else {
        res.redirect('/home');
    }
});

/* Affiche la todolist partagée */
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


/* Mise en place des socket */
io.sockets.on('connection', function (socket) {

    // On transmet le pseudo aux pages affichées
    socket.emit('pseudo',socket.handshake.session.pseudo)

    // Récupération du pseudo lors de la connexion
    socket.on('login', function(pseudo) {
        if(pseudo != ''){
            socket.handshake.session.pseudo =ent.encode(pseudo);
            socket.handshake.session.list = [];
            socket.handshake.session.save();
        }
    });

    // Supression du pseudo lors de la déconnexion
    socket.on('logout', function(pseudo) {
        if (socket.handshake.session.pseudo) {
            delete socket.handshake.session.pseudo;
            delete socket.handshake.session.list;
            socket.handshake.session.save();
        }
    });

    // Gestion d'une nouvelle connexion au chat
    socket.on('new-chat-connexion', function(){
        socket.broadcast.emit('new-chat-connexion', socket.handshake.session.pseudo);
    })

    // Gestion d'un nouveau message sur le chat
    socket.on('new-message', function(message) {
        socket.broadcast.emit('new-message', {pseudo: socket.handshake.session.pseudo, message: ent.encode(message)});
    });

    // Gestion d'une nouvelle connexion à la todolist partagée
    socket.on('new-todo-connexion', function(){
        socket.emit('new-todo-connexion', todolist);
    })

    socket.on('new-task', function(task){
        todolist.push({task: ent.encode(task), done: false});
        io.emit('list-update', todolist);
    })

    // Gestion de la reception d'une nouvelle todolist
    socket.on('list-update',function(list){
        todolist = list;
        io.emit('list-update', todolist);
    });
});

server.listen(8080);

/* Fonction permettant de savoir si une variable est numérique */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

/* Fonction permettant d'encoder les valeurs de la todolist */
function listEncode(list) {
    list[list.length - 1].task = ent.encode(list[list.length - 1].task);
    return list;
}

