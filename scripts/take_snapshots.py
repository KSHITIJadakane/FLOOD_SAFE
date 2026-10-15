"""
FloodSafe Automated High-Resolution Snapshot Generator
Captures crisp, presentation-ready 1920x1080 screenshots of all core UI views.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "snapshots"))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

BASE_URL = "http://localhost:8000"

PAGES = [
    {
        "name": "01_overview_dashboard.png",
        "hash": "#command",
        "wait_ms": 3500,
        "action": None,
    },
    {
        "name": "02_allocation_queue.png",
        "hash": "#queue",
        "wait_ms": 2500,
        "action": None,
    },
    {
        "name": "03_satellite_sar_explorer.png",
        "hash": "#satellite",
        "wait_ms": 3000,
        "action": None,
    },
    {
        "name": "04_cedar_auth_studio.png",
        "hash": "#cedar",
        "wait_ms": 2500,
        "action": None,
    },
    {
        "name": "05_optimizer_benchmarks.png",
        "hash": "#benchmark",
        "wait_ms": 2500,
        "action": None,
    },
    {
        "name": "06_standing_rules_safety.png",
        "hash": "#rules",
        "wait_ms": 2000,
        "action": None,
    },
]

def capture_snapshots():
    print(f"🚀 Starting FloodSafe Snapshot Engine...")
    print(f"📁 Destination folder: {SNAPSHOT_DIR}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        # Create high-DPI 1920x1080 viewport
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1.5,
        )
        page = context.new_page()

        for item in PAGES:
            target_url = f"{BASE_URL}/{item['hash']}"
            print(f"📸 Capturing: {item['name']} from {target_url}...")
            
            page.goto(target_url, wait_until="networkidle")
            page.wait_for_timeout(item["wait_ms"])
            
            output_path = os.path.join(SNAPSHOT_DIR, item["name"])
            page.screenshot(path=output_path, full_page=False)
            print(f"   ✅ Saved: {output_path} ({os.path.getsize(output_path) // 1024} KB)")

        # 07: What-If Tuning Drawer
        print("📸 Capturing: 07_what_if_tuning_drawer.png...")
        page.goto(f"{BASE_URL}/#command", wait_until="networkidle")
        page.wait_for_timeout(2000)
        # Open intelligence dropdown and click What-If
        page.click("button:has-text('Advanced Tools')")
        page.wait_for_timeout(600)
        page.click("button:has-text('What-If Weights')")
        page.wait_for_timeout(1200)
        out_7 = os.path.join(SNAPSHOT_DIR, "07_what_if_tuning_drawer.png")
        page.screenshot(path=out_7, full_page=False)
        print(f"   ✅ Saved: {out_7} ({os.path.getsize(out_7) // 1024} KB)")

        # 08: AI & Decision Inspector Modal
        print("📸 Capturing: 08_ai_decision_inspector.png...")
        page.goto(f"{BASE_URL}/#command", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.click("button:has-text('Advanced Tools')")
        page.wait_for_timeout(600)
        page.click("button:has-text('AI Decision Inspector')")
        page.wait_for_timeout(1200)
        out_8 = os.path.join(SNAPSHOT_DIR, "08_ai_decision_inspector.png")
        page.screenshot(path=out_8, full_page=False)
        print(f"   ✅ Saved: {out_8} ({os.path.getsize(out_8) // 1024} KB)")

        browser.close()
        print("\n✨ All snapshots successfully generated!")

if __name__ == "__main__":
    capture_snapshots()
