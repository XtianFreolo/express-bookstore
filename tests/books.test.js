process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testBook;

beforeEach(async () => {
    const result = await db.query(`
    INSERT INTO books 
    (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES
    ('1234567890', 'http://a.co/test', 'Author Test', 'english', 100, 'Test Publisher', 'Test Book', 2020)
    RETURNING *`);
    testBook = result.rows[0];
});

afterEach(async () => {
    await db.query("DELETE FROM books");
});

afterAll(async () => {
    await db.end();
});

describe("GET /books", () => {
    test("Gets a list of books", async () => {
        const res = await request(app).get("/books");
        expect(res.statusCode).toBe(200);
        expect(res.body.books).toHaveLength(1);
    });
});

describe("GET /books/:isbn", () => {
    test("Gets a single book", async () => {
        const res = await request(app).get(`/books/${testBook.isbn}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.book).toHaveProperty("isbn");
    });

    test("Responds with 404 if not found", async () => {
        const res = await request(app).get(`/books/9999999999`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /books", () => {
    test("Creates a new book", async () => {
        const res = await request(app).post("/books").send({
            isbn: "1111111111",
            amazon_url: "http://a.co/xyz",
            author: "New Author",
            language: "english",
            pages: 200,
            publisher: "New Pub",
            title: "New Book",
            year: 2022
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty("isbn");
    });

    test("Fails with invalid data", async () => {
        const res = await request(app).post("/books").send({
            isbn: "111",
            pages: "not-a-number"
        });
        expect(res.statusCode).toBe(400);
    });
});

describe("PUT /books/:isbn", () => {
    test("Updates an existing book", async () => {
        const res = await request(app)
            .put(`/books/${testBook.isbn}`)
            .send({
                isbn: testBook.isbn,
                amazon_url: "http://a.co/updated",
                author: "Updated Author",
                language: "english",
                pages: 150,
                publisher: "Updated Pub",
                title: "Updated Title",
                year: 2023
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.book.title).toBe("Updated Title");
    });

    test("Fails with invalid data", async () => {
        const res = await request(app)
            .put(`/books/${testBook.isbn}`)
            .send({
                isbn: testBook.isbn,
                pages: "not-a-number"
            });
        expect(res.statusCode).toBe(400);
    });
});

describe("DELETE /books/:isbn", () => {
    test("Deletes a book", async () => {
        const res = await request(app).delete(`/books/${testBook.isbn}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Book deleted" });
    });
});
