import {
  S3Client,
  GetObjectCommand,
  GetObjectAclCommandInput,
  GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { Router, Request, Response } from "express";
import { readFile, writeFile } from "fs/promises";
import config from "config";
import path from "path";
import { gunzip, createGunzip } from "zlib";

const client = new S3Client({
  region: config.get("AWS.region"),
});

export const router = Router();

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

router.get("/", async (req, res) => {
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
//    console.log(JSON.stringify(trees[0]));
    res.send(`Number of trees downloaded is: ${trees.length}`);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/compress", async (req: Request, res: Response) => {
  let data = req.body;
});

async function getPIDS() {
  // let fileName = "small-pids.txt";
  // let fileName = "test-group-pids.txt";
  let fileName = "pids.txt";
  console.log(__dirname)
  return readFile(path.resolve(__dirname, fileName)).then((data) =>
    Buffer.from(data).toString("utf-8").split("\n")
  );
}

function createGetRequest(pid: string): Promise<string> {
  const gzipped = new GetObjectCommand({
    Bucket: config.get("S3.bucketName"),
    // Key: `kevin-test-group/${pid}.gz`,
    Key: pid,
  });
  // const command = new GetObjectCommand({
  //   Bucket: "rf-tree-downloads",
  //   Key: pid,
  // });
  return client
    .send(gzipped)
    .then((data) => {
//      console.log(`Converting to string pid: ${pid}`);
      return streamToString(data.Body);
    })
    .then((tree) => {
      // writeFile(`./tree-data/test-group/${pid}`, tree);
      return tree;
    });
}

function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    // stream.pipe(createGunzip());
    stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

// function gunzipString(buff: Buffer): Promise<Buffer> {
//   return new Promise((resolve, reject) => {
//     gunzip(buff, (err, data) => {
//       if(err) {
//         reject(err)
//       }
//       resolve(data);
//     })
//   })
// }
