import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({
    path: "../.env"
})


const MONGODB_URI = process.env.MONGODB_CONNECTION_URI;
const DB_NAME = process.env.MONGODB_DATABASE_NAME;


if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

// console.log(global);

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    try {
        if (cached.conn) return cached.conn;

        if (!cached.promise) {
            const opts = {
                bufferCommands: false,
            };

            cached.promise = mongoose.connect(`${MONGODB_URI}/${DB_NAME}`, opts).then((mongoose) => {
                return mongoose;
            });
        }

        cached.conn = await cached.promise;
        console.log(`DB connected successfully...✅✅✅`);
        return cached.conn;
    } catch (error) {
        console.error('error connecting to db...', JSON.stringify(error));
        throw new Error("error connecting to db ❌❌❌");
    }
}

export default dbConnect;