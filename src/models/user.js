const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const validator = require('validator');
const Task = require('./task');

//creating Schema
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Email is invalid")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error("Weak Password")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be positive no.')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

//virtual field/property
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

//hidding the private data i.e password and tokens array
userSchema.methods.toJSON = function () {
    const user = this;
    userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);  //generating jwt token
    user.tokens = user.tokens.concat({ token });  //adding the generated token to the tokens array in user document
    await user.save();
    return token;
};

//model method to authenticate user credentials 
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Unable to login');
    }

    //comparing the password from the request to the hashed password stored in database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }
    return user;
}

//hashing the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this;  //user contains the instance of the user object binded to 'this'
    if (user.isModified('password')) {         //password is hashed only if it is modified or new user is created
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

//delete user tasks when the user is removed
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id })
    next();
});

//creating user model
const User = mongoose.model('User', userSchema);

module.exports = User;