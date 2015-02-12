import React from 'react/addons';
import Router from 'react-router';

import BasicD3 from './basic-d3/';
import BasicReact from './basic-react/';
import D3Controls from './d3-controls/';
import BasicCrossfilter from './basic-crossfilter/';

const { Route, RouteHandler, Link, HistoryLocation } = Router;

const App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to='basic-d3'>Basic D3</Link></li>
          <li><Link to='basic-react'>Basic React</Link></li>
          <li><Link to='d3-controls'>D3 Controls</Link></li>
          <li><Link to='basic-crossfilter'>Basic Crossfilter</Link></li>
        </ul>
        <RouteHandler/>
      </div>
    );
  }
});

const routes = (
  <Route path='/' handler={App}>
    <Route name='basic-d3' path='/basic-d3' handler={BasicD3}/>
    <Route name='basic-react' path='/basic-react' handler={BasicReact}/>
    <Route name='d3-controls' path='/d3-controls' handler={D3Controls}/>
    <Route name='basic-crossfilter' path='/basic-crossfilter' handler={BasicCrossfilter}/>
  </Route>
);

Router.run( routes, HistoryLocation, Handler => {
  React.render( <Handler/>, document.querySelector( '.main' ) );
});
