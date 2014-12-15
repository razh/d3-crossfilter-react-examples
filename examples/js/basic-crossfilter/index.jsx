import _ from 'lodash';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

var defaults = {
  margin: { top: 32, left: 32, bottom: 32, right: 32 },
  width: 320,
  height: 320
};

var store = (() => {
  var data = _.range( 256 ).map(() => {
    return {
      s: randomGaussian(),
      t: randomGaussian(),
      p: randomGaussian(),
      q: randomGaussian()
    };
  });

  var accessors = [
    d => d.s,
    d => d.t,
    d => d.p,
    d => d.q
  ];

  // Initialize crossfilter dataset.
  var filter = crossfilter( data );
  var dimensions = [];
  var groups = [];

  accessors.forEach( accessor => {
    var dimension = filter.dimension( ( d, i ) => i );
    dimensions.push( dimension );
    groups.push( dimension.group().reduceSum( accessor ) );
  });

  return {
    data,
    accessors,
    dimensions,
    groups
  };
}) ();

var LineChart = React.createClass({
  propTypes: {
    id: React.PropTypes.string.isRequired,
    dimension: React.PropTypes.object.isRequired,
    group: React.PropTypes.object.isRequired,
    yAccessor: React.PropTypes.func.isRequired
  },

  componentDidMount() {
    var {
      group,
      width, height,
      margin,
      x, y,
      xAccessor, yAccessor
    } = this.props;

    width = width || defaults.width;
    height = height || defaults.height;
    margin = margin || defaults.margin;

    xAccessor = xAccessor || ( d, i ) => i;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
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

    // DOM elements.
    var svg = d3.select( this.getDOMNode() ).append( 'svg' )
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
      .attr( 'class', 'line' );

    function redraw() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );
      linePath.datum( all ).attr( 'd', line );
    }

    redraw();

    this.chart = {
      x, y,
      width, height,
      margin,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      line, linePath,
      redraw
    };
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <div>{this.props.children}</div>;
  }
});

export default React.createClass({
  render() {
    var accessor = d => d.value;

    return (
      <div>
        {_.map( store.groups, ( group, i ) => {
          return <LineChart
            key={i}
            id={'chart-' + i}
            dimension={store.dimensions[i]}
            group={group}
            yAccessor={accessor}/>;
        })}
      </div>
    );
  }
});
