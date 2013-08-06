var CollectionView = Cato.CollectionView,
    $ = Cato.Shim;

function TableView() {
  CollectionView.call(this, ...);
  this._childView = ItemView;
}

CollectionView.mixin(TableView);
