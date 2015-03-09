$(document).ready(function(){

  // Function array
  var get = function() {}

  get.prototype.flags = function(){
    var flags = {}
    $("ul.flags li > input").each(function(index){
      flags[this.id] = $(this).is(":checked")?1:0
    })
    return flags
  }

  get.prototype.texts = function(){
    var texts = {}
    $("ul.texts li > textarea").each(function(index){
      texts[this.id] = $(this).val()
    })
    return texts
  }

  get.prototype.values = function(){
    var values = {}
    $("ul.values li > input").each(function(index){
      values[this.id] = $(this).val()
    })
    return values
  }

  get.prototype.lists = function(){
    var lists = {}
    $("ul.lists li > textarea").each(function(index){
      lists[this.id] = $(this).val()
    })
    return lists
  }


  $('.save').on('click', function() {
    item = $(this).attr('data-key')
    data = (new get())[item]()

    $.post(this.href + '/' + item, data, function( data ) {
      if (data == 1) {
        console.log("saved")
      } else {
        console.log("error")
      }
    })

    return false
  })

  $('.remove').on('click', function() {
    item = $(this).attr('data-key')
    data = { 'element' : $(this).attr('data-element') }

    $.post(this.href + '/' + item, data, (function( data ) {
      if (data == 1) {
        console.log("removed")
        $(this).parent().remove()
      } else {
        console.log("error")
      }
    }).bind(this))

    return false
  })

  $('.add').on('click', function() {
    item = $(this).attr('data-key')
    value = $("input[data-key=" + item + "]").val()
    data = { 'element' : value }

    $.post(this.href + '/' + item, data, (function( data ) {
      if (data == 1) {
        console.log("added")
        $('<li>' + value + '</li>').insertBefore($(this).parent())
      } else {
        console.log("error")
      }
    }).bind(this))

    return false
  })

})
