const express = require("express");
const app = express();
const port = 3000;
const mysql = require("mysql2");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");

// START DB CONNECTION
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "enterpassword",
  database: "enrolkodego",
});

// TEMPLATING LAYOUT EJS MATE
app.engine("ejs", ejsMate);
// TEMPLATING ENGINE EJS
app.set("view engine", "ejs");
// SET VIEWS DIRECTORY TO ABSOLUTE PATH TO VIEWS
app.set("views", path.join(__dirname, "views"));
// ENCODE FORM RESPONSES
app.use(express.urlencoded({ extended: true }));
// _METHOD FOR OVERRIDE
app.use(methodOverride("_method"));

// ROUTE TO HOME
app.get("/", (req, res) => {
  res.render("home", { error: "" });
});

// ROUTE TO HOME - POST - FAKE LOGIN
app.post("/", (req, res) => {
  const { email, password } = req.body;
  // CHECK IF EMAIL EXISTS IN DATABASE
  db.query(
    `SELECT * FROM users WHERE email = ?`,
    email,
    async (err, results) => {
      if (err) {
        console.log(err.message);
      } else {
        if (results.length === 0)
          // IF NOT, RENDER HOME PAGE AND THROW ERROR
          return res.render("home", { error: "No email/username found" });
        if (results[0].password !== password)
          // IF YES BUT PASSWORD IS WRONG, RENDER HOME AND THROW ERROR
          return res.render("home", { error: "Wrong password" });
        //   IF ALL CREDENTIALS ARE CORRECT, REDIRECT TO HOME
        res.redirect("/students");
      }
    }
  );
});

// RESTFUL ROUTE TO STUDENTS - GET
app.get("/students", (req, res) => {
  db.query(
    `SELECT
              students.id,
            students.first_name,
            students.last_name,
            students.email,
            courses.course_name
            FROM students
            INNER JOIN courses on courses.id = students.course_id
            ORDER BY students.id`,
    async (err, results) => {
      if (err) {
        console.log(err.message);
      } else {
        return res.render("students/index", { students: results });
      }
    }
  );
});

// RESTFUL ROUTE TO STUDENTS - NEW
app.get("/students/new", (req, res) => {
  res.render("students/new");
});

// RESTFUL ROUTE TO STUDENTS - POST - ADD TO DB NEW STUDENT
app.post("/students", (req, res) => {
  const { first_name, last_name, email, course_id } = req.body;
  db.query(
    `INSERT INTO students SET ?`,
    {
      first_name,
      last_name,
      email,
      course_id,
    },
    async (err, results) => {
      if (err) {
        console.log(err.message);
      } else {
        return res.redirect("/students");
      }
    }
  );
});

// RESTFUL ROUTE TO STUDENTS/ID/EDIT - GET - RENDER EDIT FORM
app.get("/students/:id/edit", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM students where id = ?", id, async (err, results) => {
    if (err) {
      console.log(err.message);
    } else {
      return res.render(`students/edit`, { student: results[0] });
    }
  });
});

// RESTFUL ROUTE TO STUDENTS/ID/EDIT - PUT/OVERRIDE - EDIT CHANGES IN DB
app.put("/students/:id/edit", (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, course_id } = req.body;
  db.query(
    "UPDATE students SET first_name = ?, last_name = ?, email = ?, course_id = ? WHERE id = ?",
    [first_name, last_name, email, course_id, id],
    async (err, results) => {
      if (err) {
        console.log(err.message);
      } else {
        return res.redirect("/students");
      }
    }
  );
});

// RESTFUL ROUTE TO STUDENTS/ID/DELETE - DELETE/OVERRIDE - DELETE FROM DB
app.delete("/students/:id/delete", (req, res) => {
  const { id } = req.params;
  db.query("DELETE from students where id = ?", id, (err, results) => {
    if (err) {
      console.log(err.message);
    } else {
      return res.redirect("/students");
    }
  });
});

// CATCH ALL - MIDDLEWARE
app.use((req, res) => {
  res.status(404).send("NOT FOUND");
});

app.listen(port, () => {
  console.log(`Serving at port: ${port}`);
});
