import db from "../db.js";

const Phone = {
    get: (req, res) => {
        // Execute a SQL query to get all users from the database
        db.all(`SELECT * FROM phones`, (err, rows) => {
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
        db.get('Select * from phones WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                return res.status(200).send({ phone: row });
            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    },
    create: (req, res) => {
        const number = req.body.number;
        if (!number) {
            res.status(422).send({ message: "number is requierd" });
            return
        }
        let q = 'insert into phones ( number) values (?)';
        let arg = [number];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Phone created sucessfully' });
        });

    },
    update: (req, res) => {
        const id = req.body.id;
        const number = req.body.number;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        if (!number) {
            res.status(422).send({ message: "number is requierd" });
            return
        }
        db.get('SELECT * FROM phones WHERE id = ?', [id], (err, row) => {
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
        let q = 'update phones set  number = ? where id = ?';
        let arg = [number, id];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'Phone Updated sucessfully' });
        });
    },
    delete: (req, res) => {
        // Get the id from the request parameters
        const id = req.params.id;

        // Call the function to delete the Phone by id
        deletePhoneById(id, (error) => {
            // Check for errors
            if (error) {
                // Send a 500 status code and an error message
                res.status(500).send(error.message);
            } else {
                // Send a 200 status code and a success message
                res.status(200).send(`Phone with id ${id} deleted successfully`);
            }
        });
    },
}
export default Phone;
const deletePhoneById = (id, callback) => {
    // Use db.run() to execute a SQL statement
    db.run("DELETE FROM phones WHERE id = ?", [id], (error) => {
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