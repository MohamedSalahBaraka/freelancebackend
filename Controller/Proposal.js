import db from "../db.js";
import { user } from "../middelware/Auth.js";

const Proposal = {
    get: (req, res) => {
        const id = req.query.id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        // Execute a SQL query to get all users from the database
        db.all(`Select u.*, us.name as username from proposals u  JOIN users us ON u.user_id = us.id WHERE u.bid_id = ${id}`, (err, rows) => {
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
        db.get('Select u.*, us.name as username from proposals u  JOIN users us ON u.user_id = us.id WHERE u.id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                return res.status(200).send({ proposal: row });
            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    },
    create: (req, res) => {
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
    update: (req, res) => {
        const id = req.body.id;
        const details = req.body.details;
        const pierod = req.body.pierod;
        const price = req.body.price;
        const bid_id = req.body.bid_id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
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
        if (!bid_id) {
            res.status(422).send({ message: "bid_id is requierd" });
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
        let q = 'update Proposals ( details, pierod,price,bid_id ,user_id) set (?,?,?,?,?) where id = ?';
        let arg = [details, pierod, price, bid_id, user.id, id];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Proposal Updated sucessfully' });
        });
    },
    delete: (req, res) => {
        const id = req.body.id;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        db.get('Delete FROM Proposals WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

        });
        return res.status(200).send({ message: 'Proposal Deleted sucessfully' });
    },
}
export default Proposal
