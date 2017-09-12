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
			.attr("height", width * 0.005)
			.attr("transform", "translate(0, " + (width * -0.0025) + ")")
	}

	upload_stepg.append("circle")
		.attr("cx", xpos)
		.attr("cy", ypos)
		.attr("r", width * 0.01)

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
		.attr("class", "loading_text")
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "baseline")
		.attr("dominant-baseline", "baseline")
		.attr("dy", "-0.75em")
		.text(loading_bar_text)
		.attr("transform", "translate(0, " + (height * -0.0125) + ")")

	loadg.append("rect")
		.attr("id", loading_bar_name + "_background")
		.attr("class", "background_bar")
		.attr("x", xpos)
		.attr("y", ypos)
		.attr("width", bar_width)
		.attr("height", height * 0.025)
		.attr("transform", "translate(0, " + (height * -0.0125) + ")")

	loadg.append("rect")
		.attr("id", loading_bar_name + "_loading_bar")
		.attr("class", "load_bar")
		.attr("x", xpos)
		.attr("y", ypos)
		.attr("width", 0)
		.attr("height", height * 0.025)
		.attr("transform", "translate(0, " + (height * -0.0125) + ")")

	loadg.append("text")
		.attr("id", loading_bar_name + "_loading_text")
		.attr("class", "loading_text")
		.attr("x", width / 2)
		.attr("y", ypos)
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "hanging")
		.attr("dominant-baseline", "hanging")
		.attr("dy", "0.75em")
		.text(default_loading_bar_progress_text)
		.attr("transform", "translate(0, " + (height * 0.0125) + ")")
}

draw_loading = function(width, height, using_picrust){
	var loadg = MainSVG.append("g")
		.attr("id","loadingG");
	
	var upload_stepsg = loadg.append("g")
		.attr("id", "upload_stepsG")
		.attr("class", "upload_steps")

	var num_loading_bars = loading_bars.length;
	if (!using_picrust){
		num_loading_bars -= 1;
	}

	for (var upload_step_index = 0; upload_step_index < upload_steps.length; upload_step_index++){

		var last_step = !(upload_step_index < upload_steps.length - 1)
		add_upload_step(upload_steps[upload_step_index], upload_step_text[upload_step_index], upload_step_index + 1, upload_stepsg, last_step, width, height / (2 + num_loading_bars))
	}

	loadg.append("text")
		.attr("id", "upload_step_message")
		.attr("class", "loading_text below_step")
		.attr("x", width / 2)
		.attr("y", (height / (2 + num_loading_bars)))
		.attr("text-anchor", "middle")
		.attr("alignment-baseline", "hanging")
		.attr("dominant-baseline", "hanging")
		.text(default_upload_step_text)

	var loading_barsg = loadg.append("g")
		.attr("id", "loading_barsG")
		.attr("class", "loading_bars")

	var starting_loading_bar_index = 0
	if (!using_picrust){
		starting_loading_bar_index += 1
	}

	for (var loading_bar_index = starting_loading_bar_index; loading_bar_index < loading_bars.length; loading_bar_index++){

		var true_loading_bar_index = loading_bar_index;
		if (!using_picrust){
			true_loading_bar_index -= 1;
		}

		add_table_loading_bar(loading_bars[loading_bar_index], loading_bar_text[loading_bar_index], height * (2 + true_loading_bar_index) / (2 + num_loading_bars), loading_barsg, width, height)
	}
}

get_picrust_loading_progress_text = function(curr_num, total_num){
	return(picrust_loading_progress_text[0] + curr_num + picrust_loading_progress_text[1] + total_num + picrust_loading_progress_text[2])
}

get_table_downloading_progress_text = function(curr_num, total_num){
	return(table_downloading_progress_text[0] + curr_num + table_downloading_progress_text[1] + total_num + table_downloading_progress_text[2])
}

update_picrust_loading_progress = function(curr_otu, total_otus){
	if (curr_otu >= 0){
		document.getElementById("picrust_loading_text").innerHTML = get_picrust_loading_progress_text(curr_otu, total_otus)
		if (curr_otu <= total_otus){
			document.getElementById("picrust_loading_bar").setAttribute("width", document.getElementById("picrust_background").getAttribute("width") * (curr_otu / total_otus))
		}
		if (curr_otu == total_otus){
			document.getElementById("picrust_loading_bar").setAttribute("class", "complete")
		}
	}
}

update_table_downloading_progress = function(curr_sample, total_samples, table_name){
	if (table_name == "contribution"){
		curr_sample = curr_sample - 1
		total_samples = total_samples-1
	}
	if (curr_sample > 0){
		document.getElementById(table_name + "_loading_text").innerHTML = get_table_downloading_progress_text(curr_sample, total_samples)
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
	document.getElementById("taxonomic_abundance_loading_text").innerHTML = get_table_downloading_progress_text(0, num_samples - 1)
	document.getElementById("contribution_loading_text").innerHTML = get_table_downloading_progress_text(0, num_samples - 1)
})

Shiny.addCustomMessageHandler("abort", function(message){
	d3.select("#mainsvg").remove();
	d3.select("body").classed("svgBody", false);
	alert(message);
})
