import React from 'react/addons';
import Router from 'react-router';

var { Route, RouteHandler } = Router;

var App = React.createClass({
  render() {
    return (
      <div>
        Hello world!
        <RouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Route path='/' handler={App}/>
);

Router.run( routes, Handler => {
  React.render( <Handler/>, document.querySelector( '.main' ) );
});
