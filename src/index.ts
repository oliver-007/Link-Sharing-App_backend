import "dotenv/config";
import dbConnect from "./db/index";
import { app } from "./app";

const startServer = async () => {
  try {
    // ************ DB CONNECTION *************
    await dbConnect();
    const port = process.env.PORT || 8000;

    app.listen(port, () => {
      console.log(`🚀 Server is running at port : ${port}`);
    });
  } catch (error) {
    console.log("MongoDB connection Failed ! ❌ ", error);
  }
};

// ********* SERVER START *********
startServer();
