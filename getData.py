#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb 7 15:20 2021

@author: giuseppeperonato
"""

import dataflows
import datapackage

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


Flow(
    load("Table Ciqual 2020_ENG_2020 07 07.xls"),
    load("Agribalyse_Synthese.csv"),
    update_schema("Table Ciqual 2020_ENG_2020 07 07", missingValues=["-", "None", ""]),
    duplicate(source="Agribalyse_Synthese", target_name="join", target_path="data.csv"),
    join(
        "Table Ciqual 2020_ENG_2020 07 07",  # Source resource
        ["alim_code"],
        "join",  # Target resource
        ["Code CIQUAL"],
        source_delete=False,
        fields={
            "Energy, Regulation EU No 1169/2011 (kcal/100g)": {
                "name": "Energy, Regulation EU No 1169/2011 (kcal/100g)",
            }
        },
    ),
    select_fields(
        [
            "Code CIQUAL",
            "LCI Name",
            "Changement climatique (kg CO2 eq/kg de produit)",
            "Energy, Regulation EU No 1169/2011 (kcal/100g)",
        ],
        resources=["join"],
    ),
    find_replace(
        [
            {
                "name": "Energy, Regulation EU No 1169/2011 (kcal/100g)",
                "patterns": [
                    {"find": "[-]", "replace": -99},
                    {"find": "\\bNone\\b", "replace": -99},
                ],
            }
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
    update_schema("data", missingValues=[-99, ""]),
    dump_to_path("data/food"),
).process()


def g_to_kg(row):
    row["is_guitarist"] = row["instrument"] == "guitar"

Flow(
    load("2017_CO2_IntensEL_EEA.csv"),
    load("CarbonIntensity_other.csv"),
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

    load("ademe.xlsx"),
    select_fields(
        [
            "Identifiant de l'ÈlÈment",
            "Type Ligne",
            "Nom base anglais",
            "Nom base franÁais",
            "Localisation gÈographique",
            "Total poste non dÈcomposÈ",
        ],
        resources=["ademe"],
    ),
    filter_rows(
        equals=[{"Type Ligne":"ElÈment"}],
        resources=["ademe"],
        ),
    add_computed_field([
        dict(target='id', operation='sum', source=["Identifiant de l'ÈlÈment"]),
        dict(target='Name_EN', operation='format', with_='{Nom base anglais}'),
        dict(target='Name_FR', operation='format', with_='{Nom base franÁais}'),
        dict(target='Location', operation='format', with_='{Localisation gÈographique}'),
        dict(target='EF', operation='format', with_='{Total poste non dÈcomposÈ}'),
    ],
        resources=["ademe"],
        ),
    delete_fields(
        [
            "Identifiant de l'ÈlÈment",
            "Type Ligne",
            "Nom base anglais",
            "Nom base franÁais",
            "Localisation gÈographique",
            "Total poste non dÈcomposÈ",
        ],
        resources=["ademe"],
        ),
    filter_rows(
        equals=[
        {"id":26769}, # Electricity for cooking (France)
        {"id":13515}], # Gas (Europe)
        resources=["ademe"],
        ),
    set_type(
        "EF",
        type="number",
        decimalChar=",",
        regex=False,
        resources=["ademe"],
    ),
    find_replace(
        [
            {
                "name": "Name_FR",
                "patterns": [
                    {"find": "È", "replace": "é"},
                ],
            },
            {
                "name": "Name_EN",
                "patterns": [
                    {"find": "Electricity", "replace": "Electricity (cooking)"},
                ],
            }
        ],
        resources=["ademe"],
    ),
    # duplicate(source="ademe", target_name="ademe_", target_path="ademe.csv"),
    # duplicate(source="2017_CO2_IntensEL_EEA", target_name="EEA_", target_path="2017_CO2_IntensEL_EEA.csv"),
    printer(),
    concatenate(
        dict(Name_EN=["Name"],
            Location=["CountryLong"],
            EF=["ValueNumeric"]),
        dict(name="ademe",path="data"),
    ),
    add_computed_field([
        dict(target='Name_Location', operation='format', with_='{Name_EN} - {Location}'),
        ]
    ),
    dump_to_path("data/energy"),
    ).process()
