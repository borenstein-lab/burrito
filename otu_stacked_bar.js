(function(){
  var otu_bar = {};

  var margin = {top: 20, right: 20, bottom: 80, left: 40},
      width = window.innerWidth - margin.left - margin.right - 250,
      height = window.innerHeight - margin.top - margin.bottom - 50;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .3);

  var y = d3.scale.linear()
      .rangeRound([height, 0]);

  var color = d3.scale.category20();
  
  var sampleColor = d3.scale.ordinal();
  sampleColor["1"] = "red";
  sampleColor["2"] = "darkred";
  sampleColor["3"] = "steelblue";
  sampleColor["4"] = "darkblue";

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format(".2s"));

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right+250)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  getSampleGroup = function(samp, sampledata){
    treatment = sampledata.filter(function(e){ return e.Sample==samp; })[0].Treatment;
    day=sampledata.filter(function(e){ return e.Sample==samp; })[0].Day;
    if(treatment==="Antibiotic"){
      if(day==="2") return "1";
      else return "2";
    } else{
      if(day==="2") return "3";
      else return "4";
    }

  }


  function get_taxon_abundance(taxon, row, data_cube){
    var leaves = data_cube.get_leaves(taxon, data_cube.taxa_lookup);
    total = 0;
    for (var i = 0; i < leaves.length; i++){
      total += parseFloat(row[leaves[i]]);
    }
    return total;
  }

  otu_bar.make_data = function(otu_abundance_data, data_cube){
    var bar_data = [];
    otu_abundance_data.forEach(function(d){
      var bar = {};
      bar.Sample = d.Sample;
      var y0 = 0;
      var my_displayed_taxa = data_cube.displayed_taxa.slice(0);
      my_displayed_taxa.reverse()
      bar.taxa = my_displayed_taxa.map(function(name){
        return { name: name, y0: y0, y1: y0 += get_taxon_abundance(name, d, data_cube)};
      });
      bar.total = bar.taxa[bar.taxa.length - 1].y1;
      bar_data.push(bar);
    })
    return bar_data;
  }

  otu_bar.draw = function(colors, bar_data, sampledata){

    var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .3);

    var y = d3.scale.linear()
      .rangeRound([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format(".2s"));

    var tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .text("a simple tooltip");

    var normalized = true;

    x.domain(bar_data.map(function(d) { return d.Sample }));
    y.domain([0, 100]);
    bar_data.forEach(function(d) {
      d.taxa.forEach(function(e){
        e.y0 = Math.round(e.y0/d.total*100*100)/100;
        e.y1 = Math.round(e.y1/d.total*100*100)/100;
      })
    })

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", function(d) {
        return "rotate(-35)"
      });

    svg.selectAll("text").style("fill",function(m){
      if(sampledata.map(function(e){ return e.Sample; }).indexOf(m)!==-1){
        return sampleColor[getSampleGroup(m, sampledata)];        
      }
    });

    var Sample = svg.selectAll(".Sample")
      .data(bar_data)
      .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { 
        return "translate(" + x(d.Sample) + ",0)"; 
      });

    Sample.selectAll("rect")
      .data(function(d) { 
        return d.taxa; 
      })
      .enter().append("rect")
      .attr("width", x.rangeBand())
      .attr("y", function(d) { 
        return y(d.y1); 
      })
      .attr("height", function(d) { 
        return y(d.y0) - y(d.y1); 
      })
      .style("fill", function(d) { 
        return colors(d.name); 
      })
      .on("mouseover", function(d){
        current_rectangle_data = d3.select(this).datum();
        tooltip.text(current_rectangle_data.name);
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(){ 
        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
      .on("mouseout", function(){
        return tooltip.style("visibility", "hidden");
      });

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .attr("class", "y_label");

    // var normalizebox = svg.append("foreignObject")
    //   .attr("width", 100)
    //   .attr("height", 100)
    //   .attr("x", width + 50)
    //   .attr("y", height/2)
    //   .attr("text", "Raw Repo Counts")
    //   .html("<form><input type=checkbox><span>Raw Counts</span></form>")
    //   .on("click", function(){
    //     if (!normalized) {
    //       y.domain([0, 100]);
    //       d3.select(".y_label").text("Relative abundance");
    //       bar_data.forEach(function(d) {
    //         d.taxa.forEach(function(e){
    //           e.y0 = Math.round(e.y0/d.total*100*100)/100;
    //           e.y1 = Math.round(e.y1/d.total*100*100)/100;
    //         })
    //       })
    //     } else {
    //       y.domain([0, d3.max(bar_data, function(d) { 
    //         return d.total; 
    //       })]);
    //       d3.select(".y_label").text("Count");
    //       bar_data.forEach(function(d) {
    //         d.taxa.forEach(function(e){
    //           e.y0 = e.y0*d.total/100;
    //           e.y1 = e.y1*d.total/100;
    //         })
    //       })
    //     }

    //     normalized = !normalized;
    //     var transition = svg.transition().duration(750);

    //     transition.select('.y.axis')
    //       .call(yAxis);

    //     svg.selectAll(".Sample").data(bar_data);

    //     Sample.selectAll("rect")
    //       .data(function(d) { 
    //         return d.taxa; 
    //       })
    //       .transition().duration(750)
    //       .attr("width", x.rangeBand())
    //       .attr("y", function(d) { 
    //         return y(d.y1); 
    //       })
    //       .attr("height", function(d) { 
    //         return y(d.y0) - y(d.y1); 
    //       })
    //       .style("fill", function(d) { 
    //         return colors(d.name); 
    //       });
    //   });

    // normalizebox.append("div")
    //   .style("position", "absolute")
    //   .style("z-index", "10")
    //   .text("Raw Counts");
  };

  this.otu_bar = otu_bar;
})();


/*    var legend = svg.selectAll(".legend")
        .data(color.domain().slice().reverse())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(150," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

    legend.append("foreignObject")
        .attr("x", width-5)
        .attr("width", 100)
        .attr("height", 20)
        .append("xhtml:body")
        .html("<input type=radio name='sort_by'/>")
        .on("click", function (sort_cat) {
          if(normalized) {
              var x0 = x.domain(data.sort(function(a, b) { return a[sort_cat]/a.total - b[sort_cat]/b.total; }).map(function(d){ return d['Sample']; })).copy();
          } else {
            var x0 = x.domain(data.sort(function(a, b) { return a[sort_cat] - b[sort_cat]; }).map(function(d){ return d['Sample']; })).copy();
          }
          var transition = svg.transition().duration(750);

          Sample.transition().duration(750).attr("transform", function(d) { return "translate(" + x0(d.Sample) + ",0)"; });

          transition.select('.x.axis')
            .call(xAxis);
        });
*/

