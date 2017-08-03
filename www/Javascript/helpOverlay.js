(function(){
	var helpOverlay={};
	
	helpOverlay.padding = 5;
	helpOverlay.createItems = function() {

		helpItems = d3.select("#help_items");

		helpOverlay.makeHelpLabel("Click to reveal image export menu", "help_sidebar", 0.002, 0.053);	
		helpOverlay.makeHelpLabel("Click nodes to expand and collapse the phylogenetic tree", "help_taxnode", 0.048, 0.285);
		helpOverlay.makeHelpLabel("Click bars to lock highlighting", "help_bars", 0.347, 0.11);
		helpOverlay.makeHelpLabel("Mouse over bar charts for detailed abundance information", "help_taxbar", 0.099, 0.674);
		helpOverlay.makeHelpLabel("Click nodes to expand and collapse the functional hierarchy", "help_funcnode", 0.72, 0.23);
		helpOverlay.makeHelpLabel("Highlight taxa to reveal taxa-specific functional contributions", "help_funcbar", 0.63, 0.65);
	}

	helpOverlay.makeHelpLabel = function( label, newid, xpos, ypos) {
		newHelpText = helpItems.append("text")
			.classed("help_text", true)
			.attr("id", newid)
			.attr("x", xpos * width)
			.attr("y", ypos * height)
			.text(label);

		bbox = newHelpText.node().getBBox();

		helpItems.insert("rect", "#" + newid)
			.attr("x", bbox.x - helpOverlay.padding)
			.attr("y", bbox.y - helpOverlay.padding)
			.attr("width", bbox.width + 2 * helpOverlay.padding)
			.attr("height", bbox.height + 2 * helpOverlay.padding)
			.style("fill", "#E8E8E8")
			.style("stroke", "#404040");

	}

	helpOverlay.redraw = function() {
		d3.select("#help_svg").attr("width", width).attr("height", height);
		d3.select("#help_background").attr("width", width).attr("height", height);
		d3.select("#help_button").attr("transform", "translate(" + (width - margin.right) + ", " + 0.03 * height + ")");
		
		d3.select("#help_items").selectAll("text, rect").remove();
		helpOverlay.createItems();

	}

	this.helpOverlay = helpOverlay;
})();
