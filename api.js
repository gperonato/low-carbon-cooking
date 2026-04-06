// SPDX-FileCopyrightText: 2026 Giuseppe Peronato <gperonato@gmail.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import express from 'express'; // Import express at the top
import { Recipe } from './recipe.js'; // Import other modules as well
import fs from 'fs'; // Using the regular file system module
import Papa from 'papaparse'; // Importing PapaParse

const DEFAULT_LANGUAGE = 'EN';

const nominal_power_defaults = {
	I: { S: 1400, M: 1800, L: 2200 },
	E: { S: 1200, M: 2000, L: 2200 },
	G: { S: 1000, M: 1750, L: 3000 },
};

// Function to load JSON file
export const loadJSON = async (path) => {
    try {
        const data = await fs.promises.readFile(path, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Failed to load JSON from ${path}:`, err);
        throw err;
    }
};

// Function to load and parse CSV file using PapaParse
export const loadCSV = async (path) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const fileStream = fs.createReadStream(path);

        fileStream.on('error', (err) => {
            reject(`Failed to read file ${path}: ${err.message}`);
        });

        Papa.parse(fileStream, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Remove extraneous characters from header
            complete: (result) => {
                resolve(result.data); // Resolve with the parsed data
            },
            error: (err) => {
                reject(`Error parsing CSV: ${err.message}`);
            }
        });
    });
};

// Dictionary with translations
let dictionary = []; // Global variable to store the dictionary
let dictionaryLoaded = false; // Flag to track if the dictionary is loaded

// Function to load the translation dictionary using loadCSV
async function loadDictionary() {
    try {
        dictionary = await loadCSV('./data/translation.csv'); // Reuse loadCSV to load the dictionary
        dictionaryLoaded = true; // Update the loading status
        console.log("Dictionary loaded successfully");
    } catch (err) {
        console.error("Error loading dictionary:", err);
        throw err; // Propagate error up
    }
}

// Translate function
async function translateValue(value, source_language, target_language) {
    if (!dictionaryLoaded) {
        await loadDictionary(); // Ensure dictionary is loaded before using it
    }

    // Search for the translation
    const entry = dictionary.find((entry) => entry[source_language] === value);
    return entry ? entry[target_language] : value; // Return translated value or original if not found
}

const app = express();
const port = 8080;

// Declare a variable for loaded data
let loadedData = null;
let dataLoadPromise = null;

// Async function to load data
async function loadData() {
    try {
        const [environment, nutrition, energy1, energy2, units, intake] = await Promise.all([
            loadCSV("./data/food/environment.csv"),
            loadCSV("./data/food/nutrition.csv"),
            loadCSV("./data/energy/data_odbl.csv"),
            loadCSV("./data/energy/data_lo.csv"),
            loadCSV("./data/food/units.csv"),
            loadJSON("./data/food/intake/data.json")
        ]);
        
        loadedData = { environment, nutrition, energy1, energy2, units, intake };
        console.log("Data loaded successfully");
    } catch (error) {
        console.error("Error loading data:", error);
        throw error;
    }
}

// Call loadData when the server starts, store the promise
dataLoadPromise = loadData();

// Health endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// API route
app.get('/recipe', async (req, res) => {
    // Wait for data to be ready before handling requests
    if (!loadedData) {
        try {
            await dataLoadPromise;
        } catch (error) {
            return res.status(503).json({ error: "Data not yet loaded", detail: error.message });
        }
    }

    // Destructure loaded data
    const { environment, nutrition, energy1, energy2, units, intake } = loadedData;

    // Handle query parameters
    const inlanguage = Array.isArray(req.query.l) ? req.query.l : (req.query.l ? [req.query.l] : []);
    const iningredients = Array.isArray(req.query.i) ? req.query.i : (req.query.i ? [req.query.i] : []);
    const inquantities = Array.isArray(req.query.q) ? req.query.q : (req.query.q ? [req.query.q] : []);
    const inenergysources = Array.isArray(req.query.e) ? req.query.e : (req.query.e ? [req.query.e] : []);
    const times = Array.isArray(req.query.t) ? req.query.t : (req.query.t ? [req.query.t] : []);
    const powers = Array.isArray(req.query.p) ? req.query.p : (req.query.p ? [req.query.p] : []);
    const powerLevels = Array.isArray(req.query.pl) ? req.query.pl : (req.query.pl ? [req.query.pl] : []);
    const appliances = Array.isArray(req.query.a) ? req.query.a : (req.query.a ? [req.query.a] : []);
    const ovenTemperatures = Array.isArray(req.query.ot) ? req.query.ot : (req.query.ot ? [req.query.ot] : []);
    var nominal_power = {
        I: parseFloat(Array.isArray(req.query.pi) ? req.query.pi : (req.query.pi ? [req.query.pi] : [])[0] || nominal_power_defaults.I.M),
        E: parseFloat(Array.isArray(req.query.pe) ? req.query.pe : (req.query.pe ? [req.query.pe] : [])[0] || nominal_power_defaults.E.M),
        G: parseFloat(Array.isArray(req.query.pg) ? req.query.pg : (req.query.pg ? [req.query.pg] : [])[0] || nominal_power_defaults.G.M),   
    };
    const servings = parseFloat(req.query.servings) || 1;
    const countrycode = Array.isArray(req.query.cc) ? req.query.cc : (req.query.cc ? [req.query.cc] : ["US"]);

    // Create country mapping
    const country_mapping = dictionary.filter(function (e) {
                return e.Type == "COUNTRY";
            });
    if (countrycode == null){
        countrycode = getCountryCode();
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

    // Create a new web recipe instance
    const webRecipe = new Recipe("webRecipe");
    webRecipe.environment = environment;
    webRecipe.nutrition = nutrition;
    webRecipe.energy_ef = [...new Set([...energy1, ...energy2])];
    webRecipe.intake = intake;
    webRecipe.units = units;
    webRecipe.servings = servings;
    webRecipe.nominal_power_appliances = nominal_power;
    console.log("Nominal power appliances set to:", webRecipe.nominal_power_appliances);

    webRecipe.setReference("Hamburger, from fast foods restaurant", 220);
    if(iningredients.length > 0 & iningredients.length == inquantities.length) {

        for (let i = 0; i < iningredients.length; i++) {
            let ingredient = await translateValue(iningredients[i], "Code", "EN"); // Retrieve translated ingredient
            console.log("Adding ingredient:", ingredient);
            webRecipe.addIngredient(ingredient, inquantities[i]);
        }

        webRecipe.miseEnPlace();
        
		for (let i = 0; i < appliances.length; i++) {
			if (appliances[i] != "") {
				let source = electricity;
				let applianceType = await translateValue(appliances[i], "Code", DEFAULT_LANGUAGE);
				if (["Gas cooktop", "Gas oven", "Other gas device"].includes(applianceType)) {
					source = gas;
				}
				let powerLevel = parseInt(powerLevels[i]) || null;
				let ovenTemperature = parseInt(ovenTemperatures[i]) || null;
				let power = parseInt(powers[i]) || null;
				console.log("Adding source:", source,
					"power level:", powerLevel,
					"power:", power,
					"time:", times[i],
					"oven temperature:", ovenTemperature,
					"applianceType:", applianceType);
				webRecipe.addCookingStep(source, times[i], power, applianceType, powerLevel, ovenTemperature);
			}	
		}

        webRecipe.cook();

        // Successfully respond to the client
        res.json(webRecipe.total_content);
    } else {
        res.json({})
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

// Create a function to export the app
export function createServer() {
    return app;
}