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

  onValueChange: null,

  componentWillMount() {
    this.onValueChange = ref.child("products").on("value", (snap) => {
      if (!this.isMounted()) return;
      this.setState({
        products: (_.isArray(snap.val()) ? snap.val() : _.values(snap.val()))
      });
    })
  },

  componentWillUnmount() {
    ref.child("products").off("value", this.onValueChange);
  },

  render() {
    var products = _.compact(this.state.products.map( (product) => {
      if (product.status !== 'CURRENT') return;
      return (
        <tr className="pr" key={product.name}>
          <th>{product.name}</th>
          <td>{num(product.qty).format('0,0')+' ft²'}</td>
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
