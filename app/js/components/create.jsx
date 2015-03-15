'use strict';

var React = require('react');
var _     = require('lodash');
var num   = require('numeral');

var Mui = require('material-ui');
var Paper = Mui.Paper;
var DropDownMenu = Mui.DropDownMenu;
var RadioButtonGroup = Mui.RadioButtonGroup;
var RadioButton = Mui.RadioButton;
var TextField = Mui.TextField;
var RaisedButton = Mui.RaisedButton;

var ref = require('app/ref.js');
var STATUSES = require('app/constants.js').statuses;

module.exports = React.createClass({
  displayName: 'Add Product',

  statusMenuItems: ( () => {
    return STATUSES.map( (s) => {
      return {payload: s, text: s}
    });
  })(),

  getInitialState() {
    return {
      showAddProductForm: false,
      status: STATUSES[0]
    }
  },

  toggleAddProductForm() {
    this.setState({
      showAddProductForm: !this.state.showAddProductForm
    })
  },
  _onChangeName(e) {
    this.setState({
      name: e.target.value
    });
  },
  _onChangeProductCode(e) {
    this.setState({
      productCode: e.target.value.trim()
    });
  },
  _onChangeStatus(e, index, menuItem) {
    this.setState({
      status: menuItem.payload
    });
  },

  createNew(e) {
    e.preventDefault();
    var id = this.state.productCode;
    var name = this.state.name.trim();
    var status = this.state.status;
    ref.child(`products/${id}`).transaction( (current) => {
      if (current === null) {
        return {
          id: id,
          name: name,
          status: status,
          createdOn: (new Date).toJSON(),
          qty: 0,
          createdBy: ref.getAuth().uid
        };
      } else {
        let err = new Error('Product code already exists')
        err.code = 'ID_TAKEN';
        this.onError(err);
        return;
      }
    }, (error, committed, snapshot) => {
      if (error) {
        this.onError(error);
      } else if (!committed) {
        // id taken
      } else {
        this.onSuccess(snapshot.val());
      }
    });
  },

  onSuccess(val) {
    console.log(val);
  },

  onError(err) {
    console.log(err);
  },

  render() {
    return (
      <div className="add-product">
        <RaisedButton
          label={this.state.showAddProductForm ? 'Cancel' : '+ Add Product'}
          onClick={this.toggleAddProductForm} />
        {this.state.showAddProductForm && (
          <Paper zDepth={1} className="paper-container">
            <form onSubmit={this.createNew}>
              <h3>Add New Product</h3>
              <div>
                <TextField
                  value={this.state.name}
                  onChange={this._onChangeName}
                  hintText="Full Product Name"
                  floatingLabelText="Product Name" />
              </div>
              <div>
                <TextField
                  value={this.state.productCode}
                  onChange={this._onChangeProductCode}
                  hintText="UC-00000 (no spaces)"
                  floatingLabelText="Product Code" />
              </div>
              <div>
                <label>Status: </label>
                <DropDownMenu
                  onChange={this._onChangeStatus}
                  menuItems={this.statusMenuItems} />
              </div>
              <p>
                <RaisedButton
                  secondary={true}
                  type="submit"
                  label="Save New Product +" />
              </p>
            </form>
          </Paper>
        )}
      </div>
    )
  }
})
