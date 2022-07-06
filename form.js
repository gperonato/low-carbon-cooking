const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const inlanguage = urlParams.getAll('l');
const iningredients = urlParams.getAll('i');
const inquantities = urlParams.getAll('q');
const inenergysources = urlParams.getAll('e');
const incookingtime = urlParams.getAll('t');
const inpower = urlParams.getAll('p');
var onlyMain = JSON.parse(urlParams.get('onlyMain'))
if (onlyMain == null){
	onlyMain = true;
}
var servings = parseFloat(urlParams.get('servings')) || 1;
const ingrsnippet = `<div class="row" id="ingredients">
	            	<div class="col-sm-7 form-group">
	            	<input id="ingredient" type="text" class="form-control input-sm"  name="i" value=""/>
	            	</div>
	            	<div class="col-sm-3 form-group">
	            		<div class="input-group">
							<input type="number" class="form-control input-sm"  name="q" min="0" value="">
							<div class="input-group-append">
								<span class="input-group-text"> g </span>
							</div>
						</div>
					</div>
	            	<div class="col-sm-1 form-group">
					<button id="delete" class="btn btn-secondary">-</button>
					</div>
							<div class="col-sm-1 form-group">
								<button name="add-ing" class="btn btn-secondary">+</button>
							</div>
					</div>`

const cooksnippet = `<div class="row" id="cooking">
				<div class="col-sm-4 form-group" id="energydropdown">
						<select class="form-control" name="e" id="energyselect">
						</select>
				</div>
				<div class="col-sm-3 form-group">
					<div class="input-group">
						<input type="number" class="form-control input-sm"  name="t" min="0" value="">
						<div class="input-group-append">
							<span class="input-group-text"> min </span>
						</div>
					</div>
				</div>
				<div class="col-sm-3 form-group">
					<div class="input-group">
						<input type="number" class="form-control input-sm"  name="p" min="0" value="">
						<div class="input-group-append">
							<span class="input-group-text"> W </span>
						</div>
					</div>
				</div>				
				<div class="col-sm-1 form-group">
					<button id="delete-cooking" class="btn btn-secondary">-</button>
				</div>
					<div class="col-sm-1 form-group">
							<button name="add-cf" class="btn btn-secondary">+</button>
						</div>
			</div>`
const default_power = 2000;
function select_language(language){
	var lang = language;
	if (language == "EN") {
		var lang = "";
	}
	var url = window.location.protocol + "//" + window.location.hostname + '/' + lang +  window.location.search
	window.location.assign(url)
}

Papa.parse("../data/translation.csv", {
	download: true,
	header:true,
    complete: function(results) {
        dictionary = results.data;

    // Create arrays of food and energy sources
	food_arr = dictionary.filter(function (e) {
	    return e.Type == "AGB";
	});
	food_arr_main = dictionary.filter(function (e) {
	    return e.Type == "AGB" && e.isMain == "TRUE";
	});
	energy_arr = dictionary.filter(function (e) {
	            return e.Type == "ENERGY";
	        });


	$(document).ready(function() {
		var wrapper = $(".ingredients");
		var wrapper_cooking = $(".cooking-steps");
		var x = 1;
		var c = 1;

		// Action for changing language
		$('#language a').click(function() {
		        select_language($(this).attr('name'))
		    }
		);

		// Define language from url params (if provided)
		if (inlanguage.length > 0){
			language=inlanguage[0];
		}

		// Translate url params
		for (i = 0; i < iningredients.length; i++) {
						iningredients[i] = translate_value(iningredients[i],"Code",language);
						}
		for (i = 0; i < inenergysources.length; i++) {
						inenergysources[i] = translate_value(inenergysources[i],"Code",language);
						}

	
		// Submit when changing weight of reference ingredient
		$('#reference-weight').keypress(function(e) {
			if (e.which == 13) {
				formsubmit();
				return false;
			}
		});

		// Translate reference
		$("#reference").last().autocomplete({
			source: food_arr.map(a => a[language])
		}).val(translate_value("25413","Code",language)).autocomplete('enable');

		// Add empty field if no parameters are provided
		if (iningredients.length == 0) {
			iningredients.push("")
		}

		if (inenergysources.length == 0) {
			inenergysources.push("")
			// Default power
			inpower.push(default_power)
		}

		// Add fields from parameters
		for (var x = 0; x < iningredients.length; x++) {
			// Hide + button from previous line
			$("[name='add-ing']").last().hide();
			// Add new line
			$(wrapper).append($(ingrsnippet));
			// Load values from parameters
			$("[name='i']").last().val(iningredients[x]);
			$("[name='q']").last().val(inquantities[x]);

			// Autocomplete
			if (onlyMain) {
				$(wrapper).find("[name='i']").last().autocomplete({
				source: food_arr_main.map(a => a[language])
				}).autocomplete('enable');
			}
			else {
				$(wrapper).find("[name='i']").last().autocomplete({
				source: food_arr.map(a => a[language])
				}).autocomplete('enable');
			}
		}

		for (var c = 0; c < inenergysources.length; c++) {
			// Hide + button from previous line
			$("[name='add-cf'").last().hide();
			// Add new line
			$(wrapper_cooking).append($(cooksnippet));
			// Load values for dropdown
			for (var i = 0; i < energy_arr.length; i++) {
				$('#energydropdown select').last().append($(document.createElement('option')).prop({
					value: energy_arr.map(a => a[language])[i],
					text: energy_arr.map(a => a[language])[i]
				}))
			};
			// Load values from parameters
			$("[name='e']").last().val(inenergysources[c]);
			$("[name='t']").last().val(incookingtime[c]);
			$("[name='p']").last().val(inpower[c]);
		}

		// Add fields from UI
		$(wrapper).on("click", "[name='add-ing']", function(e) {
			e.preventDefault();
			// Hide + button from previous line
			$("[name='add-ing']").last().hide();
			// Add new line
			$(wrapper).append($(ingrsnippet));
			// Autocomplete
			$(wrapper).find("[name='i']").last().autocomplete({
				source: food_arr.map(a => a[language])
			}).autocomplete('enable');
			x++;
		});

		$(wrapper_cooking).on("click", "[name='add-cf']", function(e) {
			e.preventDefault();
			$("[name='add-cf']").last().hide();
			$(wrapper_cooking).append($(cooksnippet));
			// Add dropdown menu
			for (var i = 0; i < energy_arr.length; i++) {
				$('#energydropdown select').last().append($(document.createElement('option')).prop({
					value: energy_arr.map(a => a[language])[i],
					text: energy_arr.map(a => a[language])[i]
				}))
			};
			$("[name='p']").last().val(default_power);
			c++;
		});

		// Remove fields from UI
		$(wrapper).on("click", "#delete", function(e) {
			e.preventDefault();
			if (x > 1) {
				// Remove line
				$(this).parent().parent('div').remove();
				$("[name^='add-ing']").last().show();
				x--;
			} else {
				console.log("cannot remove first ingredient")
			}
		});

		$(wrapper_cooking).on("click", "#delete-cooking", function(e) {
			e.preventDefault();
			if (c > 1) {
				// Remove line
				$(this).parent().parent('div').remove();
				$("[name^='add-cf']").last().show();
				c--;
			} else {
				console.log("cannot remove first cooking step")
			}
		});

		formsubmit();
	});
}});