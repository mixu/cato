# Cato testing plan

## How to express functions on items in collections which are not populated yet?

E.g:

    function(scripts) {
      if (!scripts || !scripts.at || !scripts.at(0)) {
        if (scripts instanceof Backbone.Collection) {
          scripts.once('add', function(model) {
            $(self.linkId).attr('href', '/data/' + model.get('_id'));
          });
        }
      }
      return scripts.at(0).get();
    }

## Test piping before the target element is rendered

    var scriptListView = new ScriptListView();

    // pipe after rendered, not before
    setTimeout(function() {
      var scripts = model.get('scripts');
      if (scripts.pipe) {
        scripts.pipe(scriptListView);
      } else {
        console.log('.pipe missing', scripts);
      }
    }, 100);

    return $.tag('td', { }, scriptListView);

## Switch from ._render to .render

## Test rending where the tags require a model to be bound, but none is available

- This should eliminate the need to distinguish between render and bind

## Test binding before rendering

    // TRICKY - bind can be called before `.render`
    // (e.g. in a outlet, where children are bound then rendered) or after `.render`
    // (e.g. when rendered directly, then bound)
    // Need to define what the model is for
    // event order, and how to deal with rendering unbound stuff...


## Implement .rebind

## How to express a fetch+pipe of a external resource?

e.g.

    this.sourceView = new SourceSelectView();
    this.once('show', function() {
      // rebind the source view
      var collection = mmm.stream('DataSource', { }, function() {
        collection.pipe(self.sourceView);
      });
    });

## Test sorting collections
