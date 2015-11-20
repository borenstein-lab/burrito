(function(){
	var uploader_wrapper = {};

	uploader_wrapper.make_uploader = function(draw_everything){

		var uploader = {};

		// These variables keep track of when files are loaded
		uploader.tax_abund_loaded = false;
		uploader.func_abund_loaded = false;
		uploader.func_contrib_loaded = false;
		uploader.tax_hierarchy_loaded = false;
		uploader.func_hierarchy_loaded = false;
		uploader.samp_map_loaded = false;

		// These variables thold the results of file loading
		uploader.tax_abund_text = "";
		uploader.func_abund_text = "";
		uploader.func_contrib_text = "";
		uploader.tax_hierarchy_text = "";
		uploader.func_hierarchy_text = "";
		uploader.samp_map_text = "";

		// These are the file readers
		uploader.tax_abund_reader = new FileReader();
		uploader.func_abund_reader = new FileReader();
		uploader.func_contrib_reader = new FileReader();
		uploader.tax_hierarchy_reader = new FileReader();
		uploader.func_hierarchy_reader = new FileReader();
		uploader.samp_map_reader = new FileReader();

		// These are the default data readers
		uploader.default_tax_abund_file = new XMLHttpRequest();
		uploader.default_func_abund_file = new XMLHttpRequest();
		uploader.default_func_contrib_file = new XMLHttpRequest();
		uploader.default_tax_hierarchy_file = new XMLHttpRequest();
		uploader.default_func_hierarchy_file = new XMLHttpRequest();
		uploader.default_samp_map_file = new XMLHttpRequest();

		/*
		load_default_data()

		Sends http requests to grab the default data
		*/
		uploader.load_default_data = function(){

			// Add listeners for when the default files have successfully loaded
			this.default_tax_abund_file.addEventListener("load", this.execute_on_default_tax_abund_load);
			this.default_func_abund_file.addEventListener("load", this.execute_on_default_func_abund_load);
			this.default_func_contrib_file.addEventListener("load", this.execute_on_default_func_contrib_load);
			this.default_tax_hierarchy_file.addEventListener("load", this.execute_on_default_tax_hierarchy_load);
			this.default_func_hierarchy_file.addEventListener("load", this.execute_on_default_func_hierarchy_load);
			this.default_samp_map_file.addEventListener("load", this.execute_on_default_samp_map_load);

			this.default_tax_abund_file.open("GET", "Data/reduced_genus_taxa_transpose.txt", true);
			this.default_tax_abund_file.send();
			this.default_func_abund_file.open("GET", "Data/reduced_pathway_functions_transpose.txt", true);
			this.default_func_abund_file.send();
			this.default_func_contrib_file.open("GET", "Data/reduced_genus_pathway_metagenome_contributions.txt", true);
			this.default_func_contrib_file.send();
			this.default_tax_hierarchy_file.open("GET", "Data/taxa_mapping2.txt", true);
			this.default_tax_hierarchy_file.send();
			this.default_func_hierarchy_file.open("GET", "Data/function_mapping2.txt", true);
			this.default_func_hierarchy_file.send();
			this.default_samp_map_file.open("GET", "Data/mice_samplemap.txt", true);
			this.default_samp_map_file.send();
		}

		/*
		update_plots()

		Checks to see what files have been selected for upload. If no files are selected, then just reset the plots using the current data. If some, but not all of the necessary files have been uploaded, then display messages to the user indicating which files still need to be selected. If all necessary files have been selected, upload the data and generate new plots.
		*/
		uploader.update_plots = function(){
			var tax_abund = false;
			var func_abund = false;
			var func_contrib = false;
			var tax_hierarchy = false;
			var func_hierarchy = false;
			var samp_map = false;

			// Check to see if we have a file of taxonomic abundances
			if (document.getElementById("taxonomic_abundances").value != ""){
				tax_abund = true;
			}

			// Check to see if we have a file of functional abundances
			if (document.getElementById("function_abundances").value != ""){
				func_abund = true;
			}

			// Check to see if we have a file of functional contributions
			if (document.getElementById("function_contributions").value != ""){
				func_contrib = true;
			}

			// Check to see if we have a file describing the taxonomic hierarchy
			if (document.getElementById("taxonomic_hierarchy").value != ""){
				tax_hierarchy = true;
			}	

			// Check to see if we have a file describing the functional hierarchy
			if (document.getElementById("function_hierarchy").value != ""){
				func_hierarchy = true;
			}

			// Check to see if we have a file describing the samples
			if (document.getElementById("sample_map").value != ""){
				samp_map = true;
			}

			// Now check if any new files have been selected
			if (tax_abund || func_abund || func_contrib || tax_hierarchy || func_hierarchy || samp_map){

				// If all of the necessary files have been selected, then we can try to update
				if (tax_abund && func_abund && func_contrib && tax_hierarchy && func_hierarchy){

					// If a sample map has been uploaded, we wait for all 6 files to load
					if (samp_map){
						this.check_loaded([this.tax_abund_loaded, this.func_abund_loaded, this.func_contrib_loaded, this.tax_hierarchy_loaded, this.func_hierarchy_loaded, this.samp_map_loaded], draw_everything)
					} else {
						// If there is no new sample map selected, then we wait for just the necessary files to load
						this.check_loaded([this.tax_abund_loaded, this.func_abund_loaded, this.func_contrib_loaded, this.tax_hierarchy_loaded, this.func_hierarchy_loaded], draw_everything)
					}
				} else {
					// If only a subset of necessary files have been selected, notify the user which ones are missing

					// Display messages showing which files are missing
					if (!tax_abund){
						document.getElementById("tax_abund_message").innerHTML = "You're missing a taxonomic abundances file."
					}

					if (!func_abund){
						document.getElementById("func_abund_message").innerHTML = "You're missing a functional abundances file."
					}

					if (!func_contrib){
						document.getElementById("func_contrib_message").innerHTML = "You're missing a file of taxonomnic contributions to functions."
					}

					if (!tax_hierarchy){
						document.getElementById("tax_hierarchy_message").innerHTML = "You're missing a taxonomic hierarchy file."
					}

					if (!func_hierarchy){
						document.getElementById("func_hierarchy_message").innerHTML = "You're missing a functional hierarchy file."
					}
				}
				// If no files have been uploaded, then we can just reset 
			} else if (!tax_abund && !func_abund && !func_contrib && !tax_hierarchy && !func_hierarchy && !samp_map){
				draw_everything(this.tax_abund_text, this.func_abund_text, this.func_contrib_text, this.tax_hierarchy_text, this.func_hierarchy_text, this.samp_map_text);
			}
		}
		
		/*
		check_loaded()
		Checks to see if the indicate files have been loaded. If so, redraw the graphics.
		*/
		uploader.check_loaded = function(load_flags) {

			var all_loaded = true;

			// Check each flag to see if the file has been loaded
			for (var i = 0; i < load_flags.length; i++){
				if (!load_flags[i]){
					all_loaded = false;
				}
			}

			// If all of the flags are true, redraw the graphics
			if (all_loaded){
				draw_everything(this.tax_abund_text, this.func_abund_text, this.func_contrib_text, this.tax_hierarchy_text, this.func_hierarchy_text, this.samp_map_text);
				document.getElementById("upload_message").innerHTML = "";

				// Reset the upload buttons and flags so if new files are uploaded, we wait for them
				this.tax_abund_loaded = false;
				this.func_abund_loaded = false;
				this.func_contrib_loaded = false;
				this.tax_hierarchy_loaded = false;
				this.func_hierarchy_loaded = false;
				this.samp_map_loaded = false;
				document.getElementById("taxonomic_abundances").value = "";
				document.getElementById("function_abundances").value = "";
				document.getElementById("function_contributions").value = "";
				document.getElementById("taxonomic_hierarchy").value = "";
				document.getElementById("function_hierarchy").value = "";
				document.getElementById("sample_map").value = "";
			} else {
				document.getElementById("upload_message").innerHTML = "Files still uploading.";
			}
		}

		uploader.execute_on_tax_abund_load = function() {
			uploader.tax_abund_text = this.result;
			uploader.tax_abund_loaded = true;
		}

		uploader.execute_on_func_abund_load = function() {
			uploader.func_abund_text = this.result;
			uploader.func_abund_loaded = true;

		}

		uploader.execute_on_func_contrib_load = function() {
			uploader.func_contrib_text = this.result;
			uploader.func_contrib_loaded = true;

		}

		uploader.execute_on_tax_hierarchy_load = function() {
			uploader.tax_hierarchy_text = this.result;
			uploader.tax_hierarchy_loaded = true;

		}

		uploader.execute_on_func_hierarchy_load = function() {
			uploader.func_hierarchy_text = this.result;
			uploader.func_hierarchy_loaded = true;

		}

		uploader.execute_on_samp_map_load = function() {
			uploader.samp_map_text = this.result;
			uploader.samp_map_loaded = true;

		}

		uploader.execute_on_default_tax_abund_load = function() {
			uploader.tax_abund_text = this.responseText;
			uploader.tax_abund_loaded = true;
			uploader.check_loaded([uploader.tax_abund_loaded, uploader.func_abund_loaded, uploader.func_contrib_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded], draw_everything);
		}

		uploader.execute_on_default_func_abund_load = function() {
			uploader.func_abund_text = this.responseText;
			uploader.func_abund_loaded = true;
			uploader.check_loaded([uploader.tax_abund_loaded, uploader.func_abund_loaded, uploader.func_contrib_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded], draw_everything);
		}

		uploader.execute_on_default_func_contrib_load = function() {
			uploader.func_contrib_text = this.responseText;
			uploader.func_contrib_loaded = true;
			uploader.check_loaded([uploader.tax_abund_loaded, uploader.func_abund_loaded, uploader.func_contrib_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded], draw_everything);
		}

		uploader.execute_on_default_tax_hierarchy_load = function() {
			uploader.tax_hierarchy_text = this.responseText;
			uploader.tax_hierarchy_loaded = true;
			uploader.check_loaded([uploader.tax_abund_loaded, uploader.func_abund_loaded, uploader.func_contrib_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded], draw_everything);
		}

		uploader.execute_on_default_func_hierarchy_load = function() {
			uploader.func_hierarchy_text = this.responseText;
			uploader.func_hierarchy_loaded = true;
			uploader.check_loaded([uploader.tax_abund_loaded, uploader.func_abund_loaded, uploader.func_contrib_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded], draw_everything);
		}

		uploader.execute_on_default_samp_map_load = function() {
			uploader.samp_map_text = this.responseText;
			uploader.samp_map_loaded = true;
			uploader.check_loaded([uploader.tax_abund_loaded, uploader.func_abund_loaded, uploader.func_contrib_loaded, uploader.tax_hierarchy_loaded, uploader.func_hierarchy_loaded, uploader.samp_map_loaded], draw_everything);
		}

		// Add listeners for when files have successfully loaded
		uploader.tax_abund_reader.addEventListener('load', uploader.execute_on_tax_abund_load);
		uploader.func_abund_reader.addEventListener('load', uploader.execute_on_func_abund_load);
		uploader.func_contrib_reader.addEventListener('load', uploader.execute_on_func_contrib_load);
		uploader.tax_hierarchy_reader.addEventListener('load', uploader.execute_on_tax_hierarchy_load);
		uploader.func_hierarchy_reader.addEventListener('load', uploader.execute_on_func_hierarchy_load);
		uploader.samp_map_reader.addEventListener('load', uploader.execute_on_samp_map_load);

		// Set up the event handlers for loading files when they get chosen for upload
		document.getElementById("taxonomic_abundances").addEventListener('change', function(e) {
			uploader.tax_abund_reader.readAsText(this.files[0]);
			});
		document.getElementById("function_abundances").addEventListener('change', function(e) {
			uploader.func_abund_reader.readAsText(this.files[0]);
			});
		document.getElementById("function_contributions").addEventListener('change', function(e) {
			uploader.func_contrib_reader.readAsText(this.files[0]);
			});
		document.getElementById("taxonomic_hierarchy").addEventListener('change', function(e) {
			uploader.tax_hierarchy_reader.readAsText(this.files[0]);
			});
		document.getElementById("function_hierarchy").addEventListener('change', function(e) {
			uploader.func_hierarchy_reader.readAsText(this.files[0]);
			});
		document.getElementById("sample_map").addEventListener('change', function(e) {
			uploader.samp_map_reader.readAsText(this.files[0]);
			});

		return(uploader);
	}


	this.uploader_wrapper = uploader_wrapper;
})();