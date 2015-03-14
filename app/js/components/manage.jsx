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

  onValueChange: null,

  componentWillMount() {
    this.onValueChange = ref.child('products').on('value', (snap) => {
      if (!this.isMounted()) return;
      this.setState({
        keys: _.keys(snap.val())
      });
    })
  },

  componentWillUnmount() {
    ref.child('products').off('value', this.onValueChange);
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
