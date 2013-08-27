var View = Cato.View,
    $ = Cato.Shim;

function Edit() {
  var self = this;
  View.call(this);
  this.on('show', function() {
    $j('#' + self.errorId).hide();
    $j('#' + self.id).find(':input:first').focus();
    $j('#' + self.id + ' > form')[0].reset();
  });
}

View.mixin(Edit);

Edit.prototype.render = ...;

Edit.prototype.save = function() {
  var data = $j('#' + this.id).find('form').serializeObject();

  var errors = '';
  ['hostname'].forEach(function(key) {
    if (!data[key] || data[key].trim().length === 0) {
      errors += key.charAt(0).toUpperCase() + key.slice(1) + ' should not be empty.<br>';
    }
  });
  if (errors.length > 0) {
    $j('#' + this.errorId).html(errors).show();
    return;
  }

  new Source().save(data, {
    success: function() { },
    error: function() { }
  });
};
