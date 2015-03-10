var fs = require('fs')

ConfigParser = function(options) {

  try {

    // Read config file
    var data = fs.readFileSync('config.json')
    this.config = JSON.parse(data)

  } catch (err) {

    throw err

  }

}

var p = ConfigParser.prototype

p.get = function(key) {
  // error catching ?
  return this.config[key]
}

module.exports = ConfigParser
