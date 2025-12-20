const specialFrontRequestUrls = ["Auditor/GetAuditReports"];

// Check if the URL matches any special front request patterns

function isSpecialFrontRequest(url) {
  return specialFrontRequestUrls.some((pattern) => url.includes(pattern));
}

function handleSpecialRequestHeaders(req, fetchOptions) {
  if (isSpecialFrontRequest(req.url)) {
    // Modify headers for special front requests

    fetchOptions.headers["RequestVerificationToken"] =
      req.headers["requestverificationtoken"] || "";
    fetchOptions.headers["referer"] =
      "https://front2go.whs-saas.com/F2goPMS/Auditor/NightAuditProcess/?PropCode=KFwHWn911eaVeJhL++adWg==&Cor_id=33";
    delete fetchOptions.headers["requestverificationtoken"]; // Will be set automatically if body is present
    fetchOptions.headers["origin"] = "https://front2go.whs-saas.com";
  }

  return fetchOptions;
}

module.exports = {
  handleSpecialRequestHeaders,
};
