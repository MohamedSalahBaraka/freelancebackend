// Import express module
import express from 'express';
import User from './Controller/User.js';
import { auth, isAdmin } from './middelware/Auth.js';
import { upload } from './Upload.js';
import multer from 'multer';
import Bid from './Controller/Bid.js';
import Proposal from './Controller/Proposal.js';
import Phone from './Controller/Phone.js';
import City from './Controller/City.js';
import Skil from './Controller/Skil.js';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import db from './db.js';
import { getUsersWithMessages } from './getmessages.js';
import Api from './Controller/Api.js';
import Subscription from './Controller/Subscription.js';

// Create an express application
const app = express();
const server = createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.status(200).send("<h1>Hello GFG Learner!</h1>");
});
app.use(express.json());
// Define a custom middleware function
app.use(cors());

// Use the custom middleware for all routes
app.use('/dashboard', auth);
app.use('/dashboard', isAdmin);
app.use('/api', auth);
app.use('/uploads', express.static('uploads'));

// socket .io

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        db.get('SELECT * FROM users WHERE token = ?', [token], (err, row) => {
            // Handle any errors
            if (err) {
                return next(new Error("server Error"));
            }
            // Check if the row exists
            if (row) {
                socket.username = row.name;
                socket.userID = row.id;
                next();
            } else {
                // If no, send a 404 not found response
                return next(new Error("invalid token"));
            }
        });
    } else {
        return next(new Error("no token"));
    }
});
io.on("connection", (socket) => {
    console.log("user connected", socket.userID)

    // let q = `update users set connected = 1 where id = ${socket.userID}`;
    // db.get(q, (err, row) => {
    //     if (err)
    //         console.log(err)
    // });
    socket.join(`user${socket.userID}`);

    getUsersWithMessages(socket.userID, socket)

    console.log(io.sockets.adapter.rooms);

    socket.on("private message", ({ content, touser, index }) => {
        let q = 'insert into message (content, fromuser, touser ) values (?,?,?)';
        db.get(q + ' RETURNING created_at', [content, socket.userID, touser], (err, row) => {
            if (err) {
                console.log(err)
                socket.emit("message error", { message: "something went wrong", index, err });
            } else {
                socket.emit("message success", { message: "message is saved", index });
                const message = {
                    content,
                    create_at: row.created_at,
                    isfrom: false,
                };
                let query2 = `SELECT connected FROM users WHERE id = ${touser}`;
                console.log("we here");
                socket.to(`user${touser}`).emit("private message", { message, userId: socket.userID });
                db.get(query2, function (err2, row2) {
                    if (err2) {
                        // Handle any errors
                        console.error(err2);
                    } else {
                        if (row2.connected == 1)
                            console.log("we here");
                        // todo send notifications
                    }
                });

            }
        });
    });

    // notify users upon disconnection
    socket.on("disconnect", async () => {
        console.log("user disconnected");
        let q = `update users set connected = 0 where id = ${socket.userID}`;
        db.get(q, (err, row) => { });
    });
});
// Define a route for getting all users

app.post('/login', (req, res) => User.login(req, res));
app.get('/api/logout', (req, res) => User.logout(req, res));



app.post('/dashboard/users/subscripe', (req, res) => User.subscripe(req, res));
app.get('/dashboard/users', (req, res) => User.get(req, res));
app.get('/dashboard/users/createData', (req, res) => User.createData(req, res));
app.get('/dashboard/users/:id', (req, res) => User.find(req, res));
app.get('/dashboard/users/edit/:id', (req, res) => User.edit(req, res));
app.post('/dashboard/users', function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log("A Multer error occurred when uploading.: ", err);
            // A Multer error occurred when uploading.
        } else if (err) {
            console.log("An unknown error occurred when uploading..: ", err);
            // An unknown error occurred when uploading.
        }
        User.create(req, res)
        // Everything went fine.
    })
});
app.put('/dashboard/users', function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log("A Multer error occurred when uploading.: ", err);
            // A Multer error occurred when uploading.
        } else if (err) {
            console.log("An unknown error occurred when uploading..: ", err);
            // An unknown error occurred when uploading.
        }
        User.update(req, res)
        // Everything went fine.
    })
});
app.delete('/dashboard/users/:id', (req, res) => User.delete(req, res));


app.get('/dashboard/bids', (req, res) => Bid.get(req, res));
app.get('/dashboard/bids/:id', (req, res) => Bid.find(req, res));
app.get('/dashboard/bids/edit/:id', (req, res) => Bid.edit(req, res));
app.get('/dashboard/bids/createData', (req, res) => Bid.createData(req, res));
app.post('/dashboard/bids', (req, res) => Bid.create(req, res));
app.put('/dashboard/bids', (req, res) => Bid.update(req, res));
app.delete('/dashboard/bids/:id', (req, res) => Bid.delete(req, res));

app.get('/dashboard/proposals', (req, res) => Proposal.get(req, res));
app.get('/dashboard/proposals/:id', (req, res) => Proposal.find(req, res));
app.post('/dashboard/proposals', (req, res) => Proposal.create(req, res));
app.put('/dashboard/proposals', (req, res) => Proposal.update(req, res));
app.delete('/dashboard/proposals/:id', (req, res) => Proposal.delete(req, res));

app.get('/dashboard/city', (req, res) => { City.get(req, res) });
app.get('/dashboard/city/:id', (req, res) => City.find(req, res));
app.post('/dashboard/city', (req, res) => City.create(req, res));
app.put('/dashboard/city', (req, res) => City.update(req, res));
app.delete('/dashboard/city/:id', (req, res) => City.delete(req, res));

app.get('/dashboard/phone', (req, res) => { Phone.get(req, res) });
app.get('/dashboard/phone/:id', (req, res) => Phone.find(req, res));
app.post('/dashboard/phone', (req, res) => Phone.create(req, res));
app.put('/dashboard/phone', (req, res) => Phone.update(req, res));
app.delete('/dashboard/phone/:id', (req, res) => Phone.delete(req, res));

app.get('/dashboard/Subscription', (req, res) => { Subscription.get(req, res) });
app.get('/dashboard/Subscription/:id', (req, res) => Subscription.find(req, res));
app.post('/dashboard/Subscription', (req, res) => Subscription.create(req, res));
app.put('/dashboard/Subscription', (req, res) => Subscription.update(req, res));
app.delete('/dashboard/Subscription/:id', (req, res) => Subscription.delete(req, res));

app.get('/dashboard/skils', (req, res) => Skil.get(req, res));
app.get('/dashboard/skils/:id', (req, res) => Skil.find(req, res));
app.post('/dashboard/skils', (req, res) => Skil.create(req, res));
app.put('/dashboard/skils', (req, res) => Skil.update(req, res));
app.delete('/dashboard/skils/:id', (req, res) => Skil.delete(req, res));

// api requsets

app.get('/api/subscription', (req, res) => Api.subscription(req, res));
app.get('/api/user', (req, res) => Api.user(req, res));
app.post('/api/home', (req, res) => Api.home(req, res));
app.post('/api/mybids', (req, res) => Api.mybids(req, res));
app.post('/api/findworkers', (req, res) => Api.findworkers(req, res));
app.post('/register', function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log("A Multer error occurred when uploading.: ", err);
            // A Multer error occurred when uploading.
        } else if (err) {
            console.log("An unknown error occurred when uploading..: ", err);
            // An unknown error occurred when uploading.
        }
        Api.register(req, res)
        // Everything went fine.
    })
});
app.post('/api/updateInfo', function (req, res) {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log("A Multer error occurred when uploading.: ", err);
            // A Multer error occurred when uploading.
        } else if (err) {
            console.log("An unknown error occurred when uploading..: ", err);
            // An unknown error occurred when uploading.
        }
        Api.updateInfo(req, res)
        // Everything went fine.
    })
});
app.get('/api/editUser', (req, res) => Api.editUser(req, res));
app.post('/api/updatePassword', (req, res) => Api.updatePassword(req, res));
app.post('/api/addProposal', (req, res) => Api.addProposal(req, res));
app.get('/api/myProposals', (req, res) => Api.myProposals(req, res));
app.get('/api/markBidAsDone/:id', (req, res) => Api.markBidAsDone(req, res));
app.post('/api/updateProposal', (req, res) => Api.updateProposal(req, res));
app.get('/api/deleteProposal/:id', (req, res) => Api.deleteProposal(req, res));
app.get('/api/startChat/:id', (req, res) => Api.startChat(req, res));
app.get('/bids/createData', (req, res) => Bid.createData(req, res));
app.get('/api/bids/edit/:id', (req, res) => Bid.edit(req, res));
app.post('/api/bids', (req, res) => Api.createBid(req, res));
app.put('/api/bids', (req, res) => Api.updateBid(req, res));
app.delete('/api/bids/:id', (req, res) => Bid.delete(req, res));


// Start the server on port 3000
server.listen(3030, () => {
    // Print a message when the server is ready
    console.log('Server is running on http://localhost:3000');
});
