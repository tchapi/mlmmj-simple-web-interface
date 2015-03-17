$(document).ready(function(){

  // Function array
  var get = function() {}

  /*
    These functions retrieve the values, lists, flags, texts from the control page
    and return the corresponding variable.
  */
  get.prototype.flags = function(){
    var flags = {}
    $("#flags input").each(function(index){
      flags[this.id] = $(this).is(":checked")?1:0
    })
    return flags
  }

  get.prototype.texts = function(){
    var texts = {}
    $("#texts textarea").each(function(index){
      texts[this.id] = $(this).val()
    })
    return texts
  }

  get.prototype.values = function(){
    var values = {}
    $("#values input").each(function(index){
      values[this.id] = $(this).val()
    })
    return values
  }

  get.prototype.lists = function(){
    var lists = {}
    $("#lists textarea").each(function(index){
      lists[this.id] = $(this).val()
    })
    return lists
  }

  /*
    This function is called when users click on "Save" in the Control page.
    The clicked link contains a data-key attribute that we use to retrieve the values 
    in the page. We then send them out to the server.
  */
  $('.save').on('click', function() {
    $(this).find('.saving').show();
    $(this).find(':not(.saving)').hide();
    item = $(this).attr('data-key')
    data = (new get())[item]()

    $.post(this.href + '/' + item, data, function( data ) {
      if (data == 1) {
        console.log("saved")
      } else {
        console.log("error")
      }
      $(this).find('.saving').hide();
      $(this).find(':not(.saving)').show();
    }.bind(this))

    return false
  })

  /*
    This function is called when users add an element from a group of elements of the group.
    This applies to subscribers, for instance.
    The clicked link contains a data-key and data-element attribute; The data-key 
    indicates the type of element we are adding, and the data-element is the element we want to add.
  */
  $('.add').on('click', function() {
    item = $(this).attr('data-key')
    group = $(this).attr('data-group')
    value = $("input[data-key=" + item + "]").val()
    data = { 'element' : value }

    if(value != "") {
      $.post(this.href + '/' + item, data, (function( data ) {
        if (data == 1) {
          console.log("added")
          $("#" + item).append('<li>' + value + ' <a class="remove" href="/group/' + group + '/remove" data-key="' + item + '" data-element="' + value + '">Remove</a></li>')
        } else {
          console.log("error")
        }
      }).bind(this))
    }
    
    return false
  })

  /*
    This function is called when users remove an element from a group of elements of the group.
    This applies to subscribers, for instance.
    The clicked link contains a data-key and data-element attribute; The data-key 
    indicates the type of element we are removing, and the data-element is the element we are removing.
  */
  $(document).on('click', '.remove', function() {
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

})
