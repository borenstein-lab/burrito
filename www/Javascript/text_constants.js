var text_map = {};

//// Text for the home page

// Text for top of home page
text_map['home_page_title_text'] = ['Burrito'];
text_map['home_page_description_text'] = ['Burrito is a tool for visualizing the relationship between taxonomy and function in microbiome datasets. A detailed description of the input parameters and options is available in the', 'user manual.', 'Source code is available', 'here', '<br><br>Want to try it out? Check this preview (using an example data set from', 'Theriot et al 2014', '):', 'Preview', '<br><br>If you use Burrito please cite the following paper:<br><em>In progress</em>'];

// <!-- Rogan Carr and Elhanan Borenstein (2012) <a class="normalLinkTxt" href="https://bioinformatics.oxfordjournals.org/content/28/5/734.abstract">NetSeed: A network-based reverse-ecology tool for calculating the metabolic interface of an organism with its environment.</a> <em>Bioinformatics</em>, 28(5): 734-735. (<a class="normalLinkTxt" href="https://elbo.gs.washington.edu/pub/netseed_carr_bioinf.pdf">PDF</a>) -->

// Text for taxonomic block of upload options
text_map['taxonomic_block_title_text'] = ['Taxonomic Data'];
text_map['taxonomic_block_manual_link_text'] = ['Manual&gt;Taxonomy'];
text_map['taxonomic_abundance_table_input_text'] = ['Taxonomic abundances:'];
text_map['taxonomic_abundance_table_help_text'] = ['Upload the taxonomic abundance table that functional contributions will be linked to<br>(raw read counts or relative abundances).'];
text_map['taxonomic_hierarchy_choice_text'] = ['Taxonomy:', 'Greengenes taxonomy (default; compatible with automatic contribution calculation)', 'Custom taxonomy:'];
text_map['taxonomic_hierarchy_choice_help_text'] = ['Choose the taxonomy that defines the hierarchical relationship between taxa and allows you to explore your data at different taxonomic resolutions.'];
text_map['taxonomic_level_of_detail_selector_text'] = ['Minimum taxonomic resolution:'];
text_map['taxonomic_level_of_detail_selector_help_text'] = 	['Choose the minimum taxonomic resolution that will be viewable<br>(lower resolution may improve performance for large datasets).'];

// Text for functional block of upload options
text_map['functional_block_title_text'] = ['Functional Data'];
text_map['functional_block_manual_link_text'] = ['Manual&gt;Function'];
text_map['functional_abundance_choice_text'] = ['Metagenome-based function abundances:', 'No metagenome-based function abundances available (default)', 'Metagenome-based function abundance table:'];
text_map['functional_abundance_choice_help_text'] = ['Choose to upload a table of metagenome-based function abundances for your samples to compare to the taxonomy-based function abundances.'];
text_map['contribution_choice_text'] = ['Taxonomy-function linking method:', 'Automatically calculate contributions (default; uses the 13_5 versions of the 16S copy number normalization and gene content tables downloaded from the PICRUSt website)', 'Custom genomic content table:', 'Function contribution table:'];
text_map['contribution_choice_help_text'] = ['Choose the method for linking taxonomic abundances to function abundances.'];
text_map['functional_hierarchy_choice_text'] = ['Function hierarchy:', 'BRITE function hierarchy (default, compatible with automatic contribution calculation)', 'Custom function hierarchy:'];
text_map['functional_hierarchy_choice_help_text'] = ['Choose the functional hierarchy that defines the hierarchical relationship between functions and allows you to explore your data at different functional resolutions.'];
text_map['functional_level_of_detail_selector_text'] = ['Minimum functional resolution:'];
text_map['functional_level_of_detail_selector_help_text'] = ['Choose the minimum functional resolution that will be viewable<br>(lower resolution may improve performance for large datasets).'];

// Text for grouping block of upload options
text_map['grouping_block_title_text'] = ['Sample grouping'];
text_map['grouping_block_manual_link_text'] = ['Manual&gt;Grouping'];
text_map['grouping_choice_text'] = ['Sample grouping:', 'No sample grouping (default)', 'Sort samples alphabetically', 'Sample group labels:'];
text_map['grouping_choice_help_text'] = ['Choose to upload a table of sample group labels for grouping your samples (e.g. by cases vs. controls).'];
text_map['grouping_factor_selector_text'] = ['Label to group by:'];
text_map['grouping_factor_selector_help_text'] = ['Choose the label to be used for grouping samples.'];

// Text for visualization block of upload options
text_map['visualization_block_title_text'] = ['Visualization'];
text_map['visualization_block_manual_link_text'] = ['Manual&gt;Visualization'];
text_map['color_choice_text'] = ['Color scheme:'];
text_map['hierarchical_color_choice_text'] = ['Hierarchical color scale'];
text_map['random_color_choice_text'] = ['Random color scale'];
text_map['color_choice_help_text'] = ['Choose the type of color scale used during display.'];

// Text for activation block of upload options
text_map['update_button_text'] = ['Assemble the Burrito'];

// Text for end block of home page
text_map['return_text'] = ['Back to', 'the Borenstein Lab'];

//// Text for the data processing progress page
var upload_steps = ['file_upload', 'contribution_calculation', 'data_validation', 'hierarchy_processing', 'taxonomic_abundance_formatting', 'contribution_formatting', 'hierarchy_formatting', 'average_function_abundance_formatting', 'metadata_formatting'];
var upload_step_text = ['File upload', 'Contribution calculation', 'Data validation', 'Hierarchy processing', 'Taxonomic abundance formatting', 'Contribution formatting', 'Hierarchy formatting', 'Average function abundance formatting', 'Metadata formatting'];
var upload_step_message_text = ['Uploading files', 'Calculating contributions', 'Validating data', 'Processing hierarchies', 'Formatting taxonomic abundances', 'Formatting contributions', 'Formatting hierarchies', 'Formatting average function abundances', 'Formatting metadata'];
var default_upload_step_text = 'Data processing not yet started';
var upload_steps_done_text = 'Loading tables';
var default_loading_bar_progress_text = 'Data not ready';
var loading_bars = ['picrust', 'taxonomic_abundance', 'contribution'];
var loading_bar_text = ['Default genomic content table loading progress', 'Taxonomic abundance table loading progress', 'Contribution table loading progress'];
var picrust_loading_progress_text = ['Genomic content loaded for ', '/', ' OTUs']
var table_downloading_progress_text = ['', '/', ' samples loaded']

//// Text for tooltips
var default_taxonomic_abundance_tooltip_text = '';
var taxonomic_abundance_tooltip_text = ['<strong>Taxon</strong>: ', '<br><strong>Sample: </strong>', '<br><strong>Relative Abundance: </strong>', '%']
var default_function_abundance_tooltip_text = '';
var function_abundance_tooltip_text = ['<strong>Function: </strong>', '<br><strong>Sample: </strong>', '<br><strong>Relative Abundance: </strong>', '%'];
var function_contribution_tooltip_text = ['<strong>Function: </strong>', '<br><strong>Taxon: </strong>', '<br><strong>Sample: </strong>', '<br>"+"<strong>Relative Abundance: </strong>', '%'];
var default_bipartite_graph_tooltip_text = 'a simple tooltip';
var bipartite_graph_tooltip_text = ['Average contribution to function:<br>', '%'];

//// Text for plots
var taxonomic_abundance_y_axis_title = 'Relative Abundance (%)';
var function_abundance_y_axis_title = 'Relative Abundance (%)';
var taxa_based_bar_label = "T";
var metagenome_based_bar_label = "M";

//// Text for help overlay
var option_menu_help_text = 'Click to access the options menu';
var taxonomic_hierarchy_help_text = 'Click nodes to expand and collapse the taxonomic hierarchy';
var bipartite_graph_bar_help_text = 'Click bars to lock highlighting';
var bipartite_graph_edge_help_text = 'Click edges to lock highlighting for individual taxon-function links';
var barplot_mouseover_help_text = 'Mouse over bar charts for detailed abundance information';
var function_hierarchy_help_text = 'Click nodes to expand and collapse the functional hierarchy';
var barplot_highlight_help_text = 'Highlight taxa to reveal taxa-specific functional contributions';

//// Text for option menu
var switch_scale_text_on = 'Display legend';
var switch_scale_text_off = 'Hide legend';
var output_prefix_text = 'Output file prefix:';
var image_format_text = 'Image format:';
var png_format_text = 'PNG';
var svg_format_text = 'SVG';
var save_screenshot_text = 'Export screenshot';
var save_taxonomic_barplot_text = 'Export taxonomic barplot';
var save_taxonomic_legend_text = 'Export taxonomy legend';
var save_function_barplot_text = 'Export function barplot';
var save_function_legend_text = 'Export function legend';
var save_function_abundance_table_text = 'Download function relative abundance table';
var save_contribution_table_text = 'Download contribution table';
var return_to_upload_page_text = 'Return to the upload page';

//// Text for messages to user
var busy_text = 'Busy...';
