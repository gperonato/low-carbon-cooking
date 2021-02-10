#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Feb  3 21:56:51 2021

@author: giuseppeperonato
"""

  
import csv


class Recipe():
    def __init__(self, name, country="France"):
        self.name = name
        self.ingredients = {}
        self.content = {}
        self.cooking_steps = []
        self.db = []
        self.country = country

        self.energy_ef = {"France":{"electricity": 0.0498, "gas": 0.244}}
        with open('data/join.csv') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                self.db.append(row)
        
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
            energy = step["duration"]/60. * step["power"] / 1000.
            step["CO2e"] = energy * self.energy_ef[self.country][step["energy_source"]]
            self.CO2e +=  step["CO2e"] 
        # self.CO2e = round(self.CO2e,2)

    def mise_en_place(self):
        self.weight = 0
        self.CO2e = 0
        self.kcal = 0
        for name in self.ingredients.keys():
            self.content[name] = {}
            entries = self.add_values(name)
            for key, value in entries.items():
                self.content[name][key] =  value
            self.content[name]["CO2e"] = self.content[name]["Changement climatique (kg CO2 eq/kg de produit)"] * (self.ingredients[name]["quantity"]/1000.)
            try:
                self.content[name]["kcal"] =  int(self.content[name]["Energy, Regulation EU No 1169/2011 (kcal/100g)"]) * \
                                                    (self.ingredients[name]["quantity"]/100.)
            except:
                self.content[name]["kcal"] = 0
            self.weight += self.ingredients[name]["quantity"]
            self.CO2e += self.content[name]["CO2e"]
            self.kcal += self.content[name]["kcal"]
    
    def add_values(self,name):
        entries = {}
        for entry in self.db:
            if entry["LCI Name"] == name:
                for key, value in entry.items():
                    try:
                        entries[key] = float(value)
                    except:
                        pass
                return entries


my_recipe = Recipe("Pasta broccoli e aggiughe")
# my_recipe.addIngredient("Dried pasta, wholemeal, raw", 100)
# my_recipe.addIngredient("Olive oil, extra virgin", 2)
# my_recipe.addIngredient("Anchovy, in salt (semi-preserved)", 15)
# my_recipe.addIngredient("Romanesco cauliflower or romanesco broccoli, raw", 200)
my_recipe.addIngredients([("Dried pasta, wholemeal, raw", 400),
                          ("Olive oil, extra virgin", 2),
                          ("Anchovy, in salt (semi-preserved)", 50),
                          ("Romanesco cauliflower or romanesco broccoli, raw", 1000)])
my_recipe.mise_en_place()
print(my_recipe.name)
print(my_recipe.ingredients)
print(my_recipe.content)
print("Weight",my_recipe.weight,"g")
print("Footprint",my_recipe.CO2e,"kg CO2e")
print("Calories",my_recipe.kcal,"kcal")
my_recipe.addCookingStep("electricity", 15, 2500)
print(my_recipe.cooking_steps)
my_recipe.cook()
print("Footprint",my_recipe.CO2e,"kg CO2e")
my_recipe2 = Recipe("Tagliatelle al ragù")
my_recipe2.addIngredients([("Dried egg pasta, raw", 400),
                          ("Olive oil, extra virgin", 2),
                          ("Beef, minced steak, 20% fat, cooked", 300),
                          ("Carrot, raw", 50),
                          ("Celery stalk, raw", 50),
                          ("Onion, raw", 50),
                          ("Tomato coulis, canned (tomato puree semi-reduced 11%)", 300)])
my_recipe2.mise_en_place()
print(my_recipe2.name)
print(my_recipe2.ingredients)
print("Weight",my_recipe2.weight,"g")
print("Footprint",my_recipe2.CO2e,"kg CO2e")
print("Calories",my_recipe2.kcal,"kcal")

