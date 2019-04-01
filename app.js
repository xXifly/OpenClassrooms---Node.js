var express = require('express');
var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var exphbs  = require('express-handlebars');
var http = require('http');
var fs = require('fs');

var app = express();


/* On utilise les sessions */
app.use(session({ secret: 'todotopsecret' }))


/* S'il n'y a pas de todolist dans la session,
on en crée une vide sous forme d'array avant la suite */
.use(function(req, res, next){
    if (typeof(req.session.list) == 'undefined') {
        req.session.list = [];
    }
    next();
})

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

/** Gestion des routes en-dessous **/

/* Affiche la page d'accueil */

app.get('/home', function (req, res) {
    res.render('home');
});

/** Partie Todo List **/

/* Affiche la todo list */
app.get('/todo', function (req, res) {
    res.render('list-view', {list:req.session.list});
});

/* Ajoute une tâche */
app.post('/todo/ajouter', urlencodedParser, function (req, res) {
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
    if (typeof(req.session.chat) == 'undefined') {
        res.render('connexion');
    } else {
        res.render('chat', {chat:chat});
    }
});

/* Permet la connection au chat */
app.get('/chat/connexion', function (req, res) {
    if (typeof(req.session.chat) != 'undefined') {
        res.render('chat', {chat:chat});
    } else {
        res.render('connexion');
    }
});

/* Envoie un message */
app.get('/chat/envoie', function (req, res) {
    
});

/* Gère la redirection en cas d'URL incorrect */
app.use(function (req, res, next) {
    res.redirect('/home');
});

app.listen(8080);

/* Fonction permettant de savoir si une variable est numérique */
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}