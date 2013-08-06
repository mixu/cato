# Cato testing plan

  given a collection
    ✓ single wrapping element
    ✓ render method wrapper

  event tests -
    ✓ render event is emitted on a view
    ✓ render event is emitted on a outlet
    ✓ attach event is emitted on a view
    ✓ attach event is emitted on a outlet
    ✓ show and hide events are emitted on a view
    unbind and rebind events
      ✓ can unbind a specific model or all models
      ✓ can rebind a specific model

  event tests - nested events
    ✓ attach and render events are emitted on an tag, and all its content descendants
    ✓ attach and render events are emitted on an array, and all its descendants
    ✓ attach and render events are emitted on a outlet, and all its descendants

  event tests - outlet
    ✓ render, attach and destroy events are emitted when new items are added and removed in an outlet
    ✓ show and hide events are emitted on the contents when calling outlet.toggle()

  model bindings
    ✓ function on a tag
    ✓ function with model listeners
    ✓ function as attribute binding
    ✓ function as onX attribute binding
    ✓ given a view with tags with bound values and bound attributes, manually assigning ids to the tags with bindings is optional
    ✓ it should be possible to update the contents of an attached view with new renderables that include bindings
    ◦ when the new content in update() does not contain any root views, but contains tags that expect "attach", they should still call listenTo / l    ✓ when the new content in update() does not contain any root views, but contains tags that expect "attach", they should still call listenTo / listenDom on the parent

  shim util tests
    ✓ multiply-sum example
    ✓ dfsTraverse can traverse a tree of tags, with parentTag
    ✓ dfsTraverse can traverse a tree of tags and views, with parentTag and parentView
    ✓ dfsTraverse can be used to collect a tags-only tree
    ✓ allow tag(name, attr, content) to be called as tag(name, content)
    ✓ allow tag(name, attr, content) to be called as tag(name)

  unified rendering -
    simple
      ✓ render a html string
      ✓ render single tag
      ✓ render single view
      ✓ render single outlet
    container
      ✓ render string inside tag
      ✓ render string inside outlet
      ✓ render tag inside tag
      ✓ render tag inside outlet
      ✓ render view inside tag
      ✓ render view inside outlet
      ✓ render outlet inside tag
      ✓ render outlet inside outlet
    arrays
      ✓ render array inside tag
      ✓ render array inside outlet

  viewify -
    ✓ can viewify a string
    ✓ can viewify a tag
    ✓ can viewify an array of renderables


  44 passing (40 ms)


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
