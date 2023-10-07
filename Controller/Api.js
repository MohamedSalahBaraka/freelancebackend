import db from "../db.js";
import { user } from "../middelware/Auth.js";

const Api = {
    register: (req, res) => {
        console.log("wehere");
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

        let token = getrand();
        console.log(req.file);
        let q = 'insert into users (name, phone, password,type,neighbourhood,city_id,token ) values (?,?,?,?,?,?,?)';
        let arg = [name, phone, password, type, neighbourhood, city_id, token]
        if (req.file) {
            q = 'insert into users (name, phone, password,type,neighbourhood ,city_id, token, photo) values (?,?,?,?,?,?,?,?)';
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
            return res.status(200).send({ message: 'user created sucessfully', token });

            // Check if the row exists
        });

    },
    home: async (req, res) => {
        // Get the query parameters from the request
        const cityIds = req.body.cityIds; // an array of city ids
        const keyword = req.body.keyword; // a keyword to search in bids title or details
        const skillIds = req.body.skillIds; // an array of skill ids

        // Build the query object for the database
        let query = 'SELECT b.*, c.name AS city_name, COUNT(p.id) AS proposals_count, GROUP_CONCAT(s.name) AS skills FROM bids b LEFT JOIN citys c ON b.city_id = c.id LEFT JOIN proposals p ON b.id = p.bid_id LEFT JOIN bids_skils bs ON b.id = bs.bid_id LEFT JOIN skils s ON bs.skil_id = s.id';
        let params = [];
        let whereClause = '';
        if (cityIds) {
            // Filter by city ids if provided
            whereClause += ` WHERE b.city_id IN (${cityIds.join(", ")})`;
        }
        if (keyword) {
            // Filter by keyword if provided
            whereClause += (cityIds ? ' AND' : ' WHERE') + ' (b.title LIKE ? OR b.details LIKE ?)';
            params.push('%' + keyword + '%', '%' + keyword + '%'); // use wildcard for partial match
        }
        if (skillIds) {
            // Filter by skill ids if provided
            whereClause += (cityIds || keyword ? ' AND' : ' WHERE') + ` bs.skil_id IN (${skillIds.join(", ")})`;
        }
        whereClause += (cityIds || keyword || skillIds ? ' AND' : ' WHERE') + ' b.user_id != ' + user.id + ' AND done = 0';
        query += whereClause + ' GROUP BY b.id'; // group by bid id to get the proposals count and skills
        // Fetch the bids from the database
        db.all(query, params, (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            const bidsWithSkills = row?.map((bid) => {
                return {
                    ...bid,
                    skills: bid.skills ? bid.skills.split(',') : [], // split the skills string into an array
                };
            });
            db.all(`SELECT * FROM Citys`, (err, cities) => {
                if (err) {
                    return res.status(500).send(err);
                }
                db.all(`SELECT * FROM skils`, (err, skils) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    return res.json({ bids: bidsWithSkills, cities, skils });
                })
            })

        });
    },
    findworkers: async (req, res) => {
        // Get the query parameters from the request
        const cityIds = req.body.cityIds; // an array of city ids
        const keyword = req.body.keyword; // a keyword to search in users name or details
        const skillIds = req.body.skillIds; // an array of skill ids
        const currentDate = new Date().toISOString().slice(0, 10); // get the current date in YYYY-MM-DD format

        // Build the query object for the database
        let query = 'SELECT u.*, c.name AS city_name, GROUP_CONCAT(s.name) AS skills FROM users u LEFT JOIN citys c ON u.city_id = c.id LEFT JOIN users_skils us ON u.id = us.user_id LEFT JOIN skils s ON us.skil_id = s.id';
        let params = [];
        let whereClause = '';
        if (cityIds) {
            // Filter by city ids if provided
            whereClause += ` WHERE u.city_id IN (${cityIds.join(", ")})`;
        }
        if (keyword) {
            // Filter by keyword if provided
            whereClause += (cityIds ? ' AND' : ' WHERE') + ' (u.name LIKE ?)';
            params.push('%' + keyword + '%'); // use wildcard for partial match
        }
        if (skillIds) {
            // Filter by skill ids if provided
            whereClause += (cityIds || keyword ? ' AND' : ' WHERE') + ` us.skil_id IN (${skillIds.join(", ")})`;
        }
        // Filter by finish date if not passed yet
        whereClause += (cityIds || keyword || skillIds ? ' AND' : ' WHERE') + ' u.finshDate > ?';
        whereClause += ' AND' + ' u.id != ' + user.id;
        params.push(currentDate);

        query += whereClause + ' GROUP BY u.id'; // group by user id to get the skills


        // Fetch the users from the database
        db.all(query, params, (err, users) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            const usersWithSkills = users.map((user) => {
                return {
                    ...user,
                    skills: user.skills ? user.skills.split(',') : [], // split the skills string into an array
                };
            });
            db.all(`SELECT * FROM Citys`, (err, cities) => {
                if (err) {
                    return res.status(500).send(err);
                }
                db.all(`SELECT * FROM skils`, (err, skils) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    return res.json({ workers: usersWithSkills, cities, skils, user });
                })
            })
        });

    },
    createBid: (req, res) => {
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
                if (Array.isArray(skils)) {
                    skils.forEach(element => {
                        q = q + `(${element},${bidId}),`
                    });
                    q = q.slice(0, -1);
                    console.log(q);
                    db.run(q, (err, row) => {
                        if (err)
                            console.log("Errors", err)
                    })
                }
            }
            return res.status(200).send({ message: 'bid created sucessfully' });
        });

    },
    updateBid: (req, res) => {
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
                if (Array.isArray(skils)) {
                    skils.forEach(element => {
                        q = q + `(${element},${bidID}),`
                    });
                    q = q.slice(0, -1);
                    console.log(q);
                    db.run(q, (err, row) => {
                        if (err)
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
    mybids: async (req, res) => {
        // Get the query parameters from the request
        const cityIds = req.body.cityIds; // an array of city ids
        const keyword = req.body.keyword; // a keyword to search in bids title or details
        const skillIds = req.body.skillIds; // an array of skill ids

        // Build the query object for the database
        let query = `SELECT b.*, c.name AS city_name, GROUP_CONCAT(s.name) AS skills, REPLACE (GROUP_CONCAT (p.details || "|||" || p.price || "|||" || p.pierod || "|||" || p.user_id|| "|||" || u.name|| "|||" || u.phone), ',', '---') AS proposals FROM bids b LEFT JOIN citys c ON b.city_id = c.id LEFT JOIN proposals p ON b.id = p.bid_id LEFT JOIN bids_skils bs ON b.id = bs.bid_id LEFT JOIN skils s ON bs.skil_id = s.id LEFT JOIN users u ON p.user_id = u.id`;
        let params = [];
        let whereClause = "";
        if (cityIds) {
            // Filter by city ids if provided
            whereClause += ` WHERE b.city_id IN (${cityIds.join(", ")})`;
        }
        if (keyword) {
            // Filter by keyword if provided
            whereClause += (cityIds ? ' AND' : ' WHERE') + ' (b.title LIKE ? OR b.details LIKE ?)';
            params.push('%' + keyword + '%', '%' + keyword + '%'); // use wildcard for partial match
        }
        if (skillIds) {
            // Filter by skill ids if provided
            whereClause += (cityIds || keyword ? ' AND' : ' WHERE') + ` bs.skil_id IN (${skillIds.join(", ")})`;
        }
        whereClause += (cityIds || keyword || skillIds ? ' AND' : ' WHERE') + ' b.user_id = ' + user.id;
        query += whereClause + ' GROUP BY b.id'; // group by bid id to get the skills and proposals
        db.all(query, params, (err, row) => {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            }
            if (row) {
                const bidsWithSkillsAndProposals = row.map((bid) => {
                    return {
                        ...bid,
                        skills: bid.skills ? bid.skills.split(',') : [], // split the skills string into an array
                        proposals: bid.proposals ? bid.proposals.split('---').map((p) => { // split the proposals string into an array of objects
                            let [details, price, period, user_id, userName, userPhone] = p.split('|||'); // split each proposal by |
                            return { details, price, period, user_id, userName, userPhone }; // return an object with details, price and period properties
                        }) : [],
                    };
                });
                db.all(`SELECT * FROM Citys`, (err, cities) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    db.all(`SELECT * FROM skils`, (err, skils) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        return res.json({ bids: bidsWithSkillsAndProposals, cities, skils });
                    })
                })
            } else {
                db.all(`SELECT * FROM Citys`, (err, cities) => {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    db.all(`SELECT * FROM skils`, (err, skils) => {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        return res.json({ bids: [], cities, skils });
                    })
                })
            }

        });
    },
    updateInfo: (req, res) => {
        const phone = req.body.phone;
        const id = user.id;
        const name = req.body.name;
        const neighbourhood = req.body.neighbourhood;
        const city_id = req.body.city_id;
        const skils = req.body.skils;
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
                res.status(404).send({ message: "not found" });
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
    editUser: (req, res) => {
        const id = user.id;
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
    updatePassword: (req, res) => {
        const id = user.id;
        console.log(req.body);
        const newPassword = req.body.newPassword;
        const oldPassword = req.body.oldPassword;
        if (!newPassword) {
            res.status(422).send({ message: "newPassword is requierd" });
            return
        }
        if (!oldPassword) {
            res.status(422).send({ message: "oldPassword is requierd" });
            return
        }
        if (user.password != oldPassword)
            return res.status(422).send({ message: "oldPassword doesnot match" });
        let q = `update users set password = "${newPassword}" where id = ${id}`;
        db.get(q, (err, row) => {
            // Handle any errors
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'password Updated sucessfully' });
        });
    },
    addProposal: (req, res) => {
        const details = req.body.details;
        const pierod = req.body.pierod;
        const price = req.body.price;
        const bid_id = req.body.bid_id;

        if (!details) {
            res.status(422).send({ message: "details is requierd" });
            return
        }
        if (!pierod) {
            res.status(422).send({ message: "pierod is requierd" });
            return
        }
        if (!bid_id) {
            res.status(422).send({ message: "bid_id is requierd" });
            return
        }
        if (!price) {
            res.status(422).send({ message: "price is requierd" });
            return
        }
        console.log(req.file);
        let q = 'insert into Proposals ( details, pierod,price,bid_id ,user_id) values (?,?,?,?,?)';
        let arg = [details, pierod, price, bid_id, user.id];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Proposal created sucessfully' });
        });

    },
    myProposals: (req, res) => {
        const id = user.id;
        // Execute a SQL query to get all users from the database
        db.all(`Select u.*, us.title, us.done from proposals u  JOIN bids us ON u.bid_id = us.id WHERE u.user_id = ${id}`, (err, rows) => {
            // Handle any errors
            if (err) {
                res.status(500).send(err.message);
            } else {
                // Send the result as a JSON array
                res.json(rows);
            }
        });
    },
    updateProposal: (req, res) => {
        const id = req.body.id;
        const details = req.body.details;
        const pierod = req.body.pierod;
        const price = req.body.price;
        if (!details) {
            res.status(422).send({ message: "details is requierd" });
            return
        }
        if (!pierod) {
            res.status(422).send({ message: "pierod is requierd" });
            return
        }
        if (!price) {
            res.status(422).send({ message: "price is requierd" });
            return
        }
        db.get('SELECT * FROM Proposals WHERE id = ?', [id], (err, row) => {
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
        let q = `update Proposals  set details='${details}', pierod=${pierod},price=${price} where id = ${id}`;
        db.get(q, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Proposal Updated sucessfully' });
        });
    },
    deleteProposal: (req, res) => {
        const id = req.params.id;

        // Call the function to delete the city by id
        deleteProposalById(id, (error) => {
            // Check for errors
            if (error) {
                // Send a 500 status code and an error message
                res.status(500).send(error.message);
            } else {
                // Send a 200 status code and a success message
                res.status(200).send(`Proposal with id ${id} deleted successfully`);
            }
        });
    },
    startChat: (req, res) => {
        const id = req.params.id;
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists
            if (row) {
                let userother = {
                    photo: row.photo,
                    name: row.name,
                    id: id,
                    message: []
                }
                return res.json({ user: userother })
            } else {
                // If no, send a 404 not found response
                return res.status(404).send({ message: "not found" });
            }
        });
    },
    user: (req, res) => {
        return res.status(200).json(user);
    },
    markBidAsDone: (req, res) => {
        const id = req.params.id;
        let q = `update bids set done = 1 where id = ${id}`;
        db.get(q, (err, row) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.status(200).json({ message: "done" });
        });
    },
    subscription: (req, res) => {
        db.all(`SELECT * FROM Subscriptions order BY type `, (err, rows) => {
            // Handle any errors
            if (err) {
                res.status(500).send(err.message);
            } else {
                let subscription = { full: [], small: [] };
                rows.forEach(row => {
                    if (row.type === "full")
                        subscription.full.push(row);
                    else
                        subscription.small.push(row);
                });
                db.all(`SELECT * FROM phones`, (err, phone) => {
                    // Handle any errors
                    if (err) {
                        res.status(500).send(err.message);
                    } else {
                        subscription.phone = phone;
                        // Send the result as a JSON array
                        res.json({ subscription });
                    }
                });
            }
        });
    }
}
export default Api
const deleteProposalById = (id, callback) => {
    // Use db.run() to execute a SQL statement
    db.run("DELETE FROM Proposals WHERE id = ?", [id], (error) => {
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