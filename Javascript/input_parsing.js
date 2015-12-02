(function(){
	var input_parser = {};

	// Convert a long form text table into a 2d lookup table in memory
	input_parser.convert_long_form_to_lookup = function(text, row_index, col_index, val_index){
		var lines = text.split("\n");
		for (i = 0; i < lines.length; i++){
			lines[i] = lines[i].split("\t")
		}
		var output = [];
		for (i = 0; i < lines.length; i++){
			var row = lines[i][row_index];
			var col = lines[i][col_index];
			var val = lines[i][val_index];
			if (!output.hasOwnProperty(row)){
				output[row] = [];
			}
			output[row][col] = val;
		}
		return(output)
	}

	// Convert matrix into a 2d lookup table in memory
	input_parser.convert_matrix_to_lookup = function(text, row_header, col_first){
		var lines = text.split("\n")
		header = lines[0].split("\t");
		var output = [];
		for (i = 1; i < lines.length; i++){
			var elements = lines[i].split("\t")
			for (j = 1; j < elements.length; j++){
				var col_name = "";
				if (row_header){
					col_name = header[j];
				} else {
					col_name = header[j - 1];
				}
				var row_name = elements[0];
				if (col_first){
					if (!output.hasOwnProperty(col_name)){
						output[col_name] = [];
					}
					output[col_name][row_name] = elements[j];
				} else {
					if (!output.hasOwnProperty(row_name)){
						output[row_name] = [];
					}
					output[row_name][col_name] = elements[j];
				}
			}
		}
		return(output)
	}

	// Multiply two lookup tables together 
	input_parser.multiply_lookup_tables = function(lookup_1, lookup_2){
		var output = [];
		return(output)
	}

	this.input_parser = input_parser;
})();