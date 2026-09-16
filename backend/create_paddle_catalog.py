import os
import sys
import json
import urllib.request
import urllib.error

# Toggle this to "live" or "sandbox"
MODE = os.environ.get("PADDLE_MODE", "sandbox")

PADDLE_API_URL = (
    "https://sandbox-api.paddle.com" if MODE == "sandbox"
    else "https://api.paddle.com"
)

print(f"Target: {MODE.upper()} — {PADDLE_API_URL}\n")

# Plan configurations
PLANS = {
    "Pro": {
        "description": "Pro Plan",
        "tax_category": "standard",
        "prices": [
            {
                "description": "Pro Monthly",
                "interval": "month",
                "frequency": 1,
                "amount": "1500",
                "currency_code": "USD",
                "overrides": [
                    {"country_codes": ["GB"], "amount": "1200", "currency_code": "GBP"},
                    {"country_codes": ["IE"], "amount": "1400", "currency_code": "EUR"},
                    {"country_codes": ["AU"], "amount": "2200", "currency_code": "AUD"},
                ]
            },
            {
                "description": "Pro Annual",
                "interval": "year",
                "frequency": 1,
                "amount": "13000",
                "currency_code": "USD",
                "overrides": [
                    {"country_codes": ["GB"], "amount": "10500", "currency_code": "GBP"},
                    {"country_codes": ["IE"], "amount": "12000", "currency_code": "EUR"},
                    {"country_codes": ["AU"], "amount": "19500", "currency_code": "AUD"},
                ]
            }
        ]
    }
}

def make_request(method, endpoint, data=None, api_key=None):
    url = f"{PADDLE_API_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    req_data = None
    if data:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def main():
    api_key = os.environ.get("PADDLE_API_KEY")
    if not api_key:
        api_key = input("Please enter your Paddle live API key: ").strip()
    
    if not api_key:
        print("API key is required.")
        sys.exit(1)
        
    print("Connecting to Paddle API to create catalog...\n")
    
    created_items = []
    
    for plan_name, plan_data in PLANS.items():
        print(f"Creating Product: {plan_name}...")
        
        product_payload = {
            "name": plan_name,
            "description": plan_data["description"],
            "tax_category": plan_data["tax_category"]
        }
        
        product_res = make_request("POST", "/products", data=product_payload, api_key=api_key)
        product_id = product_res["data"]["id"]
        print(f"  -> Created Product ID: {product_id}")
        
        for price_data in plan_data["prices"]:
            print(f"  Creating Price: {price_data['description']}...")
            
            overrides = []
            for override in price_data["overrides"]:
                overrides.append({
                    "country_codes": override["country_codes"],
                    "unit_price": {
                        "amount": override["amount"],
                        "currency_code": override["currency_code"]
                    }
                })
            
            price_payload = {
                "description": price_data["description"],
                "product_id": product_id,
                "unit_price": {
                    "amount": price_data["amount"],
                    "currency_code": price_data["currency_code"]
                },
                "billing_cycle": {
                    "interval": price_data["interval"],
                    "frequency": price_data["frequency"]
                },
                "unit_price_overrides": overrides
            }
            
            price_res = make_request("POST", "/prices", data=price_payload, api_key=api_key)
            price_id = price_res["data"]["id"]
            print(f"    -> Created Price ID: {price_id}")
            
            created_items.append({
                "product_name": plan_name,
                "product_id": product_id,
                "price_description": price_data["description"],
                "price_id": price_id
            })

    print("\n\n--- SUMMARY OF CREATED ITEMS ---")
    for item in created_items:
        print(f"Plan: {item['product_name']} | {item['price_description']}")
        print(f"  Product ID: {item['product_id']}")
        print(f"  Price ID:   {item['price_id']}")
        print("-" * 30)

if __name__ == "__main__":
    main()
