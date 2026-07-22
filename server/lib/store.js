const fs = require("fs");
const path = require("path");

const usersPath = path.join(__dirname, "..", "data", "users.json");
const booksPath = path.join(__dirname, "..", "data", "books.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  getUsers: () => readJson(usersPath),
  saveUsers: (users) => writeJson(usersPath, users),
  getBooks: () => readJson(booksPath),
  saveBooks: (books) => writeJson(booksPath, books),
};
