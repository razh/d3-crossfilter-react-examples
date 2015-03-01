import _ from 'lodash';
import d3 from 'd3';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

function createChart( el, props ) {
  let { data, margin, width, height } = props;

  width = width - margin.left - margin.right;
  height = height - margin.top - margin.bottom;

  const xAccessor = ( d, i ) => i;
  const yAccessor = d => d;

  const extent = d3.extent( data, xAccessor );

  const x = d3.scale.linear()
    .domain( extent )
    .range( [ 0, width ] );

  const y = d3.scale.linear()
    .domain( d3.extent( data, yAccessor ) )
    .range( [ height, 0 ] );

  const xAxis = d3.svg.axis()
    .scale( x )
    .orient( 'bottom' );

  const yAxis = d3.svg.axis()
    .scale( y )
    .orient( 'left' )
    .ticks( 6 );

  const line = d3.svg.line()
    .x( _.flow( xAccessor, x ) )
    .y( _.flow( yAccessor, y ) );

  const svg = d3.select( el ).append( 'svg' )
    .attr( 'width', width + margin.left + margin.right )
    .attr( 'height', height + margin.top + margin.bottom );

  const g = svg.append( 'g' )
    .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

  g.append( 'clipPath' )
    .attr( 'id', 'clip' )
  .append( 'rect' )
    .attr( 'x', 0 )
    .attr( 'y', 0 )
    .attr( 'width', width )
    .attr( 'height', height );

  const xAxisGroup = g.append( 'g' )
    .attr( 'class', 'x axis' )
    .attr( 'transform', 'translate(0,' + height + ')' );

  const yAxisGroup = g.append( 'g' )
    .attr( 'class', 'y axis' );

  const linePath = g.append( 'path' )
    .datum( data )
    .attr( 'class', 'line' )
    .attr( 'clip-path', 'url(#clip)' );

  function update() {
    // Translation constraint.
    const domain = x.domain();
    const range = x.range();
    const translate = zoom.translate();

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

  const zoom = d3.behavior.zoom()
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
  getDefaultProps() {
    return {
      data: _.range( 128 ).map( randomGaussian ),
      margin: { top: 48, left: 48, bottom: 48, right: 48 },
      width: 640,
      height: 320
    };
  },

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
