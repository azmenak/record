'use strict';

var React = require('react');
var _ = require('lodash');
var num = require('numeral');
var ref = require('app/ref.js');

module.exports = React.createClass({
  displayName: 'Home Page',

  getInitialState() {
    return {products: []};
  },

  componentWillMount() {
    ref.child("products").on("value", (snap) => {
      this.setState({
        products: (function() {
          let val = snap.val();
          if (_.isArray(val)) {
            return val;
          } else {
            return _.values(val); 
          }
        })()
      });
    })
  },

  componentWillUnmount() {
    ref.child("products").off("value");
  },

  render() {
    var products = _.compact(this.state.products.map( (product) => {
      if (product.status !== 'CURRENT') return;
      return (
        <tr className="pr" key={product.name}>
          <th>{product.name}</th>
          <td>{product.qty}</td>
          <td>{num(product.qty*22.05).format('0,0')+' ft²'}</td>
        </tr>
      );
    }));

    return (
      <div className="page home-page">
        <h2>Inventory Overview</h2>
        {products.length === 0 && (<p>Loading inventory data...</p>)}
        {products.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Box Count</th>
                <th>Sq.Ft.</th>
              </tr>
            </thead>
            <tbody>
              {products}
            </tbody>
          </table>
        )}
      </div>
    )
  }
});
