VEHICLE = {
    "make": "Hyundai",
    "model": "Creta",
    "category": "SUV",
    "price": 1500000,
    "quantity": 5,
}


def add_vehicle(client, headers, **overrides):
    return client.post("/api/vehicles", json={**VEHICLE, **overrides}, headers=headers)


class TestAuthRequired:
    def test_list_requires_token(self, client):
        assert client.get("/api/vehicles").status_code == 401

    def test_create_requires_token(self, client):
        assert client.post("/api/vehicles", json=VEHICLE).status_code == 401

    def test_purchase_requires_token(self, client):
        assert client.post("/api/vehicles/1/purchase").status_code == 401

    def test_invalid_token_is_rejected(self, client):
        headers = {"Authorization": "Bearer not-a-real-token"}
        assert client.get("/api/vehicles", headers=headers).status_code == 401


class TestCreateVehicle:
    def test_create_returns_201_with_unique_id(self, client, user_headers):
        first = add_vehicle(client, user_headers)
        second = add_vehicle(client, user_headers, model="Venue")
        assert first.status_code == 201
        assert first.json()["make"] == "Hyundai"
        assert first.json()["id"] != second.json()["id"]

    def test_negative_price_returns_422(self, client, user_headers):
        assert add_vehicle(client, user_headers, price=-1).status_code == 422

    def test_zero_price_returns_422(self, client, user_headers):
        assert add_vehicle(client, user_headers, price=0).status_code == 422

    def test_negative_quantity_returns_422(self, client, user_headers):
        assert add_vehicle(client, user_headers, quantity=-1).status_code == 422

    def test_empty_make_returns_422(self, client, user_headers):
        assert add_vehicle(client, user_headers, make="").status_code == 422

    def test_missing_field_returns_422(self, client, user_headers):
        payload = {k: v for k, v in VEHICLE.items() if k != "model"}
        response = client.post("/api/vehicles", json=payload, headers=user_headers)
        assert response.status_code == 422


class TestListVehicles:
    def test_empty_list(self, client, user_headers):
        response = client.get("/api/vehicles", headers=user_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_list_includes_out_of_stock_vehicles(self, client, user_headers):
        add_vehicle(client, user_headers, quantity=0)
        add_vehicle(client, user_headers, model="Venue")
        response = client.get("/api/vehicles", headers=user_headers)
        assert len(response.json()) == 2


class TestSearchVehicles:
    def _seed(self, client, headers):
        add_vehicle(client, headers)  # Hyundai Creta SUV 1,500,000
        add_vehicle(client, headers, make="Tata", model="Nexon", price=1000000)
        add_vehicle(client, headers, make="Tata", model="Tiago", category="Hatchback", price=600000)

    def _models(self, response):
        return sorted(v["model"] for v in response.json())

    def test_search_by_make_is_case_insensitive(self, client, user_headers):
        self._seed(client, user_headers)
        response = client.get("/api/vehicles/search?make=tata", headers=user_headers)
        assert self._models(response) == ["Nexon", "Tiago"]

    def test_search_by_model(self, client, user_headers):
        self._seed(client, user_headers)
        response = client.get("/api/vehicles/search?model=Creta", headers=user_headers)
        assert self._models(response) == ["Creta"]

    def test_search_by_category(self, client, user_headers):
        self._seed(client, user_headers)
        response = client.get("/api/vehicles/search?category=Hatchback", headers=user_headers)
        assert self._models(response) == ["Tiago"]

    def test_search_by_price_range(self, client, user_headers):
        self._seed(client, user_headers)
        response = client.get(
            "/api/vehicles/search?min_price=700000&max_price=1200000", headers=user_headers
        )
        assert self._models(response) == ["Nexon"]

    def test_search_combines_filters(self, client, user_headers):
        self._seed(client, user_headers)
        response = client.get(
            "/api/vehicles/search?make=Tata&max_price=800000", headers=user_headers
        )
        assert self._models(response) == ["Tiago"]

    def test_search_with_no_match_returns_empty_list(self, client, user_headers):
        self._seed(client, user_headers)
        response = client.get("/api/vehicles/search?make=Ferrari", headers=user_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_search_requires_token(self, client):
        assert client.get("/api/vehicles/search?make=Tata").status_code == 401


class TestUpdateVehicle:
    def test_update_changes_fields(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers).json()["id"]
        updated = {**VEHICLE, "price": 1400000, "quantity": 9}
        response = client.put(f"/api/vehicles/{vehicle_id}", json=updated, headers=user_headers)
        assert response.status_code == 200
        assert response.json()["price"] == 1400000
        assert response.json()["quantity"] == 9

    def test_update_missing_vehicle_returns_404(self, client, user_headers):
        response = client.put("/api/vehicles/999", json=VEHICLE, headers=user_headers)
        assert response.status_code == 404

    def test_update_with_invalid_data_returns_422(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers).json()["id"]
        response = client.put(
            f"/api/vehicles/{vehicle_id}", json={**VEHICLE, "price": -5}, headers=user_headers
        )
        assert response.status_code == 422


class TestDeleteVehicle:
    def test_regular_user_cannot_delete(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers).json()["id"]
        response = client.delete(f"/api/vehicles/{vehicle_id}", headers=user_headers)
        assert response.status_code == 403

    def test_admin_can_delete(self, client, admin_headers):
        vehicle_id = add_vehicle(client, admin_headers).json()["id"]
        response = client.delete(f"/api/vehicles/{vehicle_id}", headers=admin_headers)
        assert response.status_code == 204
        assert client.get("/api/vehicles", headers=admin_headers).json() == []

    def test_delete_missing_vehicle_returns_404(self, client, admin_headers):
        assert client.delete("/api/vehicles/999", headers=admin_headers).status_code == 404


class TestPurchase:
    def test_purchase_decreases_quantity_by_one(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers, quantity=3).json()["id"]
        response = client.post(f"/api/vehicles/{vehicle_id}/purchase", headers=user_headers)
        assert response.status_code == 200
        assert response.json()["quantity"] == 2

    def test_cannot_purchase_when_out_of_stock(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers, quantity=0).json()["id"]
        response = client.post(f"/api/vehicles/{vehicle_id}/purchase", headers=user_headers)
        assert response.status_code == 409

    def test_last_unit_can_be_purchased_once_only(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers, quantity=1).json()["id"]
        first = client.post(f"/api/vehicles/{vehicle_id}/purchase", headers=user_headers)
        second = client.post(f"/api/vehicles/{vehicle_id}/purchase", headers=user_headers)
        assert first.json()["quantity"] == 0
        assert second.status_code == 409

    def test_purchase_missing_vehicle_returns_404(self, client, user_headers):
        assert client.post("/api/vehicles/999/purchase", headers=user_headers).status_code == 404


class TestRestock:
    def test_admin_can_restock(self, client, admin_headers):
        vehicle_id = add_vehicle(client, admin_headers, quantity=2).json()["id"]
        response = client.post(
            f"/api/vehicles/{vehicle_id}/restock", json={"quantity": 10}, headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["quantity"] == 12

    def test_regular_user_cannot_restock(self, client, user_headers):
        vehicle_id = add_vehicle(client, user_headers).json()["id"]
        response = client.post(
            f"/api/vehicles/{vehicle_id}/restock", json={"quantity": 10}, headers=user_headers
        )
        assert response.status_code == 403

    def test_restock_amount_must_be_positive(self, client, admin_headers):
        vehicle_id = add_vehicle(client, admin_headers).json()["id"]
        response = client.post(
            f"/api/vehicles/{vehicle_id}/restock", json={"quantity": 0}, headers=admin_headers
        )
        assert response.status_code == 422

    def test_restock_missing_vehicle_returns_404(self, client, admin_headers):
        response = client.post(
            "/api/vehicles/999/restock", json={"quantity": 5}, headers=admin_headers
        )
        assert response.status_code == 404