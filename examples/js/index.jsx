import React from 'react/addons';
import Router from 'react-router';

var { Route, RouteHandler, Link, HistoryLocation } = Router;

import BasicReact from './basic-react/';

var App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to='basic-react'>Basic React</Link></li>
        </ul>
        <RouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Route path='/' handler={App}>
    <Route name='basic-react' path='/basic-react' handler={BasicReact}/>
  </Route>
);

Router.run( routes, HistoryLocation, Handler => {
  React.render( <Handler/>, document.querySelector( '.main' ) );
});
