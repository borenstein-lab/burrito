!function(){
  var fB = {};
  var margin = {top: 20, right: 20, bottom: 80, left: 40},
      width = window.innerWidth - margin.left - margin.right - 250,
      height = window.innerHeight - margin.top - margin.bottom - 50;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .3);

  var y = d3.scale.linear()
      .rangeRound([height, 0]);

  var color = d3.scale.category20();
  
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





//TO DO
//figure out how to refresh graph
//also need to zoom in on old function level

fB.vizData = function(data){

    var alldata = [];
    var y0 = 0;
    var y1 = 0;

    data.forEach(function(d) {
      var y0 = 0;
      var y1 = 0;
      var h = d.length-1;

      //assign values for size of bars
      d.data.forEach(function(e){

        e.y0 = y0*100;
        e.y1= (y0 += +e.contributions)*100; 


      })

      
  });

    var h = [];
    data.map(function(d) { 
    d.data.map(function(e){
      h.push(e.Sample);
      return e.Sample;
    })  });
    x.domain(h);
    y.domain([0, 100]);
    console.log(x.domain);


   return data;
  }


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

  var sampleColor = d3.scale.ordinal();
  sampleColor["1"] = "red";
  sampleColor["2"] = "darkred";
  sampleColor["3"] = "steelblue";
  sampleColor["4"] = "darkblue";

fB.Draw = function(stackdata, sampledata){
  var viz = fB.vizData(stackdata);

    
    //get the x axis set
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
      return sampleColor[getSampleGroup(m, sampledata)];
    });
      //init the tooltip as invisible
    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");


        //create a Sample object, creates 28 groups(one for each sample)
    var Sample = svg.selectAll(".Sample")
        .data(viz)
        .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) {return "translate(" + x(d.Sample) + ",0)"; });


        //create rects for each value, transpose based on sample
    Sample.selectAll("rect")
      .data(function(d) { 

       return d.data;
      })
      .enter().append("rect")
        .attr("width", x.rangeBand())
        .attr("y", function(d) {return y(d.y1); })
        .attr("height", function(d) {return y(d.y0) - y(d.y1);} )
        .style("fill", function(d) { return color(d.func); })
        .on("mouseover", function(d){
          current_rectangle_data = d3.select(this).datum();
          tempcolor = this.style.fill


          tooltip.text(current_rectangle_data.func + " " + current_rectangle_data.Taxa);
          return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
        .on("mouseout", function(){
          return tooltip.style("visibility", "hidden");


        });
//init y-axis
        svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .attr("class", "y_label");




}


this.fB = fB;
}();
