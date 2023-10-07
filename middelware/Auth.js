import db from "../db.js";
export let user;
export function auth(req, res, next) {
    // Log the request method and URL
    const authHeader = req.headers.authorization; // or req.get('authorization')
    if (authHeader) {
        const token = authHeader.split(' ')[1]; // get the token
        db.get('SELECT * FROM users WHERE token = ?', [token], (err, row) => {
            // Handle any errors
            if (err) {
                return res.status(500).send(err.message);
            }
            // Check if the row exists
            if (row) {
                // If yes, send the user data as JSON
                user = row;
                next();
            } else {
                // If no, send a 404 not found response
                res.status(401).send({ message: "wrong token" });
            }
        });

    } else {
        res.status(403).send({ message: "not authorize" });
        // handle the case when there is no authorization header
    }

    // Call the next function in the stack

}
export function isAdmin(req, res, next) {
    // Log the request method and URL
    if (user.type == 'admin')
        next();
    else
        res.status(401).send({ message: "Unauthorized" });
}