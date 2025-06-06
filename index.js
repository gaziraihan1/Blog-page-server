require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
var admin = require("firebase-admin");

var serviceAccount = require("./assignment-11-authentication.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.decoded = decoded;
    next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
};

async function run() {
  try {
    await client.connect();

    const blogCollection = client.db("blogCollection").collection("blogs");
    const commentCollection = client.db("blogCollection").collection("comments");


    app.get("/blog", async (req, res) => {
      const category = req.query.category;
      const filter = category ? { category } : {};
      const result = await blogCollection.find(filter).toArray();
      res.send(result);
    });
    app.get("/blog/:id", verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    app.post("/blog", async (req, res) => {
      const data = req.body;
      const result = await blogCollection.insertOne(data);
      res.send(result);
    });

    app.get("/comment", async(req, res) => {
      const result = await commentCollection.find().toArray();
      res.send(result)
    })

    app.post("/comment", async(req,res) => {
      const data = req.body;
      const result = await commentCollection.insertOne(data);
      res.send(result)
    })

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
