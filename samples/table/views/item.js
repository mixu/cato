var View = require('../../../lib/view.js'),
    $ = require('../../../lib/shim.js'),
    microee = require('microee');

function ItemView() { }

View.mixin(ItemView);

ItemView.prototype.render = function() {
  var model = this.model;
  // render / create elements
  var ids = [$.id(), $.id(), $.id()];
  var elements = $.el('tr', { }, [
      $.el('td', { id: ids[0] }, model.get('name')),
      '<td>Data Set</td><td>Script</td>',
      $.el('td', { id: ids[1] }, model.get('records') + ' records'),
      $.el('td', { id: ids[2] }, model.get('last_modified')),
    ]);
  // create subscriptions to local elements
  model.on('change:name', function() {
    $(ids[0]).update(model.get('name'));
  });
  model.on('change:records', function() {
    $(ids[1]).update(model.get('records') + ' records');
  });
  model.on('change:last_modified', function() {
    $(ids[2]).update(model.get('last_modified'));
  });

  return elements;
};

module.exports = ItemView;
