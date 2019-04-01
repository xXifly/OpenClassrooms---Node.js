var express = require('express');
var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var exphbs  = require('express-handlebars');

var app = express();


/* On utilise les sessions */
app.use(session({ secret: 'todotopsecret' }))

app.set('view engine', 'hbs');

var list = [];

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
    res.render('list-view', {list:list});
});

/* Ajoute une tâche */
app.post('/todo/ajouter', urlencodedParser, function (req, res) {
    if (req.body){
        list.push(req.body.task);
    }
    res.redirect('/todo');
});

/* Supprime une tâche */
app.get('/todo/supprimer/:id', function (req, res) {
    if(isNumeric(req.params.id)) {
        list.splice(req.params.id, 1);
    }
    res.redirect('/todo');
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