"""
debug_adres.py — Inspects all frames and form elements on ADRES page.
Run: python debug_adres.py
"""
import base64
from playwright.sync_api import sync_playwright

ADRES_URL = "https://www.adres.gov.co/consulte-su-eps"


def scr(page_or_frame, path="debug_scr.png"):
    try:
        data = page_or_frame.screenshot(type="png")
        with open(path, "wb") as f:
            f.write(data)
        print(f"  [screenshot saved: {path}]")
    except Exception as e:
        print(f"  [screenshot failed: {e}]")


def inspect_frame(frame, label=""):
    url = frame.url if hasattr(frame, "url") else "main"
    print(f"\n{'='*60}")
    print(f"  FRAME: {label or url}")
    print(f"  URL:   {url}")

    # All select elements
    try:
        selects = frame.locator("select").all()
        print(f"  Selects ({len(selects)}):")
        for i, sel in enumerate(selects[:5]):
            try:
                el_id   = sel.get_attribute("id") or ""
                el_name = sel.get_attribute("name") or ""
                el_class = sel.get_attribute("class") or ""
                opts = sel.locator("option").all_text_contents()[:6]
                print(f"    [{i}] id={el_id!r}  name={el_name!r}  class={el_class[:40]!r}")
                print(f"         options={opts}")
            except Exception as ex:
                print(f"    [{i}] ERROR: {ex}")
    except Exception as e:
        print(f"  Selects ERROR: {e}")

    # All text/number inputs
    try:
        inputs = frame.locator("input[type='text'], input[type='number'], input:not([type])").all()
        print(f"  Inputs ({len(inputs)}):")
        for i, inp in enumerate(inputs[:8]):
            try:
                el_id    = inp.get_attribute("id") or ""
                el_name  = inp.get_attribute("name") or ""
                el_type  = inp.get_attribute("type") or ""
                el_ph    = inp.get_attribute("placeholder") or ""
                el_class = inp.get_attribute("class") or ""
                print(f"    [{i}] id={el_id!r}  name={el_name!r}  type={el_type!r}  ph={el_ph!r}  class={el_class[:40]!r}")
            except Exception as ex:
                print(f"    [{i}] ERROR: {ex}")
    except Exception as e:
        print(f"  Inputs ERROR: {e}")

    # Buttons/submit elements
    try:
        btns = frame.locator("button, input[type='submit'], input[type='button']").all()
        print(f"  Buttons ({len(btns)}):")
        for i, btn in enumerate(btns[:5]):
            try:
                el_id    = btn.get_attribute("id") or ""
                el_val   = btn.get_attribute("value") or ""
                el_text  = btn.inner_text().strip()[:30] if btn.tag_name() != "input" else ""
                el_type  = btn.get_attribute("type") or ""
                print(f"    [{i}] id={el_id!r}  value={el_val!r}  text={el_text!r}  type={el_type!r}")
            except Exception as ex:
                print(f"    [{i}] ERROR: {ex}")
    except Exception as e:
        print(f"  Buttons ERROR: {e}")


def main():
    print("Starting ADRES frame inspection...")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
            slow_mo=100,
        )
        ctx = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="es-CO",
            viewport={"width": 1280, "height": 900},
            java_script_enabled=True,
        )
        # Mask webdriver
        ctx.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        page = ctx.new_page()
        print(f"Navigating to {ADRES_URL}...")
        page.goto(ADRES_URL, wait_until="networkidle", timeout=45_000)
        page.wait_for_timeout(4_000)

        scr(page, "debug_1_loaded.png")

        # List all frames
        all_frames = page.frames
        print(f"\nTotal frames: {len(all_frames)}")
        for i, f in enumerate(all_frames):
            print(f"  Frame[{i}]: {f.url}")

        # Inspect each frame
        inspect_frame(page, "main page")
        for i, frame in enumerate(all_frames):
            if frame.url and frame.url not in ("about:blank", page.url, ""):
                inspect_frame(frame, f"iframe[{i}]")

        # Try to fill the form in whichever frame has both elements
        print("\n\nAttempting form fill...")
        filled = False
        for frame in [page] + list(all_frames):
            if not frame.url or frame.url == "about:blank":
                continue
            try:
                sel_count = frame.locator("select").count()
                inp_count = frame.locator("input[type='text'], input[type='number'], input:not([type])").count()
                if sel_count > 0 and inp_count > 0:
                    print(f"\n  Trying frame: {frame.url}")
                    # Try to fill numero
                    inp = frame.locator("input[type='text'], input[type='number'], input:not([type])").first
                    print(f"  Filling input with '1043974773'...")
                    inp.click()
                    inp.fill("1043974773")
                    page.wait_for_timeout(500)
                    val = inp.input_value()
                    print(f"  Value after fill: {val!r}")
                    if val:
                        filled = True
                        scr(page, "debug_2_filled.png")
                        print("  Fill succeeded!")
                        break
            except Exception as e:
                print(f"  Frame error: {e}")

        if not filled:
            print("\n  Fill failed in all frames. Trying JS injection on main page...")
            try:
                page.evaluate("""
                    () => {
                        const inputs = document.querySelectorAll('input');
                        inputs.forEach(el => {
                            console.log('input:', el.id, el.name, el.type, el.offsetParent);
                        });
                        const selects = document.querySelectorAll('select');
                        selects.forEach(el => {
                            console.log('select:', el.id, el.name);
                        });
                        // also check iframes
                        const iframes = document.querySelectorAll('iframe');
                        iframes.forEach(el => {
                            console.log('iframe:', el.src, el.id);
                        });
                    }
                """)
                # Print JS console
                page.evaluate("() => { window._debug_done = true; }")
            except Exception as e:
                print(f"  JS error: {e}")

            # Try evaluate on all iframes
            try:
                iframe_info = page.evaluate("""
                    () => {
                        const iframes = Array.from(document.querySelectorAll('iframe'));
                        return iframes.map(f => ({
                            src: f.src,
                            id: f.id,
                            name: f.name,
                            width: f.width,
                            height: f.height,
                        }));
                    }
                """)
                print(f"\n  iframes found via JS: {iframe_info}")
            except Exception as e:
                print(f"  iframe JS error: {e}")

        browser.close()
        print("\nDone.")


if __name__ == "__main__":
    main()
