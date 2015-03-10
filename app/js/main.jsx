'use strict';

var React = require('react');

var Test = React.createClass({
  render: function() {
    return <h1>Hello {this.props.name}</h1>;
  }
});

React.render(<Test name="World" />, document.body);
