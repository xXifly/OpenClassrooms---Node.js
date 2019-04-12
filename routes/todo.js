var express = require('express');
var router = express.Router();

/* Affiche la todolist */
router.get('/', function (req, res) {
  req.session.list = req.session.list || [];
  res.render('todo', { list: req.session.list});
});

/* Ajoute une tâche à la todolist */
router.post('/ajouter', function (req, res) {
  if (req.body && req.body.task != "") {
    req.session.list.push(req.body.task);
  }
  res.redirect('/todo');
});

/* Supprime une tâche à la todolist */
router.get('/supprimer/:id', function (req, res) {
  if (isNumeric(req.params.id)) {
    req.session.list.splice(req.params.id, 1);
  }
  res.redirect('/todo');
});

/* Fonction permettant de savoir si une variable est numérique */
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = router;
