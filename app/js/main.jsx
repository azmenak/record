'use strict';

var React = require('react');
window.React = React;

var Router = require('react-router');
var Routes = require('app/routes.jsx');

Router.run(Routes, Router.HistoryLocation, function (Handler) {
  React.render( <Handler />, document.body);
});
