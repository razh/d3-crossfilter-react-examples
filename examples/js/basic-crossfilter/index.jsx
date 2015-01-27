import _ from 'lodash';
import d3 from 'd3';
import crossfilter from 'crossfilter';
import React from 'react/addons';

import { randomGaussian } from './../data/random';

var defaults = {
  margin: { top: 32, left: 32, bottom: 32, right: 32 },
  width: 320,
  height: 320,
  xAccessor: d => d.key
};

var store = (() => {
  var data = _.range( 256 ).map( i => [ i, randomGaussian() + 8 ] );

  // Initialize crossfilter dataset.
  var filter = crossfilter( data );

  // Create dimensions and groups.
  var index = filter.dimension( d => d[0] );
  var indexGroup = index.group().reduceSum( d => d[1] );
  var value = filter.dimension( d => d[1] );
  var valueGroup = value.group().reduceSum( d => d[1] );
  var index2D = filter.dimension( d => d );
  var index2DGroup = index2D.group();

  var charts = [];

  return {
    data,
    index, indexGroup,
    value, valueGroup,
    index2D, index2DGroup,
    charts
  };
}) ();

function redrawAll() {
  _.forEach( store.charts, chart => chart.redraw() );
}

var ChartMixin = {
  propTypes: {
    id: React.PropTypes.string.isRequired,
    dimension: React.PropTypes.object.isRequired,
    group: React.PropTypes.object.isRequired,
    yAccessor: React.PropTypes.func.isRequired
  },

  onBrushEnd() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
      redrawAll();
    }
  }
};

var Chart = {
  create( el, margin, width, height, x, y ) {
    // margins have been subtracted from width and height.
    var svg = Chart.setSize( el, margin, width, height );
    var g = Chart.createGroup( svg, margin );

    return {
      svg,
      g,
      xAxis: Chart.createXAxis( x ),
      yAxis: Chart.createYAxis( y ),
      xAxisGroup: Chart.createXAxisGroup( g, height ),
      yAxisGroup: Chart.createYAxisGroup( g )
    };
  },

  setSize( el, margin, width, height ) {
    return d3.select( el )
      .attr( 'width', width + margin.left + margin.right )
      .attr( 'height', height + margin.top + margin.bottom );
  },

  createGroup( svg, margin ) {
    return svg.append( 'g' )
      .attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );
  },

  createXAxis( x ) {
    return d3.svg.axis()
      .scale( x )
      .orient( 'bottom' );
  },

  createYAxis( y ) {
    return d3.svg.axis()
      .scale( y )
      .orient( 'left' );
  },

  createXAxisGroup( g, height ) {
    return g.append( 'g' )
      .attr( 'class', 'x axis' )
      .attr( 'transform', 'translate(0,' + height + ')' );
  },

  createYAxisGroup( g ) {
    return g.append( 'g' )
      .attr( 'class', 'y axis' );
  }
};

var LineChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor
    } = this.props;

    margin = margin || defaults.margin;
    width = ( width || defaults.width ) - margin.left - margin.right;
    height = ( height || defaults.height ) - margin.top - margin.bottom;

    xAccessor = xAccessor || defaults.xAccessor;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ height, 0 ] );

    var line = d3.svg.line()
      .x( _.flow( xAccessor, x ) )
      .y( _.flow( yAccessor, y ) );

    var brush = d3.svg.brush()
      .x( x );

    var {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    var linePath = g.append( 'path' )
      .attr( 'class', 'line' );

    var brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    brushGroup.selectAll( 'rect' )
      .attr( 'height', height );

    function redraw() {
      all = group.all().filter( d => d.value );
      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );
      linePath.datum( all ).attr( 'd', line );
    }

    redraw();

    this.chart = {
      margin,
      width, height,
      x, y,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      line, linePath,
      brush, brushGroup,
      redraw
    };

    store.charts.push( this.chart );

    brush
      .on( 'brush', this.onBrush )
      .on( 'brushend', this.onBrushEnd );
  },

  onBrush() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
    } else {
      var extent = this.chart.brush.extent();
      this.props.dimension.filter( extent );
    }

    redrawAll();
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

var BarChart = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor,
      padding
    } = this.props;

    margin = margin || defaults.margin;
    width = ( width || defaults.width ) - margin.left - margin.right;
    height = ( height || defaults.height ) - margin.top - margin.bottom;

    xAccessor = xAccessor || defaults.xAccessor;
    padding = padding || 2;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ 0, width ] );

    var histogram = d3.layout.histogram()
      .value( d => d.value )
      .bins( x.ticks( 24 ) );

    y = y || d3.scale.linear()
      .domain( [ 0, d3.max( histogram( all ), d => d.y ) ] )
      .range( [ height, 0 ] );

    var brush = d3.svg.brush()
      .x( x );

    var {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    var bars = g.append( 'g' )
      .attr( 'class', 'bars' )
      .selectAll( '.bar' );

    var brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    brushGroup.selectAll( 'rect' )
      .attr( 'height', height );

    function redraw() {
      var all = group.all().filter( d => d.value );

      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      bars = bars.data( histogram( all ) );

      bars.enter().append( 'rect' )
        .attr( 'class', 'bar' );

      bars
        .attr( 'x', d => x( d.x ) )
        .attr( 'y', d => y( d.y ) )
        .attr( 'width', d => x( d.dx + d.x ) - x( d.x ) - padding )
        .attr( 'height', d => height - y( d.y ) );

      bars.exit().remove();
    }

    redraw();

    this.chart = {
      margin,
      width, height,
      x, y,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      bars,
      padding,
      brush, brushGroup,
      redraw
    };

    store.charts.push( this.chart );

    brush
      .on( 'brush', this.onBrush )
      .on( 'brushend', this.onBrushEnd );
  },

  onBrush() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
    } else {
      var extent = this.chart.brush.extent();
      this.props.dimension.filter( extent );
    }

    redrawAll();
  },

  shouldComponentUpdate() {
    this.chart.redraw();
    return false;
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

var ScatterPlot = React.createClass({
  mixins: [ ChartMixin ],

  componentDidMount() {
    var {
      group,
      margin,
      width, height,
      x, y,
      xAccessor, yAccessor,
      radius
    } = this.props;

    margin = margin || defaults.margin;
    width = ( width || defaults.width ) - margin.left - margin.right;
    height = ( height || defaults.height ) - margin.top - margin.bottom;

    xAccessor = xAccessor || defaults.xAccessor;
    radius = radius || 2;

    var all = group.all();

    x = x || d3.scale.linear()
      .domain( d3.extent( all, xAccessor ) )
      .range( [ 0, width ] );

    y = y || d3.scale.linear()
      .domain( d3.extent( all, yAccessor ) )
      .range( [ height, 0 ] );

    var plotX = _.flow( xAccessor, x );
    var plotY = _.flow( yAccessor, y );

    var brush = d3.svg.brush()
      .x( x )
      .y( y );

    var {
      g,
      xAxis, yAxis,
      xAxisGroup, yAxisGroup
    } = Chart.create( this.getDOMNode(), margin, width, height, x, y );

    xAxis.ticks( 6 );
    yAxis.ticks( 6 );

    var circles = g.append( 'g' )
      .selectAll( 'circle' );

    var brushGroup = g.append( 'g' )
      .attr( 'class', 'brush' )
      .call( brush );

    function redraw() {
      all = group.all();

      xAxisGroup.call( xAxis );
      yAxisGroup.call( yAxis );

      circles = circles.data( all );

      circles.enter().append( 'circle' )
        .attr( 'r', radius );

      circles
        .attr( 'cx', plotX )
        .attr( 'cy', plotY );

      circles.exit().remove();
    }

    redraw();

    this.chart = {
      margin,
      width, height,
      x, y,
      xAxis, yAxis,
      xAccessor, yAccessor,
      xAxisGroup, yAxisGroup,
      circles,
      radius,
      brush, brushGroup,
      redraw
    };

    store.charts.push( this.chart );

    brush
      .on( 'brush', this.onBrush )
      .on( 'brushend', this.onBrushEnd );
  },

  onBrush() {
    if ( this.chart.brush.empty() ) {
      this.props.dimension.filterAll();
    } else {
      var extent = this.chart.brush.extent();
      this.props.dimension.filterFunction( d => {
        return extent[0][0] <= d[0] && d[0] <= extent[1][0] &&
               extent[0][1] <= d[1] && d[1] <= extent[1][1];
      });
    }

    redrawAll();
  },

  render() {
    return <svg className='chart'>{this.props.children}</svg>;
  }
});

export default React.createClass({
  render() {
    return (
      <div>
        <div className='chart-group'>
          <LineChart
            id='line-chart'
            dimension={store.index}
            group={store.indexGroup}
            yAccessor={d => d.value}/>
        </div>
        <div className='chart-group'>
          <BarChart
            id='bar-chart'
            dimension={store.value}
            group={store.valueGroup}
            yAccessor={d => d.value}
            padding={2}/>
        </div>
        <div className='chart-group'>
          <ScatterPlot
            id='scatter-plot'
            dimension={store.index2D}
            group={store.index2DGroup}
            xAccessor={d => d.key[0]}
            yAccessor={d => d.key[1]}/>
        </div>
      </div>
    );
  }
});
