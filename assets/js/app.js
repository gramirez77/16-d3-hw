// Step 1: Set up our chart
// =================================
var svgWidth  = 960;
var svgHeight = 500;

var margin = {
  top:    20,
  right:  20,
  bottom: 100,
  left:   110
};

var width  = svgWidth  - margin.left - margin.right;
var height = svgHeight - margin.top  - margin.bottom;

// Step 2: Create an SVG wrapper,
// append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
// =================================
var svg = d3
  .select("div#scatter")
  // Container class to make SVG responsive.
  .classed("svg-container", true) 
  .append("svg")
  // Responsive SVG needs these two attributes 
  // and no width and height attributes.
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)

var svgGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Step 3:
// Import data from the data.csv file
// =================================
d3.csv("assets/data/data.csv")
  .then(function(data) {

    // Step 4: Parse data/cast as numbers
    // =================================
    data.forEach(function(d) {
      d.id             = +d.id;
      d.poverty        = +d.poverty;
      d.povertyMoe     = +d.povertyMoe;
      d.age            = +d.age;
      d.ageMoe         = +d.ageMoe;
      d.income         = +d.income;
      d.incomeMoe      = +d.incomeMoe;
      d.healthcare     = +d.healthcare;
      d.healthcareLow  = +d.healthcareLow;
      d.healthcareHigh = +d.healthcareHigh;
      d.obesity        = +d.obesity;
      d.obesityLow     = +d.obesityLow;
      d.obesityHigh    = +d.obesityHigh;
      d.smokes         = +d.smokes;
      d.smokesLow      = +d.smokesLow;
      d.smokesHigh     = +d.smokesHigh;

    });

    // Step 5: Create the scales for the chart
    // =================================
    var xLinearScalePoverty = d3.scaleLinear()
      .domain([d3.min(data, d => d.poverty) * 0.9,
               d3.max(data, d => d.poverty) * 1.1])
      .range([0, width]);

    var yLinearScaleObesity = d3.scaleLinear()
      .domain([d3.min(data, d => d.obesity) * 0.9,
               d3.max(data, d => d.obesity) * 1.1])
      .range([height, 0]);

    // Step 6: Create axis functions
    // =================================
    var bottomAxisPoverty = d3.axisBottom(xLinearScalePoverty);
    var leftAxisObesity = d3.axisLeft(yLinearScaleObesity);

    // Step 7: Append axes to the chart
    // =================================
    svgGroup.append("g")
      .attr("id", "xAxis")
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxisPoverty);
    
    svgGroup.append("g")
      .attr("id", "yAxis")
      .call(leftAxisObesity);

    // Step 8: Initialize tooltip
    // =================================
    var toolTip = d3.tip()
      .attr("class", "d3-tip")
      .offset([-8, 0])
      .html(d => {
        return `${d.state}<br>Poverty: ${d.poverty}%<br>Obesity: ${d.obesity}%`
      });

    // Step 9: Create tooltip in the chart
    // =================================
    svgGroup.call(toolTip);

    // Step 10: Create circles and its labels 
    // and connect the tooltips created 
    // =================================
    var circlesGroup = svgGroup.append("g")
      .attr("id", "bubbles");

    var elemEnter = circlesGroup.selectAll("g")
      .data(data)
    .enter().append("g")
      .attr("transform", d => {
        return "translate(" + xLinearScalePoverty(d.poverty) + ", " + 
                              yLinearScaleObesity(d.obesity) + ")";
      })
      .on("mouseover", toolTip.show)
      .on("mouseout", toolTip.hide);

    elemEnter.append("circle")
      .attr("r", "15")
      .classed("stateCircle", true)

    elemEnter.append("text")
      .text(d => d.abbr)
      .classed("stateText", true);

    // Step 11: Create axes labels
    // =================================
    yLabels = [{"field": "obesity",
                "label": "Obese (%)"},
               {"field": "smokes",
                "label": "Smokes (%)"},
               {"field": "healthcare",
                "label": "Lacks Healthcare (%)"}];
    svgGroup.append("g")
      .attr("id", "yLabels")
      .selectAll("text")
      .data(yLabels)
    .enter().append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", (d, i) => {
        return 0 - margin.left + 10 + 25 * i
      })
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .attr("class", (d, i) => {
        if (i === 0) {
          return "axisText active";
        }
        return "axisText inactive";
      })
      .text(d => d.label)
      .on("click", function() {
        var newYSelection = d3.select(this).data()[0].field;

        // if user clicked on the active selection do nothing and exit
        var activeYSelection = svgGroup.select("g#yLabels").select("text.active").data()[0].field;
        if (newYSelection === activeYSelection) {
          return;
        }

        // user clicked on a new selection - time to work!

        // mute all y-labels, highlight clicked selection
        svgGroup.selectAll("g#yLabels").selectAll("text")
          .attr("class", "axisText inactive");
        d3.select(this)
          .attr("class", "axisText active");

        // create new y axis
        var yLinearScale = d3.scaleLinear()
          .domain([d3.min(data, d => d[newYSelection]) * 0.9,
                   d3.max(data, d => d[newYSelection]) * 1.1])
          .range([height, 0]);
        var leftAxis = d3.axisLeft(yLinearScale);

        // transition to new y axis
        svgGroup.select("#yAxis")
          .transition()
            .call(leftAxis);

        // rebuild existing x axis
        var currentXSelection = svgGroup.select("g#xLabels").select("text.active").data()[0].field;
        var xLinearScale = d3.scaleLinear()
          .domain([d3.min(data, d => d[currentXSelection]) * 0.9,
                   d3.max(data, d => d[currentXSelection]) * 1.1])
          .range([0, width]);

        // create new tooltup
        var toolTip = d3.tip()
          .attr("class", "d3-tip")
          .offset([-8, 0])
          .html(d => {
            xValue = d[currentXSelection];
            if (currentXSelection === 'poverty') {
              xValue += "%";
            }
            else if (currentXSelection === 'income') {
              xValue = Intl.NumberFormat().format(xValue);
            }
            return `${d.state}<br>${currentXSelection}: ${xValue}<br>${newYSelection}: ${d[newYSelection]}%`
          });
        svgGroup.call(toolTip);
        
        // transition bubbles to new y coordinates
        svgGroup.select("#bubbles").selectAll("g")
          .data(data)
          .on("mouseover", toolTip.show)
          .on("mouseout", toolTip.hide)
          .transition()
            .attr("transform", d => {
              return "translate(" + xLinearScale(d[currentXSelection]) + ", " +
                                    yLinearScale(d[newYSelection]) + ")";
            });

      });

    xLabels = [{"field": "poverty",
                "label": "In Poverty (%)"},
               {"field": "age",
                "label": "Age (Median)"},
               {"field": "income",
                "label": "Household Income (Median)"}];
    svgGroup.append("g")
      .attr("id", "xLabels")
      .selectAll("text")
      .data(xLabels)
    .enter().append("text")
      .attr("transform", (d, i) => {
        return `translate(${width /2}, ${height + margin.top + 20 + 25 * i})`
      })
      .attr("class", (d, i) => {
        if (i === 0) {
          return "axisText active";
        }
        return "axisText inactive";
      })
      .text(d => d.label)
      .on("click", function() {
        var newXSelection = d3.select(this).data()[0].field;

        // if user clicked on the active selection do nothing and exit
        var activeXSelection = svgGroup.select("g#xLabels").select("text.active").data()[0].field;
        if (newXSelection === activeXSelection) {
          return;
        }

        // user clicked on a new selection - time to work!

        // mute all x-labels, highlight clicked selection
        svgGroup.selectAll("g#xLabels").selectAll("text")
          .attr("class", "axisText inactive");
        d3.select(this)
          .attr("class", "axisText active");

        // create new x axis
        var xLinearScale = d3.scaleLinear()
          .domain([d3.min(data, d => d[newXSelection]) * 0.9,
                   d3.max(data, d => d[newXSelection]) * 1.1])
          .range([0, width]);
        var bottomAxis = d3.axisBottom(xLinearScale);

        // transition to new x axis
        svgGroup.select("#xAxis")
          .transition()
            .call(bottomAxis);

        // rebuild existing y axis
        var currentYSelection = svgGroup.select("g#yLabels").select("text.active").data()[0].field;
        var yLinearScale = d3.scaleLinear()
          .domain([d3.min(data, d => d[currentYSelection]) * 0.9,
                   d3.max(data, d => d[currentYSelection]) * 1.1])
          .range([height, 0]);

        // create new tooltup
        var toolTip = d3.tip()
          .attr("class", "d3-tip")
          .offset([-8, 0])
          .html(d => {
            xValue = d[newXSelection];
            if (newXSelection === 'poverty') {
              xValue += "%";
            }
            else if (newXSelection === 'income') {
              xValue = Intl.NumberFormat().format(xValue);
            }
            return `${d.state}<br>${newXSelection}: ${xValue}<br>${currentYSelection}: ${d[currentYSelection]}%`
          });
        svgGroup.call(toolTip);

        // transition bubbles to new x coordinates
        svgGroup.select("#bubbles").selectAll("g")
          .data(data)
          .on("mouseover", toolTip.show)
          .on("mouseout", toolTip.hide)
          .transition()
            .attr("transform", d => {
              return "translate(" + xLinearScale(d[newXSelection]) + ", " +
                                    yLinearScale(d[currentYSelection]) + ")";
            });



      });

  })
  .catch(function(error) {
    return console.warn(error);
  });
