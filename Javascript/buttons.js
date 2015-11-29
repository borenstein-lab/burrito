(function(){
	var button_maker = {};

	button_maker.add_button = function(element, rect_id, x, y, width, height, fill, text_id, text, on_click){

		element.append("rect")
		.attr("id", rect_id)
		.attr("x", x)
		.attr("y", y)
		.attr("width", width)
		.attr("height", height)
		.attr("fill", fill)

		document.getElementById(rect_id).addEventListener("click", on_click)

		var text_components = text.split(" ");

		for (i = 0; i < text_components.length; i++){
			element.append("text")
			.attr("id", text_id + "_" + i)
			.attr("x", x + (width / 2))
			.attr("y", y + 6 + (height * (i + 1)/ (text_components.length + 1)))
			.attr("font-size", "20px")
			.attr("text-anchor", "middle")
			.text(text_components[i])

			document.getElementById(text_id + "_" + i).addEventListener("click", on_click)
		}
	}

	this.button_maker = button_maker;
})();