# R server code interacting with the main webpage

library(shiny)
library(data.table)

default_func_hierarchy_table = "www/Data/classes_parsed2.tsv"
default_contribution_table = "www/Data/mice_metagenome_contributions.txt"
picrust_normalization_file = "www/Data/precalculated.tab.gz"
picrust_ko_file = "www/Data/ko_13_5_precalculated.tab.gz"

summary_level_index = 4

shinyServer(function(input, output, session) {

    tracked_data = reactiveValues(input_type = NULL, contribution_status="Not started", function_status = "Not started")

    observeEvent(input$genome_annotation_select_button, {
    	tracked_data$input_type = "genome_annotation"
    	})

    observeEvent(input$"16S_select_button", {
    	tracked_data$input_type = "16S"
    	})

    observeEvent(input$contribution_select_button, {
    	tracked_data$input_type = "contribution"
    	})

    ko_normalization_table = reactive({

	func_hierarchy = NULL
	if (is.null(input$function_hierarchy)){
		func_hierarchy = fread(default_func_hierarchy_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)
	} else {
		func_hierarchy_file = input$function_hierarchy
		func_hierarchy_file_path = func_hierarchy_file$datapath
		func_hierarchy = fread(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
	}
	output = func_hierarchy[,.N,by="KO"]
	#output = data.table(KO = levels(factor(func_hierarchy[[1]])))
	#output$norm_factor = sapply(output$KO, function(ko){
	#		return(sum(func_hierarchy[,1,with=FALSE] == ko))
	#	})

	return(output)
	})

    observeEvent(input$update_button, {
	output = NULL
	
	tracked_data$function_status = "Starting"
	if (!is.null(input$func_hierarchy)){
		tracked_data$function_status = "We are loading a user file"
		func_hierarchy_file = input$function_hierarchy
		func_hierarchy_file_path = func_hierarchy_file$datapath
		func_hierarchy = read.csv(func_hierarchy_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		tracked_data$function_status = "We are removing KOs from the user file"
		func_hierarchy = func_hierarchy[,2:dim(func_hierarchy)[2]]
		output = unique(func_hierarchy)
		session$sendCustomMessage(type='function_hierarchy', paste(paste(colnames(output), collapse="\t"), sapply(1:dim(output)[1], function(row){return(paste(output[row], collapse="\t"))}), collapse="\n", sep="\n"))

	} else {
		tracked_data$function_status = "We are loading the default file"
		func_hierarchy = read.csv(default_func_hierarchy_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		tracked_data$function_status = "We are removing KOs from the user file"
		func_hierarchy = func_hierarchy[,2:dim(func_hierarchy)[2]]
		output = unique(func_hierarchy)
		session$sendCustomMessage(type='default_function_hierarchy', paste(paste(colnames(output), collapse="\t"), sapply(1:dim(output)[1], function(row){return(paste(output[row,], collapse="\t"))}), collapse="\n", sep="\n"))
	}
	}, ignoreNULL = FALSE)

    observeEvent(input$update_button, {
	output = NULL
	
	tracked_data$contribution_status = "Starting"
	if (is.null(tracked_data$input_type)){
	
		tracked_data$contribution_status = "Loading default data"
		output = fread(default_contribution_table, sep="\t", header=TRUE, stringsAsFactors=FALSE)

		tracked_data$contriubtion_status = "Filtering and ordering columns"
		output = output[,c(2,3,1,6), with=FALSE]
	} else if (tracked_data$input_type == "genome_annotation"){

		tracked_data$contribution_status = "Loading user genome annotation data"
		otu_abundance_file = input$taxonomic_abundances_1
		otu_abundance_file_path = otu_abundance_file$datapath
		otu_abundance = read.csv(otu_abundance_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		rownames(otu_abundance) = otu_abundance[,1]
		otu_abundance = otu_abundance[,2:dim(otu_abundance)[2]]

		annotation_file = input$genome_annotations
		annotation_file_path = annotation_file$datapath
		annotation = read.csv(annotation_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

		output_rows = sapply(1:dim(otu_abundance)[2], function(col){
			sample = colnames(otu_abundance)[col]
			return(unlist(sapply(1:dim(otu_abundance)[2], function(row){
				otu = otu_abundance[row, 1]
				return(unlist(sapply(levels(factor(annotation[,2])), function(ko){
					if (any(annotation[,1] == otu & annotation[,2] == ko)){
						return(c(sample, otu, ko, otu_abundance[row, col] * annotation[annotation[,1] == otu & annotation[,2] == ko, 3]))
					} else {
						return(c(sample, otu, ko, 0))
					}
					})))
				})))
			})

		output = matrix(output_rows, ncol=4, nrow=(dim(otu_abundance)[2] - 1) * dim(otu_abundance)[1] * length(levels(factor(annotation[,2]))), byrow=TRUE)
	} else if (tracked_data$input_type == "16S"){

		tracked_data$contribution_status = "Loading user 16S data"
		reads_file = input$"16S_counts"
		reads_file_path = reads_file$datapath
		reads = read.csv(reads_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)
		rownames(reads) = reads[,1]
		reads = reads[,2:dim(reads)[2]]

		normalization = read.csv(gzfile(picrust_normalization_file), sep="\t", header=TRUE, stringsAsFactors=FALSE)

		normalized_reads = matrix(unlist(sapply(1:dim(reads)[1], function(row){
			otu = rownames(reads)[row]
			return(reads[row,]/normalization[normalization[1,] == otu,2])
		})), nrow=dim(reads)[1], ncol=dim(reads)[2], byrow=TRUE)
		colnames(normalized_reads) = colnames(reads)
		rownames(normalized_reads) = rownames(reads)

		ko_counts = read.csv(gzfile(picrust_ko_file), sep="\t", header=TRUE, stringsAsFactors=FALSE)
		output_rows = unlist(sapply(1:dim(normalized_reads)[2], function(col){
			sample = colnames(normalized_reads)[col]
			return(unlist(sapply(1:dim(normalized_reads)[1], function(row){
				otu = normalized_reads[row, 1]
				return(unlist(sapply(colnames(ko_counts)[2:length(colnames(ko_counts))], function(ko){
						return(c(sample, otu, ko, normalized_reads[row, col] * ko_counts[ko_counts[,1] == otu, colnames(ko_counts) == ko]))
					})))
				})))
			}))

		output = matrix(output_rows, ncol=4, nrow=(dim(otu_abundance)[2] - 1) * dim(otu_abundance)[1] * length(levels(factor(annotation[,2]))), byrow=TRUE)
	} else if (tracked_data$input_type == "contribution"){

		tracked_data$contribution_status = "Loading user contribution data"
		contribution_file = input$function_contributions
		contribution_file_path = contribution_file$datapath
		contribution = read.csv(contribution_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

		output = contribution[,c(2,3,1,6)]
	}

	if (!is.null(output)){

		tracked_data$contribution_status = "Calculating partial KO contributions"
		func_hierarchy = NULL
		if (is.null(input$function_hierarchy)){
			func_hierarchy = fread(default_func_hierarchy_table, header=TRUE, sep="\t", stringsAsFactors=FALSE)
		} else {
			func_hierarchy_file = input$function_hierarchy
			func_hierarchy_file_path = func_hierarchy_file$datapath
			func_hierarchy = fread(func_hierarchy_file_path, header=TRUE, sep="\t", stringsAsFactors=FALSE)
		}
		level_match_table = data.table(func_hierarchy[,c(1,summary_level_index), with=FALSE])
		expanded_table = merge(output, level_match_table, by.x=c(colnames(output)[3]), by.y=c(colnames(level_match_table)[1]), all.y=FALSE, allow.cartesian=TRUE)
		expanded_table = merge(expanded_table, ko_normalization_table(), by.x=c(colnames(expanded_table)[1]), by.y=c(colnames(ko_normalization_table())[1]), all.y=FALSE, allow.cartesian=TRUE)
		expanded_table$normalized_contributions = expanded_table[,4,with=FALSE] / expanded_table[,6,with=FALSE]
		output = expanded_table[,sum(normalized_contributions), by=eval(colnames(expanded_table)[c(2,3,5)])]
	}

	tracked_data$contribution_status = "Returning"

	output=dcast(output, Sample + OTU ~ SubPathway, value.var=colnames(output)[4])
	output=data.table(Sample = output$Sample, OTU = output$OTU, SubPathways = apply(output[,3:dim(output)[2], with=FALSE], 1, function(row){return(as.list(row[!is.na(row)]))}))
	output = dcast(output, Sample ~ OTU, value.var=colnames(output)[3])
	output = data.table(Sample = output$Sample, OTUs = apply(output[,2:dim(output)[2], with=FALSE], 1, function(row){return(as.list(row[sapply(row, function(el){!is.null(el[[1]])})]))}))
	output = dcast(output, . ~ Sample, value.var="OTUs")
	output = output[,2:dim(output)[2],with=FALSE]
	output = lapply(output, function(el){return(el[[1]])})

	if (is.null(tracked_data$input_type)){
		session$sendCustomMessage(type="default_contribution_table", output)
	} else {
		session$sendCustomMessage(type="contribution_table", output)
	}

	}, ignoreNULL=FALSE)
		
})
