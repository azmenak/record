'use strict';

var React = require('react');
var Router = require('react-router');
var App = require('app/components/app.jsx');
var Home = require('app/components/home.jsx');

var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;

module.exports = (
  <Route name="app" handler={App} path="/">
    <DefaultRoute handler={Home} />
  </Route>
)
