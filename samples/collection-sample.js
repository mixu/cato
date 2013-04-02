var util = require('util');

var Collection = require('../lib/collection.js'),
    TableView = require('./table/views/table.js'),
    Project = require('./models/project.js');

var tableView = new TableView(),
    table = new Collection([
      { name: 'Project Vega', records: 4834,  last_modified: new Date() }
    ], { model: Project });

table.pipe(tableView);

// render top level view
console.log(util.inspect(tableView.render(), null, 10, true));

// add an item to the collection
table.add({name: 'Project Foo', records: 123,  last_modified: new Date() });
console.log(util.inspect(tableView.render(), null, 10, true));

// change a variable in a model
table.get(1)
  .set('name', 'Project Bar')
  .set('records', 7000);
console.log(util.inspect(tableView.render(), null, 10, true));

// remove an item from the collection
// reset the collection
