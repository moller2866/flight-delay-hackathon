"""
Flight delay prediction service API.

Expose JSON endpoints that serve airport metadata and model predictions for flight delay probability.
"""

from __future__ import annotations

import os
import warnings
from pathlib import Path
from typing import Any, Dict, Tuple

import pandas as pd
from flask import Flask, jsonify, request
from flasgger import Swagger
from joblib import load

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "delay_probability_model.joblib"
AIRPORTS_PATH = ARTIFACTS_DIR / "airports_mapping.csv"

warnings.filterwarnings(
    "ignore",
    message="Trying to unpickle estimator",
    category=UserWarning,
)


SWAGGER_TEMPLATE: Dict[str, Any] = {
    "info": {
        "title": "Flight Delay Prediction API",
        "description": (
            "API for retrieving airport metadata and predicting the chance a flight "
            "will be delayed by more than 15 minutes."
        ),
        "version": "1.0.0",
    }
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/apispec_1.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
  "specs_route": "/docs/",
}


def load_model():
    """Load the trained scikit-learn pipeline used for delay predictions."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")
    return load(MODEL_PATH)


def load_airports() -> pd.DataFrame:
    """Load the airport metadata CSV into a DataFrame."""
    if not AIRPORTS_PATH.exists():
        raise FileNotFoundError(f"Airport mapping not found at {AIRPORTS_PATH}")
    return pd.read_csv(AIRPORTS_PATH)


DOW_NAME_MAP: Dict[int, str] = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
}


def create_app() -> Flask:
    """Application factory for the Flask API."""
    app = Flask(__name__)

    @app.after_request
    def after_request(response):
        """
        Enable CORS
        """
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        return response

    Swagger(app, template=SWAGGER_TEMPLATE, config=SWAGGER_CONFIG)

    # Defer artifact loading until the app is created so tests can patch as needed.
    app.config["DELAY_MODEL"] = load_model()
    airports_df = load_airports()
    app.config["AIRPORTS_DF"] = airports_df

    @app.get("/health")
    def health() -> Tuple[str, int]:
        """Health check
        ---
        responses:
          200:
            description: Service is healthy
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
        """
        return jsonify({"status": "ok"}), 200

    @app.get("/airports")
    def airports() -> Tuple[str, int]:
        """List airports
        ---
        responses:
          200:
            description: Sorted list of airports
            schema:
              type: object
              properties:
                count:
                  type: integer
                airports:
                  type: array
                  items:
                    type: object
                    properties:
                      airport_id:
                        type: integer
                        example: 12892
                      airport_name:
                        type: string
                        example: Los Angeles International
        """
        df = app.config["AIRPORTS_DF"]
        sorted_df = df.sort_values("airport_name")
        records = [
            {"airport_id": int(row.airport_id), "airport_name": row.airport_name}
            for row in sorted_df.itertuples(index=False)
        ]
        return jsonify({"airports": records, "count": len(records)}), 200

    @app.post("/prediction")
    def prediction() -> Tuple[str, int]:
        """Predict delay probability
        ---
        consumes:
          - application/json
        parameters:
          - in: body
            name: payload
            required: true
            schema:
              type: object
              required:
                - airport_id
                - day_of_week
              properties:
                airport_id:
                  type: integer
                  example: 12892
                day_of_week:
                  type: integer
                  minimum: 1
                  maximum: 7
                  example: 1
                carrier:
                  type: string
                  example: DL
                origin_airport_id:
                  type: integer
                  example: 15304
        responses:
          200:
            description: Delay prediction result
            schema:
              type: object
              properties:
                input:
                  type: object
                prediction:
                  type: string
                  enum: [delayed, on_time]
                delay_probability:
                  type: number
                  format: float
                delay_probability_percent:
                  type: number
                  format: float
                model_confidence_percent:
                  type: number
                  format: float
          400:
            description: Invalid request
            schema:
              type: object
              properties:
                errors:
                  type: object
        """

        payload = request.get_json(silent=True) or {}
        airport_id_raw = payload.get("airport_id")
        day_of_week_raw = payload.get("day_of_week")
        carrier = payload.get("carrier", "UNKNOWN")
        origin_airport_id_raw = payload.get("origin_airport_id", 0)

        errors = {}
        try:
            airport_id = int(airport_id_raw)
        except (TypeError, ValueError):
            airport_id = None
        if airport_id is None:
            errors["airport_id"] = "airport_id is required"
        try:
            day_of_week = int(day_of_week_raw)
        except (TypeError, ValueError):
            day_of_week = None
        if day_of_week is None:
            errors["day_of_week"] = "day_of_week is required"
        elif day_of_week not in DOW_NAME_MAP:
            errors["day_of_week"] = "day_of_week must be an integer between 1 and 7"

        try:
            origin_airport_id = int(origin_airport_id_raw)
        except (TypeError, ValueError):
            origin_airport_id = 0

        if errors:
            return jsonify({"errors": errors}), 400

        model = app.config["DELAY_MODEL"]
        features = pd.DataFrame(
            [
                {
                    "Carrier": carrier,
                    "OriginAirportID": origin_airport_id,
                    "DestAirportID": airport_id,
                    "DayOfWeekName": DOW_NAME_MAP[day_of_week],
                }
            ]
        )

        proba = model.predict_proba(features)[0]
        classes = list(getattr(model, "classes_", [0, 1]))
        try:
            delayed_index = classes.index(1)
        except ValueError:
            delayed_index = 1 if len(proba) > 1 else 0

        delay_probability = float(proba[delayed_index])
        confidence = float(max(delay_probability, 1 - delay_probability))
        prediction_label = "delayed" if delay_probability >= 0.5 else "on_time"

        return (
            jsonify(
                {
                    "input": {
                        "airport_id": airport_id,
                        "day_of_week": day_of_week,
                        "carrier": carrier,
                        "origin_airport_id": origin_airport_id,
                    },
                    "prediction": prediction_label,
                    "delay_probability": delay_probability,
                    "delay_probability_percent": delay_probability * 100,
                    "model_confidence_percent": confidence * 100,
                }
            ),
            200,
        )
    # Enable cors
    
    return app


app = create_app()



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
