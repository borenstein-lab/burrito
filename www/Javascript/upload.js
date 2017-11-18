(function(){
	var uploader_wrapper = {};

	uploader_wrapper.make_uploader = function(draw_everything, update_picrust_loading_progress, update_table_downloading_progress){

		var uploader = {};

		// Initializing the flags that keep track of when files are loaded and the list of objects themselves
		uploader.attribute_enum = {
			CONTRIBUTION_TABLE : 0,
			TAXONOMIC_HIERARCHY_TABLE : 1,
			FUNCTION_HIERARCHY_TABLE : 2,
			FUNCTION_AVERAGES : 3,
			METADATA_TABLE : 4,
			TAXONOMIC_ABUNDANCE_TABLE : 5,
			TAXONOMIC_ABUNDANCE_SAMPLE_ORDER : 6,
			FUNCTION_ABUNDANCE_SAMPLE_ORDER : 7,
			TAXONOMIC_LEVELS : 8,
			FUNCTION_LEVELS : 9,
			NSTI_TABLE : 10,
			STATISTICS_TABLE : 11	
		};

		uploader.load_flags = [];
		for (key in uploader.attribute_enum){
			uploader.load_flags.push(false);
		}

		uploader.data_objects = [];
		for (key in uploader.attribute_enum){
			uploader.data_objects.push(null);
		}

		// Indicates whether the SVG visualization element already exists
		uploader.svgCreated = false;
		
		// Initializing constants to keep track of piece-wise uploading indices
		uploader.curr_picrust_otus = 0;
		uploader.total_picrust_otus = 0;
		uploader.current_contribution_sample_index = 0;
		uploader.current_taxonomic_abundance_sample_index = 0;
		uploader.taxonomic_abundance_table_length = 0;
		uploader.contribution_table_length = 0;
		
		/*
		reset_load_flags()

		Sets the load flags to false for data that needs to be received from the server
		*/
		uploader.reset_load_flags = function(){
			for (var i = 0; i < uploader.load_flags.length; i++){
				uploader.load_flags[i] = false
			}
		}

		/*
		update_plots()

		Checks to see if the necessary data is available to update the plots. If not, waits to update until the data is ready.
		*/
		uploader.update_plots = function(){
			var all_loaded = true;

			// Check each flag to see if the file has been loaded
			for (var i = 0; i < uploader.load_flags.length; i++){
				if (!uploader.load_flags[i]){
					all_loaded = false;
				}
			}

			// If all of the flags are true, redraw the graphics
			if (all_loaded){
				draw_everything(uploader.data_objects[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_TABLE],
					uploader.data_objects[uploader.attribute_enum.CONTRIBUTION_TABLE],
					uploader.data_objects[uploader.attribute_enum.TAXONOMIC_HIERARCHY_TABLE],
					uploader.data_objects[uploader.attribute_enum.FUNCTION_HIERARCHY_TABLE],
					uploader.data_objects[uploader.attribute_enum.METADATA_TABLE],
					uploader.data_objects[uploader.attribute_enum.FUNCTION_AVERAGES],
					uploader.data_objects[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_SAMPLE_ORDER],
					uploader.data_objects[uploader.attribute_enum.FUNCTION_ABUNDANCE_SAMPLE_ORDER],
					uploader.data_objects[uploader.attribute_enum.TAXONOMIC_LEVELS],
					uploader.data_objects[uploader.attribute_enum.FUNCTION_LEVELS],
					uploader.data_objects[uploader.attribute_enum.NSTI_TABLE],
					uploader.data_objects[uploader.attribute_enum.STATISTICS_TABLE]);
			}
		}


		/*
		number_of_otus handler

		Initializes the progress state of the number of picrust OTUs that we need to load genomic content data for
		*/
		Shiny.addCustomMessageHandler("number_of_otus", function(num_otus){
			uploader.total_picrust_otus = num_otus
			update_picrust_loading_progress(0, uploader.total_picrust_otus)
		})

		/*
		otu_genomic_content_processed handler

		Keeps track of how many OTUs have had their genomic content loaded and updates the progress page
		*/
		Shiny.addCustomMessageHandler("otu_genomic_content_processed", function(x){
			uploader.curr_picrust_otus += 1
			update_picrust_loading_progress(uploader.curr_picrust_otus, uploader.total_picrust_otus)
			if (uploader.curr_picrust_otus == uploader.total_picrust_otus){
				uploader.curr_picrust_otus = 0
			}
		})

		/*
		taxonomic_abundance_table_ready handler

		Initializes the taxonomic abundance table in the uploader class in preparation for receiving the taxonomic abundance table from the server.
		*/
		Shiny.addCustomMessageHandler("taxonomic_abundance_table_ready", function(size){

			// Update the flag to indicate the taxonomic abundance table has not been loaded yet and initialize it
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_TABLE] = false;
			uploader.data_objects[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_TABLE] = [];
			uploader.taxonomic_abundance_table_length = size;
			uploader.current_taxonomic_abundance_sample_index = 0;

			// After initializing the data structure, request the first sample
			Shiny.onInputChange("taxonomic_abundance_sample_request", 0);
		})

		/*
		taxonomic_abundance_sample_return handler

		Reads the taxonomic abundance table entry for a sample returned by the server and requests the next sample, or if this is the last sample then calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("taxonomic_abundance_sample_return", function(taxonomic_abundance_sample){

			// Append the most recent sample received and ask for next sample
			uploader.data_objects[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_TABLE].push(taxonomic_abundance_sample[0]);
			++uploader.current_taxonomic_abundance_sample_index;

			// Update the progress bar
			update_table_downloading_progress(uploader.current_taxonomic_abundance_sample_index, uploader.taxonomic_abundance_table_length, "taxonomic_abundance");

			// Fixes the disconnect issue by requesting pieces of the data rather than the full table
			setTimeout(function(){

				// If there is another sample to request, then request it
				if (uploader.current_taxonomic_abundance_sample_index < uploader.taxonomic_abundance_table_length){
		            Shiny.onInputChange("taxonomic_abundance_sample_request", uploader.current_taxonomic_abundance_sample_index);

		        // Otherwise, update the flag to indicate the taxonomic abundance table has been fully loaded and call for a plot update
				} else {
					Shiny.onInputChange("taxonomic_abundance_sample_request", -1);
					uploader.load_flags[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_TABLE] = true;
					uploader.update_plots();
				}
			}, 2);
        });

		/*
		contribution_table_ready handler

		Initializes the contribution table in the uploader class in prepartion for receiving the contribution table from the server.
		*/
		Shiny.addCustomMessageHandler("contribution_table_ready", function(size){

			// Update the flag to indicate the contribution table has not been loaded yet and initialize it
			uploader.load_flags[uploader.attribute_enum.CONTRIBUTION_TABLE] = false;
			uploader.data_objects[uploader.attribute_enum.CONTRIBUTION_TABLE] = {};
			uploader.contribution_table_length = size;
			uploader.current_contribution_sample_index = 0;

			// After initializing the data structure and updating the progress bar, request the first sample
			Shiny.onInputChange("contribution_sample_request", 0);
		})

		/*
		contribution_sample_return handler

		REads the contribution table netry for a sample returned by the server and requests the next sample, or if this is the last sample then calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("contribution_sample_return", function(contribution_sample){

			// Add the most recent sample to the map of contribution table samples by sample name and ask for the next sample
			contribution_sample_name = Object.keys(contribution_sample)[0]
			uploader.data_objects[uploader.attribute_enum.CONTRIBUTION_TABLE][contribution_sample_name] = contribution_sample[contribution_sample_name];
			++uploader.current_contribution_sample_index;

			// Update the progress bar
			update_table_downloading_progress(uploader.current_contribution_sample_index, uploader.contribution_table_length, "contribution");

			// Fixes the disconnect issue by requesting pieces of the data rather than the full table
			setTimeout(function(){

				// If there is another sample, request it
				if (uploader.current_contribution_sample_index < uploader.contribution_table_length){
		            Shiny.onInputChange("contribution_sample_request", uploader.current_contribution_sample_index);

		        // Otherwise, update the flag to indicate the contribution table has been loaded and request a plot update
				} else {
					Shiny.onInputChange("contribution_sample_request", -1);
					uploader.load_flags[uploader.attribute_enum.CONTRIBUTION_TABLE] = true;
					uploader.update_plots();
				}
			}, 2);
        });

		/*
		metadata_table handler

		Reads the metadata table and updates the appropriate flag.
		*/
		Shiny.addCustomMessageHandler("metadata_table", function(metadata_table){
			uploader.load_flags[uploader.attribute_enum.METADATA_TABLE] = false;

			// If no metadata table was provided, set it to the empty string
			if (metadata_table == "NULL"){
				uploader.data_objects[uploader.attribute_enum.METADATA_TABLE] = ""

			// Otherwise, use the metadata table text
			} else {
				uploader.data_objects[uploader.attribute_enum.METADATA_TABLE] = metadata_table;
			}
			uploader.load_flags[uploader.attribute_enum.METADATA_TABLE] = true;
			uploader.update_plots();
		})

		/*
		taxonomic_abundance_sample_order handler

		Reads the sample display order for the taxonomic abundance table and updates the appropriate flag.
		*/
		Shiny.addCustomMessageHandler("taxonomic_abundance_sample_order", function(sample_order){
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_SAMPLE_ORDER] = false;
			uploader.data_objects[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_SAMPLE_ORDER] = sample_order;
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_ABUNDANCE_SAMPLE_ORDER] = true;
			uploader.update_plots();
        });

		/*
		function_abundance_sample_order handler

		Reads the sample display order for the function abundance table and updates the appropriate flag.
		*/
        Shiny.addCustomMessageHandler("function_abundance_sample_order", function(sample_order){
        	uploader.load_flags[uploader.attribute_enum.FUNCTION_ABUNDANCE_SAMPLE_ORDER] = false;
        	uploader.data_objects[uploader.attribute_enum.FUNCTION_ABUNDANCE_SAMPLE_ORDER] = sample_order;
        	uploader.load_flags[uploader.attribute_enum.FUNCTION_ABUNDANCE_SAMPLE_ORDER] = true;
        	uploader.update_plots();
        });

        /*
		taxonomic_hierarchy handler

		Reads the taxonomic hierarchy, updates the appropriate flag, and calls for a plot update.
        */
		Shiny.addCustomMessageHandler("taxonomic_hierarchy", function(taxonomic_hierarchy){
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_HIERARCHY_TABLE] = false;
			uploader.data_objects[uploader.attribute_enum.TAXONOMIC_HIERARCHY_TABLE] = taxonomic_hierarchy;
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_HIERARCHY_TABLE] = true;
			uploader.update_plots();
		});

		/*
		function_hierarchy handler

		Reads the function hierarchy and updates the appropriate flag.
		*/
		Shiny.addCustomMessageHandler("function_hierarchy", function(function_hierarchy){
			uploader.load_flags[uploader.attribute_enum.FUNCTION_HIERARCHY_TABLE] = false;
			uploader.data_objects[uploader.attribute_enum.FUNCTION_HIERARCHY_TABLE] = function_hierarchy;
			uploader.load_flags[uploader.attribute_enum.FUNCTION_HIERARCHY_TABLE] = true;
			uploader.update_plots();
		});

		/*
		function_averages handler

		Reads the function abundance averages, updates the appropriate flag, and calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("function_averages", function(function_averages){
			uploader.load_flags[uploader.attribute_enum.FUNCTION_AVERAGES] = false;
			uploader.data_objects[uploader.attribute_enum.FUNCTION_AVERAGES] = function_averages;
			uploader.load_flags[uploader.attribute_enum.FUNCTION_AVERAGES] = true;
			uploader.update_plots();
		});

		/*
		nsti_table handler

		Reads the NSTI table, updates the appropriate flag, and calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("nsti_table", function(nsti_table){
			uploader.load_flags[uploader.attribute_enum.NSTI_TABLE] = false;
			uploader.data_objects[uploader.attribute_enum.NSTI_TABLE] = nsti_table;
			uploader.load_flags[uploader.attribute_enum.NSTI_TABLE] = true;
			uploader.update_plots();
		})

		/*
		statistics_table handler

		Reads the statistics table, updates the appropriate flag, and calls for a plot update.
		*/
		Shiny.addCustomMessageHandler("statistics_table", function(statistics_table){
			uploader.load_flags[uploader.attribute_enum.STATISTICS_TABLE] = false;
			uploader.data_objects[uploader.attribute_enum.STATISTICS_TABLE] = statistics_table;
			uploader.load_flags[uploader.attribute_enum.STATISTICS_TABLE] = true;
			uploader.update_plots();
		})

		/*
		taxonomic_hierarchy_labels handler

		Updates the taxonomic hierarchy labels for the visualization.
		*/
		Shiny.addCustomMessageHandler("taxonomic_hierarchy_labels", function(labels){
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_LEVELS] = false;
			uploader.data_objects[uploader.attribute_enum.TAXONOMIC_LEVELS] = labels;
			uploader.load_flags[uploader.attribute_enum.TAXONOMIC_LEVELS] = true;
		});

		/*
		taxonomic_hierarchy_dropdown_labels handler

		Updates the the taxonomic hierarchy level-of-detail dropdown labels based on the taxonomic hierarchy being used. Default to the default taxonomic hierarchy labels with Genus selected.
		*/
		Shiny.addCustomMessageHandler("taxonomic_hierarchy_dropdown_labels", function(labels){

			// Grab the dropdown element to modify
			tax_dropdown = document.getElementById("taxonomic_level_of_detail_selector");

			// Remove the old options
			var old_options = jQuery.extend(true, [], tax_dropdown.options)
			for (var i = 0; i < old_options.length; i++){
				tax_dropdown.remove(old_options[i])
			}

			// Create the new options
			for (var i = 0; i < labels.length; i++){
				var option = document.createElement("option");
				option.text = labels[i];
				option.value = labels[i];
				tax_dropdown.add(option);
			}

			// Set the preselected option to the default if it exists
			for (var i = 0; i < labels.length; i++){
				var curr_option = tax_dropdown.options[i]
				if (curr_option.value == default_taxonomic_summary_level) {
					tax_dropdown.selectedIndex = i;
					break;
				}
			}
		});

		/*
		function_hierarchy_labels handler

		Updates the the function hierarchy labels for the visualization.
		*/
		Shiny.addCustomMessageHandler("function_hierarchy_labels", function(labels){
			uploader.load_flags[uploader.attribute_enum.FUNCTION_LEVELS] = false;
			uploader.data_objects[uploader.attribute_enum.FUNCTION_LEVELS] = labels;
			uploader.load_flags[uploader.attribute_enum.FUNCTION_LEVELS] = true;
		});

		/*
		function_hierarchy_dropdown_labels handler

		Updates the function hierarchy level-of-detail dropdown labels based on the function hierarchy being used. Default to the default function hierarchy labels with SubPathway selected.
		*/
		Shiny.addCustomMessageHandler("function_hierarchy_dropdown_labels", function(labels){

			// Grab the dropdown element to modify
			func_dropdown = document.getElementById("function_level_of_detail_selector");

			// Remove the old options
			var old_options = jQuery.extend(true, [], func_dropdown.options)
			for (var i = 0; i < old_options.length; i++){
				func_dropdown.remove(old_options[i])
			}

			// Create the new options
			for (var i = 0; i < labels.length; i++){
				var option = document.createElement("option");
				option.text = labels[i];
				option.value = labels[i];
				func_dropdown.add(option);
			}

			// Set the preselected option to the default if it exists
			for (var i = 0; i < labels.length; i++){
				var curr_option = func_dropdown.options[i];
				if (curr_option.value == default_function_summary_level) {
					func_dropdown.selectedIndex = i;
					break;
				}
			}
		});

		/*
		metadata_table_labels handler

		Updates the sample map factor-to-order-by dropdown labels based on the metadata table labels being used. Default to no selected sample ordering.
		*/
		Shiny.addCustomMessageHandler("metadata_table_labels", function(labels){

			// Grab the dropdown element to modify
			metadata_label_dropdown = document.getElementById("metadata_factor_selector")

			// Remove the old options
			var old_options = jQuery.extend(true, [], metadata_label_dropdown.options)
			for (var i = 0; i < old_options.length; i++){
				metadata_label_dropdown.remove(old_options[i])
			}

			// If there is only one label, treat it as a single string rather than a list of characters
			if (typeof labels === 'string' || labels instanceof String){

				// Add the label to the dropdown
				var option = document.createElement("option");
				option.text = labels;
				option.value = labels;
				metadata_label_dropdown.add(option);

			// Otherwise, treat it normally as a list of strings
			} else {

				// Create the new options
				for (var i = 0; i < labels.length; i++){
					var option = document.createElement("option");
					option.text = labels[i];
					option.value = labels[i];
					metadata_label_dropdown.add(option);
				}
			}
		});

		/*
		retry_upload handler

		If it takes a non-negligble amount of time to upload data to the server, then repeats the update request until the data finishes uploading.
		*/
		Shiny.addCustomMessageHandler("retry_upload", function(message){
			setTimeout(function(){
				document.getElementById("update_button").click()
			}, 2000)
		})

		// Set up the event handlers for loading files when they get chosen for upload
		document.getElementById("taxonomic_abundance_table").addEventListener('change', function(e){
			Shiny.onInputChange("new_file_trigger", "taxonomic_abundance_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("taxonomic_abundance_table", this.files[0].name);
			}
		})
		document.getElementById("taxonomic_abundance_table").addEventListener('progress', function(e){
			if (e.lengthComputable){
				console.log("add upload event-listener" + e.loaded + "/" + e.total);
			}
		}, false)
		document.getElementById("metadata_table").addEventListener('change', function(e){
			document.getElementById('metadata').checked = true;
			Shiny.onInputChange("new_file_trigger", "metadata_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("metadata_table", this.files[0].name);
			}
		});
		document.getElementById("contribution_table").addEventListener('change', function(e) {
			document.getElementById('function_contribution').checked = true;
			Shiny.onInputChange("new_file_trigger", "contribution_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("contribution_table",this.files[0].name);
			}
		});
		document.getElementById("genomic_content_table").addEventListener('change', function(e) {
			document.getElementById('genomic_content').checked = true;
			Shiny.onInputChange("new_file_trigger", "genomic_content_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("genomic_content_table",this.files[0].name);
			}
		});
		document.getElementById("custom_taxonomic_hierarchy_table").addEventListener('change', function(e){
			document.getElementById('custom_taxonomic_hierarchy').checked = true;
			Shiny.onInputChange("new_file_trigger", "custom_taxonomic_hierarchy_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("custom_taxonomic_hierarchy_table", this.files[0].name);
			}
		})
		document.getElementById("custom_function_hierarchy_table").addEventListener('change', function(e){
			document.getElementById('custom_function_hierarchy').checked = true;
			Shiny.onInputChange("new_file_trigger", "custom_function_hierarchy_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("custom_function_hierarchy_table", this.files[0].name);
			}
		})
		document.getElementById("function_abundance_table").addEventListener('change', function(e){
			document.getElementById('function_abundance').checked = true;
			Shiny.onInputChange("new_file_trigger", "function_abundance_table");
			if (this.hasOwnProperty('files')){
				mainui.fileloading("function_abundance_table", this.files[0].name);
			}
		})
			
		return(uploader);
	}

	this.uploader_wrapper = uploader_wrapper;
})();
