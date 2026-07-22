requireLogin();

document.getElementById("whoami").textContent =
  `${localStorage.getItem("name")} (${localStorage.getItem("username")}) - role: ${localStorage.getItem("role")}`;

async function loadUsers() {
  const errorEl = document.getElementById("error");
  try {
    const users = await apiFetch("/api/admin/users");
    document.getElementById("rows").innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.username}</td>
        <td><span class="badge ${u.role}">${u.role}</span></td>
        <td>${
          u.books.length
            ? u.books.map((b) => `${b.title} (${b.author}${b.year ? ", " + b.year : ""})`).join("<br/>")
            : '<span class="small">no books</span>'
        }</td>
      </tr>`
      )
      .join("");
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

loadUsers();
