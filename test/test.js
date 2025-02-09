// Sample tests for the Recipe class

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

const run_tests = async () => {
try {
    const [environment, nutrition, energy_ef, units, intake] = await Promise.all([
      loadCSV("../data/food/environment.csv"),
      loadCSV("../data/food/nutrition.csv"),
      loadCSV("../data/energy/data.csv"),
      loadCSV("../data/food/units.csv"),
      loadJSON("../data/food/intake/data.json"),
    ]);

    const myRecipe = new Recipe("myRecipe");
    myRecipe.environment = environment;
    myRecipe.nutrition = nutrition;
    myRecipe.energy_ef = energy_ef;
    myRecipe.intake = intake;
    myRecipe.units = units;

    myRecipe.addIngredient("Dried pasta, wholemeal, raw", 400)
    myRecipe.addIngredient("Olive oil, extra virgin", 2)
    myRecipe.addIngredient("Anchovy, in salt (semi-preserved)", 50)
    myRecipe.addIngredient("Romanesco cauliflower or romanesco broccoli, raw", 1000)

    // Mise-en-place only
    myRecipe.mise_en_place()

    // length of entered ingredients
    assert(Object.entries(myRecipe.content).length == 4)
    // total weight
    assert(myRecipe.weight == 1452)
    // CO2e
    assert(myRecipe.total_content["climate_change"]["value"] > 0)

    // After cooking
    myRecipe.addCookingStep("ECFR", 15, 2500)
    myRecipe.cook()

    // CO2e and calories
    assert(myRecipe.total_content["climate_change"]["value"] > 0)
    assert(myRecipe.total_content["energy_eu"]["value"] > 0)

} catch (err) {
    console.error("Error running recipe calculation:", err);
  }
};

run_tests();

