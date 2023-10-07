import db from "../db.js";

const City = {
    get: (req, res) => {
        // Execute a SQL query to get all users from the database
        db.all(`SELECT * FROM Citys`, (err, rows) => {
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
        db.get('Select * from Citys WHERE id = ?', [id], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            if (row) {
                return res.status(200).send({ city: row });
            } else {
                return res.status(404).send({ message: "not Found" });
            }
        });
    },
    create: (req, res) => {
        const name = req.body.name;
        if (!name) {
            res.status(422).send({ message: "name is requierd" });
            return
        }
        let q = 'insert into Citys ( name) values (?)';
        let arg = [name];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'City created sucessfully' });
        });

    },
    update: (req, res) => {
        const id = req.body.id;
        const name = req.body.name;
        if (!id) {
            res.status(422).send({ message: "id is requierd" });
            return
        }
        if (!name) {
            res.status(422).send({ message: "name is requierd" });
            return
        }
        db.get('SELECT * FROM Citys WHERE id = ?', [id], (err, row) => {
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
        let q = 'update Citys set  name = ? where id = ?';
        let arg = [name, id];
        db.get(q, arg, (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists

            return res.status(200).send({ message: 'City Updated sucessfully' });
        });
    },
    delete: (req, res) => {
        // Get the id from the request parameters
        const id = req.params.id;

        // Call the function to delete the city by id
        deleteCityById(id, (error) => {
            // Check for errors
            if (error) {
                // Send a 500 status code and an error message
                res.status(500).send(error.message);
            } else {
                // Send a 200 status code and a success message
                res.status(200).send(`City with id ${id} deleted successfully`);
            }
        });
    },
}
export default City
const deleteCityById = (id, callback) => {
    // Use db.run() to execute a SQL statement
    db.run("DELETE FROM citys WHERE id = ?", [id], (error) => {
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