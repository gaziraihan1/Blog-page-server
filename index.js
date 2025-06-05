require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

const uri = `mongodb+srv://${process.env.MONGO_NAME}:${process.env.MONGO_PASS}@cluster-1.${process.env.CLUSTER_CODE}.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-1`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const blogCollection = client.db("blogCollection").collection("blogs");

    app.get("/blog", async (req, res) => {
      const category = req.query.category;
      const filter = category ? {category}: {};
      const result = await blogCollection.find(filter).toArray();
      res.send(result);
    });

    app.post("/blog", async (req, res) => {
      const data = req.body;
      const result = await blogCollection.insertOne(data);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
