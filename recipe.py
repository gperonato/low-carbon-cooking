#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Feb  3 21:56:51 2021

@author: giuseppeperonato
"""

  
import csv
import json

class Recipe():
    def __init__(self, name):
        self.name = name
        self.ingredients = {}
        self.content = {}
        self.cooking_steps = []
        self.db = []
        self.energy_ef= []
        self.intake= []
        self.total_content = {}

        with open('data/food/data.csv') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                self.db.append(row)
        with open('data/energy/data.csv') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                self.energy_ef.append(row)
        with open('data/food/intake/data.json', "r") as f:
            self.intake = json.loads(f.read())
         
    def addIngredient(self,name,quantity):
        self.ingredients[name] = {"quantity": quantity}

    def removeIngredient(self,name):
        del self.ingredients[name]
        
    def addIngredients(self,ingredients):
        for ingredient in ingredients:
            self.addIngredient(ingredient[0],ingredient[1])

    def addCookingStep(self,energy_source,duration,power):
        self.cooking_steps.append({"duration": duration,
                                    "energy_source": energy_source,
                                    "power": power})

    def cook(self):
        for step in self.cooking_steps:
            energy = step["duration"]/60. * step["power"]
            print(self.find_EF(step["energy_source"]))
            step["CO2e"] = energy * self.find_EF(step["energy_source"])
            self.total_content["Carbon footprint"]["value"] +=  step["CO2e"] 
        self.compare()

    def mise_en_place(self):
        self.weight = 0
        keys_to_skip = []
        # Populate content
        for name in self.ingredients.keys():
            self.content[name] = {}
            entries = self.add_values(name)
            for key, value in entries.items():
                if key == "Carbon footprint (kgCO2e/kg)":
                    self.content[name]["Carbon footprint (gCO2e/g)"] = value * self.ingredients[name]["quantity"]
                else:
                    if value != None:
                        self.content[name][key] = value * (self.ingredients[name]["quantity"]/100.)
                    else:
                        keys_to_skip.append(key)
            self.weight += self.ingredients[name]["quantity"]
         # Populate total content
        for ingredient in self.content.keys():
            for key, value in self.content[ingredient].items():
                if key not in keys_to_skip:
                    key_no_unit = key.split(" (")[0]
                    if not key_no_unit in self.total_content.keys():
                        self.total_content[key_no_unit] = {"value": 0,
                                                                  "unit":key.split(" (")[1].split("/")[0]}
                    self.total_content[key_no_unit]["value"] += self.content[name][key]
        print("Skipping", set(keys_to_skip))
        self.compare()
    
    def add_values(self,name):
        entries = {}
        for entry in self.db:
            if entry["LCI Name"] == name:
                for key, value in entry.items():
                    try:
                        entries[key] = float(value)
                    except:
                        entries[key] = None
                return entries

    def find_EF(self,energy):
        for entry in self.energy_ef:
            if entry["Name_Location"] == energy:
                return float(entry["EF"])

    def compare(self,meal="Hamburger, from fast foods restaurant",quantity=220):
        reference = self.add_values(meal)
        del reference["LCI Name"]
        print(self.total_content.keys() )
        for key, value in reference.items():
            name = key.split(" (")[0]
            comparison = ""
            recommended = ""
            if name in self.total_content.keys() and value > 0:
                if key == "Carbon footprint (kgCO2e/kg)":
                    comparison = round(self.total_content[name]["value"] / (value*(quantity))*100,2)
                else:
                    comparison = round(self.total_content[name]["value"] / (value*(quantity/100.)) * 100,2)
                    recommended = round(self.total_content[name]["value"]/self.intake[name]["value"] * 100,2)
                self.total_content[name]["benchmark"] = {"name":meal,"weight (g)": quantity, "value": comparison}
                self.total_content[name]["recommended"] = recommended




my_recipe = Recipe("Pasta broccoli e aggiughe")
my_recipe.addIngredient("Dried pasta, wholemeal, raw", 100)
my_recipe.addIngredient("Olive oil, extra virgin", 2)
my_recipe.addIngredient("Anchovy, in salt (semi-preserved)", 15)
my_recipe.addIngredient("Romanesco cauliflower or romanesco broccoli, raw", 200)
my_recipe.addIngredients([("Dried pasta, wholemeal, raw", 100),
                          ("Olive oil, extra virgin", 2),
                          ("Anchovy, in salt (semi-preserved)", 12),
                          ("Romanesco cauliflower or romanesco broccoli, raw", 250)])
my_recipe.mise_en_place()
print(my_recipe.name)
print(my_recipe.ingredients)
print(my_recipe.content)
print("Weight",my_recipe.weight,"g")
print(my_recipe.total_content)
my_recipe.addCookingStep("Electricity 2021 - use : residential cooking - France continentale", 15, 2500)
print(my_recipe.cooking_steps)
print(my_recipe.total_content)
my_recipe.cook()

my_recipe2 = Recipe("Tagliatelle al ragù")
my_recipe2.addIngredients([("Dried egg pasta, raw", 100),
                          ("Olive oil, extra virgin", 2),
                          ("Beef, minced steak, 20% fat, cooked", 75),
                          ("Carrot, raw", 12),
                          ("Celery stalk, raw", 12),
                          ("Onion, raw", 12),
                          ("Tomato coulis, canned (tomato puree semi-reduced 11%)", 75)])
my_recipe2.mise_en_place()
print(my_recipe2.name)
print(my_recipe2.ingredients)
print("Weight",my_recipe2.weight,"g")
print(my_recipe2.total_content)
print("")


