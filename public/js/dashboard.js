requireLogin();

document.getElementById("whoami").textContent =
  `${localStorage.getItem("name")} (${localStorage.getItem("username")}) - role: ${localStorage.getItem("role")}`;

if (localStorage.getItem("role") === "admin") {
  document.getElementById("adminHint").style.display = "block";
}

async function loadBooks() {
  const errorEl = document.getElementById("error");
  try {
    const books = await apiFetch("/api/books");
    const container = document.getElementById("books");
    if (books.length === 0) {
      container.innerHTML = '<p class="small">No books yet. Add one above.</p>';
      return;
    }
    container.innerHTML = books
      .map(
        (b) => `
      <div class="book-row card" style="padding:12px;margin-bottom:8px;">
        <form data-id="${b.id}">
          <input name="title" value="${escapeHtml(b.title)}" />
          <input name="author" value="${escapeHtml(b.author)}" />
          <input name="year" value="${b.year || ""}" style="max-width:100px" />
          <button type="submit">Save</button>
          <button type="button" class="danger" data-delete="${b.id}">Delete</button>
        </form>
      </div>`
      )
      .join("");

    container.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = form.dataset.id;
        const title = form.title.value;
        const author = form.author.value;
        const year = form.year.value ? Number(form.year.value) : null;
        try {
          await apiFetch(`/api/books/${id}`, {
            method: "PUT",
            body: JSON.stringify({ title, author, year }),
          });
          loadBooks();
        } catch (err) {
          errorEl.textContent = err.message;
        }
      });
    });

    container.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await apiFetch(`/api/books/${btn.dataset.delete}`, { method: "DELETE" });
          loadBooks();
        } catch (err) {
          errorEl.textContent = err.message;
        }
      });
    });
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

document.getElementById("addBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const year = document.getElementById("year").value ? Number(document.getElementById("year").value) : null;
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  try {
    await apiFetch("/api/books", { method: "POST", body: JSON.stringify({ title, author, year }) });
    document.getElementById("title").value = "";
    document.getElementById("author").value = "";
    document.getElementById("year").value = "";
    loadBooks();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

loadBooks();
