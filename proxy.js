const express = require("express"); // For creating the server
const cors = require("cors"); // For handling CORS
const { HttpProxyAgent } = require("http-proxy-agent"); // For HTTP proxy support
const { HttpsProxyAgent } = require("https-proxy-agent"); // For HTTPS proxy support
const { SocksProxyAgent } = require("socks-proxy-agent"); // For SOCKS proxy support
const { CookieJar } = require("tough-cookie"); // For cookie management
const fetchBuilder = require("fetch-cookie").default; // For cookie handling with fetch
const fetch = require("node-fetch"); // For making HTTP requests
const url = require("url");
const path = require("path");
const { mkdirp } = require("mkdirp");
const fs = require("fs");

const app = express();
app.use(
  cors({
    origin: "http://localhost:4200", // Replace with your frontend origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    // exposedHeaders: ["set-cookie", "x-extracted-cookies"], // Expose custom headers to the client
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:4200"); // Reemplaza con tu origen frontend
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "set-cookie");

  next();
});
app.use("/download", express.json());
const PORT = 3000; // Port where your proxy server will listen
const MAX_REDIRECTS = 5;
const DOWNLOADED_DOCUMENTS_PATH = path.join(
  __dirname,
  "temp",
  "downloaded-documents"
);

let redirectCount = 0; // Counter for redirects

// --- Configuration ---
const proxyList = ["socks://127.0.0.1:9150"]; // Tor proxy
let currentProxyIndex = 0;
const cookieJar = new CookieJar();

/**
 * Gets the next proxy URL in the rotation.
 * @returns {string | null} The next proxy URL, or null if no proxies are configured.
 */
const getNextProxy = () => {
  if (proxyList.length === 0) {
    return null; // No proxies available
  }
  const proxy = proxyList[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxyList.length; // Rotate
  return proxy;
};

/**
 * Creates the appropriate agent based on the proxy URL protocol.
 * @param {string} proxyUrl - The URL of the proxy (e.g., 'http://host:port', 'socks://host:port').
 * @returns {http.Agent | https.Agent | null} The agent instance, or null if protocol is unsupported or no proxy URL provided.
 */
const createAgent = (proxyUrl) => {
  if (!proxyUrl) {
    return null; // No proxy URL provided, use default agent (direct connection)
  }

  try {
    const parsedProxy = url.parse(proxyUrl);

    switch (parsedProxy.protocol) {
      case "http:":
        return new HttpProxyAgent({ proxy: proxyUrl });
      case "https:":
        return new HttpsProxyAgent({ proxy: proxyUrl });
      case "socks:":
      case "socks4:":
      case "socks4a:":
      case "socks5:":
      case "socks5h:": // socks-proxy-agent supports various socks protocols
        return new SocksProxyAgent(proxyUrl);
      default:
        console.warn(
          `[PROXY] Unsupported proxy protocol: ${parsedProxy.protocol} for ${proxyUrl}`
        );
        return null; // Unsupported protocol
    }
  } catch (error) {
    console.error(
      `[PROXY] Error parsing or creating agent for proxy ${proxyUrl}:`,
      error
    );
    return null; // Error creating agent
  }
};

// Create a fetch instance that automatically handles cookies
const fetchWithCookies = fetchBuilder(fetch, cookieJar);

// --- Express Middleware ---

// Middleware to parse raw request body (needed for forwarding POST/PUT bodies)
// Adjust limit as needed based on expected request sizes
app.use(express.raw({ type: "*/*", limit: "10mb" }));

// proxy
let agent = null;
let usedProxy = null; // To log which proxy was used
let cookiesArray = []; // array to hold cookies from responses

// Handle all HTTP methods for the /proxy endpoint
app.all("/proxy", async (req, res) => {
  const targetUrl = req.query.url; // Get the target URL from the query parameter

  if (!targetUrl) {
    return res.status(400).send('Error: Missing "url" query parameter.');
  }

  // Select the next proxy and create its agent
  const proxyUrl = getNextProxy();
  if (proxyUrl) {
    agent = createAgent(proxyUrl);
    usedProxy = proxyUrl;
    if (!agent) {
      // If agent creation failed, log and potentially rotate again or return error
      console.error(
        `[PROXY] Failed to create agent for proxy: ${proxyUrl}. Skipping this proxy.`
      );
      // For this example, we'll just proceed without an agent (direct connection)
      // or you could implement retry logic to try the next proxy.
      usedProxy = "DIRECT (Proxy creation failed)";
    }
  } else {
    console.warn(
      "[PROXY] No proxies configured in the list. Using direct connection."
    );
    usedProxy = "DIRECT (No proxies configured)";
  }

  // --- Prepare Fetch Options ---
  const fetchOptions = {
    method: req.method, // Use the incoming request method
    headers: { ...req.headers }, // Copy incoming request headers
    agent: agent, // Use the created proxy agent
    compress: false, // Don't ask target to compress, we'll just pipe the raw response
    redirect: "manual", // Don't follow redirects automatically, let the client handle them
    timeout: 60000,
  };

  let currentUrl = targetUrl; // Start with the target URL

  // Explicitly remove headers that shouldn't be forwarded directly
  delete fetchOptions.headers.host; // node-fetch sets this based on the target URL
  // Remove common hop-by-hop headers (though node-fetch/agents handle some)
  const hopByHopHeaders = [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
  ];
  hopByHopHeaders.forEach((header) => delete fetchOptions.headers[header]);

  // Include the request body for methods that have one
  if (req.method !== "GET" && req.method !== "HEAD") {
    // req.body contains the raw buffer from express.raw()
    fetchOptions.body = req.body;
    // node-fetch will set Content-Length based on the body buffer
    // If the original request had Content-Length, it was copied in headers initially
  }

  console.log(`[PROXY] ${req.method} ${targetUrl} via ${usedProxy}`);

  // --- Make the Request ---
  try {
    let response;
    while (redirectCount < MAX_REDIRECTS) {
      response = await fetchWithCookies(currentUrl, fetchOptions);

      if (response.status === 302) {
        const location = response.headers.get("location");

        if (response.body) {
          try {
            await response.buffer();
            console.log(
              `[PROXY] Consumed body of 302 response from ${currentUrl}`
            );
          } catch (e) {
            console.warn(
              `[PROXY] Failed to consume body of 302 response from ${currentUrl}:`,
              e
            );
          }
        }

        if (!location) {
          console.warn(
            `[PROXY] Received 302 redirect for ${currentUrl} but no Location header. Treating as final response.`
          );
          // Si es 302 pero sin Location, lo tratamos como una respuesta final no-302
          break; // Salir del bucle, reenviar esta respuesta 302 al cliente
        }

        // Verificar límite de redirecciones ANTES de seguir
        if (redirectCount >= MAX_REDIRECTS) {
          console.warn(
            `[PROXY] Reached maximum redirects (${MAX_REDIRECTS}) while following 302 from ${currentUrl} to ${location}. Stopping.`
          );
          // Salir del bucle, la variable 'response' contendrá la última respuesta 302
          break;
        }

        console.log(
          `[PROXY] Following redirect (${response.status}) from ${targetUrl} to ${location}`
        );

        // *** RESOLVER LA URL DE REDIRECCIÓN   ***
        // Usa url.resolve para manejar URLs relativas correctamente
        const redirectCookies = response.headers.get("set-cookie");
        if (redirectCookies) {
          cookiesArray.push(redirectCookies);

          fetchOptions.headers = {
            ...fetchOptions.headers,
            Cookie: redirectCookies, // Envía cookies al nuevo destino
          };
        }
        try {
          currentUrl = url.resolve(currentUrl, location);
        } catch (e) {
          console.error(
            `[PROXY] Error resolving redirect URL ${location} from ${currentUrl}:`,
            e
          );
          // Si la URL de redirección es inválida, abortar la petición
          throw new Error(`Invalid redirect URL received: ${location}`);
        }

        // *** AJUSTAR MÉTODO Y BODY PARA LA SIGUIENTE PETICIÓN (después de un 302) ***
        // Según el estándar, 302 a menudo implica cambiar el método a GET para la siguiente petición.
        currentMethod = "GET";
        // currentBody = undefined; // Las peticiones GET no tienen cuerpo

        // Incrementa el contador local de redirecciones seguidas
        redirectCount++;

        // El bucle continuará a la siguiente iteración con la nueva currentUrl, método y body.
      } else {
        // --- No es un estado 302 (puede ser 200, 404, 500, 301, 307, 308, etc.) ---
        // Esta es la respuesta final que queremos enviar al cliente.
        console.log(
          `[PROXY] Received non-302 status ${response.status} for ${currentUrl}. This is the final response to forward.`
        );
        break; // Salir del bucle
      }
    }

    // --- Después del Bucle: Reenviar la Respuesta FINAL al Cliente ---
    // La variable 'response' contiene la respuesta que rompió el bucle
    // (el destino final si no fue 302, o el último 302 si se alcanzó el límite).

    // Si salimos del bucle por límite de redirecciones y la última fue 302
    if (redirectCount > MAX_REDIRECTS && response.status === 302) {
      console.warn(
        `[PROXY] Loop exited after ${MAX_REDIRECTS} redirects, last status was still 302. Returning last 302 response to client.`
      );
      // No necesitamos hacer nada extra aquí, el código de abajo reenviará la 'response' (que es la última 302)
    }

    // Establece el código de estado de la respuesta final
    res.status(response.status);

    // Copia los encabezados de la respuesta final al cliente
    // (excluyendo los hop-by-hop ya filtrados)
    response.headers.forEach((value, name) => {
      const hopByHopHeaders = [
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
      ]; // Asegúrate de tener la lista completa si es necesario
      if (!hopByHopHeaders.includes(name.toLowerCase())) {
        res.set(name, value);
      }
    });

    // Modifica esta parte donde procesas la respuesta final
    const contentType = response.headers.get("content-type") || "";

    // Manejo de cookies (siempre extraerlas aunque la respuesta sea HTML)
    const cookies = response.headers.get("set-cookie");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Expose-Headers", "set-cookie");
    if (cookies) {
      // const concatenatedCookies =
      //   ";" + cookiesArray.map((item) => item.cookies).join(", ");
      res.setHeader("X-Extracted-Cookies", cookies.replace(/httponly/gi, ""));
    }
    if (cookiesArray.length > 0) {
      res.setHeader(
        "X-Extracted-Cookies",
        cookiesArray.join("; ").replace(/httponly/gi, "")
      );
    }

    res.setHeader(
      "Access-Control-Expose-Headers",
      "set-cookie, x-extracted-cookies"
    );
    // Determinar el tipo de respuesta
    if (contentType.includes("application/json")) {
      const jsonData = await response.json();
      console.log(jsonData);
      res.status(response.status).json(jsonData);
    } else {
      if (response.body) {
        response.body.pipe(res);

        // Maneja errores durante el streaming del body (ej. cliente desconectado)
        response.body.on("error", (err) => {
          console.error(
            `[PROXY] Stream error piping final response for ${currentUrl}:`,
            err
          );
          // Si los encabezados ya se enviaron, no podemos enviar un nuevo error HTTP
          if (!res.headersSent) {
            res
              .status(500)
              .send("Internal Proxy Error: Final response stream failed.");
          } else {
            console.warn(
              "[PROXY] Headers already sent when stream error occurred. Destroying socket."
            );
            req.socket.destroy(); // Fuerza el cierre de la conexión
          }
        });
      } else {
        // No hay cuerpo de respuesta (ej. 204 No Content, HEAD, 304 Not Modified)
        res.end();
      }
    }

    // // Reenvía el cuerpo de la respuesta final usando pipe para eficiencia
    // if (response.body) {
    //   response.body.pipe(res);

    //   // Maneja errores durante el streaming del body (ej. cliente desconectado)
    //   response.body.on("error", (err) => {
    //     console.error(
    //       `[PROXY] Stream error piping final response for ${currentUrl}:`,
    //       err
    //     );
    //     // Si los encabezados ya se enviaron, no podemos enviar un nuevo error HTTP
    //     if (!res.headersSent) {
    //       res
    //         .status(500)
    //         .send("Internal Proxy Error: Final response stream failed.");
    //     } else {
    //       console.warn(
    //         "[PROXY] Headers already sent when stream error occurred. Destroying socket."
    //       );
    //       req.socket.destroy(); // Fuerza el cierre de la conexión
    //     }
    //   });
    // } else {
    //   // No hay cuerpo de respuesta (ej. 204 No Content, HEAD, 304 Not Modified)
    //   res.end();
    // }
  } catch (error) {
    console.error(
      `[PROXY] Error fetching ${targetUrl} via ${usedProxy}:`,
      error
    );

    // Send an error response back to the client
    if (!res.headersSent) {
      // If headers haven't been sent yet, send a proper error status
      res
        .status(502)
        .send(
          `Gateway Timeout or Error: Could not reach target ${targetUrl} via proxy ${usedProxy}. Error: ${error.message}`
        );
    } else {
      // If headers were sent, we can't change the status code.
      // The response stream is likely broken. Log and terminate the connection.
      req.socket.destroy(); // Force close the connection.
    }
  }
});

app.post("/download", express.json(), async (req, res) => {
  const targetUrl = req.query.url;
  console.log(
    `[PROXY] Recieving a request to download a file: ${targetUrl} via ${usedProxy}`
  );

  if (!targetUrl) {
    return res.status(400).send('Error: Missing "url" query parameter.');
  }

  // --- Make the Request ---
  try {
    const { fileName } = req.body;
    console.log(fileName);
    const fullPath = path.join(DOWNLOADED_DOCUMENTS_PATH, fileName + ".pdf");
    const proxyUrl = getNextProxy();
    const agent = proxyUrl ? createAgent(proxyUrl) : null;

    await mkdirp(DOWNLOADED_DOCUMENTS_PATH);

    // Configuración de la petición
    const fetchOptions = {
      method: "POST",
      agent,
      redirect: "follow",
      timeout: 30000,
    };

    console.log(
      `[DOWNLOAD] Starting download from ${targetUrl} to ${fullPath}`
    );

    const response = await fetchWithCookies(targetUrl, fetchOptions);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const fileStream = fs.createWriteStream(fullPath);

    // Pipe del body de la respuesta al archivo
    response.body.pipe(fileStream);

    // Manejar eventos del stream
    return new Promise((resolve, reject) => {
      fileStream.on("finish", () => {
        console.log(`[DOWNLOAD] File saved successfully: ${fullPath}`);
        res.json({
          success: true,
          path: fullPath,
          size: fs.statSync(fullPath).size,
        });
        resolve();
      });

      fileStream.on("error", (err) => {
        console.error(`[DOWNLOAD] Error saving file: ${err}`);
        res
          .status(500)
          .json({ error: "Error saving file", details: err.message });
        reject(err);
      });
    });
  } catch (error) {
    console.error(`[DOWNLOAD] Error downloading file: ${error}`);
    res.status(500).json({
      error: "Download failed",
      details: error.message,
    });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
  console.log(
    `Proxies configured: ${
      proxyList.length > 0 ? proxyList.join(", ") : "None"
    }`
  );
  console.log(
    `Make request on: http://localhost:${PORT}/proxy?url=<TARGET_URL>`
  );
});
