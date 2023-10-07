import db from "../db.js";

const Subscription = {
    get: (req, res) => {
        // Execute a SQL query to get all users from the database
        db.all(`SELECT * FROM Subscriptions order BY type `, (err, rows) => {
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
        db.get('Select * from Subscriptions WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                return res.status(200).send({ subscription: row });
            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    },
    create: (req, res) => {
        const price = req.body.price;
        const period = req.body.period;
        const type = req.body.type;
        if (!price) {
            res.status(422).send({ message: "price is requierd" });
            return
        }
        if (!period) {
            res.status(422).send({ message: "period is requierd" });
            return
        }
        if (!type) {
            res.status(422).send({ message: "type is requierd" });
            return
        }
        let q = 'insert into Subscriptions (type, price, period) values (?,?,?)';
        let arg = [type, price, period];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Subscription created sucessfully' });
        });

    },
    update: (req, res) => {
        const id = req.body.id;
        const price = req.body.price;
        const period = req.body.period;
        if (!price) {
            res.status(422).send({ message: "price is requierd" });
            return
        }
        if (!period) {
            res.status(422).send({ message: "period is requierd" });
            return
        }
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        db.get('SELECT * FROM Subscriptions WHERE id = ?', [id], (err, row) => {
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
        let q = 'update Subscriptions set  period = ?, price = ? where id = ?';
        let arg = [period, price, id];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Subscription Updated sucessfully' });
        });
    },
    delete: (req, res) => {
        // Get the id from the request parameters
        const id = req.params.id;

        // Call the function to delete the Subscription by id
        deleteSubscriptionById(id, (error) => {
            // Check for errors
            if (error) {
                // Send a 500 status code and an error message
                res.status(500).send(error.message);
            } else {
                // Send a 200 status code and a success message
                res.status(200).send(`Subscription with id ${id} deleted successfully`);
            }
        });
    },
}
export default Subscription
const deleteSubscriptionById = (id, callback) => {
    // Use db.run() to execute a SQL statement
    db.run("DELETE FROM Subscriptions WHERE id = ?", [id], (error) => {
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