
## Types

- value binding
- model binding
- collection

The base object type is a eventemitter.

- a value binding is a binding to a specific property change event
- a model binding is a wildcard binding to change events
- a collection binding is a one-way binding from the collection items to a set of views, each using either model or value bindings

## Events emitted by models and collections

E.g. Backbone's set of events for collections:

- "add" (model, collection, options) — when a model is added to a collection.
- "remove" (model, collection, options) — when a model is removed from a collection.
- "reset" (collection, options) — when the collection's entire contents have been replaced.

and for models:

- "change" (model, options) — when a model's attributes have changed.
- "change:[attribute]" (model, value, options) — when a specific attribute has been updated.
- "destroy" (model, collection, options) — when a model is destroyed.

Collection methods:

- .pipe(dest)

View methods:

- .bind(model) (~ e.g. analoguous to writable.write())
- .render() <- from user

CollectionView methods:

- .bind(model) (~ e.g. analoguous to writable.write())
- .render(): simply renders the container, contents added incrementally (could be collection-aware for less DOM thrashing in the long term)

