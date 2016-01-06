# R server code interacting with the main webpage

library(shiny)

picrust_normalization_file = "www/Data/precalculated.tab.gz"
picrust_ko_file = "www/Data/ko_13_5_precalculated.tab.gz"

shinyServer(function(input, output) {

    tracked_data = reactiveValues(input_type = NULL)

    observeEvent(input$genome_annotation_select_button, {
    	tracked_data$input_type = "genome_annotation"
    	})

    observeEvent(input$"16S_select_button", {
    	tracked_data$input_type = "16S"
    	})

    observeEvent(input$contribution_select_button, {
    	tracked_data$input_type = "contribution"
    	})

	contribution_table = eventReactive(input$update_button, {

		if (tracked_data$input_type == "genome_annotation"){

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

			return(matrix(output_rows, ncol=4, nrow=(dim(otu_abundance)[2] - 1) * dim(otu_abundance)[1] * length(levels(factor(annotation[,2])))), byrow=TRUE)
		} else if (tracked_data$input_type == "16S"){

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

			return(matrix(output_rows, ncol=4, nrow=(dim(otu_abundance)[2] - 1) * dim(otu_abundance)[1] * length(levels(factor(annotation[,2])))), byrow=TRUE)
		} else if (tracked_data$input_type == "contribution"){

			contribution_file = input$function_contributions
			contribution_file_path = contribution_file$datapath
			contribution = read.csv(contribution_file_path, sep="\t", header=TRUE, stringsAsFactors=FALSE)

			return(contribution[,c(2,3,1,6)])
		}

		})

	output$contribution_table_text = renderText({
		if (!is.null(contribution_table)){
			print(paste(unlist(sapply(1:dim(contribution_table)[1], function(row){
				paste(contribution_table[row,], collapse = "\t")
				})), collapse = "\n"))
		} else {
			print("")
		}
		})

})