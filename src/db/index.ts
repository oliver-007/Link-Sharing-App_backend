import { connect } from "mongoose";

const dbConnect = async () => {
  try {
    const connectionInstance = await connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`
    );
    console.log(
      ` 〽️ MongoDB connection Success ! DB HOST : ${connectionInstance.connection.host} `
    );
  } catch (error) {
    console.log("mongDB connection FAILED : ❌ ", error);
    process.exit(1);
  }
};

export default dbConnect;
