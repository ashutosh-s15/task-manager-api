const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router(); //creating router

//task route handlers
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true' //the value is true is condition is satisfied and false if not
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');      //split() splits the query string into the sorting criteria(eg- completed) and sorting order(asc or desc)
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;  //-1 indicates descending order and 1 indicates ascending
    }

    try {
        // const tasks = await Task.find({ owner: req.user._id }); res.send(tasks);
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                //limit and skip options are used for pagination of task data
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });

        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        updates.forEach((update) => {
            /*using square bracket notation to access user and body properties dynamically 
            instead of static way i.e user.name*/
            task[update] = req.body[update];
        });

        await task.save();

        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) {
            res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;