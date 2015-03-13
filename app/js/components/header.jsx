'use strict';

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var Mui = require('material-ui');
var FlatButton = Mui.FlatButton;

module.exports = React.createClass({
  displayName: 'Header',

  menu() {
    if (!this.props.user) { return []; }
    var _menu = [
      {to: 'home', name: 'Overview'},
      {to: 'manage', name: 'Manage Iventory'}
    ];
    return _menu;
  },

  render() {
    return (
      <header>
        <div className="topbar">
          <h2>Record</h2>
          <nav>
            <ul>
              {this.menu().map( (m) => { return (
                <li key={m.name}>
                  <FlatButton>
                    <Link to={m.to}>
                      <span className="mui-flat-button-label">
                        {m.name}
                      </span>
                    </Link>
                  </FlatButton>
                </li>
              ) })}
            </ul>
          </nav>
        </div>
      </header>
    )
  }
});
