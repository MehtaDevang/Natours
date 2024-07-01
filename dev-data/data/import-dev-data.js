const fs = require("fs");
// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require("../../models/tourModel");

dotenv.config({path: './config.env'});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log("DB connection successful!");
});

// read json file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// import data into database
const importData = async () => {
    try{
        await Tour.create(tours);
        console.log("Data successfully loaded!!!");
    } catch(err) {
        console.log(err);
    }

    process.exit();
}

// delete all data from db
const deleteData = async () => {
    try{
        console.log(tours.length);
        await Tour.deleteMany();
        console.log("Data deleted successfully!!!");
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

if(process.argv[2] === '--import'){
    importData();
}
else if (process.argv[2] === '--delete'){
    deleteData();
}
console.log(process.argv);