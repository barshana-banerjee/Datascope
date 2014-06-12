var queryFilter = {}
var data = {}
var visual_attributes=["id","guid","name","registered","gender"]
var table_data = []
var total_data = []
function refresh() {
	table_data= []
	d3.json("/data?filter="+JSON.stringify(queryFilter), function (d){
		data = d;
		//console.log(queryFilter);
		Object.keys(data).forEach(function (dim){
			if(dim == "table_data"){
				console.log('table_data')
				total_data = data[dim]["data"]
			}
		})
		for(var attr in total_data){

			console.log(total_data[attr])
			var row = total_data[attr]
			var new_row={}
			for(var vattr in visual_attributes){
				new_row[visual_attributes[vattr]]=row[visual_attributes[vattr]]
			}
			table_data.push(new_row)
		}

		console.log(data);
		renderAll()
		renderDataTable()
	})
	//render();
}


  
  var charts = [

    barChart()
        .dimension("Ai")
      .x(d3.scale.linear()
        .domain([0, 11])
        .rangeRound([0, 11 * 24])),
    barChart()
        .dimension("Bi")
      .x(d3.scale.linear()
        .domain([0, 9])
        .rangeRound([0, 9*24])),
	barChart()
        .dimension("Ci")
      .x(d3.scale.linear()
        .domain([0, 12])
        .rangeRound([0, 12*24])),
	barChart()
        .dimension("Di")
      .x(d3.scale.linear()
        .domain([4, 10])
        .rangeRound([0,6*30]))
    
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });
  //console.log(d3.selectAll(".chart"))
  renderAll();

  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
    chart.each(render);
  }


  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  function pieChart(){
    
  }


  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([100, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0,(data[dimension]) ? data[dimension].top : 1]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("reset")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }
        g.selectAll(".bar").datum(data[dimension] ? data[dimension].values : []);

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      queryFilter[dimension] = extent;
    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        queryFilter = {}
      } else {
        refresh()
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        queryFilter[dimension] = _;
      } else {
        brush.clear();
        delete queryFilter[dimension];
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }


refresh();

var datatable = d3.select("#dataTable").append("table"),
  thead = datatable.append("thead"),
  tbody = datatable.append("tbody");




function renderDataTable(){
  var columns = [];
  Object.keys(table_data[0]).forEach(function(col){
    //console.log(col);
    columns.push(col);
    //console.log(columns);
  })

  //console.log(tbody);
  tbody.html("");
  thead.html("")
  thead.append("tr")
    .selectAll("th")
    .data(columns)
    .enter()
    .append("th")
    .text(function(column){return column;})
  var rows = tbody.selectAll("tr")
    .data(table_data)
    .enter()
    .append("tr");
  var cells = rows.selectAll("td")
    .data(function(d){
      //console.log(d3.values(d));
       return d3.values(d)})
    .enter()
    .append("td")
    .text(function(d){return d;})

  //console.log(cells)
}
