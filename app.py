import os
import json
import shutil
from flask import Flask, jsonify, request, send_from_directory, abort
from functools import wraps
import data_loader

app = Flask(__name__, static_folder="static")

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config")
os.makedirs(CONFIG_DIR, exist_ok=True)
KEY_PRODUCTS_FILE = os.path.join(CONFIG_DIR, "key_products.json")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

EDIT_PASSWORD = os.environ.get("EDIT_PASSWORD", "admin123")


def require_edit(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("X-Edit-Password", "")
        if auth != EDIT_PASSWORD:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


def _load_key_products():
    if not os.path.exists(KEY_PRODUCTS_FILE):
        return {
            "wechat": ["雪肌精", "ONE BY KOSE", "DECORTE"],
            "novarca": ["雪肌精", "ONE BY KOSE", "DECORTE"],
        }
    with open(KEY_PRODUCTS_FILE) as f:
        return json.load(f)


def _save_key_products(data):
    with open(KEY_PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/analytics/<store>")
def analytics(store):
    if store not in ("wechat", "novarca"):
        abort(400)
    try:
        data = data_loader.get_analytics(store)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/key_products/<store>")
def key_products_get(store):
    if store not in ("wechat", "novarca"):
        abort(400)
    kp = _load_key_products()
    keywords = kp.get(store, [])
    data = data_loader.get_key_product_data(store, keywords)
    months = data_loader.get_store_df(store)["yyyymm"].sort_values().unique().tolist()
    return jsonify({
        "keywords": keywords,
        "data": data,
        "months": [str(m) for m in months],
    })


@app.route("/api/key_products/<store>", methods=["POST"])
@require_edit
def key_products_set(store):
    if store not in ("wechat", "novarca"):
        abort(400)
    body = request.get_json()
    keywords = body.get("keywords", [])
    kp = _load_key_products()
    kp[store] = keywords
    _save_key_products(kp)
    data = data_loader.get_key_product_data(store, keywords)
    months = data_loader.get_store_df(store)["yyyymm"].sort_values().unique().tolist()
    return jsonify({
        "keywords": keywords,
        "data": data,
        "months": [str(m) for m in months],
    })


@app.route("/api/upload/<store>", methods=["POST"])
@require_edit
def upload(store):
    if store not in ("wechat", "novarca"):
        abort(400)
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    f = request.files["file"]
    fname = f.filename.lower()
    year = request.form.get("year", "")
    if not year:
        return jsonify({"error": "year required"}), 400

    dest = os.path.join(DATA_DIR, f"{store}_{year}.xlsx")
    f.save(dest)
    data_loader.invalidate_cache()
    return jsonify({"status": "ok", "file": dest})


@app.route("/api/brands/<store>")
def brands(store):
    if store not in ("wechat", "novarca"):
        abort(400)
    df = data_loader.get_store_df(store)
    return jsonify(sorted(df["brand"].unique().tolist()))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
