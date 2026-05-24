"""debug_adres2.py — Find submit button and test popup opening."""
from playwright.sync_api import sync_playwright

ADRES_URL = "https://www.adres.gov.co/consulte-su-eps"

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="es-CO", viewport={"width": 1280, "height": 900},
        )
        ctx.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = ctx.new_page()
        page.goto(ADRES_URL, wait_until="networkidle", timeout=45_000)
        page.wait_for_timeout(3_000)

        # Get the specific frame
        frame = next((f for f in page.frames if "aplicaciones.adres.gov.co" in (f.url or "")), None)
        if not frame:
            print("ERROR: form frame not found")
            browser.close()
            return

        print(f"Found frame: {frame.url}")

        # Dump full HTML of the form frame
        html = frame.content()
        print(f"\nFrame HTML (first 3000 chars):\n{html[:3000]}")

        # Find all buttons/inputs in the frame
        all_els = frame.locator("input, button, a[href*='#']").all()
        print(f"\nAll interactive elements ({len(all_els)}):")
        for i, el in enumerate(all_els[:15]):
            try:
                attrs = {}
                for attr in ["id", "name", "type", "value", "class", "href"]:
                    v = el.get_attribute(attr)
                    if v:
                        attrs[attr] = v[:40]
                print(f"  [{i}] {attrs}")
            except Exception as e:
                print(f"  [{i}] ERROR: {e}")

        browser.close()

if __name__ == "__main__":
    main()
