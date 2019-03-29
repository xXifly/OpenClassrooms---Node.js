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

/* Gestion des routes en-dessous */

app.get('/todo', function (req, res) {
    res.render('list-view', {list:list});
});

app.post('/todo/ajouter', urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    list.push(req.body.task);
    res.redirect('/todo');
});

app.get('/todo/supprimer/:id', function (req, res) {
    
    if(isNumeric(req.params.id)) {
        list.splice(req.params.id, 1);
        res.redirect('/todo');
    } else {
        res.setHeader('Content-Type', 'text/plain');
        res.status(404).send('L\'identifiant de la tâche à supprimer n\'est pas correcte.');
    }
});

app.use(function (req, res, next) {
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable !');
});

app.listen(8080);

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}