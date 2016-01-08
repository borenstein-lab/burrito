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
		button.select("rect").attr("fill", button_maker.button_on_color);
		button.classed("activebutton", true);
		button.selectAll("text").attr("opacity",1);
	}
	
	button_maker.deactivate = function(button) {
		button.attr("on",false);
		button.select("rect").attr("fill", button_maker.button_off_color);
		button.classed("activebutton", false);
		button.selectAll("text").attr("opacity",0.5);
	}
	
	button_maker.add_rect_button = function(element, id, x, y, width, height, fill, text, on_click){

		var thisg = element.append("g")
			.attr("class","sidebutton noselect")
			.attr("id", id)
	
		thisg.append("rect")
		//.attr("class","sidebutton")
		.attr("x", x)
		.attr("y", y)
		.attr("width", width)
		.attr("height", height)
		.attr("fill", fill)

		document.getElementById(id).addEventListener("click", on_click)

		var text_components = text.split(" ");

		for (i = 0; i < text_components.length; i++){
			thisg.append("text")
			.attr("id", id + this.text_tag + "_" + i)
			.attr("x", x + (width / 2))
			.attr("y", y + 6 + (height * (i + 1)/ (text_components.length + 1)))
			.attr("font-size", "20px")
			.attr("text-anchor", "middle")
			.text(text_components[i])

			document.getElementById(id + this.text_tag + "_" + i).addEventListener("click", on_click)
		}
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

		this.add_rect_button(element, svg_button_id, x, y, width, height, fill, text, function(){
			if (document.getElementById(svg_button_id).getAttribute("on") == "true"){
				document.getElementById(html_button_id).click();
			}
		})

		d3.select("#"+svg_button_id).attr("on", false)
			.selectAll("text").attr("opacity",.5);
		

		var html_button = document.createElement("input")
		html_button.id = html_button_id;
		html_button.type = "file";

		document.getElementById(container).appendChild(html_button)
		
	}

	button_maker.add_radio_button = function(element, id, x, y, r, other_radio_buttons, associated_buttons, unassociated_buttons){
		
		
		
		this.add_circle_button(element, id + this.radio_base, x, y, r, this.radio_base_color, "", function(){
			this.setAttribute("selected", true);
			document.getElementById(id + button_maker.radio_center).setAttribute("fill", button_maker.radio_center_on_color);

			for (i = 0; i < other_radio_buttons.length; i++){
				document.getElementById(other_radio_buttons[i] + button_maker.radio_base).setAttribute("selected", false)
				document.getElementById(other_radio_buttons[i] + button_maker.radio_center).setAttribute("fill", button_maker.radio_center_off_color)
			}

			for (i = 0; i < associated_buttons.length; i++){
				button_maker.activate(d3.select("#"+associated_buttons[i]));
			}

			for (i = 0; i < unassociated_buttons.length; i++){
				button_maker.deactivate(d3.select("#"+unassociated_buttons[i]));
			}

		})

		document.getElementById(id + this.radio_base).setAttribute("selected", false);

		this.add_circle_button(element, id + this.radio_center, x, y, r * 2/3, this.radio_center_off_color, "", function(){
			document.getElementById(id + button_maker.radio_base).setAttribute("selected", true);
			this.setAttribute("fill", button_maker.radio_center_on_color);

			for (i = 0; i < other_radio_buttons.length; i++){
				document.getElementById(other_radio_buttons[i] + button_maker.radio_base).setAttribute("selected", false)
				document.getElementById(other_radio_buttons[i] + button_maker.radio_center).setAttribute("fill", button_maker.radio_center_off_color)
			}

			for (i = 0; i < associated_buttons.length; i++){
				button_maker.activate(d3.select("#"+associated_buttons[i]));
			}

			for (i = 0; i < unassociated_buttons.length; i++){
				button_maker.deactivate(d3.select("#"+unassociated_buttons[i]));
			}
		})
	}
	


	this.button_maker = button_maker;
})();