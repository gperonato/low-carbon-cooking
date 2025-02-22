# Low-carbon cooking

This repository contains a calculator providing information on the environmental impact (carbon footprint, i.e., impact on climate change) and nutritional content of cooking recipes.

# Data sources

The calculator is based on two main datasets released by the French government agencies as open data (*Licence Ouverte*):

- the <a href="https://doc.agribalyse.fr/documentation-en/">AGRIBALYSE®</a> database (v. 3.2, 2024-12-04) provided by the French Agency for Ecological Transition (ADEME) containing the environmental analysis of food products; </li>
- the <a href="https://ciqual.anses.fr/">CIQUAL</a> (v. 2020-07-03) and <a href="https://ciqual.anses.fr/">CALNUT 2020</a> (v. 2020-08-28) food composition databases provided by the French Agency for Food, Environmental and Occupational health safety (ANSES).

Additional data regarding the carbon content of energy sources for cooking are issued from:

- <a href="https://portal.electricitymaps.com/datasets">Electricity Maps' Carbon Intensity Data</a> (2025-01-27, mean 2022-2024 yearly values);
- <a href="https://www.data.gouv.fr/fr/datasets/base-carbone-r-2/">Base carbone®</a> (v. 23.4, 2025-01-02) provided by the French Agency for Ecological Transition (ADEME).

Note that the Italian translation of the CIQUAL database is provided without warranty of any kind, in particular in terms of accuracy or reliability: please check the original version in French (or the official English translation) in case of doubts.

## Data pipelines

The original datasets are downloaded and transformed from the original data sources using Python pipelines.
The pipelines can be found in `data` along with the processed datasets.

# API

The calculator is based on the `Recipe` Object (see `recipe.js`).

## Usage

For sample usage you can refer to the test file `test/test.js`. 


## Web app
A web-app provides an UI for the calculator (see `index.html` and `app.js`).
The running web app is available on [www.mycookprint.com](mycookprint.com).
