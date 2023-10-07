// Import sqlite3 module
import sqlite3s from 'sqlite3';
const sqlite3 = sqlite3s.verbose();

// Connect to the database file
const db = new sqlite3.Database('database.sqlite');

// Define a function that takes a userid as a parameter
export function getUsersWithMessages(userid, socket) {
    // Create an empty object to store the results
    const users = {};

    // Query the database to get all the messages involving the userid
    // Use parameterized query to prevent SQL injection
    const query = `SELECT m.*, t.name as toname, t.photo as tophoto, f.name as fromname, f.photo as fromphoto FROM message m  LEFT JOIN users t ON m.touser = t.id LEFT JOIN users f ON m.fromuser = f.id  WHERE fromuser = ? OR touser = ? ORDER BY m.created_at DESC`;
    const params = [userid, userid];
    let userids = [];
    // Use db.each to iterate over each row of the result
    db.all(query, params, (err, rows) => {
        if (err) {
            // Handle any errors
            console.error('get messages 1', err);
        } else {
            rows.forEach(row => {
                // Get the other user's id from the row
                const otherid = row.fromuser == userid ? row.touser : row.fromuser;
                let index = userids.indexOf(otherid);
                // Check if the other user is already in the users object
                if (index != -1) {
                    // If yes, push the message to the message array
                    users[index].message.unshift({
                        content: row.content,
                        create_at: row.create_at,
                        isfrom: row.fromuser == userid
                    });
                } else {
                    userids.push(otherid);
                    index = userids.indexOf(otherid);
                    // Initialize the user object with photo, name, id, and message properties
                    users[index] = {
                        photo: row.fromuser == userid ? row.tophoto : row.fromphoto,
                        name: row.fromuser == userid ? row.toname : row.fromname,
                        id: otherid,
                        message: []
                    };

                    // Push the message to the message array
                    users[index].message.unshift({
                        create_at: row.create_at,
                        content: row.content,
                        isfrom: row.fromuser == userid
                    });
                    // If not, query the database to get the other user's details
                }
            });
            // Remove or comment out console.log before production
            console.log(users);
            // Return the users object
            socket.emit("users", users);
            return;
        }
    });
}
