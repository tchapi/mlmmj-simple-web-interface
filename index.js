var express = require('express')
var bodyParser = require('body-parser')
var flash = require('connect-flash')
var session = require('express-session')
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy

// Add config module
var CONFIG = require('./services/ConfigParser')
  , config = new CONFIG()

// Consolidate, to make beautiful templates in nunjucks
var cons = require('consolidate')
  , nunjucks = require('nunjucks')

// Add mlmmj service wrapper module
var Mlmmj = require('./services/MlmmjWrapper')


var app = express()

/* Configuration is done here
*/
  // add nunjucks to requires so filters can be 
  // added and the same instance will be used inside the render method 
  cons.requires.nunjucks = nunjucks.configure(); 
  cons.requires.nunjucks.addGlobal('website_name', config.get('app').name);

  // Handy flash messages
  app.use(flash())

  // Use sessions
  app.use(session({ name: "mlmmj.web.session.id", secret: 'mlmmjNotSoSecretPhrase', cookie: { maxAge: null }, resave: true, saveUninitialized: true }))

  // Use passport-local auth system with persistent sessions
  app.use(passport.initialize())
  app.use(passport.session())

  // Static content
  app.use(express.static(__dirname + '/public'))

  // .. parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }))

  // .. parse application/json
  app.use(bodyParser.json())

  // Assign the swig engine to .html files
  app.engine('html', cons.nunjucks)

  // Set .html as the default extension
  app.set('view engine', 'html')
  app.set('views', __dirname + '/views')

/* End Express Configuration
*/

// Passport users setup.
function findByUsername(username, fn) {
  for (var i = 0, len = config.get('users').length; i < len; i++) {
    var user = config.get('users')[i]
    if (user.username === username) {
      return fn(null, user)
    }
  }
  return fn(null, null)
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.username)
});

passport.deserializeUser(function(username, done) {
  findByUsername(username, function (err, user) {
    done(err, user)
  });
});

// Login form / handler
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err) }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }) }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }) }
        return done(null, user)
      })
    });
  }
));

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.returnTo = req.path; // Save redirect path in session
  res.redirect('/login')
}

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/login', function(req, res){
  res.render('login', { hideLogout: true, title: "Login", message: req.flash('error') })
});

app.get('/logout', function(req, res){
  req.logout()
  res.redirect('/login')
});


app.param('name', function(req, res, next, name) {

    var group = null

    try {
      req.group = new Mlmmj(config.get('mlmmj').path, name)
      req.name = name
    } catch (err) {
      res.status(404).send(err.name + " : " + err.message)
      return
    }

    next()
})

app.param('mail_id', function(req, res, next, mail_id){

  req.group.getArchive(mail_id, function(mail_object){
    req.mail = mail_object
    req.mail_id = mail_id
    next()
  })

})

app.get('/', ensureAuthenticated, function (req, res) {

  try {
    groups = Mlmmj.listGroups(config.get('mlmmj').path)
  } catch (err) {
    res.status(500).send(err.name + " : " + err.message)
    return
  }

  res.render('list', {
    title: 'List',
    directory: config.get('mlmmj').path,
    groups: groups
  })

})

app.get('/group/:name', ensureAuthenticated, function(req, res){ 
    res.render('group', {
      title: 'Mailing list ' + req.name,
      name: req.name
    })
})

app.get('/group/:name/control', ensureAuthenticated, function(req, res){
    res.render('control', {
      title: 'Mailing list ' + req.name,
      name: req.name,
      availables : Mlmmj.getAllAvailables(),
      flags: req.group.getFlags(),
      texts: req.group.getTexts(),
      values: req.group.getValues(),
      lists: req.group.getLists()
    })
})

app.get('/group/:name/subscribers', ensureAuthenticated, function(req, res){
    res.render('subscribers', {
      title: 'Mailing list ' + req.name,
      name: req.name,
      subscribers: req.group.getSubscribers()
    })
})

app.post('/group/:name/save/:key', ensureAuthenticated, function(req, res){
    
    var key = req.params.key

    if (key == 'flags') {
      for (key in req.body) {
        req.group.setFlag(key, req.body[key])
      }
    } else if (key == 'texts') {
      for (key in req.body) {
        req.group.setText(key, req.body[key])
      }
    } else if (key == 'lists') {
      for (key in req.body) {
        req.group.setList(key, req.body[key].split("\n"))
      }
    } else if (key == 'values') {
      for (key in req.body) {
        req.group.setValue(key, req.body[key])
      }
    } else if (key == 'subscribers') {
      for (key in req.body) {
        req.group.setSubscribers(key, req.body[key])
      }
    }
    
    // Save to disk
    req.group.saveAll()
    res.status(200).send("1")

})

app.post('/group/:name/remove/:key', ensureAuthenticated, function(req, res){
    
    var key = req.params.key

    if (key == 'subscribers') {
      req.group.removeSubscriber(req.body.element)
    }

    // Save to disk
    req.group.saveAll()
    res.status(200).send("1")
})

app.post('/group/:name/add/:key', ensureAuthenticated, function(req, res){
    
    var key = req.params.key

    if (key == 'subscribers') {
      req.group.addSubscriber(req.body.element)
    }

    // Save to disk
    req.group.saveAll()
    res.status(200).send("1")
})

app.get('/group/:name/archives/:year?/:month?/:day?', ensureAuthenticated, function(req, res){

    try {
      archives = req.group.listArchives(req.params.year, req.params.month)
    } catch (err) {
      res.status(500).send(err.name + " : " + err.message)
      return
    }

    res.render('archives', {
      title: 'Mailing list ' + req.name,
      name: req.name,
      year: req.params.year,
      month: req.params.month,
      day: req.params.day,
      archives: archives
    })
})

app.get('/group/:name/archive/:mail_id', ensureAuthenticated, function(req, res){
    res.render('archive', {
      title: 'Mailing list ' + req.name,
      id: req.mail_id,
      name: req.name,
      mail: req.mail
    })
})

// Start application
var server = app.listen(config.get('server').port, config.get('server').address, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Starting mlmmj groups management interface at http://%s:%s', host, port)

})
