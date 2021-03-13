#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb 7 15:20 2021

@author: giuseppeperonato
"""

import dataflows
from datapackage import Package, Resource
import os
import requests

from dataflows import (
    Flow,
    dump_to_path,
    load,
    set_type,
    printer,
    find_replace,
    select_fields,
    join,
    duplicate,
    update_resource,
    update_schema,
    filter_rows,
    add_computed_field,
    delete_fields,
    concatenate,
    add_field
)

import requests

url = 'https://koumoul.com/s/data-fair/api/v1/datasets/agribalyse-synthese/raw'
r = requests.get(url, allow_redirects=True)
open("Agribalyse_Synthese.csv", 'wb').write(r.content)

Flow(
    load("https://ciqual.anses.fr/cms/sites/default/files/inline-files/Table%20Ciqual%202020_ENG_2020%2007%2007.xls"),
    load("Agribalyse_Synthese.csv"),
    add_computed_field([
        dict(target='Carbon footprint (kgCO2e/kg)', operation='format', with_='{Changement climatique (kg CO2 eq/kg de produit)}'),
    ],
    resources=["Agribalyse_Synthese"],
    ),
    delete_fields(
        [
            "Changement climatique (kg CO2 eq/kg de produit)",
        ],
    resources=["Agribalyse_Synthese"],
    regex=False
        ),
    update_schema("Table%20Ciqual%202020_ENG_2020%2007%2007", missingValues=["-", "None", ""]),
    duplicate(source="Agribalyse_Synthese", target_name="join", target_path="data.csv"),
    join(
        "Table%20Ciqual%202020_ENG_2020%2007%2007",  # Source resource
        ["alim_code"],
        "join",  # Target resource
        ["Code CIQUAL"],
        source_delete=True,
        fields={
            "Energy, Regulation EU No 1169/2011 (kcal/100g)": {"name": "Energy, Regulation EU No 1169/2011 (kcal/100g)"},
            "Protein (g/100g)": {"name": "Protein (g/100g)"},
            "Carbohydrate (g/100g)": {"name": "Carbohydrate (g/100g)"},
            "Fat (g/100g)":{"name": "Fat (g/100g)"},
            "Sugars (g/100g)":{"name": "Sugars (g/100g)"},
            "Calcium (mg/100g)":{"name": "Calcium (mg/100g)"},
            "Iron (mg/100g)":{"name": "Iron (mg/100g)"},
            "Vitamin B12 (µg/100g)":{"name": "Vitamin B12 (µg/100g)"},
        },
    ),
    select_fields(
        [
            # "Code CIQUAL",
            "LCI Name",
            "Carbon footprint (kgCO2e/kg)",
            "Energy, Regulation EU No 1169/2011 (kcal/100g)",
            "Protein (g/100g)","Carbohydrate (g/100g)","Fat (g/100g)","Sugars (g/100g)","Calcium (mg/100g)","Iron (mg/100g)","Vitamin B12 (µg/100g)"
        ],
        resources=["join"],
    ),
    find_replace(
        [
            {
                "name": "Energy, Regulation EU No 1169/2011 (kcal/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Protein (g/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Carbohydrate (g/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Fat (g/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Sugars (g/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Calcium (mg/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Iron (mg/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
            {
                "name": "Vitamin B12 (µg/100g)",
                "patterns": [
                    {"find": "[-]", "replace": ""},
                    {"find": '[<]', "replace": ""},
                    {"find": "\\btraces\\b", "replace": 0},
                    {"find": "\\bNone\\b", "replace": ""},
                ],
            },
        ],
        resources=["join"],
    ),
    set_type(
        "Energy, Regulation EU No 1169/2011 (kcal/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Protein (g/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Carbohydrate (g/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Fat (g/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Fat (g/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Sugars (g/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Calcium (mg/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Iron (mg/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),
    set_type(
        "Vitamin B12 (µg/100g)",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["join"],
    ),

    update_schema("data", missingValues=["", ""]),
    dump_to_path("food"),
).process()

package = Package("food/datapackage.json")
package.remove_resource("Agribalyse_Synthese")
package.commit()
package.descriptor['Sources'] = [
{
  "title": "Agribalyse® v.3.0.1, 24.11.2020 update",
  "path": "https://www.data.gouv.fr/fr/datasets/agribalyse-r-detail-par-etape-du-cycle-de-vie/"
},
{
  "title": "Ciqual database, 07.07.2020 update",
  "path": "https://www.data.gouv.fr/fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual/"
},
]
package.descriptor['description'] = 'Adapted join of CIQUAL and Agribalyse® datasets. Check getData.py to see the transformations applied to the original datasets.'
package.commit()
package.save("food/datapackage.json")
os.remove("food/Agribalyse_Synthese.csv")





url = 'https://www.eea.europa.eu/data-and-maps/data/co2-intensity-of-electricity-generation/eea-2017-co2-emission-intensity/2017-co2_intensel_eea_csv/at_download/file'
r = requests.get(url, allow_redirects=True)
open("2017_CO2_IntensEL_EEA.zip", 'wb').write(r.content)

url = "https://www.data.gouv.fr/fr/datasets/r/8513c5a0-9f98-4059-8843-990d7dd47ff2"
r = requests.get(url, allow_redirects=True)
open("ademe.csv", 'wb').write(r.content)

Flow(
    load("2017_CO2_IntensEL_EEA.zip"),
    load("energy/CarbonIntensity_other.csv"),
    set_type(
        "Year",
        type="number",
        regex=False,
    resources=["2017_CO2_IntensEL_EEA","CarbonIntensity_other"]
    ),
    filter_rows(
        equals=[{"Year":2017}], 
    resources=["2017_CO2_IntensEL_EEA"]
    ),
    filter_rows(
        equals=[{"Year":2014}], 
    resources=["CarbonIntensity_other"]
    ),
    select_fields(
        [
            "CountryLong",
            "ValueNumeric",
        ],
        resources=["2017_CO2_IntensEL_EEA","CarbonIntensity_other"],
        ),
    add_field(
        'Name',
        type='string',
        default="Electricity mix",
        resources=["2017_CO2_IntensEL_EEA","CarbonIntensity_other"],
    ),
    set_type("ValueNumeric", type="number", resources=["2017_CO2_IntensEL_EEA","CarbonIntensity_other"]),
    lambda row: dict(row, ValueNumeric=row["ValueNumeric"] / 1000),

    load("ademe.csv",name="data"),
    select_fields(
        [
            "Identifiant de l'élément",
            "Type Ligne",
            "Nom base anglais",
            "Nom base français",
            "Localisation géographique",
            "Total poste non décomposé",
        ],
        resources=["data"],
    ),
    filter_rows(
        equals=[{"Type Ligne":"Elément"}],
        resources=["data"],
        ),
    add_computed_field([
        dict(target='id', operation='format', with_="{Identifiant de l'élément}"),
        dict(target='Name_EN', operation='format', with_='{Nom base anglais}'),
        dict(target='Name_FR', operation='format', with_='{Nom base français}'),
        dict(target='Location', operation='format', with_='{Localisation géographique}'),
        dict(target='EF', operation='format', with_='{Total poste non décomposé}'),
    ],
        resources=["data"],
        ),
    set_type(
        "id",
        type="number",
        regex=False,
        resources=["data"],
    ),
    delete_fields(
        [
            "Identifiant de l'élément",
            "Type Ligne",
            "Nom base anglais",
            "Nom base français",
            "Localisation géographique",
            "Total poste non décomposé",
        ],
        resources=["data"],
        ),
    filter_rows(
        equals=[
        {"id":26769}, # Electricity for cooking (France)
        {"id":13515}], # Gas (Europe)
        resources=["data"],
        ),
    set_type(
        "EF",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["data"],
    ),
    find_replace(
        [
            {
                "name": "Name_EN",
                "patterns": [
                    {"find": "Electricity", "replace": "Electricity (cooking)"},
                ],
            }
        ],
        resources=["data"],
    ),
    concatenate(
        dict(Name_EN=["Name"],
            Location=["CountryLong"],
            EF=["ValueNumeric"]),
        dict(name="data",path="data"),
    ),
    add_computed_field([
        dict(target='Name_Location', operation='format', with_='{Name_EN} - {Location}'),
        ]
    ),
    dump_to_path("energy"),
    ).process()

resource = Resource({"path": "energy/CarbonIntensity_other.csv"})
resource.tabular # true
resource.read(keyed=True)
resource.infer()
resource.descriptor["path"] = "CarbonIntensity_other.csv"
resource.commit()

package = Package("energy/datapackage.json")
package.descriptor['Sources'] = [
{
  "title": "EEA 2017 CO2 Intensity of Electricity Generation, 28.02.2020 update",
  "path": "https://www.eea.europa.eu/data-and-maps/data/co2-intensity-of-electricity-generation"
},
{
  "title": "Swiss Federal Office for the Environment",
  "path": "https://www.bafu.admin.ch/bafu/en/home/topics/climate/questions-answers.html"
},
{
  "title": "Base carbone® v.19.0, 04.12.2020 update",
  "path": "https://www.data.gouv.fr/fr/datasets/base-carbone-r-1/"
},
]
package.descriptor['description'] = 'Adapted join of various European carbon intensty datasets. Check getData.py to see the transformations applied to the original datasets.'
package.add_resource(resource.descriptor)
package.commit()
package.save("energy/datapackage.json")


