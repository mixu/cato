var VJS = require('viewjson2');

module.exports = {

  init: function(path) {

    // note: views have no inherent names (just file names)

    var indexView = new VJS.view('views/index'),
        todoList = new VJS.view('views/todo_list'),
        footer = new VJS.view('views/footer');

    // the index view "selects @views"

    indexView.emit('@View', todoList);
    indexView.emit('@View', footer);

    // connect a data source

    VJS.db('todos').pipe(todoList);

    // this gets rendered in the VJS wrapper (html + head + body)
    return indexView;
  }
};
