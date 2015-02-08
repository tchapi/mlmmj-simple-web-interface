var express = require('express')
var app = express()

// Consolidate, to make beautiful templates in nunjucks
var cons = require('consolidate')

// Assign the swig engine to .html files
app.engine('html', cons.nunjucks)

// Set .html as the default extension
app.set('view engine', 'html')
app.set('views', __dirname + '/views')

// Add mlmmj service wrapper module
var Mlmmj = require('./services/MlmmjWrapper')

app.get('/', function (req, res) {

  try {
    groups = Mlmmj.listGroups()
  } catch (err) {
    res.status(500).send(err.name + " : " + err.message)
    return
  }

  res.render('index', {
    title: 'Home',
    groups: groups
  })

})

app.get('/group/:name', function(req, res){
    
    var groupname = req.params.name
    var group = null

    try {
      group = new Mlmmj(groupname)
    } catch (err) {
      res.status(404).send(err.name + " : " + err.message)
      return
    }

    res.render('group', {
      title: 'Group ' + groupname,
      flags: group.getFlags()
    })

})

// Start application
var server = app.listen(4792, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Starting mlmmj groups management interface at http://%s:%s', host, port)

})