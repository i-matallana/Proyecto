from patchright.sync_api import sync_playwright
import time
import random

def human_delay(min_sec=0.3, max_sec=0.8):
    time.sleep(random.uniform(min_sec, max_sec))

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        channel="chrome",
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-popup-blocking',
            '--no-sandbox',
        ]
    )
    context = browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport={'width': 1280, 'height': 720},
        locale='es-ES',
        timezone_id='America/Bogota'
    )
    page = context.new_page()
    
    print("🌐 Cargando página...")
    page.goto("https://www.adres.gov.co/consulte-su-eps", wait_until="networkidle")
    human_delay(2, 3)
    
    # Buscar iframe
    target_frame = None
    for frame in page.frames:
        if frame.locator("#txtNumDoc").count() > 0:
            target_frame = frame
            break
    if not target_frame:
        print("❌ No se encontró iframe")
        exit(1)
    
    # Rellenar documento
    target_frame.fill("#txtNumDoc", "22800789", force=True)
    print("📝 Documento ingresado")
    human_delay(0.5, 1)
    
    # *** TRUCO CLAVE: Inyectar código para forzar el envío ***
    # 1. Verificar que reCAPTCHA esté cargado
    recaptcha_ready = target_frame.evaluate("""
        () => {
            return typeof grecaptcha !== 'undefined' && grecaptcha.ready;
        }
    """)
    print(f"🔐 reCAPTCHA listo: {recaptcha_ready}")
    
    if not recaptcha_ready:
        print("⚠️ reCAPTCHA no detectado. Esperando carga...")
        human_delay(3, 5)
    
    # 2. Ejecutar el envío manualmente usando JavaScript
    #    Esto fuerza la ejecución de setRecaptchaToken y luego el postback
    result = target_frame.evaluate("""
        async () => {
            try {
                // Obtener el botón
                const btn = document.getElementById('btnConsultar');
                if (!btn) return 'Botón no encontrado';
                
                // Crear un evento simulado para pasar a setRecaptchaToken
                const fakeEvent = { preventDefault: () => {} };
                
                // Llamar a la función setRecaptchaToken (si existe)
                if (typeof setRecaptchaToken === 'function') {
                    await setRecaptchaToken(fakeEvent);
                } else {
                    return 'setRecaptchaToken no está definida';
                }
                
                // Una vez generado el token (o si falla, igual intentamos postback)
                // Forzar el postback manualmente
                if (typeof WebForm_DoPostBackWithOptions === 'function') {
                    WebForm_DoPostBackWithOptions(new WebForm_PostBackOptions('btnConsultar', '', true, '', '', false, false));
                    return 'Postback ejecutado mediante WebForm_DoPostBackWithOptions';
                } else if (typeof __doPostBack === 'function') {
                    __doPostBack('btnConsultar', '');
                    return 'Postback ejecutado mediante __doPostBack';
                } else {
                    // Último recurso: clic nativo
                    btn.click();
                    return 'Clic nativo disparado';
                }
            } catch(e) {
                return 'Error: ' + e.toString();
            }
        }
    """)
    print(f"🚀 Resultado de inyección: {result}")
    
    # Esperar a que aparezca la nueva ventana (popup)
    try:
        with context.expect_page(timeout=15000) as popup_info:
            pass
        popup = popup_info.value
        print("✨ Ventana emergente detectada")
        popup.wait_for_load_state("networkidle")
        contenido = popup.content()
        with open("resultado_forced.html", "w", encoding="utf-8") as f:
            f.write(contenido)
        print("💾 Resultado guardado")
    except:
        print("❌ No se abrió ventana. Revisa el HTML de la página principal después del intento.")
        with open("post_click.html", "w", encoding="utf-8") as f:
            f.write(page.content())
    
    input("Presiona Enter para cerrar...")
    browser.close()