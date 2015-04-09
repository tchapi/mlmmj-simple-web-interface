var fs = require('fs')

// Add mail parser module
var MailParser = require("mailparser").MailParser
  , mailparser = new MailParser();

/*

  Mlmmj standard folders

*/
var control_folder = "control"
var archive_folder = "archive"
var subscribers_master_folder = "subscribers.d" // One file per letter
var templates_folder = "text"

/*

  These are the boolean flags you can set per mailing list, as per http://mlmmj.org/docs/tunables/

*/
var available_flags = {
  "closedlist" : {
    name: "Closed list", 
    description: "Is the list is open or closed. If it's closed subscription and unsubscription via mail is disabled."
  },
  "closedlistsub" : {
    name: "Closed for subscription", 
    description: "Closed for subscription. Unsubscription is possible."
  },
  "moderated" : {
    name: "Moderated list", 
    description: "If this file is present, the emailaddresses in the file listdir/control/moderators will act as moderators for the list."
  },
  "submod" : {
    name: "Moderated subscription", 
    description: "If this file is present, subscription will be moderated by owner(s). If there are emailaddresses in this file, then these will be used instead of owner."
  },
  "tocc" : {
    name: "To/Cc optional", 
    description: "If this file is present, the list address does not have to be in the To: or Cc: header of the email to the list."
  },
  "subonlypost" : {
    name: "Closed posting", 
    description: " When this file is present, only people who are subscribed to the list, are allowed to post to it. The check is made against the \"From:\" header."
  },
  "modnonsubposts" : {
    name: "Moderated posts", 
    description: "When this file is present, all postings from people who are not subscribed to the list will be moderated."
  },
  "addtohdr" : {
    name: "Add To: header", 
    description: "When this file is present, a To: header including the recipients emailaddress will be added to outgoing mail. Recommended usage is to remove existing To: headers with delheaders (see above) first."
  },
  "notifysub" : {
    name: "Notify of subscription", 
    description: "If this file is present, the owner(s) will get a mail with the address of someone sub/unsubscribing to a mailinglist."
  },
  "notifymod" : {
    name: "Notify of moderation", 
    description: "If this file is present, the poster (based on the envelope from) will get a mail when their post is being moderated."
  },
  "noarchive" : {
    name: "No archive", 
    description: "If this file exists, the mail won't be saved in the archive but simply deleted."
  },
  "nosubconfirm" : {
    name: "No subscription confirmation", 
    description: "If this file exists, no mail confirmation is needed to subscribe to the list. This should in principle never ever be used, but there is times on local lists etc. where this is useful. HANDLE WITH CARE!"
  },
  "noget" : {
    name: "No mail post retrieval", 
    description: "If this file exists, then retrieving old posts with +get-N is disabled"
  },
  "subonlyget" : {
    name: "Closed retrieval", 
    description: "If this file exists, then retrieving old posts with +get-N is only possible for subscribers. The above mentioned 'noget' have precedence."
  },
  "notoccdenymails" : {
    name: "Do not notify of rejects", 
    description: "These switches turns off whether mlmmj sends out notification about postings being denied due to the listaddress not being in To: or Cc: (see 'tocc'), when it was rejected due to an access rule (see 'access') or whether it's a subscribers only posting list (see 'subonlypost')."
  },
  "noaccessdenymails" : {
    name: "Do not notify of access", 
    description: "These switches turns off whether mlmmj sends out notification about postings being denied due to the listaddress not being in To: or Cc: (see 'tocc'), when it was rejected due to an access rule (see 'access') or whether it's a subscribers only posting list (see 'subonlypost')."
  },
  "nosubonlydenymails" : {
    name: "Do not notify of closed list", 
    description: "These switches turns off whether mlmmj sends out notification about postings being denied due to the listaddress not being in To: or Cc: (see 'tocc'), when it was rejected due to an access rule (see 'access') or whether it's a subscribers only posting list (see 'subonlypost')."
  },
  "nosubmodmails" : {
    name: "Do not notify of subs moderation", 
    description: "This switch turns off whether mlmmj sends out notification about subscription being moderated to the person requesting subscription (see 'submod')."
  },
  "nodigesttext" : {
    name: "No digest text", 
    description: "If this file exists, digest mails won't have a text part with a thread summary."
  },
  "nodigestsub" : {
    name: "No digest subscription", 
    description: "If this file exists, subscription to the digest version of the mailinglist will be denied. (Useful if you don't want to allow digests and notify users about it)."
  },
  "nonomailsub" : {
    name: "No no-mail subscription", 
    description: "If this file exists, subscription to the nomail version of the mailinglist will be denied. (Useful if you don't want to allow nomail and notify users about it)."
  },
  "nomaxmailsizedenymails" : {
    name: "Do not notify of max size rejects", 
    description: "If this is set, no reject notifications caused by violation of maxmailsize will be sent."
  },
  "nolistsubsemail" : {
    name: "No +list functionality", 
    description: "If this is set, the LISTNAME+list@ functionality for requesting an email with the subscribers for owner is disabled."
  },
  "ifmodsendonlymodmoderate" : {
    name: "No replication of moderation mails", 
    description: "If this file is present, then mlmmj in case of moderation checks the envelope from, to see if the sender is a moderator, and in that case only send the moderation mails to that address. In practice this means that a moderator sending mail to the list won't bother all the other moderators with his mail."
  },
  "notmetoo" : {
    name: "Do not receive own posts", 
    description: "If this file is present, mlmmj attempts to exclude the sender of a post from the distribution list for that post so people don't receive copies of their own posts."
  }
}

/*

  These are the editable files (normal, list, or text) you can set per mailing list, as per http://mlmmj.org/docs/tunables/

*/
var available_lists = {
  "listaddress" : {
    name: "List addresses",
    default: "",
    description: "This file contains all addresses which mlmmj sees as listaddresses (see tocc below). The first one is the one used as the primary one, when mlmmj sends out mail."
  },
  "owner" : {
    name: "List owner's email",
    default: "",
    description: "The emailaddresses in this file (1 pr. line) will get mails to listname+owner@listdomain.tld"
  },
  "customheaders" : {
    name: "Custom headers",
    default: "",
    description: "These headers are added to every mail coming through. This is the place you want to add Reply-To: header in case you want such."
  },
  "delheaders" : {
    name: "Deleted headers",
    default: "",
    description: "In this file is specified *ONE* header token to match per line. If the file consists of:  Received: \n\r Message-ID:  \n\r Then all occurences of these headers in incoming list mail will be deleted. \"From \" and \"Return-Path:\" are deleted no matter what."
  },
  "access" : {
    name: "Access headers",
    default: "",
    description: "If this file exists, all headers of a post to the list is matched against the rules. The first rule to match wins."
  }
}

var available_texts = {
  "prefix" : {
    name: "Prefix Text",
    default: "",
    description: "The prefix for the Subject: line of mails to the list. This will alter the Subject: line, and add a prefix if it's not present elsewhere."
  },
  "footer" : {
    name: "Footer text",
    default: "",
    description: "The content of this file is appended to mail sent to the list."
  }
}

var available_values = {
  "memorymailsize" : {
    name: "Memory mail size",
    default: "16384", 
    description: "Here is specified in bytes how big a mail can be and still be prepared for sending in memory. It's greatly reducing the amount of write system calls to prepare it in memory before sending it, but can also lead to denial of service attacks. Default is 16k (16384 bytes)."
  },
  "relayhost" : {
    name: "Relay host",
    default: "127.0.0.1", 
    description: "The host specified (IP address or hostname, both works) in this file will be used for relaying the mail sent to the list. Defaults to 127.0.0.1."
  },
  "digestinterval" : {
    name: "Digest interval", 
    default: "604800",
    description: "This file specifies how many seconds will pass before the next digest is sent. Defaults to 604800 seconds, which is 7 days."
  },
  "digestmaxmails" : {
    name: "Digest emails", 
    default: "50",
    description: "This file specifies how many mails can accumulate before digest sending is triggered. Defaults to 50 mails, meaning that if 50 mails arrive to the list before digestinterval have passed, the digest is delivered."
  },
  "bouncelife" : {
    name: "Bounce life time", 
    default: "432000",
    description: "Here is specified for how long time in seconds an address can bounce before it's unsubscribed. Defaults to 432000 seconds, which is 5 days."
  },
  "verp" : {
    name: "Verp control", 
    default: "",
    description: "Control how Mlmmj does VERP (variable envelope return path). If this tunable does not exist, Mlmmj will send a message to the SMTP server for each recipient, with an appropriate envelope return path, i.e. it will handle VERP itself. If the tunable does exist, Mlmmj will instead divide the recipients into groups (the maximum number of recipients in a group can be controlled by the maxverprecips tunable) and send one message to the SMTP server per group. The content of this tunable allows VERP to be handled by the SMTP server. If the tunable contains \"postfix\", Mlmmj will make Postfix use VERP by adding XVERP=-= to the MAIL FROM: line. If it contains something else, that text will be appended to the MAIL FROM: line. If it contains nothing, VERP will effectively be disabled, as neither Mlmmj nor the SMTP server will do it."
  },
  "maxverprecips" : {
    name: "Max recipients", 
    default: "100",
    description: "How many recipients per mail delivered to the SMTP server. Defaults to 100."
  },
  "smtpport" : {
    name: "SMTP port", 
    default: "25",
    description: "In this file a port other than port 25 for connecting to the relayhost can be specified."
  },
  "delimiter" : {
    name: "Delimiter", 
    default: "+",
    description: "This specifies what to use as recipient delimiter for the list. Default is '+'."
  },
  "maxmailsize" : {
    name: "Max mail size", 
    default: "",
    description: "With this option the maximal allowed size of incoming mails can be specified."
  },
  "staticbounceaddr" : {
    name: "Bounce address", 
    default: "",
    description: "If this is set to something@example.org, the bounce address (Return-Path:) will be fixed to something+listname-bounces-and-so-on@example.org in case you need to disable automatic bounce handling."
  }
}

MlmmjWrapper = function(path, name) {

  this.path = path + "/" + name

  // Empty control dict to hold flag values
  this.flags = {}
  this.lists = {}
  this.texts = {}
  this.values = {}

  // Check that group exist
  try {
    fs.openSync(this.path, 'r')
  } catch (err) {
    throw new Error("Group " + name + " doesn't exist")
  }
  
  // Check flags & stuff
  this.retrieveAll()

  return this

}

// "Static"
MlmmjWrapper.listGroups = function(path) {

  try {
    return fs.readdirSync(path)
  } catch (err) {
    throw new Error("Error opening base folder " + path + ". Are you sure mlmmj is installed ?")
  }

}

MlmmjWrapper.getAllAvailables = function() {

  return {
    flags: available_flags,
    lists: available_lists,
    values: available_values,
    texts: available_texts
  }

}

var p = MlmmjWrapper.prototype

p.retrieveAll = function() {
  this.retrieveFlags()
  this.retrieveTexts()
  this.retrieveLists()
  this.retrieveValues()
  this.retrieveSubscribers()
}

p.saveAll = function() {
  this.saveFlags()
  this.saveTexts()
  this.saveLists()
  this.saveValues()
  this.saveSubscribers()
}


/* FLAGS (boolean) */
p.retrieveFlags = function() {
  for (var flag in available_flags) {
    try {
      fs.openSync(this.path + "/" + control_folder + "/" + flag, 'r')
    } catch (err) {
      this.clearFlag(flag)
      continue
    }
    this.raiseFlag(flag)
  }
}

p.raiseFlag = function(name) {
  if (name in available_flags){
    this.flags[name] = true
  } else {
    throw new Error("'" + name + "' is not a valid flag")
  }
}

p.setFlag = function(name, bool) {
  if (name in available_flags){
    this.flags[name] = (bool==true)
  } else {
    throw new Error("'" + name + "' is not a valid flag")
  }
}

p.clearFlag = function(name) {
  if (name in available_flags){
    this.flags[name] = false
  } else {
    throw new Error("'" + name + "' is not a valid flag")
  }
}

p.getFlag = function(name) {
  if (name in available_flags){
    return (this.flags[name] === true)
  } else {
    throw new Error("'" + name + "' is not a valid flag")
  }
}

p.getFlags = function() {
  return this.flags
}

p.saveFlags = function() {
  for (var flag in available_flags) {
    if (this.getFlag(flag) == true) {
      fd = fs.openSync(this.path + "/" + control_folder + "/" + flag, 'w')
      fs.closeSync(fd)
    } else {
      try {
        fs.unlinkSync(this.path + "/" + control_folder + "/" + flag)
      } catch(err){}
    }
  }
}

/* TEXTS */
p.retrieveTexts = function() {
  for (var name in available_texts) {
    try {
      text = fs.readFileSync(this.path + "/" + control_folder + "/" + name, { "encoding": 'utf8'})
    } catch (err) {
      this.clearText(name)
      continue
    }
    this.setText(name, text)
  }
}

p.setText = function(name, text) {
  if (name in available_texts){
    this.texts[name] = text
  } else {
    throw new Error("'" + name + "' is not a valid text")
  }
}

p.clearText = function(name) {
  if (name in available_texts){
    this.texts[name] = ""
  } else {
    throw new Error("'" + name + "' is not a valid text")
  }
}

p.getText = function(name) {
  if (name in available_texts){
    return this.texts[name]
  } else {
    throw new Error("'" + name + "' is not a valid text")
  }
}

p.getTexts = function() {
  return this.texts
}

p.saveTexts = function() {
  var text = null
  for (var name in available_texts) {
    text = this.getText(name)
    if (text != "") {
      fd = fs.openSync(this.path + "/" + control_folder + "/" + name, 'w')
      fs.writeSync(fd, text)
      fs.closeSync(fd)
    } else {
      try {
        fs.unlinkSync(this.path + "/" + control_folder + "/" + name)
      } catch(err){}
    }
  }
}


/* VALUES */
p.retrieveValues = function() {
  for (var name in available_values) {
    try {
      value = fs.readFileSync(this.path + "/" + control_folder + "/" + name, { "encoding": 'utf8'})
    } catch (err) {
      this.clearValue(name)
      continue
    }
    this.setValue(name, value)
  }
}

p.setValue = function(name, value) {
  if (name in available_values){
    this.values[name] = value
  } else {
    throw new Error("'" + name + "' is not a valid value")
  }
}

p.clearValue = function(name) {
  if (name in available_values){
    this.values[name] = ""
  } else {
    throw new Error("'" + name + "' is not a valid value")
  }
}

p.getValue = function(name) {
  if (name in available_values){
    return this.values[name]
  } else {
    throw new Error("'" + name + "' is not a valid value")
  }
}

p.getValues = function() {
  return this.values
}

p.saveValues = function() {
  var val = null
  for (var name in available_values) {
    val = this.getValue(name)
    if (val != "") {
      fd = fs.openSync(this.path + "/" + control_folder + "/" + name, 'w')
      fs.writeSync(fd, val)
      fs.closeSync(fd)
    } else {
      try {
        fs.unlinkSync(this.path + "/" + control_folder + "/" + name)
      } catch(err){}
    }

  }
}

/* LISTS */
p.retrieveLists = function() {
  for (var name in available_lists) {
    try {
      l = fs.readFileSync(this.path + "/" + control_folder + "/" + name, { "encoding": 'utf8'})
    } catch (err) {
      this.clearList(name)
      continue
    }
    this.setList(name, l.split('\n\r'))
  }
}

p.setList = function(name, list) {
  if (name in available_lists){
    this.lists[name] = list
  } else {
    throw new Error("'" + name + "' is not a valid list")
  }
}

p.clearList = function(name) {
  if (name in available_lists){
    this.lists[name] = []
  } else {
    throw new Error("'" + name + "' is not a valid list")
  }
}

p.getList = function(name) {
  if (name in available_lists){
    return this.lists[name]
  } else {
    throw new Error("'" + name + "' is not a valid list")
  }
}

p.getLists = function() {
  return this.lists
}

p.saveLists = function() {
  var l = null
  for (var name in available_lists) {
    l = this.getList(name)
    if (l != "") {
      fd = fs.openSync(this.path + "/" + control_folder + "/" + name, 'w')
      fs.writeSync(fd,l.join('\n'))
      fs.closeSync(fd)
    } else {
      try {
        fs.unlinkSync(this.path + "/" + control_folder + "/" + name, 'w')
      } catch(err){}
    }
  }
}

/* Subscribers */
p.retrieveSubscribers = function() {
  this.subscribers = []

  var path = this.path + "/" + subscribers_master_folder
  files = fs.readdirSync(path)

  for (var key in files) {
    subs = fs.readFileSync(path + "/" + files[key], { "encoding": 'utf8'}).split('\n')
    for (var item in subs) {
      if (subs[item] != "") {
        this.subscribers.push(subs[item])
      }
    }
  }
}

p.removeSubscriber = function(element){
  var index = this.subscribers.indexOf(element)
  this.subscribers.splice(index, 1)
}

p.addSubscriber = function(element){
  this.subscribers.push(element)

}

p.getSubscribers = function() {
  return this.subscribers
}

p.saveSubscribers = function() {
  /* Empty directory first*/
  var path = this.path + "/" + subscribers_master_folder
  files = fs.readdirSync(path)
  for (var key in files) { fs.unlinkSync(path + "/" + files[key]) }
  /* Then recreates on file per first email character */
  for (var key in this.subscribers) {
    fd = fs.openSync(path + "/" + this.subscribers[key].charAt(0), 'a')
    fs.writeSync(fd, this.subscribers[key] + '\n')
    fs.closeSync(fd)
  }
}

p.listArchives = function(year, month) {
  var result = {}
    , dir = this.path + "/" + archive_folder
  try {
    var files = fs.readdirSync(dir)
              .map(function(v) { 
                  var timestamp = fs.statSync(dir + "/" + v).mtime

                  if (month != null) {
                    key = timestamp.getDate()
                    if (timestamp.getYear() + 1900 == year && timestamp.getMonth() + 1 == month) {
                      if ( !(result[key] instanceof Array)) {
                        result[key] = []
                      }
                      result[key].push(v);
                    }
                  } else if (year != null) {
                    key = timestamp.getMonth() + 1 // Starts from 0 = Jan
                    if (timestamp.getYear() + 1900 == year) {
                      if ( !(result[key] instanceof Array)) {
                        result[key] = []
                      }
                      result[key].push(v);
                    }
                  } else {
                    key = timestamp.getYear() + 1900
                    if ( !(result[key] instanceof Array)) {
                      result[key] = []
                    }
                    result[key].push(v);
                  }

                  return null; 
               })
  } catch (err) {
    throw new Error("Error opening archives at " + this.path + "/" + archive_folder)
  }

  return result
}


p.getArchive = function(id, callback) {
  email = fs.readFileSync(this.path + "/" + archive_folder + "/" + id, { "encoding": 'utf8'})
  mailparser.once('end', callback)
  return mailparser.end(email)
}

module.exports = MlmmjWrapper
