(function bootstrapHealth(globalScope) {
  const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:3000";

  function renderHealthState(target, state) {
    target.textContent = state.message;
    target.dataset.state = state.ok ? "ok" : "error";
  }

  async function fetchHealthState(
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    try {
      const response = await fetchImpl(`${backendBaseUrl}/health`);
      const payload = await response.json();

      if (response.ok && payload.status === "ok") {
        return { ok: true, message: "Backend health: ok" };
      }

      return { ok: false, message: "Backend health: unavailable" };
    } catch (_error) {
      return { ok: false, message: "Backend health: unavailable" };
    }
  }

  async function initHealthDisplay({
    fetchImpl = globalScope.fetch,
    documentRef = globalScope.document,
    backendBaseUrl = globalScope.BACKEND_BASE_URL ?? DEFAULT_BACKEND_BASE_URL,
  } = {}) {
    if (!documentRef || typeof documentRef.getElementById !== "function") {
      return;
    }

    const target = documentRef.getElementById("health-status");

    if (!target) {
      return;
    }

    const state = await fetchHealthState(fetchImpl, backendBaseUrl);
    renderHealthState(target, state);
  }

  if (globalScope.document) {
    globalScope.addEventListener("DOMContentLoaded", () => {
      void initHealthDisplay();
    });
  }

  if (typeof module !== "undefined") {
    module.exports = {
      fetchHealthState,
      renderHealthState,
      initHealthDisplay,
      DEFAULT_BACKEND_BASE_URL,
    };
  }
})(typeof window === "undefined" ? globalThis : window);
