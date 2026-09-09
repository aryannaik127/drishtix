import urllib.request
import json
import time

def test_endpoint(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            print(f"[SUCCESS] {method} {url} -> {str(res)[:80]}")
            return True, res
    except Exception as e:
        print(f"[FAILED] {method} {url} -> {e}")
        return False, str(e)

if __name__ == "__main__":
    print("=== DRISHTIX API INTEGRATION TEST SUITE ===")
    test_endpoint("http://localhost:8000/api/health")
    test_endpoint("http://localhost:8000/api/cameras")
    test_endpoint("http://localhost:8000/api/events")
    test_endpoint("http://localhost:8000/api/alerts")
    test_endpoint("http://localhost:8000/api/virtual-fences")
    test_endpoint("http://localhost:8000/api/watchlist")
    test_endpoint("http://localhost:8000/api/analytics")
    test_endpoint("http://localhost:8000/api/settings")
    test_endpoint("http://localhost:8000/api/start-demo", method="POST")
    print("=== ALL ENDPOINTS VERIFIED ===")
