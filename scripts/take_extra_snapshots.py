"""
FloodSafe Snapshot Generator - Captures AI Inspector & Navigation Dropdowns
"""

import os
import sys
from playwright.sync_api import sync_playwright

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "snapshots"))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

BASE_URL = "http://localhost:8000"

def capture_extra_snapshots():
    print("Capturing remaining snapshots...")
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=1.5,
        )
        page = context.new_page()

        # 08: AI & Decision Inspector Modal
        print("Capturing: 08_ai_decision_inspector.png...")
        page.goto(f"{BASE_URL}/#command", wait_until="networkidle")
        page.wait_for_timeout(2500)
        
        # Click on Advanced Tools dropdown
        adv_btn = page.locator("button:has-text('Advanced Tools')")
        adv_btn.wait_for(state="visible")
        adv_btn.click()
        page.wait_for_timeout(800)
        
        # Click AI Decision Inspector
        insp_btn = page.locator("button:has-text('AI Decision Inspector')")
        insp_btn.wait_for(state="visible")
        insp_btn.click()
        page.wait_for_timeout(1500)
        
        out_8 = os.path.join(SNAPSHOT_DIR, "08_ai_decision_inspector.png")
        page.screenshot(path=out_8, full_page=False)
        print(f"Saved: {out_8} ({os.path.getsize(out_8) // 1024} KB)")

        # 09: Navigation Intelligence Dropdown Open
        print("Capturing: 09_navigation_intelligence_dropdown.png...")
        page.goto(f"{BASE_URL}/#command", wait_until="networkidle")
        page.wait_for_timeout(2000)
        
        intel_btn = page.locator("button:has-text('INTELLIGENCE')")
        intel_btn.wait_for(state="visible")
        intel_btn.click()
        page.wait_for_timeout(800)
        
        out_9 = os.path.join(SNAPSHOT_DIR, "09_navigation_intelligence_dropdown.png")
        page.screenshot(path=out_9, full_page=False)
        print(f"Saved: {out_9} ({os.path.getsize(out_9) // 1024} KB)")

        browser.close()
        print("Done!")

if __name__ == "__main__":
    capture_extra_snapshots()
