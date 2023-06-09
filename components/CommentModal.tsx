import { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import Picker from "emoji-picker-react";
import { useRecoilState } from "recoil";
import { commentModalState, postIdState } from "../atoms/atoms";
import { Dialog, Transition } from "@headlessui/react";
import {
  Fragment,
  FunctionComponent,
  SyntheticEvent,
  useEffect,
  useState,
} from "react";
import {
  onSnapshot,
  doc,
  addDoc,
  collection,
  serverTimestamp,
} from "@firebase/firestore";
import { useSession } from "next-auth/react";
import {
  CalendarIcon,
  ChartBarIcon,
  FaceSmileIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useRouter } from "next/router";
import Moment from "react-moment";
import { db } from "../utils/firebase";
import { changedSessionType, PostType } from "../utils/typings";
import SelectedDate from "./Input/SelectedDate";

const CommentModal: FunctionComponent = () => {
  const {
    data: session,
  }: {
    data: null | changedSessionType;
    status: "loading" | "authenticated" | "unauthenticated";
  } = useSession();
  const [commentIsOpen, setCommentIsOpen] = useRecoilState(commentModalState);
  const [postId, setPostId] = useRecoilState(postIdState);
  const [post, setPost] = useState<PostType>();
  const [comment, setComment] = useState("");
  const router = useRouter();
  const [showEmojis, setShowEmojis] = useState(false);
  const [showDatesPanel, setShowDatesPanel] = useState(false);

  useEffect(
    () =>
      onSnapshot(doc(db, "posts", postId), (snapshot: any) => {
        setPost(snapshot.data());
      }),
    [db]
  );

  const sendComment = async (event: SyntheticEvent) => {
    event.preventDefault();

    await addDoc(collection(db, "posts", postId, "comments"), {
      comment: comment,
      username: session?.user?.name,
      tag: session?.user?.tag,
      userImg: session?.user?.image,
      timestamp: serverTimestamp(),
    });

    setCommentIsOpen(false);
    setComment("");

    router.push(`/${postId}`);
  };

  return (
    <Transition.Root show={commentIsOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-30 inset-0 pt-8"
        onClose={setCommentIsOpen}
      >
        <div className="flex items-start justify-center min-h-[800px] sm:min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-[#5b7083] bg-opacity-40 transition-opacity" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-black rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
              <div className="flex items-center px-1.5 py-2 border-b border-gray-700">
                <div
                  className="hoverAnimation w-9 h-9 flex items-center justify-center xl:px-0"
                  onClick={() => setCommentIsOpen(false)}
                >
                  <XMarkIcon className="h-[22px] text-white" />
                </div>
              </div>
              <div className="flex px-4 pt-5 pb-2.5 sm:px-6">
                <div className="w-full">
                  <div className="text-[#6e767d] flex gap-x-3 relative">
                    <span className="w-0.5 h-full z-[-1] absolute left-5 top-11 bg-gray-600" />
                    <img
                      src={post?.userImg}
                      alt=""
                      className="h-11 w-11 rounded-full"
                    />
                    <div>
                      <div className="inline-block group">
                        <h4 className="font-bold text-[#d9d9d9] inline-block text-[15px] sm:text-base">
                          {post?.username}
                        </h4>
                        <span className="ml-1.5 text-sm sm:text-[15px]">
                          @{post?.tag}{" "}
                        </span>
                      </div>{" "}
                      ·{" "}
                      <span className="hover:underline text-sm sm:text-[15px]">
                        <Moment fromNow>{post?.timestamp?.toDate()}</Moment>
                      </span>
                      <p className="text-[#d9d9d9] text-[15px] sm:text-base">
                        {post?.text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex space-x-3 w-full">
                    <img
                      src={session?.user?.image as string}
                      alt=""
                      className="h-11 w-11 rounded-full"
                    />
                    <div className="flex-grow mt-2">
                      <textarea
                        value={comment}
                        onClick={() => setShowEmojis(false)}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tweet your reply"
                        rows={7}
                        className="bg-transparent outline-none text-[#d9d9d9] text-lg placeholder-gray-500 tracking-wide w-full min-h-[80px]"
                      />

                      <div className="flex items-center justify-between pt-2.5">
                        <div className="flex items-center">
                          <div
                            className="icon"
                            onClick={() => setShowEmojis(false)}
                          >
                            <PhotoIcon className="text-[#1d9bf0] h-[22px]" />
                          </div>

                          <div
                            className="icon rotate-90"
                            onClick={() => setShowEmojis(false)}
                          >
                            <ChartBarIcon className="text-[#1d9bf0] h-[22px]" />
                          </div>

                          <div
                            className="icon"
                            onClick={() => setShowEmojis(!showEmojis)}
                          >
                            <FaceSmileIcon className="h-[22px] text-[#1d9bf0]" />
                          </div>

                          {showEmojis && (
                            <div className="absolute z-50 -mt-32 -ml-10 max-w-xs rounded-2xl">
                              <Picker
                                onEmojiClick={(
                                  emojiObject: EmojiClickData,
                                  event: MouseEvent
                                ): void => {
                                  setComment(comment + emojiObject.emoji);
                                }}
                                emojiStyle={EmojiStyle.TWITTER}
                              />
                            </div>
                          )}

                          {showDatesPanel && (
                            <SelectedDate
                              showDatesPanel={showDatesPanel}
                              setShowDatesPanel={setShowDatesPanel}
                              setInput={setComment}
                              input={comment}
                            />
                          )}

                          <div
                            className="icon"
                            onClick={() => {
                              setShowEmojis(false);
                              setShowDatesPanel(true);
                            }}
                          >
                            <CalendarIcon className="text-[#1d9bf0] h-[22px]" />
                          </div>
                        </div>
                        <button
                          className="bg-[#1d9bf0] text-white rounded-full px-4 py-1.5 font-bold shadow-md hover:bg-[#1a8cd8] disabled:hover:bg-[#1d9bf0] disabled:opacity-50 disabled:cursor-default"
                          type="submit"
                          onClick={sendComment}
                          disabled={!comment.trim()}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CommentModal;
