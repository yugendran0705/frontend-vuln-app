const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const usersPath = path.join(__dirname, "data", "users.json");
const booksPath = path.join(__dirname, "data", "books.json");

const adminId = uuidv4();
const bobId = uuidv4();
const carolId = uuidv4();

const users = [
  {
    id: adminId,
    username: "admin",
    password: bcrypt.hashSync("Admin@123", 10),
    role: "admin",
    name: "Alice Admin",
  },
  {
    id: bobId,
    username: "bob",
    password: bcrypt.hashSync("Bob@123", 10),
    role: "user",
    name: "Bob Reader",
  },
  {
    id: carolId,
    username: "carol",
    password: bcrypt.hashSync("Carol@123", 10),
    role: "user",
    name: "Carol Reader",
  },
];

const books = [
  { id: uuidv4(), title: "1984", author: "George Orwell", year: 1949, userId: bobId },
  { id: uuidv4(), title: "Brave New World", author: "Aldous Huxley", year: 1932, userId: bobId },
  { id: uuidv4(), title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953, userId: carolId },
  { id: uuidv4(), title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, userId: carolId },
];

fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
fs.writeFileSync(booksPath, JSON.stringify(books, null, 2));

console.log("Seeded users.json and books.json");
console.log("Login credentials:");
console.log("  admin / Admin@123  (role: admin)");
console.log("  bob   / Bob@123    (role: user)");
console.log("  carol / Carol@123  (role: user)");
