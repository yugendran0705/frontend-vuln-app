// Every request attaches the token AND the role straight from localStorage.
// The role header is what makes the client-side privilege escalation work
// against the (intentionally broken) backend admin check.
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (role) headers["X-Role"] = role;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function requireLogin() {
  if (!localStorage.getItem("token")) {
    window.location.href = "/index.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("name");
  window.location.href = "/index.html";
}
