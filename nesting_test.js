(function(){
  d3.tsv("ko_metagenome_contributions_filtered_short.txt", function(error, data) {
    var nested_data = [];
    data.forEach(function(d) {
      var gene = d.Gene;
      var otu = d.OTU;
      var sample = d.Sample;
      var contribution = d.ContributionPercentOfSample;
      if (gene in nested_data){
        if (otu in nested_data[gene]){
          nested_data[gene][otu][sample] = contribution;
        } else {
          nested_data[gene][otu] = [];
          nested_data[gene][otu][sample] = contribution;
        };
      } else {
        nested_data[gene] = [];
        nested_data[gene][otu] = [];
        nested_data[gene][otu][sample] = contribution;
      };
    });
    document.getElementById('demo').innerHTML = nested_data['K01362']['135956']['Cef2dayrec21'];
  });
})();