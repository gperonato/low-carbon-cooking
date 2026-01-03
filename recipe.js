// SPDX-FileCopyrightText: 2021-2026 Giuseppe Peronato <gperonato@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

// Recipe calculator

// Utility function to coerce values to float
function getNum(val) {
	val = +parseFloat(val) || NaN
	return val;
}

// Utility function to load JSON data
export const loadJSON = async (path) => {
	try {
	  const response = await fetch(path);
	  if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	  }
	  return await response.json();
	} catch (err) {
	  console.error(`Failed to load JSON from ${path}:`, err);
	  throw err;
	}
  };

// Utility function to load CSV using PapaParse
export const loadCSV = async (path) => {
	return new Promise((resolve, reject) => {
	  Papa.parse(path, {
		skipEmptyLines: true,
		download: true,
		header: true,
		complete: (results) => resolve(results.data),
		error: (err) => reject(err),
	  });
	});
  };


/**
 * Oven energy consumption model
 *
 * Inputs:
 *  - temperatureCelsius: number (oven temperature in °C)
 *  - timeMinutes: number (total cooking time in minutes, after preheating)
 *  - volumeLiters: optional number (oven cavity volume in liters, default 55L)
 *  - roomTemperatureCelsius: optional number (room temperature in °C, default 20°C)
 *  - U: optional number (overall heat transfer coefficient in W/m²·K, default 5 W/m²·K)
 *
 * Output:
 *  - totalEnergy: number (total energy consumption in kWh, including preheating)
 */
export function ovenModel(
	temperatureCelsius,
	timeMinutes,
	volumeLiters = 55,
	roomTemperatureCelsius = 20,
	U = 5 // overall heat transfer coefficient (W/m²·K)
) {
	const c = 490; 		// specific heat capacity of steel (J/kg·K)
	const d = 7850; 	// density of steel (kg/m³)
	const t = 3.5/1000; // thickness of oven walls (m)
	const Vi = volumeLiters * 0.001; // cavity volume (m³)
	const s  = Math.cbrt(Vi); // internal side (m)

	const m = ((s + 2*t)**3 - s**3) * d; // mass of oven walls (kg)
	const a = 6 * (Vi ** (2/3)); // area (m²)

	const UA = a * U; // overall heat transfer (W/K)
	const deltaT = temperatureCelsius - roomTemperatureCelsius;
	const preHeatEnergy = c * m * deltaT / 3600000; // kWh

	const maintainEnergy = UA * deltaT * (timeMinutes*60) / 3600000; // kWh

	const totalEnergy = preHeatEnergy + maintainEnergy;
	return totalEnergy;
}


/**
 * Cooking energy consumption model
 *
 * Inputs:
 *  - timeMinutes: number (effective cooking time in minutes, AFTER preheating)
 *  - applianceType: "Induction cooktop" | "Electric cooktop" | "Gas cooktop"
 *                   | "Gas oven" | "Electric oven" | null
 *  - powerLevel: 1–9 integer (relative power setting, optional)
 *  - ovenTemperatureCelsius: optional number (°C, for ovens)
 *  - inputPowerW: optional number (direct input power in W, overrides model)
 *  - nominalPowerAppliances: object (mapping appliance types to nominal power in W)
 *  - ovenVolume: optional number (oven cavity volume in liters, default 55L)
 *
 * Output:
 *  {
 *    E_consumed_kWh   // Input energy from supply (kWh)
 *  }
 */
export function cookingEnergyConsumption(
	timeMinutes,
	applianceType,
	powerLevel,
	ovenTemperatureCelsius,
	inputPowerW,
	nominalPowerAppliances,
	ovenVolume,
) {

  // Validate applianceType
  if (applianceType != null && !(
	applianceType.includes("Induction cooktop") ||
	applianceType.includes("Electric cooktop") ||
	applianceType.includes("Gas cooktop") ||
	applianceType.includes("Other gas device") ||
	applianceType.includes("Other electric device") ||
	applianceType.includes("Gas oven") ||
	applianceType.includes("Electric oven"))) {
	throw new Error("Invalid applianceType provided.");
  }

  // Normalize appliance types
  applianceType = applianceType.includes("oven") ? "oven " : applianceType;
  applianceType = applianceType.substring(0, applianceType.indexOf(' '));

  // Validate other inputs
  if (powerLevel === null && inputPowerW === null && applianceType !== "oven") {
	throw new Error("Either powerLevel or inputPowerW must be provided.");
  }
  if (powerLevel !== null && ![1,2,3,4,5,6,7,8,9].includes(powerLevel)) {
	throw new Error("powerLevel must be an integer between 1 and 9.");
  }
  if (applianceType == "oven" && ovenTemperatureCelsius === null) {
	throw new Error("ovenTemperature must be provided for oven.");
  }

  let E_consumed_kWh;

  if (applianceType != null && applianceType == "oven") {
	// Oven
	E_consumed_kWh = ovenModel(
		ovenTemperatureCelsius,
		timeMinutes,
		ovenVolume
	);
  } else {
	// Determine input power
  	let P;
  	if (inputPowerW !== null) {
		P = inputPowerW;
  	} else {
		// Power Curve: P = Pmax * (pL/pLmax)^1.5
		// Note: An exponent of 1.5 is used instead of 1.0 (linear) to map the 
		// 1-9 dial to a more realistic power curve
		// where lower settings provide finer control for simmering.
    	P = nominalPowerAppliances[applianceType.at(0)] * (powerLevel/9)**1.5;
 	}
  	const tHours = timeMinutes / 60;

  	// Compute energy
  	E_consumed_kWh = (P * tHours) / 1000;
  }

  return {
    E_consumed_kWh
  };
}



export class Recipe {
	constructor(name) {
		this.name = name;
		this.environment = [];
		this.nutrition = [];
		this.energy_ef = [];
		this.nominal_power_appliances = {};
		this.oven_volume = 55; // default oven volume in liters
		this.intake = {};
		this.units = [];
		this.servings = 1;
		this.ingredients = {};
		this.cooking_steps = [];
		this.total_content = {};
		this.comparison = {"food":"Hamburger, from fast foods restaurant",
								"quantity":220};
	}

	addIngredient(name, quantity) {
		this.ingredients[name] = {
			"quantity": parseInt(quantity)
		};
	}

	addCookingStep(energy_source, duration, power=null,  applianceType=null, powerLevel=null, ovenTemperature=null) {
		let cooking = cookingEnergyConsumption(
			duration,
			applianceType,
			powerLevel,
			ovenTemperature,
			power,
			this.nominal_power_appliances,
			this.oven_volume
		)
		let energy = cooking["E_consumed_kWh"]
		this.cooking_steps.push({"duration": duration,
				"energy_source": energy_source,
				"energy": energy
		});
	}

	removeIngredient(name) {
		delete this.ingredients[name]
	}

	addIngredients(ingredients) {
		for (let ingredient of ingredients) {
			this.addIngredient(ingredient[0], ingredient[1])
		}
	}

	miseEnPlace() {
		this.content = {}
		this.weight = 0;
		// Populate content
		for (const [name, value] of Object.entries(this.ingredients)) {
			this.content[name] = {}
			for (const dict of [this.nutrition, this.environment]) {
				var entries = this.addValues(name, dict)
				for (const [key, value] of Object.entries(entries)) {
					let absolute_value = 0;
					// Handle 0s
					if (value == "") {
						absolute_value = NaN;
					} else if (getNum(value) > 0) {
						absolute_value = getNum(value) * (this.ingredients[name]["quantity"]/1000);
					}
					this.content[name][key] = {
						"value": absolute_value,
						"source": entries["source"]
					}
				}
			}
		this.weight += this.ingredients[name]["quantity"]
		}
		// Populate total content
		for (const [name, object] of Object.entries(this.content)){
			for (const [key, value] of Object.entries(object)){
				// Add the content if the object doesn't exist already and if it has a unit
				if (! (this.total_content[key]) & this.lookUp(key, "Short Name", "Unit", this.units) != ""){
					this.total_content[key] = {"value": 0,
											   "unit": this.lookUp(key, "Short Name", "Unit", this.units),
											   "benchmark": {},
											   "recommended": ""	
											   }
					var is_environment = false;
					}
				if (this.total_content[key]) {
					this.total_content[key]["value"] += this.content[name][key]["value"] / this.servings;
					if(this.content[name][key]["source"].includes("AGRIBALYSE")) {is_environment = true}
					this.total_content[key]["is_environment"] = is_environment	
				}
			}
		}
		this.compare()
	}

	cook() {
		for (const step of this.cooking_steps) {
			step["CO2e"] = step["energy"] * this.lookUp(step["energy_source"], "code", "EF", this.energy_ef)
			this.total_content["climate_change"]["value"] += step["CO2e"] / this.servings
			}
		this.compare()
	}

	addValues(name, dict) {
		var entries = {};
		for (let entry of dict) {
			if (entry["lci_name"] == name) {
				for (const [key, value] of Object.entries(entry)) {
					entries[key] = value;
				}
			}
		}
		return entries;
	}

	listIngredients() {
		for (const [name, value] of Object.entries(this.ingredients)) {
			return name;
		}
	}

	lookUp(variable, variable_name, key, dict) {
		for (let entry of dict) {
			if (entry[variable_name] == variable) {
					return entry[key];
				}
		}
	}

	setReference(food, quantity){
		this.comparison["food"] = food;
		this.comparison["quantity"] = quantity;
	}
	compare(){
		var food = this.comparison["food"];
		var quantity = this.comparison["quantity"];
		var reference = Object.assign({}, this.addValues(food, this.nutrition), this.addValues(food, this.environment)); 
		var recommended = 0;
		var comparison = "";
		// Reference food
		for (const [key, value] of Object.entries(reference)){
			if (this.total_content.hasOwnProperty(key)) {
				comparison = this.total_content[key]["value"] / (getNum(value)*quantity/1000)
				this.total_content[key]["benchmark"] = {"name":food,
														"weight (g)": quantity,
														"value": comparison}
			}
		}
		// Recommended intake
		for (const [key, value] of Object.entries(this.intake)){
			if (this.total_content[key]["value"] > 0) {
				recommended = this.total_content[key]["value"]/this.intake[key]["value"]; // ratio
				this.total_content[key]["recommended"] = recommended;
				this.total_content[key]["recommended_source"] = this.intake[key]["source"]["title"];			
			}
		}
	}
}
