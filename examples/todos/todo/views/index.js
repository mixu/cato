module.exports = {

  // If you hit return in the main input field, create new **Todo** model,
  // persisting it to *localStorage*.
  "#createOnEnter": function() {
    if (e.keyCode != 13) return;
    /*
    if (!this.input.val()) return;

    Todos.create({title: this.input.val()});
    this.input.val('');
    */
    var val = $('#'+this.bound[1]).val();
    if (!val) return;
    Todos.create({title: val });

    //   Todos.add( new Model({ done: false, title: $('#'+this.bound[0]).val() }));

    $('#'+this.bound[1]).val('');

  }

};

