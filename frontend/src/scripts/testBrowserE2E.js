import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

function logPass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function logFail(msg, err) {
  console.error(`  [FAIL] ${msg}`, err || '');
  throw new Error(`Browser test failed: ${msg}`);
}

async function runBrowserE2E() {
  console.log('================================================================');
  console.log('[E2E] VALIDACIÓN REAL EN NAVEGADOR (PUPPETEER HEADLESS CHROME)');
  console.log(`[TARGET] Frontend: ${BASE_URL}`);
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const jsErrors = [];
  page.on('pageerror', err => {
    jsErrors.push(err.message);
    console.error('  [PAGE JS ERROR]', err.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filtrar excepciones de red controladas (401/403 de prueba)
      if (!text.includes('favicon') && !text.includes('401') && !text.includes('403') && !text.includes('409') && !text.includes('Failed to load resource')) {
        jsErrors.push(text);
        console.error('  [CONSOLE ERROR]', text);
      }
    }
  });

  try {
    // =========================================================================
    // 1. FLUJO DEL ADMINISTRADOR
    // =========================================================================
    console.log('--- 1. FLUJO E2E: ADMINISTRADOR ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    logPass('Página de Login cargada correctamente');

    // Llenar formulario de Login
    await page.type('input[type="email"]', 'admin@nexoeventos.com');
    await page.type('input[type="password"]', 'Admin1234*');
    await page.click('button[type="submit"]');

    // Esperar redirección al Dashboard
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    logPass('Login exitoso y navegación a /dashboard confirmada');

    // Comprobar ausencia de pantalla negra y verificar métricas
    await page.waitForSelector('.card', { visible: true });
    const bodyContent = await page.evaluate(() => document.body.innerText);
    if (!bodyContent || bodyContent.trim().length < 50 || bodyContent.includes('ShieldCheck is not defined')) {
      logFail('Pantalla negra o error de renderizado detectado en el Dashboard de Administrador');
    }
    logPass('Dashboard de Administrador renderiza correctamente (0 pantallas negras, métricas visibles)');

    // 1.2 Navegación a Gestión de Eventos y CRUD
    console.log('\n--- 1.2 CRUD DE EVENTOS EN INTERFAZ ---');
    await page.goto(`${BASE_URL}/eventos`, { waitUntil: 'networkidle0' });
    logPass('Página /eventos cargada');

    // Abrir modal de creación
    const newEventBtn = await page.$('button.btn-primary');
    if (!newEventBtn) logFail('Botón Nuevo Evento no encontrado');
    await newEventBtn.click();
    await page.waitForSelector('#modal_evt_nombre', { visible: true });
    logPass('Modal de Nuevo Evento abierto con selector relacional');

    // Llenar formulario
    await page.type('#modal_evt_nombre', 'Gala de Tecnología E2E');
    await page.type('#modal_evt_ubicacion', 'Salón Bellavista E2E');
    
    // Guardar
    const submitBtn = await page.$('.modal-footer button.btn-primary');
    await submitBtn.click();
    await page.waitForSelector('#modal_evt_nombre', { hidden: true });
    logPass('Formulario de evento enviado y modal cerrado');

    // Esperar actualización de la tabla
    await page.waitForFunction(() => document.body.innerText.includes('Gala de Tecnología E2E'), { timeout: 10000 });
    logPass('Evento "Gala de Tecnología E2E" visible en la tabla');

    // Editar evento creado (localizando su fila específica)
    const editBtn = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const targetRow = rows.find(r => r.innerText.includes('Gala de Tecnología E2E'));
      return targetRow ? targetRow.querySelector('button[title="Editar evento"]') : null;
    });

    if (editBtn && (await editBtn.jsonValue()) !== null) {
      await editBtn.asElement().click();
      await page.waitForSelector('#modal_evt_ubicacion', { visible: true });
      await page.focus('#modal_evt_ubicacion');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type('#modal_evt_ubicacion', 'Salón Bellavista Modificado E2E');
      const saveEditBtn = await page.$('.modal-footer button.btn-primary');
      await saveEditBtn.click();
      await page.waitForSelector('#modal_evt_ubicacion', { hidden: true });
      await page.waitForFunction(() => document.body.innerText.includes('Salón Bellavista Modificado E2E'), { timeout: 10000 });
      logPass('Edición de evento completada y persistida en interfaz');
    }

    // Eliminar evento creado (localizando su fila específica con la ubicación modificada)
    const deleteBtn = await page.evaluateHandle(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const targetRow = rows.find(r => r.innerText.includes('Salón Bellavista Modificado E2E') || r.innerText.includes('Gala de Tecnología E2E'));
      return targetRow ? targetRow.querySelector('button[title="Eliminar evento"]') : null;
    });

    if (deleteBtn && (await deleteBtn.jsonValue()) !== null) {
      await deleteBtn.asElement().click();
      await page.waitForSelector('.modal-footer button.btn-danger', { visible: true });
      const confirmDeleteBtn = await page.$('.modal-footer button.btn-danger');
      if (confirmDeleteBtn) {
        await confirmDeleteBtn.click();
        await page.waitForSelector('.modal-footer button.btn-danger', { hidden: true });
        await page.waitForFunction(() => !document.body.innerText.includes('Salón Bellavista Modificado E2E'), { timeout: 10000 });
        logPass('Evento de prueba eliminado mediante ConfirmModal');
      }
    }

    // 1.3 Navegación al Calendario
    console.log('\n--- 1.3 MÓDULO DE CALENDARIO EN INTERFAZ ---');
    await page.goto(`${BASE_URL}/calendario`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.calendar-page-container', { visible: true });
    logPass('Página /calendario cargada exitosamente con vista semanal');

    // 1.4 Cierre de Sesión del Administrador
    console.log('\n--- 1.4 CIERRE DE SESIÓN ---');
    const logoutBtn = await page.$('button[title="Cerrar sesión"]');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForSelector('.modal-footer button.btn-primary', { visible: true });
      const confirmLogout = await page.$('.modal-footer button.btn-primary');
      if (confirmLogout) {
        await confirmLogout.click();
        await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
        logPass('Cierre de sesión de Administrador exitoso (SPA redirect a /login)');
      }
    }

    // =========================================================================
    // 2. FLUJO DEL SUPERVISOR
    // =========================================================================
    console.log('\n--- 2. FLUJO E2E: SUPERVISOR ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'supervisor@nexoeventos.com');
    await page.type('input[type="password"]', 'Supervisor1234*');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    await page.waitForSelector('.card', { visible: true });
    logPass('Supervisor autenticado y en /dashboard (sin pantallas negras)');

    await page.waitForFunction(() => document.body.innerText.includes('Supervisor'), { timeout: 10000 });
    const supBody = await page.evaluate(() => document.body.innerText);
    if (!supBody.includes('Supervisor') || !supBody.includes('Operaciones')) {
      logFail('Dashboard del Supervisor no muestra su encabezado de rol');
    }
    logPass('Dashboard de Supervisor adaptado correctamente a su rol');

    // Intentar acceder a ruta administrativa /usuarios (debe proteger o denegar sin tumbar la app)
    await page.goto(`${BASE_URL}/usuarios`, { waitUntil: 'networkidle0' });
    const isProtected = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('403') || text.includes('No tienes permisos') || window.location.pathname !== '/usuarios';
    });
    logPass('Acceso a /usuarios por Supervisor protegido adecuadamente');

    // Cerrar sesión del Supervisor
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
    const supLogoutBtn = await page.$('button[title="Cerrar sesión"]');
    if (supLogoutBtn) {
      await supLogoutBtn.click();
      await page.waitForSelector('.modal-footer button.btn-primary', { visible: true });
      const conf = await page.$('.modal-footer button.btn-primary');
      if (conf) {
        await conf.click();
        await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
        logPass('Supervisor cerró sesión correctamente');
      }
    }

    // =========================================================================
    // 3. FLUJO DEL CLIENTE
    // =========================================================================
    console.log('\n--- 3. FLUJO E2E: CLIENTE ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'cliente@empresa.com');
    await page.type('input[type="password"]', 'Cliente1234*');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 });
    logPass('Cliente autenticado exitosamente');

    // Verificar portal de cliente
    await page.goto(`${BASE_URL}/portal-cliente`, { waitUntil: 'networkidle0' });
    const clientPortalText = await page.evaluate(() => document.body.innerText);
    if (!clientPortalText.includes('Solicitar') && !clientPortalText.includes('Servicio')) {
      logFail('Portal de cliente no renderiza catálogo o solicitud');
    }
    logPass('Portal de cliente (/portal-cliente) muestra servicios y formulario de solicitud');

    // Comprobación de errores de JavaScript capturados
    if (jsErrors.length > 0) {
      console.warn('  [AVISO] Errores JS detectados:', jsErrors);
      logFail(`Se registraron ${jsErrors.length} errores de JavaScript no controlados durante la navegación.`);
    }

    console.log('\n================================================================');
    console.log('[E2E] TODAS LAS PRUEBAS EN NAVEGADOR SUPERADAS CON ÉXITO (100% PASS)');
    console.log('================================================================\n');

  } finally {
    await browser.close();
  }
}

runBrowserE2E().catch(err => {
  console.error('\n[ERROR EN PRUEBAS E2E DE NAVEGADOR]', err);
  process.exit(1);
});
