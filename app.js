// App for the Recipe calculator

import { Recipe, loadCSV, loadJSON } from './recipe.js';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const inlanguage = urlParams.getAll('l');
const iningredients = urlParams.getAll('i');
const inquantities = urlParams.getAll('q');
const inenergysources = urlParams.getAll('e');
const incookingtime = urlParams.getAll('t');
const inpower = urlParams.getAll('p');
var servings = parseFloat(urlParams.get('servings')) || 1;

var ingrsnippet = `<div class="row" id="ingredients">
	            	<div class="col-sm-7 form-group">
	            	<input id="ingredient" type="text" class="form-control input-sm" placeholder="%INGREDIENT%" name="i" value=""/>
	            	</div>
	            	<div class="col-sm-3 form-group">
	            		<div class="input-group">
							<input type="number" class="form-control input-sm"  placeholder="%WEIGHT%" name="q" min="0" value="">
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

var cooksnippet = `<div class="row" id="cooking">
				<div class="col-sm-4 form-group" id="energydropdown">
						<select class="form-control" name="e" id="energyselect">
						<option value="" selected disabled hidden>%SOURCE%</option>
						</select>
				</div>
				<div class="col-sm-3 form-group">
					<div class="input-group">
						<input type="number" class="form-control input-sm"  placeholder = "%TIME%"  name="t" min="0" value="">
						<div class="input-group-append">
							<span class="input-group-text"> min </span>
						</div>
					</div>
				</div>
				<div class="col-sm-3 form-group">
					<div class="input-group">
						<input type="number" class="form-control input-sm"  placeholder = "%POWER%" name="p" min="0" value="">
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

if (! onlyMain){
	var onlyMain = true;
}
function select_language(language){
	var lang = language;
	if (language == "EN") {
		var lang = "";
	}
	var url = window.location.protocol + "//" + window.location.hostname + '/' + lang +  window.location.search
	window.location.assign(url)
}


let dictionary = []; // Global variable to store the dictionary
let dictionaryLoaded = false; // Flag to track if the dictionary is loaded
  
function loadDictionary() {
	return new Promise((resolve, reject) => {
		Papa.parse("../data/translation.csv", {
			download: true,
			header: true,
			complete: function (results) {
				dictionary = results.data;
				dictionaryLoaded = true;
				console.log("Dictionary loaded successfully");
				resolve(dictionary); // Resolve the Promise once the dictionary is ready
			},
			error: function (err) {
				reject(err); // Reject the Promise if there's an error
			}
		});
	});
};

async function translate_value(value, source_language, target_language) {
    if (!dictionaryLoaded) {
        await loadDictionary(); // Ensure dictionary is loaded before using it
    }

    for (let t = 0; t < dictionary.length; t++) {
        if (dictionary[t][source_language] === value) {
            return dictionary[t][target_language];
        }
    }
    return value; // Return original value if no translation is found
};

// get onclick event from HTML
window.formsubmit = function () {
    formsubmit();
};

async function formsubmit() {
	if ($('[name="q"]').val().length > 0 && $('[name="i"]').val().length > 0) {
		run();
		var recipe_arr = $("#recipeform").serializeArray();

		// Serialize form values
		// var serialized = 'l='+language+"&";
		var serialized = '';
		const translatePromises = recipe_arr.map(async (item) => {
			if (item.name === "i" || item.name === "e") {
				item.value = await translate_value(item.value, language, "Code");
			}
		});
		
		await Promise.all(translatePromises);
		
		for (let i = 0; i < recipe_arr.length; i++) {
			serialized += recipe_arr[i]["name"] + "=" + recipe_arr[i]["value"] + "&";
		}

		if (servings > 1) {
			serialized += "servings=" + servings + "&"
		}
		// Update URL
		history.pushState(null, "", '?' + serialized); 
	}

};

async function run() {
	try {
		const [environment, nutrition, energy_ef, units, intake] = await Promise.all([
		  loadCSV("../data/food/environment.csv"),
		  loadCSV("../data/food/nutrition.csv"),
		  loadCSV("../data/energy/data.csv"),
		  loadCSV("../data/food/units.csv"),
		  loadJSON("../data/food/intake/data.json"),
		]);
		
		// Web recipe
		const webRecipe = new Recipe("webRecipe");
		webRecipe.environment = environment;
		webRecipe.nutrition = nutrition;
		webRecipe.energy_ef = energy_ef;
		webRecipe.intake = intake;
		webRecipe.units = units;


		webRecipe.servings = servings;
		var ingredients = $('[name="i"]');
		var quantities = $('[name="q"]');

		var reference = {};
		reference["food"] = await translate_value($('#reference').val(),language,"EN");
		reference["quantity"] = $('#reference-weight').val();
		console.log("Setting reference food:", reference["food"]);
		webRecipe.set_reference(reference["food"],reference["quantity"]);

		for (let i = 0; i < ingredients.length; i++) {
			let ingredient = await translate_value(ingredients[i].value,language,"EN");
			console.log("Adding ingredient:", ingredient)			
			webRecipe.addIngredient(ingredient, quantities[i].value)
		}
		webRecipe.mise_en_place()

		var sources = $('[name="e"]');
		var times = $('[name="t"]');
		var powers = $('[name="p"]');


		for (let i = 0; i < sources.length; i++) {
			if (sources[i].value != "") {
				let source = await translate_value(sources[i].value,language,"Code");
				console.log("Adding source:", source)
				webRecipe.addCookingStep(source, times[i].value, powers[i].value)
			}	
		}
		webRecipe.cook()
		$("#results").css('display','inline');

		var html = '';
		for (const [key, value] of Object.entries(webRecipe.total_content)){
			if (webRecipe.total_content[key]["is_environment"] == true & key == "climate_change") {
	            html += '<tr><td>' + await translate_value(key,"Code",language) + '</td>' +
	                    '<td class="text-center">' + Math.round(((value["value"]) + Number.EPSILON)*100)/100 + ' ' + value["unit"] + '</td>' +
						// Equivalent km - Passenger car with average motorization, 2018 | Base Carbone® ADEME v23.4 (27970)
						'<td class="text-center">' + Math.round(((value["value"])/0.231 + Number.EPSILON)*100)/100 + ' km</td>'  +
	                    '<td class="text-center">' + Math.round(value["benchmark"]["value"]*100)  + '%</td>' +
	                    '</tr>';
		     }
		}
		$('#table-footprint').html(html);
		$('[data-toggle="tooltip"]').tooltip();
		
		$("#results").css("visibility","visible");
		var html = '';
		for (const [key, value] of Object.entries(webRecipe.intake)){
			if (isFinite(webRecipe.total_content[key]["value"])) {
				html += '<tr><td>' + await translate_value(key,"Code", language)  + '</td>' +
						'<td class="text-center">' + Math.round((webRecipe.total_content[key]["value"] + Number.EPSILON)*100)/100 + ' ' + webRecipe.total_content[key]["unit"] + '</td>' +
						'<td class="text-center"><a href="#" style="text-decoration: none; color: inherit;" data-toggle="tooltip" title="'
						+ webRecipe.total_content[key]["recommended_source"] + '">' 
						+ Math.round(webRecipe.total_content[key]["recommended"]*100) + '%</a></td>' +
						'<td class="text-center">' + Math.round(webRecipe.total_content[key]["benchmark"]["value"]*100)  + '%</td>' +
						'</tr>';
			} else {
				html += '<tr><td>' + await translate_value(key,"Code", language)  + '</td>' +
						'<td class="text-center"></td>' +
						'<td class="text-center"></td>' +
						'<td class="text-center"></td>' +
						'</tr>';					
			}
		  }
		$('#table-nutritional').html(html);
		$('[data-toggle="tooltip"]').tooltip();

	} catch (err) {
		console.error("Error running recipe calculation:", err);
	  }
};

	
async function init() {
	await new Promise(resolve => {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", resolve);
		} else {
			resolve();
		}
	});

	if (!dictionaryLoaded) {
		await loadDictionary(); // Ensure dictionary is loaded before using it
	}

	// Create arrays of food and energy sources
	const food_arr = dictionary.filter(function (e) {
	return e.Type == "AGB";
	});
	const food_arr_main = dictionary.filter(function (e) {
		return e.Type == "AGB" && e.isMain == "TRUE";
	});
	const energy_arr = dictionary.filter(function (e) {
				return e.Type == "ENERGY";
			});
		

	var wrapper = $(".ingredients");
	var wrapper_cooking = $(".cooking-steps");
	var x = 1;
	var c = 1;

	// Action settings window
	$("#servings").last().val(servings);
	$("#main-ingredients").prop("checked",onlyMain);
	$("#save-settings").on("click", function(e) {
			servings = $("#servings").last().val();
			onlyMain = $("#main-ingredients").prop("checked");
			urlParams.set('servings', servings.toString());
			urlParams.set('onlyMain', onlyMain.toString());
			history.pushState(null, null, "?"+urlParams.toString());
			for (var x = 0; x < iningredients.length; x++) {
				// Autocomplete
				if (onlyMain) {
					$(wrapper).find("[name='i']").last().autocomplete({
					source: food_arr_main.map(a => a[language])
					}).autocomplete('enable');
				}
				else {
					console.log("all")
					$(wrapper).find("[name='i']").last().autocomplete({
					source: food_arr.map(a => a[language])
					}).autocomplete('enable');
				}
			}
			formsubmit();
			});

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
	await Promise.all(iningredients.map(async (val, i) => {
		iningredients[i] = await translate_value(val, "Code", language);
	}));
	await Promise.all(inenergysources.map(async (val, i) => {
		inenergysources[i] = await translate_value(val, "Code", language);
	}));


	// Submit when changing the reference ingredient
	$('#reference').keypress(function(e) {
		if (e.which == 13) {
			formsubmit();
			return false;
		}
	});


	// Submit when changing weight of reference ingredient
	$('#reference-weight').keypress(function(e) {
		if (e.which == 13) {
			formsubmit();
			return false;
		}
	});

	// Translate form
	ingrsnippet = ingrsnippet.replace("%WEIGHT%", await translate_value("%WEIGHT%","Code",language));
	ingrsnippet = ingrsnippet.replace("%INGREDIENT%", await translate_value("%INGREDIENT%","Code",language));
	cooksnippet = cooksnippet.replace("%SOURCE%", await translate_value("%SOURCE%","Code",language));
	cooksnippet = cooksnippet.replace("%TIME%", await translate_value("%TIME%","Code",language));
	cooksnippet = cooksnippet.replace("%POWER%",await translate_value("%POWER%","Code",language));

	// Translate reference
	$("#reference").last().autocomplete({
		source: food_arr.map(a => a[language])
	}).val(await translate_value("25413","Code",language)).autocomplete('enable');

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


};

init();
			


