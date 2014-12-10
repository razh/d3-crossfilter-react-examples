import _ from 'lodash';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

function createCharts( el, props ) {
  var { data, margin, width, height } = props;

  data = data || _.range( 256 ).map(() => {
    return {
      s: randomGaussian(),
      t: randomGaussian(),
      p: randomGaussian(),
      q: randomGaussian()
    };
  });

  margin = margin || { top: 32, left: 32, bottom: 32, right: 32 };
  width = ( width || 320 ) - margin.left - margin.right;
  height = ( height || 320 ) - margin.top - margin.bottom;

  var xAccessor = ( d, i ) => i;
  var sAccessor = d => d.s;
  var tAccessor = d => d.t;
  var pAccessor = d => d.p;
  var qAccessor = d => d.q;

  var x = d3.scale.linear()
    .domain( d3.extent( data, xAccessor ) )
    .range( [ 0, width ] );

  var xAxis = d3.svg.axis()
    .scale( x )
    .orient( 'bottom' );

  function createChart( y, yAccessor ) {
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

    var xAxisGroup = g.append( 'g' )
      .attr( 'class', 'x axis' )
      .attr( 'transform', 'translate(0,' + height + ')' );

    var yAxisGroup = g.append( 'g' )
      .attr( 'class', 'y axis' );

    var linePath = g.append( 'path' )
      .datum( data )
      .attr( 'class', 'line' );

    function update() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );
      linePath.attr( 'd', line );
    }

    update();
    return update;
  }

  _.map([
    sAccessor,
    tAccessor,
    pAccessor,
    qAccessor
  ], yAccessor => {
    var y = d3.scale.linear()
      .domain( d3.extent( data, yAccessor ) )
      .range( [ 0, height ] );

    return createChart( y, yAccessor );
  });
}

export default React.createClass({
  componentDidMount() {
    createCharts( this.getDOMNode(), this.props );
  },

  shouldComponentUpdate() {
    createCharts( this.getDOMNode(), this.props );
    return false;
  },

  render() {
    return <div {...this.props}>{this.props.children}</div>;
  }
});
