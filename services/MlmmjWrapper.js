var fs = require('fs')

var global_path = "/tmp/mlmmj"

var control_folder = "control"

var flags = {
  "closedlist" : "",
  "modnonsubposts": "",
  "nolistsubsemail": "",
  "notmetoo": "",
  "subonlyget": "",
  "subonlypost": ""
}

var editables = {
  "owner" : "",
  "prefix": "",
  "moderators": "",
  "footer": "",
  "listaddress": "",
  "customheaders": ""
}

MlmmjWrapper = function(path) {

  this.path = global_path + "/" + path

  // Check that group exist
  try {
    fs.openSync(this.path, 'r')
  } catch (err) {
    throw new Error("Group " + path + " doesn't exist")
  }
  
  // Empty control dict to hold flag values
  this.control = {}

  // Check flags
  this.checkFlags()

  return this

}

// "Static"
MlmmjWrapper.listGroups = function() {

  try {
    return fs.readdirSync(global_path)
  } catch (err) {
    throw new Error("Error opening base folder " + global_path)
  }

}

var p = MlmmjWrapper.prototype

p.checkFlags = function() {
  var stat = null
  for (flag in flags) {
    try {
      fs.openSync(this.path + "/" + control_folder + "/" + flag, 'r')
    } catch (err) {
      this.clearFlag(flag)
      continue
    }
    this.setFlag(flag)
  }
}

p.setFlag = function(flag) {
  this.control[flag] = true
}

p.clearFlag = function(flag) {
  this.control[flag] = false
}

p.getFlag = function(flag) {
  return (this.control[flag] === true)
}

p.getFlags = function() {
  return this.control
}

p.saveFlags = function() {
  for (flag in flags) {
    if (this.getFlag(flag)) {
      fd = fs.openSync(this.path + "/" + control_folder + "/" + flag, 'w')
      fs.closeSync(fd)
    } else {
      fs.unlinkSync(this.path + "/" + control_folder + "/" + flag)
    }
  }
}

module.exports = MlmmjWrapper
