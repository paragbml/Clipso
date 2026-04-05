const toastEl = document.getElementById("toast");
const DEFAULT_API_BASE = "https://clipso-backend.onrender.com/v1";

function normalizeApiBase(input) {
    const base = (input || DEFAULT_API_BASE).trim().replace(/\/$/, "");
    if (base.endsWith("/v1")) return base;
    return `${base}/v1`;
}

function getApiBase() {
    const urlApi = new URLSearchParams(window.location.search).get("api");
    const stored = localStorage.getItem("clipso_api_base");
    return normalizeApiBase(urlApi || stored || DEFAULT_API_BASE);
}

function setApiBase(base) {
    localStorage.setItem("clipso_api_base", normalizeApiBase(base));
}

function money(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function num(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function showToast(message, isError = false) {
    toastEl.innerHTML = `<div class="toast" style="border-left-color:${isError ? "#ef4444" : "#f5c842"}">${message}</div>`;
    setTimeout(() => {
        toastEl.innerHTML = "";
    }, 3200);
}

function statusBadge(status) {
    const normalized = String(status || "");
    if (normalized === "APPROVED") return '<span class="badge approved">APPROVED</span>';
    if (normalized === "REJECTED") return '<span class="badge rejected">REJECTED</span>';
    if (normalized === "REVISION_REQUIRED") return '<span class="badge revision">REVISION</span>';
    return '<span class="badge pending">PENDING</span>';
}

async function api(path, options = {}) {
    const base = getApiBase();
    const response = await fetch(`${base}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
}

const state = {
    clipper: null,
    campaigns: [],
    dashboard: null,
    pollTimer: null,
};

const refs = {
    apiBase: document.getElementById("apiBase"),
    saveApi: document.getElementById("saveApi"),
    clipperInfo: document.getElementById("clipperInfo"),
    submissionForm: document.getElementById("submissionForm"),
    campaignSelect: document.getElementById("campaignSelect"),
    sourceUrl: document.getElementById("sourceUrl"),
    handle: document.getElementById("handle"),
    caption: document.getElementById("caption"),
    reloadDashboard: document.getElementById("reloadDashboard"),
    statSubs: document.getElementById("statSubs"),
    statApproved: document.getElementById("statApproved"),
    statViews: document.getElementById("statViews"),
    statEarnings: document.getElementById("statEarnings"),
    submissionRows: document.getElementById("submissionRows"),
};

function renderClipperInfo() {
    if (!state.clipper) {
        refs.clipperInfo.innerHTML = '<div class="muted">No clipper found. Run seed first.</div>';
        return;
    }

    refs.clipperInfo.innerHTML = `
    <div class="muted">Name</div><div>${state.clipper.name}</div>
    <div class="muted">Email</div><div>${state.clipper.email}</div>
    <div class="muted">Clipper ID</div><div class="small">${state.clipper.id}</div>
  `;
}

function renderCampaignOptions() {
    refs.campaignSelect.innerHTML = "";

    if (state.campaigns.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No live campaigns available";
        refs.campaignSelect.append(option);
        return;
    }

    for (const campaign of state.campaigns) {
        const option = document.createElement("option");
        option.value = campaign.id;
        option.textContent = `${campaign.title} (${campaign.status})`;
        refs.campaignSelect.append(option);
    }
}

function renderDashboard(dashboard) {
    refs.statSubs.textContent = num(dashboard?.totals?.submissions || 0);
    refs.statApproved.textContent = num(dashboard?.totals?.approvedSubmissions || 0);
    refs.statViews.textContent = num(dashboard?.totals?.totalViews || 0);
    refs.statEarnings.textContent = money(dashboard?.totals?.totalEarningsCents || 0);

    const submissions = dashboard?.submissions || [];

    if (submissions.length === 0) {
        refs.submissionRows.innerHTML = '<tr><td colspan="7" class="muted">No submissions yet.</td></tr>';
        return;
    }

    refs.submissionRows.innerHTML = submissions
        .map((item) => `
      <tr>
        <td>${item.campaignTitle}</td>
        <td>${item.platform}</td>
        <td>${statusBadge(item.status)}</td>
        <td>${num(item.latestViews || 0)}</td>
        <td>${item.engagementRate || 0}%</td>
        <td>${money(item.payoutCents || 0)}</td>
        <td>
          <div class="row">
            <button class="btn" data-refresh-submission="${item.id}">Refresh Metrics</button>
            <a class="btn small" target="_blank" rel="noopener noreferrer" href="${item.sourceUrl}">Open</a>
          </div>
        </td>
      </tr>
    `)
        .join("");
}

async function loadBootstrapAndCampaigns() {
    const bootstrap = await api("/dev/bootstrap");
    state.clipper = bootstrap.clipper;
    renderClipperInfo();

    const campaignResponse = await api("/campaigns?status=LIVE");
    state.campaigns = campaignResponse.campaigns || [];
    renderCampaignOptions();
}

async function loadClipperDashboard() {
    if (!state.clipper) {
        renderDashboard(null);
        return;
    }

    state.dashboard = await api(`/clippers/${state.clipper.id}/dashboard`);
    renderDashboard(state.dashboard);
}

async function submitClip(event) {
    event.preventDefault();

    if (!state.clipper) {
        showToast("No clipper identity found. Run seed first.", true);
        return;
    }

    const campaignId = refs.campaignSelect.value;
    const sourceUrl = refs.sourceUrl.value.trim();

    if (!campaignId || !sourceUrl) {
        showToast("Campaign and URL are required.", true);
        return;
    }

    await api("/submissions", {
        method: "POST",
        body: JSON.stringify({
            campaignId,
            clipperId: state.clipper.id,
            sourceUrl,
            handle: refs.handle.value.trim() || undefined,
            caption: refs.caption.value.trim() || undefined,
        }),
    });

    refs.submissionForm.reset();
    showToast("Submission created.");
    await loadClipperDashboard();
}

async function refreshSubmissionMetrics(event) {
    const button = event.target.closest("button[data-refresh-submission]");
    if (!button) return;

    const submissionId = button.getAttribute("data-refresh-submission");
    if (!submissionId) return;

    await api(`/submissions/${submissionId}/refresh-metrics`, {
        method: "POST",
    });

    showToast("Metrics refresh queued for submission.");
}

function startPolling() {
    if (state.pollTimer) {
        clearInterval(state.pollTimer);
    }

    state.pollTimer = setInterval(async () => {
        try {
            await loadClipperDashboard();
        } catch {
            // keep polling silent
        }
    }, 20000);
}

async function bootstrap() {
    try {
        await loadBootstrapAndCampaigns();
        await loadClipperDashboard();
    } catch (error) {
        showToast(error.message || "Unable to connect to API", true);
    }
}

async function init() {
    refs.apiBase.value = getApiBase();

    refs.saveApi.addEventListener("click", async () => {
        setApiBase(refs.apiBase.value);
        showToast("API base saved.");
        await bootstrap();
    });

    refs.submissionForm.addEventListener("submit", async (event) => {
        try {
            await submitClip(event);
        } catch (error) {
            showToast(error.message || "Submission failed", true);
        }
    });

    refs.reloadDashboard.addEventListener("click", async () => {
        try {
            await loadClipperDashboard();
            showToast("Dashboard refreshed.");
        } catch (error) {
            showToast(error.message || "Refresh failed", true);
        }
    });

    refs.submissionRows.addEventListener("click", async (event) => {
        try {
            await refreshSubmissionMetrics(event);
        } catch (error) {
            showToast(error.message || "Metrics refresh failed", true);
        }
    });

    await bootstrap();
    startPolling();
}

init();
