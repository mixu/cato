var CollectionView = require('../../../lib/collection_view.js'),
    $ = require('../../../lib/shim.js'),
    microee = require('microee');

var ItemView = require('./item.js');

function TableView() {
  this._childView = ItemView;
  this._state = 'initialized';
};

CollectionView.mixin(TableView);

module.exports = TableView;
