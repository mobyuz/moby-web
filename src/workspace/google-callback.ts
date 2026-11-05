const query = new URLSearchParams(window.location.search);
const state = query.get("state");
const code = query.get("code");
window.history.replaceState(null, "", window.location.pathname);

const result = document.getElementById("result");
if (state && /^[A-Za-z0-9_-]{43}$/.test(state)) {
  const channel = new BroadcastChannel(`moby-google-${state}`);
  channel.postMessage(code);
  channel.close();
  if (result) result.textContent = "Return to the Moby web app.";
} else if (result) {
  result.textContent = "This Google sign-in request is invalid or expired.";
}
