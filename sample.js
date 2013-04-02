var Collection = require('./lib/collection.js'),
    View = require('./lib/view.js'),
    CollectionView = require('./lib/collection_view.js');

var table = new Collection([
    { name: 'Project Vega', records: 4834,  last_modified: new Date() },
    { name: 'Project Foo', records: 123,  last_modified: new Date() }
  ]);

function ItemView() {

}

View.mixin(ItemView);

ItemView.prototype.render = function() {
  var model = this.model;
  return '<tr><td>'+model.name+'</td><td>Data Set</td><td>Script</td><td>'+model.records+' records</td><td>'+model.last_modified+'</td></tr>';
};

function TableView() {
  this._childView = ItemView;

  this._state = 'initialized';
};

CollectionView.mixin(TableView);

var tableView = new TableView();

table.pipe(tableView);

// render top level view

console.log(tableView.render());
