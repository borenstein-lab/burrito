(function(){
  var otu_bar = {};

  otu_bar.getSampleGroup = function(samp, sampledata, grouping){
    group = sampledata.filter(function(e){ return e.Sample==samp;})[0][grouping];
    return group;
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

  otu_bar.draw = function(bar_data, sampledata, colors, svglink, dims, highlight_overall, dehighlight_overall, sampleColor, grouping){

	var graphdims = {width: dims.width - 45, height: dims.height * 8/10, height_buffer:10, width_buffer:0, sample_buffer:-dims.width/100, sample_label_buffer:-dims.width/30}
    var x = d3.scale.ordinal()
      .rangeRoundBands([0, graphdims.width], .2);

    var y = d3.scale.linear()
      .rangeRound([graphdims.height, 0]);

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
      .style("background", "lightyellow")
      .style("opacity", "1")
      .style("border", "0px")    
      .style("border-radius", "4px")  
      .style("padding","2px")
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



      //y-axis label
    svglink.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 0)
    .attr("x", -(graphdims.height + graphdims.height_buffer) / 2)
    .attr("font-size",18)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Relative Abundance (%)");

  //x-axis label
    svglink.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", dims.height - 18)
    .attr("x", (dims.width - graphdims.width + graphdims.width_buffer) + ((graphdims.width  - graphdims.width_buffer)/ 2))
    .attr("font-size",18)
    .attr("font-style","bold")
    .attr("dy", ".75em")
    .text("Samples");


    var Sample = svglink.selectAll(".Sample")
      .data(bar_data)
      .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { 
        return "translate(" + (dims.width-graphdims.width + graphdims.width_buffer  + graphdims.sample_buffer + x(d.Sample)) + "," + graphdims.height_buffer +")"; 
      });

    Sample.selectAll("rect")
      .data(function(d) {
      	d["taxa"] = d.taxa.map(function(dat){ 
      		dat_plusSamp = dat
      		dat_plusSamp["Sample"] = d.Sample
      		return dat_plusSamp; })
        return d.taxa;
      })
      .enter().append("rect")
      .attr("taxon", function(d){ return d.name; })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { 
        return y(d.y1); 
      })
      .attr("height", function(d) { 
        return y(d.y0) - y(d.y1) + 1; 
      })
      .style("fill", function(d) { 
        return colors(d.name); 
      })
      .style("opacity", 0.75)
      .on("mouseover", function(d){
        var current_rectangle_data = d3.select(this).datum();
        highlight_overall(current_rectangle_data.name, "", 1);
        name_split = (current_rectangle_data.name.split('_')).pop()
        tooltip.html("<strong>Taxon</strong>: " + name_split + "<br>" + "<strong>Sample: </strong>"+current_rectangle_data.Sample + " <br>"+ "<strong>Relative Abundance: </strong>" +Math.round((current_rectangle_data.y1-current_rectangle_data.y0)*100)/100+"%");
        return tooltip.style("visibility", "visible");
      })
      .on("mousemove", function(){ 
        return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
      .on("mouseout", function(){
        var current_rectangle_data = d3.select(this).datum();
        dehighlight_overall(current_rectangle_data.name, "", 1);
        return tooltip.style("visibility", "hidden");
      });

    var xtick_svg = svglink.append("svg")
    .attr("id", "xtick_svg")
    .attr("x", 0)
    .attr("y",graphdims.height + graphdims.height_buffer)
    .attr("width", dims.width)
    .attr("height", dims.height-25 - graphdims.height - graphdims.height_buffer)
    .style("font-family", "Verdana");

      xtick_svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(" + (dims.width-graphdims.width + graphdims.width_buffer) + ",0)")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-8")
      .attr("dy", graphdims.sample_label_buffer)
      .attr("transform", function(d) {
        return "rotate(-90)"
      });

    svglink.append("g")
      .attr("class", "y axis")
	  .attr("transform","translate("+ (dims.width-graphdims.width + graphdims.width_buffer) +"," + graphdims.height_buffer + ")")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .attr("class", "y_label"); 

        svglink.selectAll("text").style("fill",function(m){
      if(sampledata.map(function(e){ return e.Sample; }).indexOf(m)!==-1){
        return sampleColor(otu_bar.getSampleGroup(m, sampledata, grouping));        
      }
    });


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

otu_bar.select_bars = function(taxon){
 selected =  d3.select("#taxa_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.name == taxon;
    });
	var trimstr = taxon.replace(/\W+/g,'') + "_tx";
	current_color = selected.style("fill");

	if (d3.select("#" + trimstr)[0][0] == null) {
  		var t = textures.lines()
    			.thicker()
    			.background(current_color)
			.id(trimstr)
    			.stroke("white");

  		d3.select("#patternsvg").call(t);
	}

    selected.style("opacity", 1)
        .style("fill", "url(#" + trimstr + ")");

}

otu_bar.deselect_bars = function(taxon, colors){
  d3.select("#taxa_bars")
    .selectAll(".g")
    .selectAll("rect")
    .filter(function(d) {
      return d.name == taxon;
    })
    .style("opacity", 0.75)
    .style("fill", function(d){ return colors(d.name); });
}

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

