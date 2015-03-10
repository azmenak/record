'use strict';

var React = require('react');
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;

module.exports = React.createClass({
  displayName: 'App',

  render() {
    return (
      <main className="frame">
        <header><h1>Header</h1></header>
        <div className="app">
          <RouteHandler />
        </div>
      </main>
    )
  }
});
