import _ from 'lodash';
import d3 from 'd3';
import React from 'react/addons';

function createChart( el, props ) {
  var { data, margin, width, height } = props;

  data = data || [ 0, 7, 2, 1, 8 ];
  margin = margin || { top: 48, left: 48, bottom: 48, right: 48 };
  width = ( width || 640 ) - margin.left - margin.right;
  height = ( height || 320 ) - margin.top - margin.bottom;

  var xAccessor = ( d, i ) => i;
  var yAccessor = d => d;

  var x = d3.scale.linear()
    .domain( d3.extent( data, xAccessor ) )
    .range( [ 0, width ] );

  var y = d3.scale.linear()
    .domain( d3.extent( data, yAccessor ) )
    .range( [ height, 0 ] );

  var line = d3.svg.line()
    .x( _.compose( x, xAccessor ) )
    .y( _.compose( y, yAccessor ) );

  var svg = d3.select( el ).append( 'svg' )
    .attr( 'width', width + margin.left + margin.right )
    .attr( 'height', height + margin.top + margin.bottom );

  var g = svg.append( 'g' )
    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

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
    return <div>{this.props.children}</div>;
  }
});
