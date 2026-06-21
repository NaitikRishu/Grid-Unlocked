const express = require("express");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
const { fastApiBaseUrl } = require("../config");

const router = express.Router();

router.use(
  "/",
  createProxyMiddleware({
    target: fastApiBaseUrl,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
    proxyTimeout: 15000,
    onProxyReq: fixRequestBody,
    onError(err, req, res) {
      res.status(502).json({
        error: "fastapi_unreachable",
        message: "Gridlock API backend is not reachable.",
        detail: err.message,
      });
    },
  }),
);

module.exports = router;
