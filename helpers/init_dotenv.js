if (process.env.NODE_ENV !== "production") {
  try {
    const dotenv = require("dotenv");
    if (dotenv) {
      dotenv.config();
      console.log("Loaded environment variables using dotenv");
    }
  } catch (err) {
    console.log("dotenv package not installed, skipping dotenv way...");
  }
}
