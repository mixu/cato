
/*
  TableView is a subclass of CollectionView.

  It adds:

  - the ability to sort by a column
  - pagination
  - rendering a visible portion only
  - filtering

  Sorting is done on the underlying collection directly.
  In other words, a click on a sortable column results in
  - a change in the params of the sortBy function on the BB collection
  - a call to collection.sort() to force a re-sort

  Options:

    title: 'Name',
    content: 'name'

*/
