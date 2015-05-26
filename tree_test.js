var margin = {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120
},
width = window.innerWidth - margin.left - margin.right - 50,
height = window.innerHeight - margin.top - margin.bottom - 50;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .children(function (d) {
    if (d.hasOwnProperty('values')) return d.values;
    else if (d.hasOwnProperty('children')) return d.children;
})
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function (d) {
    return [d.y, d.x];
});

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.tsv("taxa_mapping.txt", function(error, data){

    var nested_data = d3.nest()
        .key(function(d) {return d.Kingdom; })
        .key(function(d) { return d.Phylum; })
        .key(function(d) { return d.Class; })
        .key(function(d) { return d.Order; })
        .key(function(d) { return d.Family; })
        .key(function(d) { return d.Genus; })
        .key(function(d) { return d.Species; })
        .entries(data);    

    function fixNames(d){
        d.name = d.key;
        if(d.hasOwnProperty('values')){
            d.children = d.values;
            d.values.forEach(fixNames);
        }
    }
    newData = {
        "name": "All Taxa",
        "children": nested_data,
    }


    root = newData;
    root.x0 = height/2;
    root.y0 = 0;

    function collapse(d) {
        if (d.hasOwnProperty('name')) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        } else if (d.hasOwnProperty('key')) {
            if (d.values) {
                d._values = d.values;
                d._values.forEach(collapse);
                d.values = null;
            }
        }
    }

    root.children.forEach(collapse);

    update(root);

    d3.select(self.frameElement).style("height", "800px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        console.log(nodes.toSource());
        nodes.forEach(function (d) {
            d.y = d.depth * 140;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function (d) {
            return d._children || d._values ? "lightsteelblue" : "#fff";
        });

        nodeEnter.append("text")
            .attr("x", function (d) {
            return d.children || d._children || d.values || d._values ? -10 : 10;
            //return d.children || d.values ? -10 : 10;
        })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
            return d.children || d._children || d.values || d._values ? "end" : "start";
        })
            .text(function (d) {
               if(d.name != null)
                   return d.name;
               else if(d.key != null)
                   return d.key;
        })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) {
            return d._children || d._values ? "lightsteelblue" : "#fff";
        });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
            return d.target.id;
        });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        }).remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            console.log(d.x);
            console.log(d.y);
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.hasOwnProperty('name')) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        } else if (d.hasOwnProperty('key')) {
            if (d.values) {
                d._values = d.values;
                d.values = null;
            } else {
                d.values = d._values;
                d._values = null;
            }
        }
        update(d);
    }
});