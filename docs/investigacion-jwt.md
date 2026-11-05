# Investigación a Profundidad: Autenticación con JSON Web Tokens (JWT) en NexoEventos

**Proyecto:** NexoEventos — Plataforma Empresarial de Planificación de Eventos  
**Fecha:** Noviembre 2026  
**Autor:** Equipo de Desarrollo NexoEventos  
**Documento Académico de Referencia:** `Mini_Proyecto_1_Dia_2.pdf`  

---

## 1. ¿Qué es un JSON Web Token (JWT)?

Un **JSON Web Token (JWT)** es un estándar abierto definido formalmente en la especificación [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519). Define un formato compacto y autónomo (*self-contained*) para transmitir información de forma segura entre dos partes como un objeto JSON.

La característica fundamental de un JWT es que su autenticidad e integridad están garantizadas digitalmente mediante una firma criptográfica. Un JWT puede firmarse usando:
- Un secreto simétrico compartido mediante el algoritmo HMAC (por ejemplo, `HS256`, `HS384`, `HS512`).
- Un par de claves asimétricas pública/privada mediante RSA o ECDSA (por ejemplo, `RS256`, `ES256`).

Al ser autónomo, el token almacena en su propio contenido los datos de identidad requeridos (claims) del usuario, lo que permite a las arquitecturas de servicios verificar la sesión sin necesidad de consultar el almacenamiento central o la base de datos en cada petición subsecuente.

---

## 2. Anatomía de un JWT: Header, Payload y Signature

Un JWT serializado se representa como una cadena de texto formada por tres partes codificadas en Base64URL, separadas por puntos (`.`):

$$\text{JWT} = \text{Base64URL}(\text{Header}) \,.\, \text{Base64URL}(\text{Payload}) \,.\, \text{Signature}$$

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF91c3VhcmlvIjoxLCJyb2wiOiJhZG1pbmlzdHJhZG9yIn0.4aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
|________________ Header ______________| |_______________ Payload ________________| |___________ Signature __________|
```

### 2.1 Header (Encabezado)
El encabezado típicamente consta de dos partes: el tipo de token (`"typ": "JWT"`) y el algoritmo criptográfico utilizado para la firma (`"alg"`), como `HS256`.
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2.2 Payload (Carga Útil o Reclamos)
El cuerpo del token contiene las declaraciones o *claims* sobre el usuario y metadatos adicionales de la sesión. Los claims se clasifican en:
- **Registrados (Registered Claims):** Recomendados por la RFC 7519, tales como `sub` (subject/sujeto), `iss` (emisor), `aud` (audiencia), `exp` (fecha de expiración en segundos Unix), `nbf` (not before), e `iat` (issued at).
- **Públicos (Public Claims):** Declaraciones definidas por la aplicación registradas en la IANA o resistentes a colisiones.
- **Privados (Private Claims):** Declaraciones personalizadas creadas para compartir información entre partes acordadas (por ejemplo, `id_usuario`, `correo`, `rol`, `id_cliente`).

```json
{
  "id_usuario": 1,
  "nombre": "Administrador Principal",
  "correo": "admin@nexoeventos.com",
  "rol": "administrador",
  "id_cliente": null,
  "iat": 1793865600,
  "exp": 1793894400
}
```

### 2.3 Signature (Firma Digital)
Para generar la firma con algoritmos simétricos (HMAC-SHA256):
```
Signature = HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secretKey
)
```
La firma permite al receptor verificar que el emisor es quien dice ser y que el contenido del payload no ha sido alterado ni manipulado en tránsito por ningún intermediario.

---

## 3. Generación y Validación de Tokens en Node.js y Express

En el ecosistema Node.js, la biblioteca estándar de la industria es `jsonwebtoken` (Auth0).

### Generación en el proceso de Login:
```javascript
import jwt from 'jsonwebtoken';

export const generarToken = (usuario) => {
  const payload = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    id_cliente: usuario.id_cliente || null
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
};
```

### Verificación en Middleware:
```javascript
import jwt from 'jsonwebtoken';

export const verificarToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
```
Si la firma es inválida, el token ha expirado o la sintaxis es errónea, `jwt.verify` lanza excepciones específicas (`JsonWebTokenError`, `TokenExpiredError`), las cuales son capturadas para devolver un código HTTP 401 Unauthorized sin revelar información interna del servidor.

---

## 4. Expiración de Tokens

Todo JWT debe contar con un tiempo de caducidad explícito (`exp`). Un token sin expiración representa un riesgo de seguridad crítico, ya que si es interceptado por un tercero o filtrado, mantendría acceso permanente e indefinido.

- En entornos académicos y empresariales de oficina, un tiempo de vida (*Time-To-Live*, TTL) común es de 1 a 8 horas.
- En **NexoEventos**, se adopta un TTL de **8 horas** para la jornada administrativa de trabajo, configurable mediante la variable de entorno `JWT_EXPIRES_IN=8h`.

---

## 5. Refresh Tokens: Cuándo se Justifican y Cuándo No

Un esquema de doble token utiliza:
1. **Access Token:** Corta duración (15 a 30 minutos). Utilizado en cada petición HTTP para autorizar recursos.
2. **Refresh Token:** Larga duración (días o semanas). Almacenado de forma segura (por ejemplo, en cookie HTTP-Only con ruta restringida a `/api/auth/refresh`), utilizado exclusivamente para solicitar un nuevo Access Token cuando el anterior expira.

### Criterio de Justificación:
- **¿Cuándo es necesario?** En aplicaciones bancarias, móviles, arquitecturas de microservicios con cientos de miles de usuarios donde los Access Tokens deben revocarse rápidamente sin obligar al usuario a reintroducir sus credenciales constantemente.
- **¿Por qué NO sobrecargar NexoEventos con Refresh Tokens innecesarios?**
  Siguiendo el principio KISS (*Keep It Simple, Stupid*) y las directrices de la especificación académica de Día 2 ("No implementes refresh tokens solo por agregar complejidad"), NexoEventos utiliza una expiración directa y predecible de 8 horas para la sesión de trabajo. Si el token vence, el usuario es redirigido de forma transparente y controlada al login mediante el interceptor de peticiones de React.

---

## 6. ¿Qué Ocurre Cuando un Token Vence?

1. El frontend envía la petición al backend con el token expirado en la cabecera: `Authorization: Bearer <token_expirado>`.
2. El middleware `authMiddleware` ejecuta `jwt.verify(...)`.
3. `jsonwebtoken` detecta que el timestamp actual `Math.floor(Date.now() / 1000)` supera el claim `exp`, arrojando un `TokenExpiredError`.
4. El backend responde con:
   ```json
   {
     "success": false,
     "message": "Sesión expirada. Por favor inicie sesión nuevamente.",
     "error": "TokenExpired"
   }
   ```
   Acompañado de un código de estado HTTP **401 Unauthorized**.
5. El cliente React (en su servicio centralizado `api.js`) intercepta la respuesta 401, limpia el almacenamiento local (`localStorage.removeItem('nexoeventos_token')`), actualiza el `AuthContext` y redirige al usuario a la ruta `/login`.

---

## 7. Comparativa de Almacenamiento en el Frontend

| Criterio | `localStorage` | `sessionStorage` | Cookies `httpOnly` |
|---|---|---|---|
| **Persistencia** | Permanente hasta borrado explícito o expiración. Sobrevive a reinicios del navegador. | Se destruye al cerrar la pestaña o ventana actual. | Persiste según directiva `Max-Age` / `Expires`. |
| **Acceso desde JavaScript** | Sí (`window.localStorage`). | Sí (`window.sessionStorage`). | **No**. Inaccesible para scripts del cliente si tiene flag `HttpOnly`. |
| **Vulnerabilidad a XSS** | **Alta**: Cualquier script inyectado puede leer el token. | **Alta**: Cualquier script inyectado puede leer el token en la pestaña. | **Inmune a robo directo** mediante `document.cookie`. |
| **Vulnerabilidad a CSRF** | **Baja/Nula**: El navegador no envía automáticamente cabeceras `Authorization`. | **Baja/Nula**: Requiere extracción manual e inyección en cabeceras. | **Alta** si no se implementa flag `SameSite=Strict` o tokens anti-CSRF. |
| **Complejidad de Implementación** | Muy sencilla; estándar para SPAs y APIs desacopladas. | Muy sencilla; idéntica API a localStorage. | Mayor complejidad: requiere configuración de dominio, CORS credentials, sameSite, HTTPS. |

---

## 8. Riesgos de Seguridad: XSS y CSRF

### 8.1 Cross-Site Scripting (XSS)
- **Riesgo:** Un atacante logra inyectar código JavaScript malicioso en la aplicación (a través de datos no sanitizados en inputs, comentarios o URLs).
- **Impacto con localStorage:** El script malicioso ejecuta `localStorage.getItem('token')` y envía el JWT al servidor del atacante.
- **Mitigación en NexoEventos:**
  1. React previene inyecciones XSS por defecto al escapar automáticamente todo texto renderizado en JSX (`{variable}`).
  2. Nunca se utiliza `dangerouslySetInnerHTML`.
  3. Validación estricta y tipado de campos en el backend antes de guardar en MySQL.
  4. Cabeceras de seguridad HTTP básicas mediante Express.

### 8.2 Cross-Site Request Forgery (CSRF)
- **Riesgo:** Una página web maliciosa aprovecha la sesión activa del usuario en otro sitio para enviar peticiones no deseadas a través del navegador.
- **Impacto con Cabecera `Authorization: Bearer`:**
  Dado que el token no se almacena en cookies automáticas sino que se inyecta programáticamente en la cabecera `Authorization: Bearer <token>`, los navegadores **no adjuntan** automáticamente este encabezado en peticiones originadas desde dominios de terceros. Por lo tanto, el uso de tokens Bearer protege de forma nativa contra ataques CSRF.

---

## 9. Decisión de Diseño Adoptada para NexoEventos

Para NexoEventos se adopta la siguiente estrategia:
- **Almacenamiento:** `localStorage` (`nexoeventos_token` y `nexoeventos_user`).
- **Mecanismo de transmisión:** Cabecera HTTP `Authorization: Bearer <token>`.
- **Justificación:**
  1. Cumple a cabalidad con los requerimientos académicos del Día 2 y la arquitectura desacoplada SPA (Vite + React en puerto 5173 / Backend Express en puerto 5000).
  2. Ofrece protección nativa contra ataques CSRF transdominio sin requerir complejas configuraciones de cookies de terceros que fallan en entornos locales o de desarrollo sin SSL/HTTPS.
  3. La protección contra XSS se garantiza mediante el motor de escapado automático de React y la sanitización rigurosa de entradas en Node.js.
  4. Si el token vence o la API retorna 401, el cliente borra las claves de `localStorage` y finaliza la sesión de manera determinística.

---

## 10. Implementación del Middleware en Express

El middleware `authMiddleware.js` se encarga de:
1. Extraer la cabecera `Authorization`.
2. Validar que comience con el prefijo `Bearer `.
3. Verificar la firma y la fecha de expiración con `jwt.verify(token, process.env.JWT_SECRET)`.
4. Consultar la existencia del usuario en la base de datos para asegurar que no haya sido eliminado después de emitir el token.
5. Inyectar `req.user` en el objeto de la petición con sus propiedades (`id_usuario`, `rol`, `id_cliente`, `correo`).
6. Si la verificación falla, responder de inmediato con HTTP 401 y un mensaje descriptivo en formato JSON.

---

## 11. Envío del Token desde el Frontend React

En el frontend, se centraliza la comunicación en `src/services/api.js`.
- Se crea una función de petición o cliente HTTP común.
- Antes de cada llamada, se obtiene el token desde `localStorage.getItem('nexoeventos_token')`.
- Si el token existe, se añade la cabecera:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
  ```
- Si la respuesta del servidor es HTTP 401:
  - Se remueve el token de `localStorage`.
  - Se notifica al `AuthContext`.
  - Se redirige al usuario a la página de login (`/login`).

---

## 12. Uso Obligatorio de HTTPS en Producción

En entornos de producción, el uso de HTTPS (TLS/SSL) es **mandatorio**:
- En HTTP plano, las cabeceras viajan en texto claro por la red. Cualquier intermediario (sniffing de red, Wi-Fi público, proxies intermediarios) podría capturar el token y suplantar la identidad del usuario.
- Con HTTPS, toda la capa HTTP (incluyendo URL, cabeceras `Authorization` y cuerpo JSON) viaja cifrada de extremo a extremo entre el cliente y el servidor.

---

## 13. Manejo Seguro del Secreto (`JWT_SECRET`)

- La clave secreta debe ser una cadena aleatoria de alta entropía (mínimo 256 bits).
- **Regla estricta:** La clave secreta **nunca** se escribe en código fuente (*hardcoded*).
- Se almacena exclusivamente en variables de entorno del servidor mediante el archivo `.env`.
- El archivo `.env` está expresamente excluido del repositorio mediante `.gitignore`.
- Se proporciona una plantilla `.env.example` para documentar la variable sin exponer secretos reales.

---

## 14. Buenas Prácticas: Qué Datos NO Incluir en el Payload

**Principio fundamental:** El Payload de un JWT está codificado en Base64URL, **no cifrado**. Cualquier persona que intercepte o posea el token puede decodificarlo y leer su contenido de forma inmediata.

### ❌ Datos que NUNCA deben incluirse:
- Contraseñas o hashes de contraseñas (bcrypt).
- Números de tarjetas de crédito o datos bancarios.
- Claves privadas, secretos de APIs o tokens de servicios externos.
- Información médica o identificaciones nacionales sensibles no requeridas para la sesión.

### ✔ Datos correctos y seguros:
- Identificador único del usuario (`id_usuario`).
- Rol del usuario (`administrador`, `supervisor`, `cliente`).
- Correo electrónico y nombre para visualización.
- Identificador de cliente asociado (`id_cliente`).
- Timestamps de emisión (`iat`) y expiración (`exp`).

---

## 15. Referencias y Fuentes Consultadas

1. **RFC 7519 — JSON Web Token (JWT):**  
   Jones, M., Bradley, J., & Sakimura, N. (2015). *Internet Engineering Task Force (IETF)*. [https://datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)
2. **OWASP — JSON Web Token Cheat Sheet for Java/Node:**  
   Open Web Application Security Project (OWASP). *JWT Security Best Practices*. [https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
3. **OWASP — Cross-Site Scripting (XSS) Prevention Cheat Sheet:**  
   [https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
4. **Auth0 — Introduction to JSON Web Tokens:**  
   Auth0 by Okta. [https://auth0.com/docs/secure/tokens/json-web-tokens](https://auth0.com/docs/secure/tokens/json-web-tokens)
5. **Node.js `jsonwebtoken` Documentation:**  
   [https://github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
6. **MDN Web Docs — HTTP Authentication & Bearer Scheme:**  
   Mozilla Developer Network. [https://developer.mozilla.org/es/docs/Web/HTTP/Authentication](https://developer.mozilla.org/es/docs/Web/HTTP/Authentication)

