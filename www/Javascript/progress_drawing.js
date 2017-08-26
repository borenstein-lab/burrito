add_upload_step = function(upload_step_name, initial_text, step_number, upload_stepsg, last_step, width, ypos){

	var xpos = width * step_number / (upload_steps.length + 1)

	var upload_stepg = upload_stepsg.append("g")
		.attr("id", upload_step_name)
		.attr("class", "pending")

	if (!last_step){
		upload_stepg.append("rect")
			.attr("x", xpos)
			.attr("y", ypos)
			.attr("width", width / (upload_steps.length + 1))
	}

	upload_stepg.append("circle")
		.attr("cx", xpos)
		.attr("cy", ypos)

	// Uncomment to add text underneath the circle for each step
	// var upload_text = upload_stepsg.append("text")
	// 		.attr("id", upload_step_name + "_text_" + word_index)
	// 		.attr("x", xpos)
	// 		.attr("y", ypos + (width / 49))

	// var text_words = initial_text.split(" ")
	// for (var word_index = 0; word_index < text_words.length; word_index++){
	// 	upload_text.append("tspan")
	// 		.attr("x", xpos)
	// 		.attr("text-anchor", "middle")
	// 		.attr("dy", "1.4em")
	// 		.text(text_words[word_index])
	// }
}

add_table_loading_bar = function(loading_bar_name, loading_bar_text, ypos, loadg, width, height){
	
	var bar_width = width * (upload_steps.length - 1) / (upload_steps.length + 1)
	var xpos = (width / 2) - (bar_width / 2)

	loadg.append("text")
		.attr("x", width / 2)
		.attr("y", ypos)
		.attr("class", "loading_text above_bar")
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "baseline")
		.text(loading_bar_text)

	loadg.append("rect")
		.attr("id", loading_bar_name + "_background")
		.attr("class", "background_bar")
		.attr("x", xpos)
		.attr("y", ypos)
		.attr("width", bar_width)

	loadg.append("rect")
		.attr("id", loading_bar_name + "_loading_bar")
		.attr("class", "load_bar")
		.attr("x", xpos)
		.attr("y", ypos)
		.attr("width", 0)

	loadg.append("text")
		.attr("id", loading_bar_name + "_loading_text")
		.attr("class", "loading_text below_bar")
		.attr("x", width / 2)
		.attr("y", ypos)
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "hanging")
		.text(default_loading_bar_progress_text)
}

draw_loading = function(width, height) {
	var loadg = MainSVG.append("g")
		.attr("id","loadingG");
	
	var upload_stepsg = loadg.append("g")
		.attr("id", "upload_stepsG")
		.attr("class", "upload_steps")

	for (var upload_step_index = 0; upload_step_index < upload_steps.length; upload_step_index++){

		var last_step = !(upload_step_index < upload_steps.length - 1)
		add_upload_step(upload_steps[upload_step_index], upload_step_text[upload_step_index], upload_step_index + 1, upload_stepsg, last_step, width, height / (2 + loading_bars.length))
	}

	loadg.append("text")
		.attr("id", "upload_step_message")
		.attr("class", "loading_text below_step")
		.attr("x", width / 2)
		.attr("y", (height / (2 + loading_bars.length)))
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "hanging")
		.text(default_upload_step_text)

	var loading_barsg = loadg.append("g")
		.attr("id", "loading_barsG")
		.attr("class", "loading_bars")

	for (var loading_bar_index = 0; loading_bar_index < loading_bars.length; loading_bar_index++){

		add_table_loading_bar(loading_bars[loading_bar_index], loading_bar_text[loading_bar_index], height * (2 + loading_bar_index) / (2 + loading_bars.length), loading_barsg, width, height)
	}
}

update_progress = function(curr_sample, total_samples, table_name, width){
	if (table_name == "contribution"){
		curr_sample = curr_sample - 1
		total_samples = total_samples-1
	}
	if (curr_sample > 0){
		document.getElementById(table_name + "_loading_text").innerHTML = curr_sample + "/" + (total_samples) + " samples loaded"
		if (curr_sample <= total_samples){
			document.getElementById(table_name + "_loading_bar").setAttribute("width", document.getElementById(table_name + "_background").getAttribute("width") * (curr_sample / total_samples))
		}
		if (curr_sample == total_samples){
			document.getElementById(table_name + "_loading_bar").setAttribute("class", "complete")
		}
	}
}

Shiny.addCustomMessageHandler("upload_status", function(step){
	var upload_done = true
	for (var upload_step_index = 0; upload_step_index < upload_steps.length; upload_step_index++){
		if (step != upload_steps[upload_step_index]){
			document.getElementById(upload_steps[upload_step_index]).setAttribute("class", "complete")
		} else if (step == upload_steps[upload_step_index]){
			document.getElementById(step).setAttribute("class", "in_progress")
			document.getElementById("upload_step_message").innerHTML = "Step " + (upload_step_index + 1) + ": " + upload_step_message_text[upload_step_index]
			upload_done = false
			break
		}
	}

	if (upload_done){
		document.getElementById("upload_step_message").innerHTML = upload_steps_done_text
	}
})

Shiny.addCustomMessageHandler("number_of_samples_message", function(num_samples){
	document.getElementById("taxonomic_abundance_loading_text").innerHTML = "0/" + (num_samples - 1) + " samples loaded"
	document.getElementById("contribution_loading_text").innerHTML = "0/" + (num_samples - 1) + " samples loaded"
})

Shiny.addCustomMessageHandler("abort", function(message){
	d3.select("#mainsvg").remove();
	d3.select("body").classed("svgBody", false);
	alert(message);
})
