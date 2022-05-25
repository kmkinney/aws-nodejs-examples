import {
  S3Client,
  GetObjectCommand,
  GetObjectAclCommandInput,
  GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { Router } from "express";
import { readFile, writeFile } from "fs/promises";

const client = new S3Client({
  region: "us-west-2",
});

export const router = Router();

router.get("/", (req, res) => {
  res.send("Server listening");
});

router.get("/tree", async (req, res) => {
  try {
    let data = await readFile("./tree-data/KWJL-HRV.json").then((data) =>
      JSON.parse(data.toString())
    );
    await writeFile("./tree-data/processed.json", JSON.stringify(data));
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get("/s3", async (req, res) => {
  try {
    let pids = await getPIDS();
    let promises: Promise<string>[] = pids.map((pid) => createGetRequest(pid));

    let trees = await Promise.allSettled(promises)
      .then((results) => {
        console.log("All done!");
        return results;
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
        return [];
      });
    // console.log(JSON.stringify(trees[0]));
    res.send(`Number of trees downloaded is: ${trees.length}`);
  } catch (err) {
    res.status(500).send(err);
  }
});

async function getPIDS() {
  // let fileName = "small-pids.txt";
  let fileName = 'test-group-pids.txt'
  return readFile(`./tree-data/${fileName}`).then((data) =>
    Buffer.from(data).toString("utf-8").split("\n")
  );
}

function createGetRequest(pid: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: "rf-tree-downloads",
    Key: pid,
  });
  return client.send(command).then((data) => {
    console.log(`Converting to string pid: ${pid}`);
    return streamToString(data.Body);
  }).then((tree) => {
    // writeFile(`./tree-data/test-group/${pid}`, tree);
    return tree;
  });
}

function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}
