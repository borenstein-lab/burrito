(function(){
	var button_maker = {};

	button_maker.radio_base = "_base";
	button_maker.radio_center = "_center";
	button_maker.radio_base_color = "#FFFFFF";
	button_maker.radio_center_on_color = "#000000";
	button_maker.radio_center_off_color = "#FFFFFF";
	button_maker.button_on_color = "#FF0000"
	button_maker.button_off_color = "#CDC9C9";
	button_maker.text_tag = "_text"

	button_maker.activate = function(button) {
		button.attr("on",true);
		//button.select("rect").attr("fill", button_maker.button_on_color);
		button.classed("activebutton", true);
		//button.selectAll("text").attr("opacity",1);
	}
	
	button_maker.deactivate = function(button) {
		button.attr("on",false);
		//button.select("rect").attr("fill", button_maker.button_off_color);
		button.classed("activebutton", false);
		//button.selectAll("text").attr("opacity",0.5);
	}
	
	button_maker.add_rect_button = function(element, id, x, y, width, height, rxy, newclass, fontsize, text, on_click){

		var thisg = element.append("g")
			.attr("id", id);
			
		if (newclass) { thisg.attr("class",newclass); }
		thisg.classed("noselect",true);
		
		var thisrect = thisg.append("rect")
			.attr("x", x)
			.attr("y", y)
			.attr("width", width)
			.attr("height", height)
			.attr("rx", rxy)
			.attr("ry", rxy);
		
		//if (fill) { thisrect.style("fill",fill); }
		if (fontsize) { thisrect.style("font-size", fontsize) }

		document.getElementById(id).addEventListener("click", function() {
			
			if (document.getElementById(id).getAttribute("on") == "true") {
				on_click();
			}
		})
	
		var text_components = text.split(" ");

		for (i = 0; i < text_components.length; i++){
			thisg.append("text")
			.attr("id", id + this.text_tag + "_" + i)
			.attr("x", x + (width / 2))
			.attr("y", y + 6 + (height * (i + 1)/ (text_components.length + 1)))
			//.attr("font-size", "20px")
			.attr("text-anchor", "middle")
			.text(text_components[i])
			.classed("noselect",true);
		}
		
		button_maker.activate(thisg);
	}

	button_maker.add_circle_button = function(element, id, x, y, r, fill, text, on_click){

		element.append("circle")
		.attr("id", id)
		.attr("cx", x)
		.attr("cy", y)
		.attr("r", r)
		.attr("fill", fill)

		document.getElementById(id).addEventListener("click", on_click)

		var text_components = text.split(" ");

		for (i = 0; i < text_components.length; i++){
			element.append("text")
			.attr("id", id + this.text_tag + "_" + i)
			.attr("x", x + (width / 2))
			.attr("y", y + 6 + (height * (i + 1)/ (text_components.length + 1)))
			.attr("font-size", "20px")
			.attr("text-anchor", "middle")
			.text(text_components[i])

			document.getElementById(id + this.text_tag + "_" + i).addEventListener("click", on_click)
		}
	}

	button_maker.add_input_button = function(element, container, svg_button_id, html_button_id, x, y, width, height, fill, text){

		this.add_rect_button(element, svg_button_id, x, y, width, height, "uploadb",fill, text, function(){
			if (document.getElementById(svg_button_id).getAttribute("on") == "true"){
				document.getElementById(html_button_id).click();
			}
		})

		d3.select("#"+svg_button_id).attr("on", false);
		

		var html_button = document.createElement("input")
		html_button.id = html_button_id;
		html_button.name = html_button_id;
		html_button.type = "file";

		document.getElementById(container).appendChild(html_button)
		
	}

	this.button_maker = button_maker;
})();
