(function bootstrapApp(globalScope) {
  const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:3000";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderHealthState(target, state) {
    if (!target) {
      return;
    }

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

  function formatLatestResult(check) {
    const result = check?.latestResult;

    if (!result) {
      return "No result yet";
    }

    if (result.ok) {
      return `Up (${result.httpStatus ?? "HTTP ok"})`;
    }

    return result.error ?? `Down (${result.httpStatus ?? "request failed"})`;
  }

  function renderCheckList(target, checks) {
    if (!target) {
      return;
    }

    const items = (Array.isArray(checks) ? checks : []).map((check) => {
      const latest = formatLatestResult(check);
      const label = check.paused ? "Paused" : "Running";

      return `
        <li class="check-item" data-check-id="${escapeHtml(check.id)}">
          <div class="check-header">
            <strong>${escapeHtml(check.name)}</strong>
            <span class="check-status">${escapeHtml(label)}</span>
          </div>
          <div class="check-meta">${escapeHtml(check.url)} · every ${escapeHtml(check.intervalSeconds)}s</div>
          <div class="check-result">Latest: ${escapeHtml(latest)}</div>
          <div class="check-actions">
            <button type="button" data-action="run" data-check-id="${escapeHtml(check.id)}">Run now</button>
            <button type="button" data-action="toggle" data-check-id="${escapeHtml(check.id)}">${check.paused ? "Resume" : "Pause"}</button>
            <button type="button" data-action="delete" data-check-id="${escapeHtml(check.id)}">Delete</button>
          </div>
        </li>
      `;
    });

    target.innerHTML = items.length > 0 ? items.join("") : '<li class="empty-state">No uptime checks configured yet.</li>';
  }

  async function fetchChecks(
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    const response = await fetchImpl(`${backendBaseUrl}/checks`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to load uptime checks");
    }

    return Array.isArray(payload?.checks) ? payload.checks : [];
  }

  async function createCheck(
    input,
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    const response = await fetchImpl(`${backendBaseUrl}/checks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to create uptime check");
    }

    return payload.check;
  }

  async function updateCheck(
    id,
    changes,
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    const response = await fetchImpl(`${backendBaseUrl}/checks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to update uptime check");
    }

    return payload.check;
  }

  async function deleteCheck(
    id,
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    const response = await fetchImpl(`${backendBaseUrl}/checks/${id}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error ?? "Unable to delete uptime check");
    }

    return true;
  }

  async function runCheck(
    id,
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    const response = await fetchImpl(`${backendBaseUrl}/checks/${id}/run`, {
      method: "POST",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to run uptime check");
    }

    return payload;
  }

  async function fetchCheckResult(
    id,
    fetchImpl = globalScope.fetch,
    backendBaseUrl = DEFAULT_BACKEND_BASE_URL,
  ) {
    const response = await fetchImpl(`${backendBaseUrl}/checks/${id}/result`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to read uptime check result");
    }

    return payload.result;
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

  async function initUptimeChecks({
    fetchImpl = globalScope.fetch,
    documentRef = globalScope.document,
    backendBaseUrl = globalScope.BACKEND_BASE_URL ?? DEFAULT_BACKEND_BASE_URL,
  } = {}) {
    if (!documentRef || typeof documentRef.getElementById !== "function") {
      return;
    }

    const listNode = documentRef.getElementById("checks-list");
    const statusNode = documentRef.getElementById("checks-status");
    const formNode = documentRef.getElementById("check-form");

    if (!listNode) {
      return;
    }

    const updateList = async () => {
      try {
        const checks = await fetchChecks(fetchImpl, backendBaseUrl);
        renderCheckList(listNode, checks);

        if (statusNode) {
          statusNode.textContent =
            checks.length > 0
              ? `Showing ${checks.length} uptime checks. In-memory only; results reset on restart.`
              : "No uptime checks configured yet. In-memory only; checks reset on restart.";
          statusNode.dataset.state = checks.length > 0 ? "ok" : "idle";
        }
      } catch (error) {
        renderCheckList(listNode, []);

        if (statusNode) {
          statusNode.textContent = error.message || "Unable to load uptime checks.";
          statusNode.dataset.state = "error";
        }
      }
    };

    const onListClick = async (event) => {
      const button = event.target.closest("button[data-action]");

      if (!button) {
        return;
      }

      const { action, checkId } = button.dataset;

      if (!checkId) {
        return;
      }

      try {
        if (action === "delete") {
          await deleteCheck(checkId, fetchImpl, backendBaseUrl);
        } else if (action === "toggle") {
          const checks = await fetchChecks(fetchImpl, backendBaseUrl);
          const check = checks.find((entry) => String(entry.id) === String(checkId));

          if (check) {
            await updateCheck(checkId, { paused: !check.paused }, fetchImpl, backendBaseUrl);
          }
        } else if (action === "run") {
          await runCheck(checkId, fetchImpl, backendBaseUrl);
        }

        await updateList();
      } catch (error) {
        if (statusNode) {
          statusNode.textContent = error.message || "Unable to update uptime check.";
          statusNode.dataset.state = "error";
        }
      }
    };

    if (listNode && !listNode.dataset.boundListClick) {
      listNode.addEventListener("click", onListClick);
      listNode.dataset.boundListClick = "true";
    }

    if (formNode && !formNode.dataset.boundSubmit) {
      formNode.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(formNode);
        const payload = {
          name: String(formData.get("name") ?? "").trim(),
          url: String(formData.get("url") ?? "").trim(),
          intervalSeconds: Number.parseInt(String(formData.get("intervalSeconds") ?? "60"), 10),
          paused: formData.get("paused") === "on",
        };

        try {
          await createCheck(payload, fetchImpl, backendBaseUrl);
          formNode.reset();
          const intervalInput = documentRef.getElementById("check-interval");

          if (intervalInput) {
            intervalInput.value = "60";
          }

          await updateList();
        } catch (error) {
          if (statusNode) {
            statusNode.textContent = error.message || "Unable to create uptime check.";
            statusNode.dataset.state = "error";
          }
        }
      });
      formNode.dataset.boundSubmit = "true";
    }

    const refreshButton = documentRef.getElementById("refresh-checks");

    if (refreshButton && !refreshButton.dataset.boundRefresh) {
      refreshButton.addEventListener("click", updateList);
      refreshButton.dataset.boundRefresh = "true";
    }

    await updateList();
  }

  if (globalScope.document) {
    globalScope.addEventListener("DOMContentLoaded", () => {
      void initHealthDisplay();
      void initUptimeChecks();
    });
  }

  if (typeof module !== "undefined") {
    module.exports = {
      DEFAULT_BACKEND_BASE_URL,
      createCheck,
      deleteCheck,
      fetchCheckResult,
      fetchChecks,
      fetchHealthState,
      formatLatestResult,
      initHealthDisplay,
      initUptimeChecks,
      renderCheckList,
      renderHealthState,
      runCheck,
      updateCheck,
    };
  }
})(typeof window === "undefined" ? globalThis : window);
