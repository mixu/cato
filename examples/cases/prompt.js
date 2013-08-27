var View = Cato.View,
    $ = Cato.Shim;

function Dialog() {
  var self = this;
  View.call(this);
  this.dialog = {};
  this.on('show', function(message) {
    this.dialog = message;
    if (message.prompt) {
      $j('#' + self.promptId).html(message.prompt);
    }
    if (message.value) {
      $j('#' + self.inputId).val(message.value).show();
    } else {
      $j('#' + self.inputId).hide();
    }
    $j('#' + self.id).find(':input:first').focus();
  });
}

View.mixin(Dialog);

Dialog.prototype.render = ...;
