'use strict';

var React = require('react');
var _ = require('lodash');

var ref = require('app/ref.js');

module.exports = React.createClass({
  displayName: 'Manage',

  getInitialState() {
    return {
      keys: []
    }
  },

  componentWillMount() {
    ref.child('products').on('value', (snap) => {
      var keys = _.keys(snap.val());
      this.setState({keys});
    })
  },

  render() {
    return (
      <div className="manage-page page">
        <h2>Manage Inventory</h2>

        {this.state.keys.map( (k) => { return (
          <p key={k}>{k}</p>
        )})}
      </div>
    )
  }
})
