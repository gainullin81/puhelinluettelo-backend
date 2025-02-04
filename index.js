require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const Person = require("./models/person");
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "https://gainullin81.github.io",
      "http://localhost:5173",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, "dist")));
app.use(morgan("tiny"));

let persons = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: 4,
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

app.get("/", (req, res) => {
  res.json("<h1>Phonebook</h1>");
});

app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then((persons) => {
      res.json(persons);
    })
    .catch((error) => next(error));
});

app.get("/api/info", (req, res, next) => {
  Person.countDocuments({})
    .then((count) => {
      res.send(`
      <p>Phonebook has info for ${count} people</p>
      <p>${new Date()}</p>
    `);
    })
    .catch((error) => next(error));
});

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

const generateId = () => {
  const MaxId = persons.length > 0 ? Math.max(...persons.map((p) => p.id)) : 0;
  return MaxId + 1;
};

app.post("/api/persons", (req, res, next) => {
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(400).json({
      error: "name or number is missing",
    });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person
    .save()
    .then((savedPerson) => {
      res.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (req, res, next) => {
  const { name, number } = req.body;

  Person.findByIdAndUpdate(
    req.params.id,
    { name, number },
    { new: true, runValidators: true, context: "query" }
  )
    .then((updatedPerson) => {
      res.json(updatedPerson);
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log("Attempting to delete id:", id);

    const deletedPerson = await Person.findByIdAndDelete(id);
    console.log("Deleted person:", deletedPerson);

    if (deletedPerson) {
      res.status(200).json(deletedPerson);
    } else {
      res.status(404).json({ error: "Person not found" });
    }
  } catch (error) {
    console.error("Delete error:", error);
    next(error);
  }
});

const errorHandler = (error, req, res, next) => {
  console.error("Error details:", error);

  if (error.name === "CastError") {
    return res.status(400).json({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({
    error: "internal server error",
    details: error.message,
  });
};

app.use(errorHandler);

app.get("/persons", (request, response) => {
  response.redirect("/api/persons");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
