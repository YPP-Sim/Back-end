const mongoose = require("mongoose");

mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB: ", err.message);
  });

mongoose.connection.on("error", (err) =>
  console.log("MongoDB error: ", err.message)
);

mongoose.connection.on("disconnected", () =>
  console.log("Disconnected from MongoDB")
);
