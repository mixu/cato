var $ = require('cato').Shim,
    CollectionView = require('cato').CollectionView,
    RowView = require('./table-row.js');

function TableView() {
  CollectionView.call(this, 'table', {},
      $.tag('th', [
        $.tag('td', 'Name'),
        $.tag('td', 'Last modified')
      ]));
  this._childView = RowView;
}

CollectionView.mixin(TableView);

/*
TableView.prototype._render = function(outlet) {
  this.id = $.id();
  return $.tag('table', { id: this.id }, [
      $.tag('th', [
        $.tag('td', 'Name'),
        $.tag('td', 'Last modified')
      ]),
      outlet
    ]);
};
*/

module.exports = TableView;
