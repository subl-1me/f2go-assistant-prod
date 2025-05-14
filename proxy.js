const express = require("express"); // For creating the server
const cors = require("cors"); // For handling CORS
const { HttpProxyAgent } = require("http-proxy-agent"); // For HTTP proxy support
const { HttpsProxyAgent } = require("https-proxy-agent"); // For HTTPS proxy support
const { SocksProxyAgent } = require("socks-proxy-agent"); // For SOCKS proxy support
const { CookieJar } = require("tough-cookie"); // For cookie management
const fetchBuilder = require("fetch-cookie").default; // For cookie handling with fetch
const fetch = require("node-fetch"); // For making HTTP requests
const url = require("url");

const app = express();
app.use(cors());
const PORT = 3000; // Port where your proxy server will listen

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

// --- Proxy Route ---

// Handle all HTTP methods for the /proxy endpoint
app.all("/proxy", async (req, res) => {
  const targetUrl = req.query.url; // Get the target URL from the query parameter

  if (!targetUrl) {
    return res.status(400).send('Error: Missing "url" query parameter.');
  }

  let agent = null;
  let usedProxy = null; // To log which proxy was used

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
  };

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
    const response = await fetchWithCookies(targetUrl, fetchOptions);

    // --- Forward the Response ---
    // Set the response status code
    res.status(response.status);

    console.log(response);

    // Copy headers from the target response to our response
    response.headers.forEach((value, name) => {
      // Again, filter potential hop-by-hop headers from target response
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
      if (!hopByHopHeaders.includes(name.toLowerCase())) {
        res.set(name, value);
      }
    });

    // Pipe the target response body stream to our client response stream
    response.body.pipe(res);

    // Handle errors during piping (e.g., client disconnect)
    response.body.on("error", (err) => {
      console.error(
        `[PROXY] Stream error piping response for ${targetUrl} via ${usedProxy}:`,
        err
      );
      if (!res.headersSent) {
        res.status(500).send("Internal Proxy Error: Response stream failed.");
      } else {
        req.socket.destroy(); // Force close the connection.
      }
    });
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
