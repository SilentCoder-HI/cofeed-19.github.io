import Head from "next/head";
import React, { useEffect, useState } from "react";
import RSSParser from "rss-parser";
import { PostLink } from "../components/PostLink";

import { NewFeedForm } from "../components/NewFeedForm";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";

const rssParser = new RSSParser();

function allStorage(): FeedArchiveType {
  const archive: FeedArchiveType = {};

  for (const key of Object.keys(localStorage)) {
    const item = localStorage.getItem(key);
    if (item) {
      archive[key] = JSON.parse(item);
    }
  }

  return archive;
}

interface Feed extends RSSParser.Output<RSSParser.Item> {
  old: Record<string, boolean>;
}

type FeedArchiveType = Record<string, Feed>;

export default function Home() {
  const [feedArchive, setFeedArchive] = useState<FeedArchiveType>({});

  async function onSubmit(newFeed: string): Promise<void> {
    const newFeeds = newFeed.split(",").filter(Boolean);

    const errors = [];

    for (const feedUrl of newFeeds) {
      try {
        const feed = await rssParser.parseURL(feedUrl);
        if (!localStorage.getItem(feedUrl)) {
          const feedToAdd: Feed = {
            ...feed,
            old: {},
          };
          localStorage.setItem(feedUrl, JSON.stringify(feedToAdd));
        }
      } catch (_e) {
        errors.push(feedUrl);
      }
    }
    if (errors.length) {
      alert(
        `Could not add:${errors.join(
          "\n"
        )}\n\nProbable CORS issue😢!\nMaybe ask website owner to enable CORS🤔!`
      );
    }
    window.location.reload();
  }

  function onLinkClick(feedUrl: string, itemLink?: string) {
    if (!feedUrl || !itemLink) {
      return;
    }
    const rawFeed: string | null = localStorage.getItem(feedUrl);
    if (rawFeed) {
      const feed: Feed = JSON.parse(rawFeed);
      console.log(feed);

      feed.old[itemLink] = true;
      localStorage.setItem(feedUrl, JSON.stringify(feed));
    }
  }

  useEffect(() => {
    const storage = allStorage();
    setFeedArchive(storage);
    console.log({ storage });
  }, []);

  return (
    <div>
      <Head>
        <title>Free web feed</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main>
        <NewFeedForm onSubmit={onSubmit} />
        {Object.keys(feedArchive).map((feedKey) => {
          const feed = feedArchive[feedKey];
          return (
            <div key={feedKey}>
              <h2>{feed?.title}</h2>
              {feed?.items
                .filter((item) => item.link && !feed.old[item.link])
                .map((item) =>
                  item.title && item.link ? (
                    <PostLink
                      key={item.link}
                      title={item.title}
                      link={item.link}
                      onClick={() => onLinkClick(feedKey, item.link)}
                    />
                  ) : null
                )}
              {Object.keys(feed.old).length ? (
                <details>
                  <summary>Visited from {feed?.title}</summary>
                  {feed?.items
                    .filter((item) => item.link && feed.old[item.link])
                    .map((item) =>
                      item.title && item.link ? (
                        <PostLink
                          key={item.link}
                          title={item.title}
                          link={item.link}
                          onClick={() => onLinkClick(feedKey, item.link)}
                        />
                      ) : null
                    )}
                </details>
              ) : null}
            </div>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
