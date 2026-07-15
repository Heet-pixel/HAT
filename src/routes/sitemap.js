import express from "express";
import { SitemapStream, streamToPromise } from "sitemap";

const router = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const smStream = new SitemapStream({
      hostname: "https://eadronix.com",
    });

    smStream.write({ url: "/", changefreq: "daily", priority: 1.0 });
    smStream.write({ url: "/login", changefreq: "weekly", priority: 0.9 });
    smStream.write({ url: "/student", changefreq: "daily", priority: 0.8 });
    smStream.write({ url: "/teacher", changefreq: "daily", priority: 0.8 });
    smStream.write({ url: "/hod", changefreq: "daily", priority: 0.8 });
    smStream.write({ url: "/admin", changefreq: "daily", priority: 0.8 });
    smStream.write({ url: "/super-admin", changefreq: "daily", priority: 0.8 });

    smStream.end();

    const sitemap = await streamToPromise(smStream);

    res.header("Content-Type", "application/xml");
    res.send(sitemap.toString());
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

export default router;