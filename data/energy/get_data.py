#!/usr/bin/env python3
#%%
import pandas as pd
import os
import hashlib

dir_path = os.path.dirname(os.path.realpath(__file__))

#%%
# Add files downloaded from Electricity Maps
em = []

for file in os.listdir(os.path.join(dir_path, "electricity_maps")):
    if not file.endswith(".csv"):
        continue
    path = os.path.join(dir_path,"electricity_maps", file)
    if not os.path.exists(path):
        continue
    
    df = pd.read_csv(path)
    df["code"] = "EL" + file.split("_")[0]
    df["year"] = file.split("_")[1]
    df["external_id"] = file.split("_")[0]
    em.append(df)

em = pd.concat(em)
assert hashlib.sha256(pd.util.hash_pandas_object(em, index=True).values).hexdigest() == "8d3b05b63c48bf7e4acac46753e23d35157f9800d5fd01af2cfa3feb68b8f9fd"

em = em.groupby("external_id").agg({
    'Country': ['first'],
    'external_id': ['first'],
    'code': ['first'],
    'Carbon Intensity gCO₂eq/kWh (LCA)': ['mean'],
    'Data Source': ['first']
}).droplevel(1, axis=1)


em["database"] = "Electricity Maps v. 2025-01-27 - 2022-2024"
em["type"] = "Grid electricity consumption mix (LCA)"
em["year"] = "2022-2024"
em = em.sort_values("Country")

#%%
# Get Base_Carbone_V23.4
base_carbone = pd.read_csv("https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/data-files/Base_Carbone_V23.4.csv",
                           delimiter = ";",
                           encoding='latin-1',
                           low_memory=False,
                           decimal = ",")
assert hashlib.sha256(pd.util.hash_pandas_object(base_carbone, index=True).values).hexdigest() == "647836f5f6345290f9b05edd10eb0b9746b4b0617855e230e479b5610828c6e9"

base_carbone = base_carbone.loc[base_carbone["Type Ligne"] == "Elément",]
base_carbone = base_carbone.set_index("Identifiant de l'élément")
base_carbone["database"] = "Base_Carbone_V23.4"

#%%
# Prepare Emission Factors
ef = em.loc[:,["code", "type", "Country", "Carbon Intensity gCO₂eq/kWh (LCA)", "Data Source", "database", "external_id", "year"]]
ef = ef.rename(columns = {"Country": "location",
                          "Carbon Intensity gCO₂eq/kWh (LCA)": "EF",
                          "Data Source": "source"})
ef["EF"] /= 1000

#%%
# Add additional records from ADEME Base Carbone
bc_codes = {
    15626: "ELMT",
    15714: "ELEU27", 
    43281: "ECFR",
    13515: "NGEU",
    37132: "NGFR",
    34720: "PVFR"
}
new_rows = []
for id in bc_codes.keys():
  new_rows.append({
                    "code": bc_codes[id],
                    'location': "{} {}".format(base_carbone.loc[id, "Localisation géographique"].replace("Autre pays du monde", ""),
                                               base_carbone["Sous-localisation géographique anglais"].fillna("").loc[id]).strip(),
                    "type": "{} {}".format(base_carbone.loc[id, "Nom base anglais"],
                                               base_carbone["Nom attribut anglais"].fillna("").loc[id]).strip(),
                    'source': base_carbone.loc[id, "Source"],
                    'year': base_carbone.loc[id, "Date de modification"].split("/")[-1],
                    'EF': base_carbone.loc[id,"Total poste non décomposé"],
                    "database": base_carbone.loc[id,"database"],
                    "external_id": id
                    })
   

ef = pd.concat([ef, pd.DataFrame(new_rows)],
               axis=0,
               ignore_index=True)

#%%
# Round
ef["EF"] = ef["EF"].round(3)

# Save file
ef.to_csv(os.path.join(dir_path, "data.csv"), index=False)
# %%
