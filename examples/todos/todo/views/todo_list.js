var VJS = require('viewjson2');

module.exports = {
  "alter @collection": function(collection) {
    $('.main').visible(collection.length > 0);
  },

  // Toggle the `"done"` state of the model.
  "#toggleDone": function(model) {
    model.toggle();
  },

  // Switch this view into `"editing"` mode, displaying the input field.
  "#edit": function(model) {
    /*
    this.$el.addClass("editing");
    this.input.focus();
    */
    $('#'+this.bound[0]).addClass('editing');

    //   this.model.set('title', $('#'+this.bound[5]).val());

    $('#'+this.bound[5]).focus();
  },

  // Close the `"editing"` mode, saving changes to the todo.
  "#close": function(model) {
    /*
    var value = this.input.val();
    if (!value) this.clear();
    this.model.save({title: value});
    this.$el.removeClass("editing");
    */
    var value = $('#'+this.bound[5]).val();
    if (!value) this.clear();
    this.model.set('title', value);
    $('#'+this.bound[0]).removeClass('editing');
  },

  // Remove the item, destroy the model.
  "#clear": function(model) {
    this.model.clear();
  },

  // If you hit `enter`, we're through editing the item.
  "#updateOnEnter": function(model) {
    if (e.keyCode == 13) this.close();
  },

  "#toggleAllComplete": function(model) {
    // ?? How does this know about the collection??

    var done = $('.toggle-all').prop('checked');

    VJS.db('todos').forEach(function(todo) {
      todo.save({'done': done});
    });


  }

};
