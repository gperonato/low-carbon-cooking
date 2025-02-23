# SPDX-FileCopyrightText: 2025 Giuseppe Peronato <gperonato@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
import http.server
import socketserver
import threading
import time
import warnings
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

PORT = 8001

@pytest.fixture(scope="module")
def start_http_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        time.sleep(2)  # Give server time to start
        yield
        httpd.shutdown()

@pytest.fixture(scope="module")
def browser():
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    driver = webdriver.Chrome(service=service, options=options)
    yield driver
    driver.quit()

def test_recipe_class(start_http_server, browser):
    # Run tests in test.js
    filename = "test.html"
    url = f"http://localhost:{PORT}/test/{filename}"
    browser.get(url)
    time.sleep(0.5)

    failures = [entry for entry in browser.get_log('browser') if entry is not None]
    for failure in failures:
        warnings.warn(UserWarning("{}".format(failure)))
    
    assert len(failures) == 0

def test_food_01(start_http_server, browser):
    # Check Tempeh CO2e and Calories
    filename = "index.html"
    url = f"http://localhost:{PORT}/{filename}?i=20917&q=1000&t=&p=0&"
    browser.get(url)
    time.sleep(0.5)

    soup = BeautifulSoup(browser.page_source, features="html.parser")
    table_footprint = soup.find('tbody', id='table-footprint')
    climate = [td for td in table_footprint.find_all('td') if 'kg CO2 eq' in td.text]
    
    table_nutrition = soup.find('tbody', id='table-nutritional')
    calories = [td for td in table_nutrition.find_all('td') if 'kcal' in td.text]
    
    assert len(climate) == 1
    assert climate[0].text == "2.37 kg CO2 eq"
    assert len(calories) == 1
    assert calories[0].text == "1570 kcal"

def test_energy_01(start_http_server, browser):
    # Check Natural Gas CO2e
    filename = "index.html"
    url = f"http://localhost:{PORT}/{filename}?i=20917&q=0&e=NGEU&t=60&p=1000&"
    browser.get(url)
    time.sleep(0.5)
    
    soup = BeautifulSoup(browser.page_source, features="html.parser")
    table_footprint = soup.find('tbody', id='table-footprint')
    climate = [td for td in table_footprint.find_all('td') if 'kg CO2 eq' in td.text]
    
    assert len(climate) == 1
    assert climate[0].text == "0.24 kg CO2 eq"
