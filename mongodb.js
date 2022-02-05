//CRUD op.

// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;
// const ObjectID = mongodb.ObjectId;

const { MongoClient } = require('mongodb');

const connectionURL = 'mongodb://127.0.0.1:27017';
const databaseName = 'task-manager';

MongoClient.connect(connectionURL, { useNewUrlParser: true }, (error, client) => {
    if (error) {
        return console.log('Unable to connect to database!')
    }

    const db = client.db(databaseName);

    // db.collection('tasks').findOne({ _id: new ObjectId("61e81a0f69c541b3d711f2eb") }, (error, task) => {
    //     if (error) {
    //         console.log('enable to fetch');
    //     }

    //     console.log(task);
    // })

    // db.collection('tasks').find({ completed: false }).toArray((error, tasks) => {
    //     console.log(tasks);
    // });
    // db.collection('tasks').find({ completed: false }).count((error, count) => {
    //     console.log(count);
    // });

    // db.collection('users').updateOne({
    //     _id: new ObjectId("61e813f945903a2be154465c")
    // }, {
    //     $inc: {
    //         age: 1
    //     }
    // }).then((result) => {
    //     console.log(result);
    // }).catch((error) => {
    //     console.log(error);
    // })

    // db.collection('tasks').updateMany({
    //     completed: false
    // }, {
    //     $set: {
    //         completed: true
    //     }
    // }).then((result) => console.log(result))
    //     .catch((error) => console.log(error))

    // db.collection('users').deleteMany({
    //     name: 'Ashutosh'
    // }).then((result) => {
    //     console.log(result);
    // }).catch((error) => {
    //     console.log(error);
    // })
});
