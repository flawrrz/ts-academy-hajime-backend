const express = require("express");
const app = express();
const PORT = 8080;

app.use(express.json()); // Middleware for parsing json request bodies

const students = []; // In-memory database for storing student info

// Add new student
app.post("/addstd", (req, res) => {
    const { name, matric, department } = req.body;

    const newStd = {
        name,
        matric,
        department,
        year: 1,
        school: "University of Ibadan"
    }

    students.push(newStd);

    res.status(201).json({message: "New student information has been added :)"});
});

// Get all students
app.get("/getallstd", (req, res) => {
    res.status(200).json(students);
});

// Get student by matric number
app.get("/getstd:matric", (req, res) => {
    const { matric } = req.params

    const index = students.findIndex(students => students.matric === matric);

    res.status(200).json(students[index]);
});

// Update student information by matric number
app.put("/updatestd:matric", (req, res) => {
    const { matric } = req.params;
    const { name, department } = req.body;

    const index = students.findIndex(students => students.matric === matric);

    students[index] = {
        name: name,
        matric: matric,
        department: department,
        year: 1,
        school: "University of Ibadan"
    };

    res.status(200).json({message: "Student info updated successfully :)"});
});

// Delete student information by matric number
app.delete("/deletestd:matric", (req, res) => {
    const { matric } = req.params;

    const index = students.findIndex(students => students.matric === matric);

    students.splice(index, 1);

    res.status(200).json({message: "Student info deleted successfully :)"});
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} :)`);
});