import db from "../db.js";
import { user } from "../middelware/Auth.js";

const Bid = {
    get: (req, res) => {
        // Execute a SQL query to get all bids from the database
        db.all(`Select u.*, us.name as cityname from bids u  JOIN citys us ON u.city_id = us.id`, (err, rows) => {
            // Handle any errors
            if (err) {
                res.status(500).send(err.message);
            } else {
                // Send the result as a JSON array
                res.json(rows);
            }
        });
    },
    find: (req, res) => {
        const id = req.params.id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        db.get('Select u.*, us.name as cityname from bids u  JOIN citys us ON u.city_id = us.id WHERE u.id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                return res.status(200).send({ bid: row });
            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    },
    createData: async (req, res) => {
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
    create: (req, res) => {
        console.log(req.body);
        const title = req.body.title;
        const details = req.body.details;
        const pierod = req.body.pierod;
        const price = req.body.price;
        const neighbourhood = req.body.neighbourhood;
        const city_id = req.body.city_id;
        const skils = req.body.skils;
        if (!title) {
            res.status(422).send({ message: "title is requierd" });
            return
        }
        if (!details) {
            res.status(422).send({ message: "details is requierd" });
            return
        }
        if (!pierod) {
            res.status(422).send({ message: "pierod is requierd" });
            return
        }
        if (!city_id) {
            res.status(422).send({ message: "city_id is requierd" });
            return
        }
        if (!neighbourhood) {
            res.status(422).send({ message: "neighbourhood is requierd" });
            return
        }
        if (!price) {
            res.status(422).send({ message: "price is requierd" });
            return
        }
        console.log(req.file);
        let q = 'insert into bids (title, details, pierod,price,neighbourhood,city_id ,user_id) values (?,?,?,?,?,?,?)';
        let arg = [title, details, pierod, price, neighbourhood, city_id, user.id];
        db.get(q + ' RETURNING id', arg, (err, row) => {
            // Handle any errors
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            // console.log(row);
            if (skils) {
                let bidId = row.id;
                let q = "INSERT INTO bids_skils (skil_id, bid_id) VALUES ";
                let skilsarray = skils.split(',');
                if (Array.isArray(skilsarray)) {
                    skilsarray.forEach(element => {
                        q = q + `(${element},${bidId}),`
                    });
                    q = q.slice(0, -1);
                    console.log(q);
                    db.run(q, (err, row) => {
                        console.log("Errors", err)
                    })
                }
            }
            return res.status(200).send({ message: 'bid created sucessfully' });
        });

    },
    update: (req, res) => {
        const id = req.body.id;
        const title = req.body.title;
        const details = req.body.details;
        const pierod = req.body.pierod;
        const price = req.body.price;
        const skils = req.body.skils;
        const neighbourhood = req.body.neighbourhood;
        const city_id = req.body.city_id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        if (!title) {
            res.status(422).send({ message: "title is requierd" });
            return
        }
        if (!details) {
            res.status(422).send({ message: "details is requierd" });
            return
        }
        if (!pierod) {
            res.status(422).send({ message: "pierod is requierd" });
            return
        }
        if (!city_id) {
            res.status(422).send({ message: "city_id is requierd" });
            return
        }
        if (!neighbourhood) {
            res.status(422).send({ message: "neighbourhood is requierd" });
            return
        }
        if (!price) {
            res.status(422).send({ message: "price is requierd" });
            return
        }
        if (skils) {
            db.run("DELETE FROM bids_skils WHERE bid_id = ?", [id], (error) => {
                let bidID = id;
                let q = "INSERT INTO bids_skils (skil_id, bid_id) VALUES ";
                let skilsarray = skils.split(',');
                if (Array.isArray(skilsarray)) {
                    skilsarray.forEach(element => {
                        q = q + `(${element},${bidID}),`
                    });
                    q = q.slice(0, -1);
                    console.log(q);
                    db.run(q, (err, row) => {
                        console.log("Errors", err)
                    })
                }
            });
        }
        db.get('SELECT * FROM bids WHERE id = ?', [id], (err, row) => {
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
        let q = `update bids  set title= '${title}', details='${details}', pierod=${pierod},price=${price},neighbourhood = '${neighbourhood}',city_id = ${city_id} where id = ${id}`;
        db.get(q, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'bid Updated sucessfully' });
        });
    },
    delete: (req, res) => {
        const id = req.params.id;

        // Call the function to delete the city by id
        deleteBidById(id, (error) => {
            // Check for errors
            if (error) {
                // Send a 500 status code and an error message
                res.status(500).send(error.message);
            } else {
                // Send a 200 status code and a success message
                res.status(200).send(`bid with id ${id} deleted successfully`);
            }
        });
    },
    edit: (req, res) => {
        const id = req.params.id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        console.log(id)
        db.all(`
      SELECT u.*, s.id as skilId
      FROM bids u
      JOIN bids_skils us ON u.id = us.bid_id
      JOIN skils s ON us.skil_id = s.id
      WHERE u.id = ?
    `, id, async (err, rows) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            else {
                if (rows.length > 0) {
                    try {
                        let bid = {};
                        bid.title = rows[0].title;
                        bid.id = rows[0].id;
                        bid.pierod = rows[0].pierod;
                        bid.details = rows[0].details;
                        bid.neighbourhood = rows[0].neighbourhood;
                        bid.city_id = rows[0].city_id;
                        bid.price = rows[0].price;
                        bid.skils = rows.map(row => row.skilId);
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
                                        res.status(200).send({ bid, skils, citis })
                                    }
                                });
                            }
                        });
                    } catch (error) {
                        res.status(500).send(error.message);
                    }
                } else {
                    db.get('Select * from bids WHERE id = ?', [id], (err, row) => {
                        // Handle any errors
                        if (err) {
                            return res.status(500).send(err.message);
                        }
                        if (row) {
                            let bid = {};
                            bid.title = row.title;
                            bid.id = row.id;
                            bid.pierod = row.pierod;
                            bid.neighbourhood = row.neighbourhood;
                            bid.details = row.details;
                            bid.price = row.price;
                            bid.city_id = row.city_id;
                            bid.skils = [];
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
                                            res.status(200).send({ bid, skils, citis })
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

    }
}
export default Bid
const deleteBidById = (id, callback) => {
    // Use db.run() to execute a SQL statement
    db.run("DELETE FROM bids WHERE id = ?", [id], (error) => {
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