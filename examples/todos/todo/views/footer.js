
module.exports = {

  // Clear all done todo items, destroying their models.
  "#clearCompleted": function() {
    _.each(Todos.done(), function(todo){ todo.clear(); });

    //   Todos.done().forEach(function() {
    //  todo.set('done', true); // should delete the todo as well
    //  window.events.emit('model.done');
    // });

    return false;
  }
};

