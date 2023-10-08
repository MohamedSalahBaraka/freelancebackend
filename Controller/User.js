import db from "../db.js";
import { user } from "../middelware/Auth.js";

const User = {
    get: (req, res) => {
        const type = req.query.type;
        const keyword = req.query.keyword;
        if (!type) {
            res.status(422).send({ message: "type is requierd" });
            return
        }
        let query = `Select u.*, us.name as cityname from users u left JOIN citys us ON u.city_id = us.id where u.type = '${type}'`;

        if (keyword) {
            // Filter by keyword if provided
            query += ` AND (u.phone LIKE '%${keyword}%' )`;
        }
        // Execute a SQL query to get all users from the database

        db.all(query, (err, rows) => {
            // Handle any errors
            if (err) {
                console.log(err);
                res.status(500).send(err.message);
            } else {
                // Send the result as a JSON array
                res.json(rows);
            }
        });
    },
    login: (req, res) => {
        console.log("login attmpt");
        const phone = req.body.phone;
        const password = req.body.password;
        if (!phone) {
            res.status(422).send({ message: "phone is requierd" });
            return
        }
        if (!password) {
            res.status(422).send({ message: "password is requierd" });
            return
        }
        db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists
            if (row) {
                // If yes, send the user data as JSON
                if (row.password != password) {
                    return res.status(422).send({ message: "wrong password" });
                }
                let token = getrand();
                db.get('UPDATE users SET  token = ? WHERE id = ?', [token, row.id], (err, row2) => {
                    // Handle any errors
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    return res.status(200).send({ user: row, token });
                });
            } else {
                // If no, send a 404 not found response
                return res.status(422).send({ message: "user not found" });
            }
        });
    },
    logout: (req, res) => {

        db.get('UPDATE users SET  token = ? WHERE id = ?', ["", user.id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            return res.status(200).send({ message: "logout" });
        });
    },
    createData: (req, res) => {
        db.all(`SELECT * FROM Skils`, (err, skils) => {
            // Handle any errors
            if (err) {
                res.status(500).send(err.message);
            } else {
                // Send the result as a JSON array
                db.all(`SELECT * FROM Citys`, (err, citis) => {
                    // Handle any errors
                    if (err) {
                        res.status(500).send(err.message);
                    } else {
                        // Send the result as a JSON array
                        res.json({ skils, citis });
                    }
                });
            }
        });
    },
    find: (req, res) => {
        const id = req.params.id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        db.get('Select u.*, us.name as cityname from users u left JOIN citys us ON u.city_id = us.id WHERE u.id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                return res.status(200).send({ user: row });
            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    },
    create: (req, res) => {
        const phone = req.body.phone;
        const password = req.body.password;
        const name = req.body.name;
        const skils = req.body.skils;
        const neighbourhood = req.body.neighbourhood;
        const city_id = req.body.city_id;
        const type = req.body.type;
        if (!phone) {
            res.status(422).send({ message: "phone is requierd" });
            return
        }
        if (!password) {
            res.status(422).send({ message: "password is requierd" });
            return
        }
        if (!name) {
            res.status(422).send({ message: "name is requierd" });
            return
        }
        if (!type) {
            res.status(422).send({ message: "type is requierd" });
            return
        }
        console.log(req.file);
        let q = 'insert into users (name, phone, password,type,neighbourhood,city_id ) values (?,?,?,?,?,?)';
        let arg = [name, phone, password, type, neighbourhood, city_id]
        if (req.file) {
            q = 'insert into users (name, phone, password,type,neighbourhood ,city_id,photo) values (?,?,?,?,?,?,?)';
            arg.push(req.file.path);
        }
        db.get(q + ' RETURNING id', arg, (err, row) => {
            // Handle any errors
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            // console.log(row);
            if (skils) {
                let UserID = row.id;
                let q = "INSERT INTO users_skils (skil_id, user_id) VALUES ";
                let skilsarray = skils.split(',');
                if (Array.isArray(skilsarray)) {
                    skilsarray.forEach(element => {
                        q = q + `(${element},${UserID}),`
                    });
                    q = q.slice(0, -1);
                    console.log(q);
                    db.run(q, (err, row) => {
                        console.log("Errors", err)
                    })
                }
            }
            return res.status(200).send({ message: 'user created sucessfully' });

            // Check if the row exists
        });

    },
    update: (req, res) => {
        const phone = req.body.phone;
        const id = req.body.id;
        const name = req.body.name;
        const neighbourhood = req.body.neighbourhood;
        const city_id = req.body.city_id;
        const skils = req.body.skils;

        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        if (!phone) {
            res.status(422).send({ message: "phone is requierd" });
            return
        }
        if (!name) {
            res.status(422).send({ message: "name is requierd" });
            return
        }
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists
            if (row) {
            } else {
                // If no, send a 404 not found response
                return res.status(404).send({ message: "not found" });
            }
        });
        if (skils) {
            db.run("DELETE FROM users_skils WHERE user_id = ?", [id], (error) => {
                let UserID = id;
                let q = "INSERT INTO users_skils (skil_id, user_id) VALUES ";
                let skilsarray = skils.split(',');
                if (Array.isArray(skilsarray)) {
                    skilsarray.forEach(element => {
                        q = q + `(${element},${UserID}),`
                    });
                    q = q.slice(0, -1);
                    console.log(q);
                    db.run(q, (err, row) => {
                        console.log("Errors", err)
                    })
                }
            });
        }
        let q = `update users set name = "${name}", phone = "${phone}",neighbourhood = '${neighbourhood}',city_id = ${city_id} where id = ${id}`;

        if (req.file) {
            q = `update users set name = "${name}", phone = "${phone}",neighbourhood = '${neighbourhood}',city_id = ${city_id},photo="${req.file.path}" where id = ${id}`;
        }
        db.get(q, (err, row) => {
            // Handle any errors
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'user Updated sucessfully' });
        });
    },
    delete: (req, res) => {
        const id = req.params.id;

        // Call the function to delete the city by id
        deleteuserById(id, (error) => {
            // Check for errors
            if (error) {
                // Send a 500 status code and an error message
                res.status(500).send(error.message);
            } else {
                // Send a 200 status code and a success message
                res.status(200).send(`user with id ${id} deleted successfully`);
            }
        });
    },
    edit: (req, res) => {
        const id = req.params.id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        db.all(`
      SELECT u.*, s.id as skilId
      FROM users u
      JOIN users_skils us ON u.id = us.user_id
      JOIN skils s ON us.skil_id = s.id
      WHERE u.id = ?
    `, id, (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            else {
                if (rows.length > 0) {
                    let user = {};
                    user.name = rows[0].name;
                    user.id = rows[0].id;
                    user.phone = rows[0].phone;
                    user.photo = rows[0].photo;
                    user.neighbourhood = rows[0].neighbourhood;
                    user.city_id = rows[0].city_id;
                    user.skils = rows.map(row => row.skilId);
                    db.all(`SELECT * FROM Skils`, (err, skils) => {
                        // Handle any errors
                        if (err) {
                            res.status(500).send(err.message);
                        } else {
                            // Send the result as a JSON array
                            db.all(`SELECT * FROM Citys`, (err, citis) => {
                                // Handle any errors
                                if (err) {
                                    res.status(500).send(err.message);
                                } else {
                                    res.status(200).send({ user, skils, citis })
                                }
                            });
                        }
                    });
                } else {
                    db.get('Select * from users WHERE id = ?', [id], (err, row) => {
                        // Handle any errors
                        if (err) {
                            return res.status(500).send(err.message);
                        }
                        if (row) {
                            let user = {};
                            user.name = row.name;
                            user.id = row.id;
                            user.phone = row.phone;
                            user.photo = row.photo;
                            user.neighbourhood = row.neighbourhood;
                            user.city_id = row.city_id;
                            user.skils = [];
                            db.all(`SELECT * FROM Skils`, (err, skils) => {
                                // Handle any errors
                                if (err) {
                                    res.status(500).send(err.message);
                                } else {
                                    // Send the result as a JSON array
                                    db.all(`SELECT * FROM Citys`, (err, citis) => {
                                        // Handle any errors
                                        if (err) {
                                            res.status(500).send(err.message);
                                        } else {
                                            res.status(200).send({ user, skils, citis })
                                        }
                                    });
                                }
                            });
                        } else {
                            console.log('we here');
                            return res.status(404).send({ message: "not Found" });
                        }
                    });
                }
            }
        })

    },
    subscripe: (req, res) => {
        const id = req.body.id;
        const number = parseInt(req.body.number);
        const ust = req.body.ust;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        if (!number) {
            res.status(422).send({ message: "number is requierd" });
            return
        }
        if (!ust) {
            res.status(422).send({ message: "ust is requierd" });
            return
        }
        db.get('Select * from users WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                const finshDate = addMonthToDate(row.finshdate, number);
                let q = `update users set finshdate = "${finshDate}", ust = "${ust}" where id = ${id}`;
                db.get(q, (err, row) => {
                    // Handle any errors
                    if (err) {
                        console.log(err);
                        return res.status(500).send(err.message);
                    }
                    // Check if the row exists

                    return res.status(200).send({ message: 'user Updated sucessfully' });
                });

            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    }
}
export default User
const deleteuserById = (id, callback) => {
    // Use db.run() to execute a SQL statement
    db.run("DELETE FROM users WHERE id = ?", [id], (error) => {
        // Check for errors
        if (error) {
            // Return the error to the callback
            callback(error);
        } else {
            // Return null to indicate success
            callback(null);
        }
    });
};
const getrand = () => {
    // Define a custom charset
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Generate a random string of 8 characters from the charset
    let randString = '';
    for (let i = 0; i < 50; i++) {
        // Get a random index from the charset
        const randIndex = Math.floor(Math.random() * charset.length);
        // Append the character at the index to the string
        randString += charset[randIndex];
    }
    return randString;
}
function addMonthToDate(date, number) {
    // Create a new Date object for the current date
    let currentDate = new Date();
    // If the date is not given, use the current date
    if (!date) {
        date = currentDate;
    }
    // Create a new Date object for the given date
    let givenDate = new Date(date);
    // Compare the given date and the current date
    if (givenDate > currentDate) {
        // If the given date is in the future, add the number to the month of the given date
        givenDate.setMonth(givenDate.getMonth() + number);
        // Return the new date
        return givenDate;
    } else {
        console.log('currentDate', currentDate.getMonth());
        // If the given date is in the past, add the number to the month of the current date
        currentDate.setMonth(currentDate.getMonth() + number);
        // Return the new date
        return currentDate;
    }
}