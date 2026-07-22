document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  try {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("username", data.username);
    localStorage.setItem("name", data.name);
    window.location.href = "/dashboard.html";
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById("registerBtn").addEventListener("click", async () => {
  const username = document.getElementById("regUsername").value.trim();
  const name = document.getElementById("regName").value.trim();
  const password = document.getElementById("regPassword").value;
  const errorEl = document.getElementById("regError");
  errorEl.textContent = "";

  try {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, name, password }),
    });
    document.getElementById("username").value = username;
    document.getElementById("password").value = password;
    errorEl.textContent = "";
    alert("Account created. You can now log in.");
  } catch (err) {
    errorEl.textContent = err.message;
  }
});
