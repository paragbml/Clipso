const toastEl = document.getElementById("toast");

function normalizeApiBase(input) {
  const base = (input || "http://localhost:8080/v1").trim().replace(/\/$/, "");
  if (base.endsWith("/v1")) return base;
  return `${base}/v1`;
}

function getApiBase() {
  const urlApi = new URLSearchParams(window.location.search).get("api");
  const stored = localStorage.getItem("clipso_api_base");
  return normalizeApiBase(urlApi || stored || "http://localhost:8080/v1");
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
  creator: null,
  campaigns: [],
  selectedCampaignId: "",
  pollTimer: null,
};

const refs = {
  apiBase: document.getElementById("apiBase"),
  saveApi: document.getElementById("saveApi"),
  creatorInfo: document.getElementById("creatorInfo"),
  campaignForm: document.getElementById("campaignForm"),
  campaignTitle: document.getElementById("campaignTitle"),
  campaignBudget: document.getElementById("campaignBudget"),
  campaignDescription: document.getElementById("campaignDescription"),
  campaignSelect: document.getElementById("campaignSelect"),
  reloadCampaign: document.getElementById("reloadCampaign"),
  queueMetrics: document.getElementById("queueMetrics"),
  statViews: document.getElementById("statViews"),
  statSubs: document.getElementById("statSubs"),
  statEngagement: document.getElementById("statEngagement"),
  statLikes: document.getElementById("statLikes"),
  submissionRows: document.getElementById("submissionRows"),
};

function renderCreatorInfo() {
  if (!state.creator) {
    refs.creatorInfo.innerHTML = '<div class="muted">No creator found. Run seed first.</div>';
    return;
  }

  refs.creatorInfo.innerHTML = `
    <div class="muted">Name</div><div>${state.creator.name}</div>
    <div class="muted">Email</div><div>${state.creator.email}</div>
    <div class="muted">Creator ID</div><div class="small">${state.creator.id}</div>
  `;
}

function renderCampaignSelect() {
  refs.campaignSelect.innerHTML = "";

  if (state.campaigns.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No campaigns available";
    refs.campaignSelect.append(option);
    state.selectedCampaignId = "";
    return;
  }

  for (const campaign of state.campaigns) {
    const option = document.createElement("option");
    option.value = campaign.id;
    option.textContent = `${campaign.title} (${campaign.status})`;
    refs.campaignSelect.append(option);
  }

  if (!state.selectedCampaignId || !state.campaigns.some((item) => item.id === state.selectedCampaignId)) {
    state.selectedCampaignId = state.campaigns[0].id;
  }

  refs.campaignSelect.value = state.selectedCampaignId;
}

function renderCampaignStats(payload) {
  refs.statViews.textContent = num(payload.stats?.totalViews || 0);
  refs.statSubs.textContent = num(payload.stats?.totalSubmissions || 0);
  refs.statEngagement.textContent = `${payload.stats?.avgEngagementRate || 0}%`;
  refs.statLikes.textContent = num(payload.stats?.totalLikes || 0);
}

function renderSubmissionRows(submissions) {
  if (!submissions || submissions.length === 0) {
    refs.submissionRows.innerHTML = '<tr><td colspan="7" class="muted">No submissions yet for this campaign.</td></tr>';
    return;
  }

  refs.submissionRows.innerHTML = submissions
    .map((submission) => {
      const payout = submission.payoutCents ?? 0;
      return `
      <tr>
        <td>
          <div class="small">${submission.platform}</div>
          <a class="small" href="${submission.sourceUrl}" target="_blank" rel="noopener noreferrer">Open clip</a>
        </td>
        <td>
          <div>${submission.clipper?.name || "Unknown"}</div>
          <div class="small muted">${submission.clipper?.email || ""}</div>
        </td>
        <td>${statusBadge(submission.status)}</td>
        <td>${num(submission.stats?.latestViews || 0)}</td>
        <td>${submission.stats?.engagementRate || 0}%</td>
        <td>
          <input class="inline-input" type="number" min="0" step="1" data-payout-input="${submission.id}" value="${payout}" />
        </td>
        <td>
          <div class="row">
            <button data-review="APPROVED" data-submission-id="${submission.id}" class="btn-primary">Approve</button>
            <button data-review="REVISION_REQUIRED" data-submission-id="${submission.id}" class="btn">Revision</button>
            <button data-review="REJECTED" data-submission-id="${submission.id}" class="btn">Reject</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

async function loadBootstrapAndCampaigns() {
  const bootstrap = await api("/dev/bootstrap");
  state.creator = bootstrap.creator;
  renderCreatorInfo();

  if (!state.creator) {
    state.campaigns = [];
    renderCampaignSelect();
    return;
  }

  const campaignResponse = await api(`/campaigns?creatorId=${encodeURIComponent(state.creator.id)}`);
  state.campaigns = campaignResponse.campaigns || [];
  renderCampaignSelect();
}

async function loadSelectedCampaignData() {
  if (!state.selectedCampaignId) {
    renderCampaignStats({ stats: {} });
    renderSubmissionRows([]);
    return;
  }

  const [dashboard, submissionsResponse] = await Promise.all([
    api(`/campaigns/${state.selectedCampaignId}/dashboard`),
    api(`/campaigns/${state.selectedCampaignId}/submissions`),
  ]);

  renderCampaignStats(dashboard);
  renderSubmissionRows(submissionsResponse.submissions || []);
}

async function createCampaign(event) {
  event.preventDefault();

  if (!state.creator) {
    showToast("No creator identity found. Seed database first.", true);
    return;
  }

  const title = refs.campaignTitle.value.trim();
  const description = refs.campaignDescription.value.trim();
  const budgetUsd = Number(refs.campaignBudget.value || 0);

  if (!title || budgetUsd <= 0) {
    showToast("Campaign title and budget are required.", true);
    return;
  }

  await api("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      creatorId: state.creator.id,
      title,
      description,
      budgetCents: Math.round(budgetUsd * 100),
      status: "LIVE",
    }),
  });

  refs.campaignForm.reset();
  refs.campaignBudget.value = "1000";
  showToast("Campaign created.");

  await loadBootstrapAndCampaigns();
  await loadSelectedCampaignData();
}

async function reviewSubmission(event) {
  const button = event.target.closest("button[data-review]");
  if (!button) return;

  const submissionId = button.getAttribute("data-submission-id");
  const status = button.getAttribute("data-review");
  const payoutInput = document.querySelector(`input[data-payout-input="${submissionId}"]`);
  const payoutCents = Number(payoutInput?.value || 0);

  if (!submissionId || !status) return;

  await api(`/submissions/${submissionId}/review`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      payoutCents: Math.max(0, Math.round(payoutCents)),
    }),
  });

  showToast(`Submission updated: ${status}`);
  await loadSelectedCampaignData();
}

async function queueMetricsRefresh() {
  if (!state.selectedCampaignId) {
    showToast("Select a campaign first.", true);
    return;
  }

  const result = await api(`/campaigns/${state.selectedCampaignId}/refresh-metrics`, {
    method: "POST",
  });

  showToast(`Queued metrics refresh for ${result.queued || 0} submissions.`);
}

function startPolling() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
  }

  state.pollTimer = setInterval(async () => {
    try {
      await loadSelectedCampaignData();
    } catch {
      // keep silent during background polling
    }
  }, 20000);
}

async function init() {
  refs.apiBase.value = getApiBase();

  refs.saveApi.addEventListener("click", async () => {
    setApiBase(refs.apiBase.value);
    showToast("API base saved.");
    await bootstrap();
  });

  refs.campaignForm.addEventListener("submit", async (event) => {
    try {
      await createCampaign(event);
    } catch (error) {
      showToast(error.message || "Failed to create campaign", true);
    }
  });

  refs.campaignSelect.addEventListener("change", async () => {
    state.selectedCampaignId = refs.campaignSelect.value;
    try {
      await loadSelectedCampaignData();
    } catch (error) {
      showToast(error.message || "Failed to load campaign", true);
    }
  });

  refs.reloadCampaign.addEventListener("click", async () => {
    try {
      await loadSelectedCampaignData();
      showToast("Campaign data refreshed.");
    } catch (error) {
      showToast(error.message || "Refresh failed", true);
    }
  });

  refs.queueMetrics.addEventListener("click", async () => {
    try {
      await queueMetricsRefresh();
    } catch (error) {
      showToast(error.message || "Failed to queue refresh", true);
    }
  });

  refs.submissionRows.addEventListener("click", async (event) => {
    try {
      await reviewSubmission(event);
    } catch (error) {
      showToast(error.message || "Failed to update review", true);
    }
  });

  await bootstrap();
  startPolling();
}

async function bootstrap() {
  try {
    await loadBootstrapAndCampaigns();
    await loadSelectedCampaignData();
  } catch (error) {
    showToast(error.message || "Unable to connect to API", true);
  }
}

init();
