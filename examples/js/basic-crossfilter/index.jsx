import _ from 'lodash';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

var defaults = {
  margin: { top: 32, left: 32, bottom: 32, right: 32 },
  width: 320,
  height: 320,
  xAccessor: ( d, i ) => i
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

var ChartMixin = {
  propTypes: {
    id: React.PropTypes.string.isRequired,
    dimension: React.PropTypes.object.isRequired,
    group: React.PropTypes.object.isRequired,
    yAccessor: React.PropTypes.func.isRequired
  }
};

var LineChart = React.createClass({
  mixins: [ ChartMixin ],

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

    xAccessor = xAccessor || defaults.xAccessor;

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
    return <div className='chart'>{this.props.children}</div>;
  }
});

var BarChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      width, height,
      margin,
      padding,
      x, y,
      xAccessor, yAccessor
    } = this.props;

    width = width || defaults.width;
    height = height || defaults.height;
    margin = margin || defaults.margin;
    padding = padding || 2;

    xAccessor = xAccessor || defaults.xAccessor;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ 0, width ] );

    var data = d3.layout.histogram()
      .value( d => d.value )
      .bins( x.ticks( 24 ) )
      ( all );

    y = y || d3.scale.linear()
      .domain( d3.extent( data, d => d.y ) )
      .range( [ height, 0 ] );

    var xAxis = d3.svg.axis()
      .scale( x )
      .orient( 'bottom' );

    var yAxis = d3.svg.axis()
      .scale( y )
      .orient( 'left' );

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

    var bars = g.append( 'g' )
      .attr( 'class', 'bars' )
      .selectAll( '.bar' );

    function redraw() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      bars = bars.data( data );

      bars.enter().append( 'rect' )
        .attr( 'class', 'bar' )
        .attr( 'x', d => x( d.x ) )
        .attr( 'y', d => y( d.y ) )
        .attr( 'width', d => x( d.dx + d.x ) - x( d.x ) - padding )
        .attr( 'height', d => height - y( d.y ) );

      bars.exit().remove();
    }

    redraw();

    this.chart = {
      x, y,
      width, height,
      margin,
      padding,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      bars,
      redraw
    };
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <div className='chart'>{this.props.children}</div>;
  }
});

var ScatterPlot = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      width, height,
      margin,
      radius,
      x, y,
      xAccessor, yAccessor
    } = this.props;

    width = width || defaults.width;
    height = height || defaults.height;
    margin = margin || defaults.margin;
    radius = radius || 2;

    xAccessor = xAccessor || defaults.xAccessor;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ 0, width ] );

    var xAxis = d3.svg.axis()
      .scale( x )
      .orient( 'bottom' );

    var yAxis = d3.svg.axis()
      .scale( y )
      .orient( 'left' );

    var plotX = _.compose( x, xAccessor );
    var plotY = _.compose( y, yAccessor );

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

    var circles = g.append( 'g' )
      .selectAll( 'circle' );

    function redraw() {
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      circles = circles.data( all );

      circles.enter().append( 'circle' )
        .attr( 'cx', plotX )
        .attr( 'cy', plotY )
        .attr( 'r', radius );

      circles.exit().remove();
    }

    redraw();

    this.chart = {
      x, y,
      width, height,
      margin,
      radius,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      circles,
      redraw
    };
  },

  render() {
    return <div className='chart'>{this.props.children}</div>;
  }
});

export default React.createClass({
  render() {
    var accessor = d => d.value;

    return (
      <div>
        <div className='chart-group'>
          {_.map( store.groups, ( group, i ) => {
            return <LineChart
              key={i}
              id={'line-chart-' + i}
              dimension={store.dimensions[i]}
              group={group}
              yAccessor={accessor}/>;
          })}
        </div>
        <div className='chart-group'>
          {_.map( store.groups, ( group, i ) => {
            return <BarChart
              key={i}
              id={'bar-chart-' + i}
              dimension={store.dimensions[i]}
              group={group}
              yAccessor={accessor}
              padding={2}/>;
          })}
        </div>
        <div className='chart-group'>
          {_.map( store.groups, ( group, i ) => {
            return <ScatterPlot
              key={i}
              id={'scatter-plot-' + i}
              dimension={store.dimensions[i]}
              group={group}
              yAccessor={accessor}/>;
          })}
        </div>
      </div>
    );
  }
});
