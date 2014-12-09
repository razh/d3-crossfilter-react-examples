import React from 'react/addons';
import Router from 'react-router';

var { Route, RouteHandler, Link, HistoryLocation } = Router;

import BasicD3 from './basic-d3/';
import BasicReact from './basic-react/';

var App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to='basic-d3'>Basic D3</Link></li>
          <li><Link to='basic-react'>Basic React</Link></li>
        </ul>
        <RouteHandler/>
      </div>
    );
  }
});

var routes = (
  <Route path='/' handler={App}>
    <Route name='basic-d3' path='/basic-d3' handler={BasicD3}/>
    <Route name='basic-react' path='/basic-react' handler={BasicReact}/>
  </Route>
);

Router.run( routes, HistoryLocation, Handler => {
  React.render( <Handler/>, document.querySelector( '.main' ) );
});
