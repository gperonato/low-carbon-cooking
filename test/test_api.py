# SPDX-FileCopyrightText: 2026 Giuseppe Peronato <gperonato@gmail.com>
# SPDX-License-Identifier: AGPL-3.0-or-later

import pytest
import subprocess
import time
import requests
import os

API_PORT = 8080
API_URL = f"http://localhost:{API_PORT}"
API_JS_PATH = os.path.join(os.path.dirname(__file__), '..', 'api.js')

@pytest.fixture(scope="module")
def start_api_server():
    """Start the Node.js API server for testing."""
    # Check if already running
    already_running = False
    try:
        requests.get(f"{API_URL}/health/", timeout=2)
        already_running = True
        print("API server already running, skipping start.")
    except Exception:
        pass

    if already_running:
        yield None
        return

    proc = subprocess.Popen(
        ["node", API_JS_PATH],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=os.path.join(os.path.dirname(__file__), '..'),
        env={**os.environ}
    )
    # Wait until server is ready (up to 15s)
    ready = False
    for _ in range(30):
        try:
            requests.get(f"{API_URL}/health/", timeout=1)
            ready = True
            break
        except Exception:
            time.sleep(0.5)

    if not ready:
        proc.terminate()
        stdout = proc.stdout.read().decode()
        stderr = proc.stderr.read().decode()
        pytest.fail(f"API server failed to start.\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}")

    yield proc
    proc.terminate()
    proc.wait()

def test_health(start_api_server):
    """Test that the health endpoint returns ok."""
    response = requests.get(f"{API_URL}/health", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data == {"status": "ok"}

def test_recipe_no_params(start_api_server):
    """Test that the API returns empty object when no ingredients provided."""
    response = requests.get(f"{API_URL}/recipe/", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data == {}

def test_recipe_returns_json(start_api_server):
    """Test that the API returns JSON content type."""
    response = requests.get(f"{API_URL}/recipe/", timeout=10)
    assert response.headers.get("Content-Type", "").startswith("application/json")

def test_recipe_climate_change(start_api_server):
    """Test that climate_change key is present in response with ingredient."""
    response = requests.get(
        f"{API_URL}/recipe/",
        params={"i": "20917", "q": "1000"},
        timeout=10
    )
    assert response.status_code == 200
    data = response.json()
    assert "climate_change" in data
    assert "value" in data["climate_change"]
    assert isinstance(data["climate_change"]["value"], (int, float))
    assert data["climate_change"]["value"] > 0
    assert data["climate_change"]["unit"] == "kg CO2 eq"
    assert data["climate_change"]["value"] == pytest.approx(2.37, abs=0.01)

def test_recipe_energy(start_api_server):
    """Test that energy_eu key is present in response with ingredient."""
    response = requests.get(
        f"{API_URL}/recipe/",
        params={"i": "20917", "q": "1000"},
        timeout=10
    )
    assert response.status_code == 200
    data = response.json()
    assert "energy_eu" in data
    assert "value" in data["energy_eu"]
    assert isinstance(data["energy_eu"]["value"], (int, float))
    assert data["energy_eu"]["value"] > 0
    assert data["energy_eu"]["unit"] == "kcal"
    assert data["energy_eu"]["value"] == pytest.approx(1570, abs=1)

def test_recipe_emission_cooking(start_api_server):
    """Test that cooking emissions are calculated when parameters provided."""
    response = requests.get(
        f"{API_URL}/recipe/",
        params={"i": "20917", "q": "0", "a": "I", "t": "60", "pl": "9"},
        timeout=10
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "climate_change" in data
    assert "value" in data["climate_change"]
    assert isinstance(data["climate_change"]["value"], (int, float))
    assert data["climate_change"]["value"] > 0
    assert data["climate_change"]["unit"] == "kg CO2 eq"
    # 420 g of CO2 eq/kWh, with 1800 W of power considered
    assert data["climate_change"]["value"] == pytest.approx(0.42*1.8, abs=0.01)

def test_recipe_full(start_api_server):
    """Test response values agains app."""
    response = requests.get(
        f"{API_URL}/recipe/",
        params={"i": ["9810", "20170"], "q": ["400", "40"], "a": "E", "t": "10", "pl": "6", "servings": "4"},
        timeout=10
    )
    # https://mycookprint.com/?i=9810&q=400&i=20170&q=40&a=E&t=10&pl=6&ot=&p=&servings=4&
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "climate_change" in data
    assert "value" in data["climate_change"]
    assert isinstance(data["climate_change"]["value"], (int, float))
    assert data["climate_change"]["value"] > 0
    assert data["climate_change"]["unit"] == "kg CO2 eq"
    assert data["climate_change"]["value"] == pytest.approx(0.23, abs=0.01)
    assert "energy_eu" in data
    assert "value" in data["energy_eu"]
    assert isinstance(data["energy_eu"]["value"], (int, float))
    assert data["energy_eu"]["value"] > 0
    assert data["energy_eu"]["unit"] == "kcal"
    assert data["energy_eu"]["value"] == pytest.approx(340.71, abs=1)
