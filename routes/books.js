const express = require("express");
const jsonschema = require("jsonschema");
const Book = require("../models/book");
const bookSchema = require("../schemas/bookSchema.json");
const ExpressError = require("../expressError");

const router = new express.Router();

/** GET / => {books: [book, ...]}  */
router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[isbn]  => {book: book} */
router.get("/:isbn", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.isbn);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST / => {book: newBook}
 *  Validates request body with JSONSchema.
 */
router.post("/", async function (req, res, next) {
  try {
    const validation = jsonschema.validate(req.body, bookSchema);
    if (!validation.valid) {
      const listOfErrors = validation.errors.map(e => e.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const book = await Book.create(req.body);
    return res.status(201).json({ book });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn] => {book: updatedBook}
 *  Validates request body with JSONSchema.
 */
router.put("/:isbn", async function (req, res, next) {
  try {
    const validation = jsonschema.validate(req.body, bookSchema);
    if (!validation.valid) {
      const listOfErrors = validation.errors.map(e => e.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn] => {message: "Book deleted"} */
router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
