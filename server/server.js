const express = require("express");
const app = express();

const {Pool, Client} = require("pg");
const connectionString = "postgres://vokabhpu:jUG_pxDXIq4qbqOFo8yD7VD1kJe_VdWu@satao.db.elephantsql.com:5432/vokabhpu";

const client = new Client({
    connectionString:connectionString
});

function makeSqlResponce(sql, value) {
    // console.log(value.length);
    for (var i = 0; i < value.length; i++) {
        sql = sql.replace("?", "\'" + value[i] + "\'");
    }
    for (let i = 0; i < sql.length; i++) {
        sql = sql.replace("--_--", " ");
        sql = sql.replace("--ampersentznak--", "&");
        sql = sql.replace("--questionznak--", "?");
    }
    return sql;
    //console.log(sql);
    return sql;
}

client.connect();

app.get("/get/all_from_persons", function(req, res){
    console.log("get all from persons\n");
    client.query("SELECT * FROM persons", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/all_from_students", function(req, res){
    console.log("get all from students\n");
    client.query("SELECT * FROM students", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/all_from_teachers", function(req, res){
    console.log("get all from teachers\n");
    client.query("SELECT * FROM teachers", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/all_from_groups", function(req, res){
    console.log("get all from student_groups\n");
    client.query("SELECT * FROM students_group", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/all_from_tests", function(req, res){
    console.log("get all from student_tests\n");
    client.query("SELECT * FROM tests", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/all_from_questions", function(req, res){
    console.log("get all from questions\n");
    client.query("SELECT * FROM questions", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/all_from_answers", function(req, res){
    console.log("get all from answers\n");
    client.query("SELECT * FROM answers", (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/person_by_id", function(req, res){
    const id = req.query["id"];
    console.log("get by id=" + id + " from persons\n");
    client.query(makeSqlResponce("SELECT * FROM persons WHERE id=?" , [id]), (err, results) => {
        res.send(results["rows"]);
    });
});

app.post("/post/add_new_person", function (req, res) {
    console.log("add new user in persons...");
    const auth_sql = makeSqlResponce("SELECT * FROM persons WHERE login=?", [req.query["login"]]);
    client.query(auth_sql, (err, results) => {
        console.log(results["rowCount"]);
        if(results["rowCount"] == 0) {
            const sql = makeSqlResponce("INSERT INTO persons(name, login, password) " +
                "VALUES(?,?,?)", [req.query["name"], req.query["login"], req.query["password"]]);
            client.query(sql,function (err, results) {
                console.log("...person was added");
                res.send("person was added");
            });
        } else {
            console.log("login is busy");
            res.send("login is busy");
        }
    });
});

app.get("/get/teacher_id", function(req, res){
    const id = req.query["id"];
    console.log("get teacher_id, person_id=" + id + "\n");
    client.query(makeSqlResponce("SELECT (idteachers) FROM teachers WHERE persons_id=?" ,
        [id]), (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/test_by_teacher_id", function(req, res){
    console.log("get test for teacher_id= " + req.query["teacher_id"] + "\n");
    client.query(makeSqlResponce("SELECT * FROM tests WHERE teachers_idteachers=?" ,
        [req.query["teacher_id"]]), (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/test_by_id", function(req, res){
    console.log("get test by id= " + req.query["test_id"] + "\n");
    client.query(makeSqlResponce("SELECT * FROM tests WHERE idtests=?" ,
        [req.query["test_id"]]), (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/questions_for_test_id", function(req, res){
    console.log("get questions for test_id= " + req.query["test_id"] + "\n");
    client.query(makeSqlResponce("SELECT * FROM questions WHERE tests_idtests=?" ,
        [req.query["test_id"]]), (err, results) => {
        res.send(results["rows"]);
    });
});

app.get("/get/answers_for_questions_id", function(req, res){
    console.log("get answers for question_id= " + req.query["question_id"] + "\n");
    const sql = makeSqlResponce("SELECT * FROM answers WHERE questions_idquestion=?" ,
        [req.query["question_id"]]);
    console.log(sql);
    client.query(sql, (err, results) => {
        res.send(results["rows"]);
    });
});

app.post("/post/add_new_student", function (req, res) {
    console.log("add new student...");

    //проверка уникальности логина
    const auth_sql = makeSqlResponce("SELECT * FROM persons WHERE login=?", [req.query["login"]]);
    client.query(auth_sql, (err, results) => {
        if(results["rowCount"] == 0) {

            //логин уникален, регистрируем в persons
            const sql = makeSqlResponce("INSERT INTO persons(name, login, password) VALUES(?,?,?) RETURNING id",
                [req.query["name"], req.query["login"], req.query["password"]]);
            client.query(sql,function (err, results) {
                var id = results["rows"][0]["id"]; //id в таблице persons
                console.log("person id = " + id);

                //проверяем, существует ли группа
                const get_group_sql = makeSqlResponce("SELECT (idgroup) FROM students_group WHERE groupcol = ?",
                    [req.query["group"]]);
                client.query(get_group_sql, function (err, results) {

                    if(results["rowCount"] == 0) {

                        //группа не существует, добавляем группу
                        const add_group_sql = makeSqlResponce("INSERT INTO students_group(groupcol)" +
                            " VALUES(?) RETURNING idgroup", [req.query["group"]]);
                        client.query(add_group_sql, function (err, results) {
                            var idgroup = results["rows"][0]["idgroup"]; //id в таблице group
                            console.log("group id: " + idgroup);

                            //добавляем данные в таблицу students
                            const add_stud_sql = makeSqlResponce("INSERT INTO students (persons_id , " +
                                "group_idgroup) VALUES(?,?) RETURNING idstudents", [id, idgroup]);
                            client.query(add_stud_sql, function (err, results) {
                                var idstudent = results["rows"][0]["idstudents"]; //id в таблице students
                                console.log("student id:  " + idstudent);
                                console.log("...person was added\n");
                                res.send("OK");
                            });
                        });
                    } else {

                        //группа существует, запоминаем ее id
                        var idgroup = results["rows"][0]["idgroup"];
                        console.log("group id: " + idgroup);

                        //добавляем данные в таблицу students
                        const add_stud_sql = makeSqlResponce("INSERT INTO students (persons_id , " +
                            "group_idgroup) VALUES(?,?) RETURNING idstudents", [id, idgroup]);
                        client.query(add_stud_sql, function (err, results) {
                            var idstudent = results["rows"][0]["idstudents"]; //id в таблице students
                            console.log("student id:  " + idstudent);
                            console.log("...person was added\n");
                            res.send("OK");
                        });
                    }
                });
            });
        } else {

            //логин не уникален, сорян
            console.log("login is busy");
            res.send("login is busy");
        }
    });
});

app.post("/post/add_new_teacher", function (req, res) {
    console.log("add new teacher...");

    //проверка уникальности логина
    const auth_sql = makeSqlResponce("SELECT * FROM persons WHERE login=?", [req.query["login"]]);
    client.query(auth_sql, (err, results) => {
        if(results["rowCount"] == 0) {

            //логин уникален, регистрируем в persons
            const sql = makeSqlResponce("INSERT INTO persons(name, login, password) VALUES(?,?,?) RETURNING id",
                [req.query["name"], req.query["login"], req.query["password"]]);
            client.query(sql,function (err, results) {
                var person_id = results["rows"][0]["id"]; //id в таблице persons
                console.log("person id = " + person_id);

                //регистрируем в teachers
                const add_teach_sql = makeSqlResponce("INSERT INTO teachers (persons_id)" +
                    " VALUES(?) RETURNING idteachers", [person_id]);
                client.query(add_teach_sql, function (err, results) {
                    var idteacher = results["rows"][0]["idteachers"]; //id в таблице teacher
                    console.log("teacher id:  " + idteacher);
                    console.log("...person was added\n");
                    res.send("OK");
                });
            });
        } else {

            //логин не уникален, сорян
            console.log("login is busy");
            res.send("login is busy");
        }
    });
});

app.post("/post/add_new_test", function (req, res) {
    console.log("add new test");
    const sql = makeSqlResponce("INSERT INTO tests(name_test, teachers_idteachers) VALUES(?, ?) RETURNING idtests",
        [req.query["name_test"], req.query["teacher_id"]]);
    console.log(sql);
    client.query(sql, (err, results) => {
        var test_id = results["rows"][0]; //["idtests"]; //id в таблице tests
        console.log(test_id);
        res.send(test_id);
    });
});

app.post("/post/add_new_question", function (req, res) {
    console.log("...add new question for test " + req.query["test_id"]);
    console.log(req.query["question_text"]);
    const sql = makeSqlResponce("INSERT INTO questions(question , tests_idtests) " +
        "VALUES(?, ?) RETURNING idquestion",
        [req.query["question_text"], req.query["test_id"]]);
    console.log(sql);
    client.query(sql, (err, results) => {
        var question_id = results["rows"][0]; //["idquestion"]; //id в таблице questions
        console.log(question_id);
        res.send(question_id);
    });
});

app.post("/post/add_new_answer", function (req, res) {
    console.log("......add new answer for question " + req.query["question_id"]);
    const sql = makeSqlResponce("INSERT INTO answers(answerscol , questions_idquestion, isItCorrect)" +
        " VALUES (?, ?, ?)", [req.query["answerscol"], req.query["question_id"], req.query["isItCorrect"]]);
    client.query(sql, (err, results) => {
        res.send("answer was added");
    });
});

app.get("/get/test_result", function (req, res) {
    console.log("get result for test_id=" + req.query["test_id"]);
    const sql = makeSqlResponce("SELECT * FROM results WHERE tests_idtests =?",
        [req.query["test_id"]]);
    console.log(sql);
    client.query(sql, (err, results) => {
        console.log(results["rows"]);
        res.send(results["rows"]);
    });
});

app.get("/get/auth_person", function (req, res) {
    console.log("get user by login and password (auth)");
    const sql = makeSqlResponce("SELECT * FROM persons WHERE login=? AND password=?",
        [req.query["login"], req.query["password"]]);
    console.log(sql);
    client.query(sql, (err, results) => {
        console.log(results["rows"]);
        res.send(results["rows"]);
    });
});

app.get("/get/person_status", function (req, res) {
    console.log("get person " + req.query["person_id"] + " status...");
    const teach_sql = makeSqlResponce("SELECT (idteachers) FROM teachers WHERE persons_id=?",
        [req.query["person_id"]]);
    client.query(teach_sql, (err, results) => {
        if(results["rowCount"] > 0) {
            console.log("...person is teacher");
            res.send("Teacher");
        } else {
            const stud_sql = makeSqlResponce("SELECT (idstudents) FROM students WHERE persons_id=?",
                [req.query["person_id"]]);
            client.query(stud_sql, (err, results) => {
                if(results["rowCount"] > 0) {
                    console.log("...person is student");
                    res.send("Student");
                } else {
                    const admin_sql = makeSqlResponce("SELECT (idadministrators) FROM administrators " +
                        "WHERE persons_id=?", [req.query["person_id"]]);
                    client.query(admin_sql, (err, results) => {
                        if(results["rowCount"] > 0) {
                            console.log("...person is admin");
                            res.send("Admin");
                        } else {
                            console.log("...person is nikto for nash project");
                            res.send("404");
                        }
                    });
                }
            });
        }
    });
});

app.listen(8080);

console.log("Server is running...\n");