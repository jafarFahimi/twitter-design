import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "@firebase/firestore";
import { getProviders, getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import Modal from "../components/CommentModal";
import Sidebar from "../components/Sidebar";
import Widgets from "../components/Widgets";
import Post from "../components/Post";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Head from "next/head";
import Login from "../components/Login";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { commentModalState } from "../atoms/atoms";
import { db } from "../utils/firebase";
import Comment from "../components/Comment";
import { changedSessionType } from "../utils/typings";

const PostPage: NextPage<any> = ({
  trendingResults = "",
  followResults = "",
  providers,
}) => {
  const [commentIsOpen, setCommentIsOpen] = useRecoilState(commentModalState);
  const [post, setPost] = useState<any>();
  const [comments, setComments] = useState<any>([]);
  const router = useRouter();
  const { postId } = router.query;
  const {
    data: session,
    status,
  }: {
    data: changedSessionType | null;
    status: "loading" | "authenticated" | "unauthenticated";
  } = useSession();

  // Warning: A title element received an array with more than 1 element as children. In browsers title Elements can only have Text Nodes as children. If the children being rendered output more than a single text node in aggregate the browser will display markup and comments as text in the title and hydration will likely fail and fall back to client rendering
  let titleText = `${post?.username} on Twitter: "${post?.text}"`;
  if (post?.username === undefined) titleText = "Twitter Design";

  useEffect(
    () =>
      onSnapshot(doc(db, "posts", postId as string), (snapshot) =>
        setPost(snapshot.data())
      ),
    [db]
  );

  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, "posts", postId as string, "comments"),
          orderBy("timestamp", "desc")
        ),
        (snapshot) => setComments(snapshot.docs)
      ),
    [db, postId]
  );

  if (!session) return <Login providers={providers} />;

  return (
    <div>
      <Head>
        <title>{titleText}</title>
      </Head>
      <main className="bg-black min-h-screen flex max-w-[1500px] mx-auto">
        <Sidebar />
        <div className="flex-grow border-l border-r border-gray-700 max-w-2xl sm:ml-[73px] xl:ml-[370px]">
          <div>
            <div className="flex items-center px-1.5 py-2 border-b border-gray-700 text-[#d9d9d9] font-semibold text-xl gap-x-4 sticky top-0 z-50 bg-black">
              <div
                className="hoverAnimation w-9 h-9 flex items-center justify-center xl:px-0"
                onClick={() => router.push("/")}
              >
                <ArrowLeftIcon className="h-5 text-white" />
              </div>
              Tweet
            </div>
            <Post id={postId as string} post={post} postPage />
          </div>

          {comments.length > 0 && (
            <div className="pb-72">
              {comments.map((comment: any) => (
                <Comment
                  key={comment.id}
                  id={comment.id}
                  comment={comment.data()}
                />
              ))}
            </div>
          )}
        </div>
        <Widgets
          trendingResults={trendingResults}
          followResults={followResults}
        />
        {commentIsOpen && <Modal />}
      </main>
    </div>
  );
};

export default PostPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  let trendingResults: {
    tweetText: string;
    tweets: number;
    trendingText: string;
  }[] = [];
  let followResults: {
    name: { title: string; first: string; last: string };
    login: {
      uuid: string;
      username: string;
      password: string;
      salt: string;
      md5: string;
      sha1: string;
      sha256: string;
    };
    picture: {
      large: string;
      medium: string;
      thumbnail: string;
    };
  }[] = [];

  try {
    trendingResults = [
      { trendingText: "Trending", tweetText: "LinkedIn", tweets: 23000 },
      {
        trendingText: "Technology - Trending",
        tweetText: "TypeScript",
        tweets: 13000,
      },
      {
        trendingText: "Politics - Trending",
        tweetText: "Taliban",
        tweets: 5400,
      },
      {
        trendingText: "Culture - Trending",
        tweetText: "New Year Eve",
        tweets: 900,
      },
      {
        trendingText: "Sport - trending",
        tweetText: "Qatar",
        tweets: 2300034,
      },
    ];
    const fetchedData: {
      results: [
        {
          name: { title: string; first: string; last: string };
          login: {
            uuid: string;
            username: string;
            password: string;
            salt: string;
            md5: string;
            sha1: string;
            sha256: string;
          };
          picture: {
            large: string;
            medium: string;
            thumbnail: string;
          };
        }
      ];
    } = await fetch(
      "https://randomuser.me/api/?results=30&inc=name,login,picture"
    ).then((res) => res.json());
    followResults = fetchedData.results;
  } catch (error) {
    if (error instanceof Error) console.log("error occured ", error.message);
  }

  const providers = await getProviders();
  const session = await getSession(context);

  return {
    props: {
      trendingResults,
      followResults,
      providers,
      session,
    },
  };
};
