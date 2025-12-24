// SPDX-FileCopyrightText: 2021-2025 Giuseppe Peronato <gperonato@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

// App for the Recipe calculator

import { Recipe, loadCSV, loadJSON, cookingEnergyConsumption} from './recipe.js';

// Default values
const default_servings = 1;
const default_power = 2000;
const default_power_level = 6;
const nominal_power_defaults = {
	I: { S: 1400, M: 1800, L: 2200 },
	E: { S: 1200, M: 2000, L: 2200 },
	G: { S: 1000, M: 1750, L: 3000 },
};
const efficiency = {
	defaults: { I: 78, E: 58, G: 30 },
	high:     { I: 86, E: 76, G: 55 }
};
var onlyMain = true;

// Parse URL arguments
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const inlanguage = urlParams.getAll('l');
const iningredients = urlParams.getAll('i');
const inquantities = urlParams.getAll('q');
const inenergysources = urlParams.getAll('e');
const incookingtime = urlParams.getAll('t');
const inpower = urlParams.getAll('p');
const inpowerlevels = urlParams.getAll('pl');
const inappliances = urlParams.getAll('a');
var nominal_power = {
	I: parseFloat(urlParams.get('pi')),
	E: parseFloat(urlParams.get('pe')),
	G: parseFloat(urlParams.get('pg')),
};
var servings = parseFloat(urlParams.get('servings')) || default_servings;
var countrycode = urlParams.get('cc');
export function getCountryCode() {
    // navigator.language may be "en-US", "fr-FR", etc.
    const lang = navigator.language || navigator.userLanguage || "en-US";
    // Split by "-" and take the second part (country), fallback to "US"
    const parts = lang.split("-");
    return parts.length > 1 ? parts[1].toUpperCase() : "US";
}

// HTML snippets
var ingrsnippet = `<div class="row" id="ingredients">
						<div class="col-sm-6 form-group">
						<input id="ingredient" type="text" class="form-control input-sm" placeholder="%INGREDIENT%" name="i" value=""/>
						</div>
						<div class="col-sm-6 form-group">
							<div class="input-group">
								<input type="number" class="form-control input-sm"  placeholder="%WEIGHT%" name="q" min="0" value="" style="text-align:right;"/>
								<div class="input-group-append">
									<span class="input-group-text">g</span>
								</div>
								<div class="input-group-append">
									<button id="delete" class="btn btn-secondary ml-2 mr-1">-</button>
									<button name="add-ing" class="btn btn-secondary">+</button>
								</div>
							</div>
						</div>
					</div>`

var cooksnippet = `<div class="row" id="cooking">
    <div class="col-md-6 form-group" id="energydropdown">
        <select class="form-control input-sm ml-6" name="a">
                <option value="" selected disabled hidden>Appliance</option>
        </select>
    </div>
    <div class="col-md-6 form-group">
        <div class="input-group">
            <input type="number" class="form-control input-sm" placeholder="%TIME%" name="t" min="0" value="" style="text-align:right;">
            <div class="input-group-append">
                <span class="input-group-text">min</span>
            </div>

            <!-- Power level select (hidden when oven temp/input power is visible) -->
            <select class="form-control input-sm ml-3" name="pl">
                <option value="" selected disabled hidden>Power level</option>
            </select>

            <!-- Oven temperature input (hidden by default) -->
            <input type="number" class="form-control input-sm ml-3 oven-temp-group" name="ot" placeholder="Temp" min="50" max="400" step="1" style="display: none;"/>
            <div class="input-group-append oven-temp-group" style="display: none;"><span class="input-group-text">°C</span></div>

			<!-- Power input (hidden by default) -->
            <input type="number" class="form-control input-sm ml-3 watt-group" name="p" placeholder="Power" step="50" style="display: none;"/>
            <div class="input-group-append watt-group" style="display: none;">
				<span class="input-group-text">W</span>
			</div>

            <div class="input-group-append">
                <button id="delete-cooking" class="btn btn-secondary ml-2 mr-1">-</button>
                <button name="add-cf" class="btn btn-secondary">+</button>
            </div>
        </div>
	</div>
</div>`;

// Language selector from URL
function selectLanguage(language) {
    // Treat "EN" as no prefix, otherwise use the language code
    const langPath = (language === "EN") ? "" : language;

    const host = window.location.host;
    const protocol = window.location.protocol;
    const search = window.location.search;

    // Construct the URL: protocol + host + / + lang + search
    const newUrl = `${protocol}//${host}/${langPath}${search}`;

    window.location.assign(newUrl);
}


// Dictionary with translations
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

// Translate from dictionary
async function translateValue(value, source_language, target_language) {
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
window.submitForm = function () {
    submitForm();
};
// Run actions when submitting form from HTML
async function submitForm() {
	// only if at least one ingredient
	if ($('[name="q"]').val().length > 0 && $('[name="i"]').val().length > 0) {
		// run the calculator
		run();
		// serialize arguments for URL
		var recipe_arr = $("#recipeform").serializeArray();
		// Serialize form values
		// var serialized = 'l='+language+"&";
		var serialized = '';
		const translatePromises = recipe_arr.map(async (item) => {
			if (item.name === "i" || item.name === "e") {
				item.value = await translateValue(item.value, language, "Code");
			}
		});
		
		await Promise.all(translatePromises);
		for (let i = 0; i < recipe_arr.length; i++) {
			serialized += recipe_arr[i]["name"] + "=" + recipe_arr[i]["value"] + "&";
		}

		// Update URL
		if (servings > default_servings) {
			serialized += "servings=" + servings + "&"
		}
		for (const [key,entry] of Object.entries(nominal_power)) {
			if (entry != nominal_power_defaults[key]["M"]) {
				serialized += "p" + key.toLowerCase() + "=" + entry  + "&"
			}
		}
		history.pushState(null, "", '?' + serialized); 

        // scroll to results and focus it
        const $results = $('#results');
        if ($results.length) {
            $('html, body').animate({ scrollTop: Math.max(0, $results.offset().top - 60) }, 400);
            $results.attr('tabindex', '-1').focus();
        }
	}

};

// Run the calculator
async function run() {
	try {
		const [environment, nutrition, energy1, energy2, units, intake] = await Promise.all([
		  loadCSV("../data/food/environment.csv"),
		  loadCSV("../data/food/nutrition.csv"),
		  loadCSV("../data/energy/data_odbl.csv"),
		  loadCSV("../data/energy/data_lo.csv"),
		  loadCSV("../data/food/units.csv"),
		  loadJSON("../data/food/intake/data.json"),
		]);
		
		// Web recipe
		const webRecipe = new Recipe("webRecipe");
		webRecipe.environment = environment;
		webRecipe.nutrition = nutrition;
		webRecipe.energy_ef = Array.from(new Set([...energy1, ...energy2]));
		webRecipe.intake = intake;
		webRecipe.units = units;
		webRecipe.nominal_power_appliances = nominal_power;
		console.log("Nominal power appliances set to:", webRecipe.nominal_power_appliances);
		webRecipe.oven_volume = $("#oven-volume").last().val();
		console.log("Oven volume set to:", webRecipe.oven_volume);
		webRecipe.servings = servings;
		var ingredients = $('[name="i"]');
		var quantities = $('[name="q"]');

		var reference = {};
		reference["food"] = await translateValue($('#reference').val(),language,"EN");
		reference["quantity"] = $('#reference-weight').val();
		console.log("Setting reference food:", reference["food"]);
		webRecipe.setReference(reference["food"],reference["quantity"]);

		for (let i = 0; i < ingredients.length; i++) {
			let ingredient = await translateValue(ingredients[i].value,language,"EN");
			console.log("Adding ingredient:", ingredient)			
			webRecipe.addIngredient(ingredient, quantities[i].value)
		}
		webRecipe.miseEnPlace()
		var sources = $('[name="e"]');
		var times = $('[name="t"]');
		var powers = $('[name="p"]');
		var appliances = $('[name="a"]');
		var powerLevels = $('[name="pl"]');
		var ovenTemperatures = $('[name="ot"]');
		var gas = $("#gas").last().val();
		var electricity = $("#electricity").last().val();

		for (let i = 0; i < appliances.length; i++) {
			if (appliances[i].value != "") {
				let source = electricity;
				let applianceType = await translateValue(appliances[i].value, "Code", "EN");
				if (["Gas cooktop", "Gas oven", "Other gas device"].includes(applianceType)) {
					source = gas;
				}
				let powerLevel = parseInt(powerLevels[i].value) || null;
				let ovenTemperature = parseInt(ovenTemperatures[i].value) || null;
				let power = parseInt(powers[i].value) || null;
				console.log("Adding source:", source,
					"power level:", powerLevel,
					"power:", power,
					"time:", times[i].value,
					"oven temperature:", ovenTemperature,
					"applianceType:", applianceType);
				webRecipe.addCookingStep(source, times[i].value, power, applianceType, powerLevel, ovenTemperature);
			}	
		}
		webRecipe.cook()
		$("#results").css('display','inline');

		var html = '';
		for (const [key, value] of Object.entries(webRecipe.total_content)){
			if (webRecipe.total_content[key]["is_environment"] == true & key == "climate_change") {
	            html += '<tr><td>' + await translateValue(key,"Code",language) + '</td>' +
	                    '<td class="text-right">' + Math.round(((value["value"]) + Number.EPSILON)*100)/100 + '&nbsp;' + value["unit"] + '</td>' +
						// Equivalent km - Passenger car with average motorization, 2018 | Base Carbone® ADEME v23.4 (27970)
						'<td class="text-right">' + Math.round(((value["value"])/0.231 + Number.EPSILON)*100)/100 + ' km</td>'  +
	                    '<td class="text-right">' + Math.round(value["benchmark"]["value"]*100)  + '%</td>' +
	                    '</tr>';
		     }
		}
		$('#table-footprint').html(html);
		$('[data-toggle="tooltip"]').tooltip();
		
		$("#results").css("visibility","visible");
		var html = '';
		for (const [key, value] of Object.entries(webRecipe.intake)){
			if (isFinite(webRecipe.total_content[key]["value"])) {
				html += '<tr><td>' + await translateValue(key, "Code", language)  + '</td>' +
						'<td class="text-right"><a style="text-decoration: none; color: inherit;" data-toggle="tooltip" title="'
						+ await translateValue("%TOTAL_VALUES_DISCLAIMER%", "Code", language) + '">' +
						Math.round((webRecipe.total_content[key]["value"] + Number.EPSILON)*100)/100 + '&nbsp;' + webRecipe.total_content[key]["unit"] + '</a></td>' +
						'<td class="text-right"><a style="text-decoration: none; color: inherit;" data-toggle="tooltip" title="'
						+ webRecipe.total_content[key]["recommended_source"] + '">' 
						+ Math.round(webRecipe.total_content[key]["recommended"]*100) + '%</a></td>' +
						'<td class="text-right">' + Math.round(webRecipe.total_content[key]["benchmark"]["value"]*100)  + '%</td>' +
						'</tr>';
			} else {
				html += '<tr><td>' + await translateValue(key,"Code", language)  + '</td>' +
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

// Update efficiency inputs. mode optional: 'high'|'defaults'
function updateEfficiency(mode) {

	// Determine target values based on mode or toggle state
	const isHigh = mode === 'high' || (mode !== 'defaults' && $('#efficiency-toggle').is(':checked'));
	const vals = isHigh ? efficiency.high : efficiency.defaults;

	let hasChanged = false;
	['I', 'E', 'G'].forEach(code => {
		const $el = $('#' + code + '-efficiency');
		if ($el.length) {
			$el.val(vals[code]).trigger('input');
			hasChanged = true;
		}
	});

	// Run sync only once after all inputs are updated
	if (hasChanged) setupPowerSyncGroups();
}

// Update rated input-power values according to hob-size (S/M/L)
function updateHobOutputs(size) {
	const sz = (size || $('#hob-size').val() || 'M').toString().toUpperCase();
	let hasChanged = false;

	['I', 'E', 'G'].forEach(code => {
		const $el = $('#' + code + '-input-power');
		if ($el.length) {
			const newVal = nominal_power_defaults[code][sz];
			$el.val(newVal).trigger('input');
			hasChanged = true;
		}
	});

	// Run sync only once after all inputs are updated
	if (hasChanged) setupPowerSyncGroups();
}

// Setup synchronization between power, efficiency, and time inputs
function setupPowerSyncGroups() {
	document.querySelectorAll("[id$='-input-power']").forEach(function(inputElem) {
		const prefix = inputElem.id.replace(/-input-power$/, '');
		const inPower = document.getElementById(prefix + '-input-power');
		const eff = document.getElementById(prefix + '-efficiency');
		const outPower = document.getElementById(prefix + '-output-power'); // display only
		const time = document.getElementById(prefix + '-boil-time');

		if (!inPower) return;

		let updating = false;

		function setValue(elem, val) {
			if (!elem) return;
			updating = true;
			elem.value = val;
			setTimeout(() => { updating = false; }, 0);
		}

		// When input changes: output and time are updated
		function updateFromInput() {
			if (updating) return;
			const inputVal = parseFloat(inPower.value) || 0;
			const effVal = parseFloat(eff && eff.value) || 0;
			const out = inputVal * (effVal / 100);
			const t = (4180 * 80) / (out);
			if (isFinite(t) && t > 0) setValue(time, Number(Math.round(t)));
			if (isFinite(out) && out > 0) setValue(outPower, Number(out.toFixed(2)));
		}

		// When efficiency changes: time and output are also oupdated
		function updateFromEfficiency() {
			if (updating) return;
			const effVal = parseFloat(eff && eff.value) || 0;
			const inputVal = parseFloat(inPower.value) || 0;
			const out = inputVal * (effVal / 100);
			const t = (4180 * 80) / (out);
	
			if (isFinite(t) && t > 0) setValue(time, Number(Math.round(t)));
			if (isFinite(out) && out > 0) setValue(outPower, Number(out.toFixed(2)));

		}

		// When time changes: output is computed from time
		function updateFromTime() {
			if (updating) return;
			const timeVal = parseFloat(time && time.value) || 0;
			const out = (4180 * 80) / (timeVal);
			const effVal = parseFloat(eff && eff.value) || 0;
			const input = out / effVal * 100;
			
			if (isFinite(input) && input > 0) setValue(inPower, Number(Math.round(input)));
	
		}

		if (inPower) inPower.addEventListener('input', updateFromInput);
		if (eff) eff.addEventListener('input', updateFromEfficiency);
		if (time) time.addEventListener('input', updateFromTime);

		// initialize
		updateFromInput();
	});
}

// Initialize the app	
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

	// Create country mapping
	const country_mapping = dictionary.filter(function (e) {
				return e.Type == "COUNTRY";
			});
	if (countrycode == null){
		countrycode = getCountryCode()
	}
	console.log("Country code set to", countrycode)

	// Init fallbacks for energy sources
	function getDefaultEnergySources(countrycode) {
		let gas = "NGEU"
		let electricity = "ELEU27";

		if (countrycode == "FR") {
			gas = "NGFR"
		}

		if (countrycode != null && country_mapping.map(a => a["Code"]).includes(countrycode)) {
			electricity = "EL" + countrycode
		}
		return {gas: gas, electricity: electricity};
	}		
	let {gas, electricity} = getDefaultEnergySources(countrycode);


	// Create arrays of food and energy sources
	const food_arr = dictionary.filter(function (e) {
	return e.Type == "AGB";
	});
	const food_arr_main = dictionary.filter(function (e) {
		return e.Type == "AGB" && e.isMain == "TRUE";
	});
	const electricity_arr = dictionary.filter(function (e) {
				return e.Type == "ELECTRICITY";
			});
	const gas_arr = dictionary.filter(function (e) {
				return e.Type == "GAS";
			});
	const appliances_arr = dictionary.filter(function (e) {
				return e.Type == "APPLIANCES";
			});	
	const power_level_arr = [1, 2, 3, 4, 5, 6, 7, 8, 9]

	var wrapper = $(".ingredients");
	var wrapper_cooking = $(".cooking-steps");
	var x = 1;
	var c = 1;

	// Action settings window
	// Load values for dropdown
	for (var i = 0; i < electricity_arr.length; i++) {
		$('#electricity').last().append($(document.createElement('option')).prop({
			value: electricity_arr.map(a => a["Code"])[i],
			text: electricity_arr.map(a => a[language])[i]
		}))
	};
	for (var i = 0; i < gas_arr.length; i++) {
		$('#gas').last().append($(document.createElement('option')).prop({
			value: gas_arr.map(a => a["Code"])[i],
			text: gas_arr.map(a => a[language])[i]
		}))
	};
	// Set initial values
	$("#gas").last().val(gas);
	$("#electricity").last().val(electricity);
	$("#servings").last().val(servings);
	$("#main-ingredients").prop("checked",onlyMain);

	let isSaved = false;
    // Reset the flag whenever the modal opens
    $('#settings').on('show.bs.modal', function () {
        isSaved = false; 
    });
	
	// Update variables when settings are saved
	$("#save-settings").on("click", function(e) {
			isSaved = true;
			servings = $("#servings").last().val();
			nominal_power = {
				I: $("#I-input-power").val(),
				E: $("#E-input-power").val(),
				G: $("#G-input-power").val(),
			};
			onlyMain =	$("#main-ingredients").prop("checked");
			for (var x = 0; x < iningredients.length; x++) {
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
			submitForm();
			});

	// Discard settings if modal closed without saving
	$('#settings').on('hidden.bs.modal', function () {
		if (!isSaved) {
            console.log("Discarding changes...");
            $('#settings-form')[0].reset();
			$("#servings").last().val(servings);
			$("#gas").last().val(gas);
			$("#electricity").last().val(electricity);
        } else {
            console.log("Changes were saved, keeping form state.");
        }
        updateEfficiency();
		updateHobOutputs();
    });

	// Wire events for efficiency and hob size updates
	$('#efficiency-toggle').on('change.update', () => updateEfficiency());
	$('#hob-size').on('change.update', () => updateHobOutputs());

	// Initialize on load
	updateEfficiency();
	$("#E-input-power").val(nominal_power.E || nominal_power_defaults.E.M);
	$("#I-input-power").val(nominal_power.I || nominal_power_defaults.I.M);
	$("#G-input-power").val(nominal_power.G || nominal_power_defaults.G.M);
	
	nominal_power = {
	I: $("#I-input-power").val(),
	E: $("#E-input-power").val(),
	G: $("#G-input-power").val(),
	};

	setupPowerSyncGroups();

	// Action for changing language
	$('#language a').click(function() {
			selectLanguage($(this).attr('name'))
		}
	);

	// Define language from url params (if provided)
	if (inlanguage.length > 0){
		language=inlanguage[0];
	}

	// Translate url params
	await Promise.all(iningredients.map(async (val, i) => {
		iningredients[i] = await translateValue(val, "Code", language);
	}));
	await Promise.all(inenergysources.map(async (val, i) => {
		inenergysources[i] = await translateValue(val, "Code", language);
	}));


	// Submit when changing the reference ingredient
	$('#reference').keypress(function(e) {
		if (e.which == 13) {
			submitForm();
			return false;
		}
	});


	// Submit when changing weight of reference ingredient
	$('#reference-weight').keypress(function(e) {
		if (e.which == 13) {
			submitForm();
			return false;
		}
	});

	// Translate form
	ingrsnippet = ingrsnippet.replace("%WEIGHT%", await translateValue("%WEIGHT%","Code",language));
	ingrsnippet = ingrsnippet.replace("%INGREDIENT%", await translateValue("%INGREDIENT%","Code",language));
	cooksnippet = cooksnippet.replace("%SOURCE%", await translateValue("%SOURCE%","Code",language));
	cooksnippet = cooksnippet.replace("%TIME%", await translateValue("%TIME%","Code",language));
	cooksnippet = cooksnippet.replace("%POWER%",await translateValue("%POWER%","Code",language));

	// Translate reference
	$("#reference").last().autocomplete({
		source: food_arr.map(a => a[language])
	}).val(await translateValue("25413","Code",language)).autocomplete('enable');

	// Add empty field if no parameters are provided
	if (iningredients.length == 0) {
		iningredients.push("")
	}

	if (inappliances.length == 0) {
		// Default power
		inpower.push(default_power)
		// Default power level
		inpowerlevels.push(default_power_level)
		// Default appliance
		inappliances.push("I")
	}

	// Add fields from parameters
	for (var x = 0; x < iningredients.length; x++) {
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

	for (var c = 0; c < inappliances.length; c++) {
		// Add new line
		$(wrapper_cooking).append($(cooksnippet));
		// Load values for dropdown
		for (var i = 0; i < appliances_arr.length; i++) {
			$('#energydropdown select').last().append($(document.createElement('option')).prop({
				value: appliances_arr.map(a => a["Code"])[i],
				text: appliances_arr.map(a => a[language])[i]
			}))
		};
		for (var i = 0; i < power_level_arr.length; i++) {
			$("[name='pl']").last().append($(document.createElement('option')).prop({
				value: power_level_arr.map(a => a)[i],
				text: "Level ".concat(power_level_arr.map(a => a)[i])
			}))
		};
		// Load values from parameters
		$("[name='t']").last().val(incookingtime[c]);
		$("[name='p']").last().val(inpower[c]);
		$("[name='a']").last().val(inappliances[c]);
		$("[name='pl']").last().val(inpowerlevels[c]);
	}

	// Add fields from UI
	$(wrapper).on("click", "[name='add-ing']", function(e) {
		e.preventDefault();
		// Insert new line after the current row
		$(this).closest('.row').after($(ingrsnippet));
		// Autocomplete for the newly added input
		var $newInput = $(this).closest('.row').next().find("[name='i']");
		if (onlyMain) {
			$newInput.autocomplete({ source: food_arr_main.map(a => a[language]) }).autocomplete('enable');
		} else {
			$newInput.autocomplete({ source: food_arr.map(a => a[language]) }).autocomplete('enable');
		}
		x++;
	});

	$(wrapper_cooking).on("click", "[name='add-cf']", function(e) {
		e.preventDefault();
		// Insert new cooking snippet after the current row
		$(this).closest('.row').after($(cooksnippet));
		// Populate dropdown for the newly added select
		var $newSelect = $(this).closest('.row').next().find('#energydropdown select');
		for (var i = 0; i < appliances_arr.length; i++) {
			$newSelect.append($(document.createElement('option')).prop({
				value: appliances_arr.map(a => a[language])[i],
				text: appliances_arr.map(a => a[language])[i]
			}));
		}
		for (var i = 0; i < power_level_arr.length; i++) {
			$("[name='pl']").last().append($(document.createElement('option')).prop({
				value: power_level_arr.map(a => a)[i],
				text: "Level ".concat(power_level_arr.map(a => a)[i])
			}));
		}
		$(this).closest('.row').next().find("[name='p']").val(default_power);
		c++;
	});

	// Remove fields from UI
	$(wrapper).on("click", "#delete", function(e) {
		e.preventDefault();
		if (x > 1) {
			// Remove line
			$(this).closest('.row').remove();
			x--;
		} else {
			console.log("cannot remove first ingredient")
		}
	});

	$(wrapper_cooking).on("click", "#delete-cooking", function(e) {
		e.preventDefault();
		if (c > 1) {
			// Remove line
			$(this).closest('.row').remove();
			c--;
		} else {
			console.log("cannot remove first cooking step")
		}
	});


	// Show/hide oven temperature based on appliance selection (delegated)
	$(wrapper_cooking).on('change', 'select[name="a"]', function () {
		const $row = $(this).closest('.row');
		const selectedOption = $row.find('select[name="a"] option:selected');
		const text = (selectedOption.text() || '').toString();
		const val = ($row.find('select[name="a"]').val() || '').toString();
		const isOven = /Oven/i.test(text) || /oven/i.test(val);
		const isOther = /Other/i.test(text) || /other/i.test(val);

		// --- oven show/hide behavior ---
		if (isOven) {
			$row.find('select[name="pl"]').hide();
			$row.find('.watt-group').hide();
			$row.find('.oven-temp-group').show();
			$row.find('input[name="p"]').val("");
		} else if (isOther) {
			$row.find('select[name="pl"]').hide();
			$row.find('.watt-group').show();
			$row.find('.oven-temp-group').hide();
		} else {
			$row.find('select[name="pl"]').show();
			$row.find('.watt-group').hide();
			$row.find('.oven-temp-group').hide();
			$row.find('input[name="p"]').val("");
		}

		// helper to find a settings output-power element for a given appliance code
		function getOutputFor(code) {
			if (!code) return null;

			const el = document.getElementById(code + '-output-power');
			if (el && el.value !== undefined && el.value !== '') {
				const v = parseFloat(el.value);
				if (isFinite(v) && v > 0) return v;
			}
			return null;
		}

		// previous appliance code saved on the row
		const prevCode = $row.data('prevAppliance') || null;
		const newCode = val || text || null;
		const oldOutput = getOutputFor(prevCode);
		const newOutput = getOutputFor(newCode);

		// adjust time proportionally: newTime = oldTime * (oldOutput / newOutput)
		const $timeInput = $row.find('input[name="t"], [name="t"]');
		const oldTime = parseInt($timeInput.val()) || 0;
		if (oldTime > 0 && oldOutput > 0 && newOutput > 0) {
			const newTime = Math.max(1,Math.round(oldTime * (oldOutput / newOutput)));
			$timeInput.val(Number(newTime)).trigger('input');
		}

		// store current appliance code for next change
		$row.data('prevAppliance', newCode);
	});

	// Ensure prefilled appliance selects initialize visibility
	// after the code that populates existing cooking rows (inside init), trigger change:
	$('.cooking-steps').find('select[name="a"]').each(function(){ $(this).trigger('change'); });



	submitForm();


};

init();



