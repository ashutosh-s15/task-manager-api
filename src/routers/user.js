const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const auth = require('../middleware/auth');

const router = new express.Router(); //creating router

//user route handlers
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(500).send(e);
    }

    // user.save().then(() => {
    //     res.status(201).send(user);
    // }).catch((e) => {
    //     res.status(400).send(e);
    // })
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const _id = req.user._id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true }); <-- this method bypasses the mongoose middleware

        // const user = await User.findById(_id);
        updates.forEach((update) => {
            /*using square bracket notation to access user and body properties dynamically 
            instead of static way i.e user.name*/
            req.user[update] = req.body[update];
        });

        await req.user.save();

        // if (!user) {
        //     return res.status(404).send();
        // }
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        // if (!user) {
        //     res.status(404).send();
        // }
        sendCancelationEmail(req.user.email, req.user.name);
        await req.user.remove();
        res.send(req.user);
    } catch (e) {
        res.status(500).send();
    }
});

//middleware and route handler for profile picture file uploads
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        //checking file extension using regEx inside .match() method
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    // req.user.avatar = req.file.buffer;
    req.user.avatar = buffer;

    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/users/:id/avatar', async (req, res) => {
    try {

        const user = await User.findById(req.params.id);
        if (!user && !user.avatar) {
            throw new Error();
        }
        res.set('Content-Type', 'image/png'); //setting up the header of the response
        res.send(user.avatar);

    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;