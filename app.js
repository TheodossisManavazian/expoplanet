// Colorblind-friendly palette: top 4 methods + "Other" for the rest
var MAIN_METHODS = ["Transit", "Radial Velocity", "Microlensing", "Imaging"];
var OTHER_METHODS = [
  "Transit Timing Variations",
  "Eclipse Timing Variations",
  "Orbital Brightness Modulation",
  "Pulsar Timing",
  "Astrometry",
  "Pulsation Timing Variations",
  "Disk Kinematics"
];

var METHOD_COLORS = {
  "Transit": "#183B5A",
  "Radial Velocity": "#EDA04A",
  "Microlensing": "#45B850",
  "Imaging": "#D4F1FF",
  "Other": "#8C3560"
};

// Dark theme defaults for all Plotly charts
var DARK_LAYOUT = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#ccc" },
  xaxis: { gridcolor: "rgba(255,255,255,0.1)", zerolinecolor: "rgba(255,255,255,0.1)" },
  yaxis: { gridcolor: "rgba(255,255,255,0.1)", zerolinecolor: "rgba(255,255,255,0.1)" }
};

// Global state: full dataset and current filters (empty = show all)
var allData = [];
var activeMethods = [];
var activeYears = [];

// Load and parse the CSV
d3.csv("data.csv").then(function (data) {
  data.forEach(function (d) {
    d.discovery_year = +d.discovery_year;
    d.orbital_period = d.orbital_period ? +d.orbital_period : null;
    d.distance = d.distance ? +d.distance : null;
    d.planet_radius = d.planet_radius ? +d.planet_radius : null;
    d.original_method = d.discovery_method;

    if (OTHER_METHODS.indexOf(d.discovery_method) !== -1) {
      d.discovery_method = "Other";
    }
  });

  allData = data;
  console.log("Loaded " + allData.length + " planets");
  buildAll();
});

// Rebuild all charts using current filter state
function buildAll() {
  updateFilterBar();

  // Year chart: filter by methods only so all years stay clickable
  var yearFiltered = allData;
  if (activeMethods.length > 0) {
    yearFiltered = yearFiltered.filter(function (d) {
      return activeMethods.indexOf(d.discovery_method) !== -1;
    });
  }

  // Method chart: filter by years only so all methods stay clickable
  var methodFiltered = allData;
  if (activeYears.length > 0) {
    methodFiltered = methodFiltered.filter(function (d) {
      return activeYears.indexOf(d.discovery_year) !== -1;
    });
  }

  // Scatter plot: apply both filters
  var scatterFiltered = allData;
  if (activeMethods.length > 0) {
    scatterFiltered = scatterFiltered.filter(function (d) {
      return activeMethods.indexOf(d.discovery_method) !== -1;
    });
  }
  if (activeYears.length > 0) {
    scatterFiltered = scatterFiltered.filter(function (d) {
      return activeYears.indexOf(d.discovery_year) !== -1;
    });
  }

  buildYearChart(yearFiltered);
  buildMethodChart(methodFiltered);
  buildScatterPlot(scatterFiltered);

  // newPlot purges old listeners, so re-attach after every rebuild
  attachYearClick();
  attachMethodClick();
}

// Filter bar: show/hide and update label
function updateFilterBar() {
  var bar = document.getElementById("filter-bar");
  var label = document.getElementById("filter-label");

  if (activeMethods.length === 0 && activeYears.length === 0) {
    bar.classList.add("hidden");
    return;
  }

  bar.classList.remove("hidden");
  var parts = [];
  if (activeMethods.length > 0) parts.push("Methods: " + activeMethods.join(", "));
  if (activeYears.length > 0) parts.push("Years: " + activeYears.join(", "));
  label.textContent = "Filtering by " + parts.join(" & ");
}

document.getElementById("clear-filters").addEventListener("click", function () {
  activeMethods = [];
  activeYears = [];
  buildAll();
});

// Click handlers for cross-filtering
function attachYearClick() {
  var yearPlot = document.getElementById("year-plot");
  yearPlot.on("plotly_click", function (eventData) {
    var clickedYear = eventData.points[0].x;

    var idx = activeYears.indexOf(clickedYear);
    if (idx !== -1) {
      activeYears.splice(idx, 1);
    } else {
      activeYears.push(clickedYear);
    }
    buildAll();
  });
}

function attachMethodClick() {
  var methodPlot = document.getElementById("method-plot");
  methodPlot.on("plotly_click", function (eventData) {
    var clickedMethod = eventData.points[0].x;

    var idx = activeMethods.indexOf(clickedMethod);
    if (idx !== -1) {
      activeMethods.splice(idx, 1);
    } else {
      activeMethods.push(clickedMethod);
    }
    buildAll();
  });
}

// Chart 1: Stacked bar chart -- discoveries per year by method
function buildYearChart(data) {
  var methods = Object.keys(METHOD_COLORS);

  var years = [...new Set(allData.map(function (d) { return d.discovery_year; }))];
  years.sort(function (a, b) { return a - b; });

  var yearSummaries = {};
  years.forEach(function (year) {
    var yearData = data.filter(function (d) { return d.discovery_year === year; });
    var total = yearData.length;
    var lines = methods.map(function (method) {
      var count = yearData.filter(function (d) { return d.discovery_method === method; }).length;
      if (count === 0) return null;
      var pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
      return '<span style="color:' + METHOD_COLORS[method] + ';">&#9679;</span> '
        + method + ": " + count + " (" + pct + "%)";
    }).filter(function (line) { return line !== null; });
    yearSummaries[year] = "<b>Total: " + total + "</b><br>" + lines.join("<br>");
  });

  var yearTotals = {};
  years.forEach(function (year) {
    yearTotals[year] = data.filter(function (d) { return d.discovery_year === year; }).length;
  });

  var traces = methods.map(function (method) {
    var counts = years.map(function (year) {
      return data.filter(function (d) {
        return d.discovery_year === year && d.discovery_method === method;
      }).length;
    });

    var scaledCounts = counts.map(function (count, i) {
      var total = yearTotals[years[i]];
      if (total === 0) return 0;
      return (count / total) * Math.sqrt(total);
    });

    var summaries = years.map(function (year) { return yearSummaries[year]; });

    var opacities = years.map(function (year) {
      if (activeYears.length > 0 && activeYears.indexOf(year) === -1) {
        return 0.2;
      }
      return 1;
    });

    return {
      x: years,
      y: scaledCounts,
      name: method,
      type: "bar",
      marker: {
        color: METHOD_COLORS[method],
        opacity: opacities
      },
      customdata: summaries,
      hovertemplate: "<b>%{x}</b><br>%{customdata}<extra></extra>"
    };
  });

  var tickValues = [0, 10, 200, 500, 1000, 1500];
  var tickPositions = tickValues.map(function (v) { return Math.sqrt(v); });

  var shapes = activeYears.map(function (year) {
    return {
      type: "rect",
      x0: year - 0.4, x1: year + 0.4,
      y0: 0, y1: 1, yref: "paper",
      fillcolor: "rgba(255,255,255,0.1)",
      line: { width: 0 }
    };
  });

  var layout = Object.assign({}, DARK_LAYOUT, {
    barmode: "stack",
    xaxis: Object.assign({}, DARK_LAYOUT.xaxis, { title: { text: "Discovery Year", standoff: 7 } }),
    yaxis: Object.assign({}, DARK_LAYOUT.yaxis, {
      title: "Number of Planets (√ scale)",
      tickvals: tickPositions,
      ticktext: tickValues.map(String)
    }),
    legend: { orientation: "h", y: -0.3, font: { color: "#ccc" } },
    margin: { t: 10, r: 20, b: 100, l: 80 },
    height: 320,
    shapes: shapes,
    hoverlabel: {
      bgcolor: "white",
      font: { color: "#333", size: 12 },
      bordercolor: "#ccc"
    }
  });

  Plotly.newPlot("year-plot", traces, layout, { responsive: true });
}

// Chart 2: Bar chart -- total discoveries per method
function buildMethodChart(data) {
  var methods = Object.keys(METHOD_COLORS);

  var counts = methods.map(function (method) {
    return data.filter(function (d) {
      return d.discovery_method === method;
    }).length;
  });

  var summaries = methods.map(function (method, i) {
    if (method === "Other") {
      var lines = OTHER_METHODS.map(function (m) {
        var count = data.filter(function (d) { return d.original_method === m; }).length;
        return m + ": " + count;
      }).filter(function (line) { return !line.endsWith(": 0"); });
      return '<span style="color:' + METHOD_COLORS[method] + ';">&#9679;</span> '
        + counts[i] + " planets<br>" + lines.join("<br>");
    }
    return '<span style="color:' + METHOD_COLORS[method] + ';">&#9679;</span> '
      + counts[i] + " planets";
  });

  var colors = methods.map(function (method) {
    if (activeMethods.length > 0 && activeMethods.indexOf(method) === -1) {
      return "#ddd";
    }
    return METHOD_COLORS[method];
  });

  var sqrtCounts = counts.map(function (c) { return Math.sqrt(c); });

  var traces = [{
    x: methods,
    y: sqrtCounts,
    type: "bar",
    marker: { color: colors },
    customdata: summaries,
    hovertemplate: "<b>%{x}</b><br>%{customdata}<extra></extra>",
    showlegend: false
  }];

  var tickValues = [0, 50, 200, 500, 1000, 2000, 5000];
  var tickPositions = tickValues.map(function (v) { return Math.sqrt(v); });

  var layout = Object.assign({}, DARK_LAYOUT, {
    xaxis: Object.assign({}, DARK_LAYOUT.xaxis, { title: { text: "Discovery Method", standoff: 7 } }),
    yaxis: Object.assign({}, DARK_LAYOUT.yaxis, {
      title: "Number of Planets (√ scale)",
      tickvals: tickPositions,
      ticktext: tickValues.map(String)
    }),
    margin: { t: 10, r: 20, b: 80, l: 80 },
    height: 300,
    hoverlabel: {
      bgcolor: "white",
      font: { color: "#333", size: 12 },
      bordercolor: "#ccc"
    }
  });

  Plotly.newPlot("method-plot", traces, layout, { responsive: true });
}

// Chart 3: Scatter plot -- orbital period vs distance
function buildScatterPlot(data) {
  var scatterData = data.filter(function (d) {
    return d.orbital_period !== null && d.distance !== null;
  });

  var methods = Object.keys(METHOD_COLORS);

  var traces = methods.map(function (method) {
    var subset = scatterData.filter(function (d) {
      return d.discovery_method === method;
    });

    // sqrt to compress range, x6 so median ~2.4 Earth radii is a decent dot
    var sizes = subset.map(function (d) {
      if (d.planet_radius === null) return 8;
      return Math.sqrt(d.planet_radius) * 6;
    });

    return {
      x: subset.map(function (d) { return d.orbital_period; }),
      y: subset.map(function (d) { return Math.sqrt(d.distance * 3.26156); }),  // sqrt of light-years
      text: subset.map(function (d) {
        var radius = d.planet_radius !== null ? d.planet_radius + " Earth radii" : "Unknown";
        var ly = d.distance !== null ? (d.distance * 3.26156).toFixed(1) + " ly" : "Unknown";
        return d.name + "</b><br>"
          + "Orbital Period: " + (d.orbital_period !== null ? d.orbital_period.toFixed(1) + " days" : "Unknown") + "<br>"
          + "Distance: " + ly + "<br>"
          + "Radius: " + radius + "<br>"
          + "Discovered: " + d.discovery_year + "<br>"
          + '<span style="color:' + METHOD_COLORS[method] + ';">&#9679;</span> ' + d.original_method;
      }),
      mode: "markers",
      type: "scatter",
      name: method,
      marker: {
        color: METHOD_COLORS[method],
        size: sizes,
        sizemode: "diameter",
        sizemin: 3,
        opacity: 0.45
      },
      hovertemplate: "<b>%{text}<extra></extra>",
      showlegend: false
    };
  });

  var layout = Object.assign({}, DARK_LAYOUT, {
    xaxis: Object.assign({}, DARK_LAYOUT.xaxis, {
      title: { text: "Orbital Period (days)", standoff: 7 },
      type: "log"
    }),
    yaxis: Object.assign({}, DARK_LAYOUT.yaxis, {
      title: { text: "Distance in light-years (√ scale)", standoff: 15 },
      tickvals: [100, 500, 1000, 2000, 5000, 10000, 20000].map(function (v) { return Math.sqrt(v); }),
      ticktext: ["100", "500", "1,000", "2,000", "5,000", "10,000", "20,000"]
    }),
    margin: { t: 10, r: 20, b: 60, l: 80 },
    height: 450,
    hoverlabel: {
      bgcolor: "white",
      font: { color: "#333", size: 12 },
      bordercolor: "#ccc"
    }
  });

  Plotly.newPlot("scatter-plot", traces, layout, { responsive: true });
}
