var util = require('util');

var Collection = require('./lib/collection.js'),
    View = require('./lib/view.js'),
    CollectionView = require('./lib/collection_view.js'),
    $ = require('./lib/shim.js');

function ItemView() {

}

View.mixin(ItemView);

ItemView.prototype.render = function() {
  var model = this.model;
  return $.el('tr', { }, [
      $.el('td', { id: $.id() }, model.get('name')),
      '<td>Data Set</td><td>Script</td>',
      $.el('td', { id: $.id() }, model.get('records') + ' records'),
      $.el('td', { id: $.id() }, model.get('last_modified')),
    ]);
};

function TableView() {
  this._childView = ItemView;

  this._state = 'initialized';
};

CollectionView.mixin(TableView);

function Project(attrs) {
  this._data = attrs;
}

Project.prototype.set = function(k, v) {
  this._data[k] = v;
  return this;
};

Project.prototype.get = function(k) {
  return this._data[k];
}

var tableView = new TableView(),
    table = new Collection([
      { name: 'Project Vega', records: 4834,  last_modified: new Date() },
      { name: 'Project Foo', records: 123,  last_modified: new Date() }
    ], { model: Project });

table.pipe(tableView);

// render top level view
console.log(util.inspect(tableView.render(), null, 10, true));

table.get(1).set('name', 'Project Bar');

console.log(util.inspect(tableView.render(), null, 10, true));
