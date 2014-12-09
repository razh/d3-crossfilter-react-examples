import _ from 'lodash';
import d3 from 'd3';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

function createChart( el, props ) {
  var { data, margin, width, height } = props;

  data = data || _.range( 128 ).map( randomGaussian );
  margin = margin || { top: 48, left: 48, bottom: 48, right: 48 };
  width = ( width || 640 ) - margin.left - margin.right;
  height = ( height || 320 ) - margin.top - margin.bottom;

  var xAccessor = ( d, i ) => i;
  var yAccessor = d => d;

  var extent = d3.extent( data, xAccessor );

  var x = d3.scale.linear()
    .domain( extent )
    .range( [ 0, width ] );

  var y = d3.scale.linear()
    .domain( d3.extent( data, yAccessor ) )
    .range( [ height, 0 ] );

  var xAxis = d3.svg.axis()
    .scale( x )
    .orient( 'bottom' );

  var yAxis = d3.svg.axis()
    .scale( y )
    .orient( 'left' );

  var line = d3.svg.line()
    .x( _.compose( x, xAccessor ) )
    .y( _.compose( y, yAccessor ) );

  var svg = d3.select( el ).append( 'svg' )
    .attr( 'width', width + margin.left + margin.right )
    .attr( 'height', height + margin.top + margin.bottom );

  var g = svg.append( 'g' )
    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

  g.append( 'clipPath' )
    .attr( 'id', 'clip' )
  .append( 'rect' )
    .attr( 'x', 0 )
    .attr( 'y', 0 )
    .attr( 'width', width )
    .attr( 'height', height );

  var xAxisGroup = g.append( 'g' )
    .attr( 'class', 'x axis' )
    .attr( 'transform', 'translate(0,' + height + ')' );

  var yAxisGroup = g.append( 'g' )
    .attr( 'class', 'y axis' );

  var linePath = g.append( 'path' )
    .datum( data )
    .attr( 'class', 'line' )
    .attr( 'clip-path', 'url(#clip)' );

  function update() {
    // Translation constraint.
    var domain = x.domain();
    var range = x.range();
    var translate = zoom.translate();

    if ( domain[0] < extent[0] ) {
      zoom.translate( [ translate[0] - x( extent[0] ) + range[0], translate[1] ] );
    } else if ( domain[1] > extent[1] ) {
      zoom.translate( [ translate[0] - x( extent[1] ) + range[1], translate[1] ] );
    }

    // Update chart.
    xAxisGroup.call( xAxis );
    yAxisGroup.call( yAxis );
    linePath.attr( 'd', line );
  }

  var zoom = d3.behavior.zoom()
    .on( 'zoom', update )
    .x( x )
    .scaleExtent( [ 1, Infinity ] );

  g.append( 'rect' )
    .attr( 'class', 'pane' )
    .attr( 'width', width )
    .attr( 'height', height )
    .call( zoom );

  update();
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
