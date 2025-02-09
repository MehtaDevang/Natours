// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({path: './config.env'});

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("DB connection successful!");
})


// getting the environment variable set by express
// console.log(app.get('env'));

// getting the envs set by node
// console.log(process.env);

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`app running on port ${port}...`);
});
