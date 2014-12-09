import _ from 'lodash';
import d3 from 'd3';
import React from 'react/addons';

function createChart( el, props ) {
  var { data, width, height, margin } = props;

  data = data || [ 0, 7, 2, 1, 8 ];
  width = width || 640;
  height = height || 320;
  margin = margin || { top: 48, left: 48, bottom: 48, right: 48 };

  var xAccessor = ( d, i ) => i;
  var yAccessor = d => d;

  var svg = d3.select( el ).append( 'svg' )
    .attr( 'width', width )
    .attr( 'height', height );

  var x = d3.scale.linear()
    .domain( d3.extent( data, xAccessor ) )
    .range( [ 0, width - margin.left - margin.right ] );

  var y = d3.scale.linear()
    .domain( d3.extent( data, yAccessor ) )
    .range( [ height - margin.top - margin.bottom, 0 ] );

  var g = svg.append( 'g' )
    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

  var line = d3.svg.line()
    .x( _.compose( x, xAccessor ) )
    .y( _.compose( y, yAccessor ) );

  g.append( 'path' )
    .datum( data )
    .attr( 'class', 'line' )
    .attr( 'd', line );
}

export default React.createClass({
  componentDidMount() {
    createChart( this.getDOMNode(), this.props );
  },

  shouldComponentUpdate() {
    createChart( this.getDOMNode(), this.props );
    return false;
  },

  render() {
    return <div {...this.props}>{this.props.children}</div>;
  }
});
