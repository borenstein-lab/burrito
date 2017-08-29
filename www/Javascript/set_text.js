var text_ids = Object.keys(text_map);

for (var i = 0; i < text_ids.length; i++){

	var text = text_map[text_ids[i]];
	if (text.length == 1){
		var element = document.getElementById(text_ids[i]);
		if (element){
			element.innerHTML = text[0];
		}
	} else {
		for (var j = 0; j < text.length; j++){
			var element = document.getElementById(text_ids[i] + "_" + (j + 1));
			if (element){
				element.innerHTML = text[j];
			}
		}
	}
}