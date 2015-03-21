'use strict';

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var Mui = require('material-ui');
var FlatButton = Mui.FlatButton;

/**
 * This is a controlled component
 * Updates are pass down thought props from app.jsx
 */

module.exports = React.createClass({
  displayName: 'Header',

  menu() {
    if (!this.props.user) { return []; }
    var _menu = [
      {to: 'home', name: 'Home'},
    ];
    if (this.props.user.admin || this.props.user.editor) {
      _menu.push({to: 'manage', name: 'Manage'});
    }
    return _menu;
  },

  render() {
    return (
      <header>
        <div className="topbar">
          <h2>Record</h2>
          {!this.props.user && (
            <span className="loading">Authenticating...</span>
          )}
          <nav>
            <ul>
              {this.menu().map( (m) => { return (
                <li key={m.name}>
                  <Link to={m.to}>
                    {m.name}
                  </Link>
                </li>
              ) })}
            </ul>
          </nav>
        </div>
      </header>
    )
  }
});
