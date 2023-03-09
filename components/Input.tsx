import {
  CalendarIcon,
  ChartBarIcon,
  FaceSmileIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
// import Picker from "emoji-mart";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "@firebase/firestore";
import { getDownloadURL, ref, uploadString } from "@firebase/storage";
import "emoji-mart/css/emoji-mart.css";
import { db, storage } from "../utils/firebase";
import { useSession } from "next-auth/react";

export default function Input() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const filePickerRef = useRef<any>(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const { data: session } = useSession();
  const addImageToPost = (e: any) => {
    const reader = new FileReader();
    // FileReader Lets web applications asynchronously read the contents of files (or raw data buffers) stored on the user's computer, using File or Blob objects
    if (e.target.files[0]) {
      // e.target.files[0] is d blob
      reader.readAsDataURL(e.target.files[0]);
    }
    reader.onload = (readerEvent: any) => {
      //getting d event & setting it as selectedFile
      setSelectedFile(readerEvent?.target.result);
    };
  };

  const addEmoji = (e: any) => {
    let sym = e.unified.split("-");
    let codesArray: any[] = [];
    sym.forEach((el: any) => codesArray.push("0x" + el));
    let emoji = String.fromCodePoint(...codesArray);
    setInput(input + emoji);
  };

  const sendPost = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // addDoc: add new document to collection of 'posts' & d data inside document will be {text, timestamp} // 'posts' collection will be in db.
      const docRef = await addDoc(collection(db, "posts"), {
        // id: session.user.uid,
        // username: session.user.name,
        // userImg: session.user.image,
        // tag: session.user.tag,
        text: input,
        timestamp: serverTimestamp(), // return timestamp value
      });

      // ref from firebase/storage return a storage refrence for the given url(d url of file inside storage)
      const imageRef = ref(storage, `posts/${docRef.id}/image`);

      if (selectedFile) {
        // Uploads a string/value to this object's-location/ref. // return a Promise containing an UploadResult
        await uploadString(imageRef, selectedFile, "data_url").then(
          async () => {
            const downloadURL = await getDownloadURL(imageRef); // Returns the download URL for the given StorageReference.
            // updateDoc Updates fields in the document referred to by the specified DocumentReference.
            // doc Gets a DocumentReference instance that refers to the document at the specified absolute path.
            await updateDoc(doc(db, "posts", docRef.id), {
              image: downloadURL,
            });
          }
        );
      }
    } catch (error: any) {
      alert("Error! " + error.message);
    }

    setLoading(false);
    setInput("");
    setSelectedFile(null);
    setShowEmojis(false);
  };

  // divide-y added border top & bottom for each elem in container.
  return (
    <div
      className={`flex space-x-3 overflow-y-scroll border-b border-gray-700 p-3 scrollbar-hide ${
        loading && "opacity-60"
      }`}
    >
      <img
        src={session?.user?.image || "images/people(1).png"}
        alt=""
        className="h-11 w-11 cursor-pointer rounded-full"
        onClick={() => {}}
      />
      <div className="w-full divide-y divide-gray-700">
        <div className={` ${input && "space-y-2.5"}`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you thinking about?"
            rows={2}
            className="min-h-[50px] w-full bg-transparent text-lg tracking-wide text-[#d9d9d9] placeholder-gray-500 outline-none"
          />

          {selectedFile && (
            <div className="relative">
              <div
                className="absolute top-1 left-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#15181c] bg-opacity-75 hover:bg-[#272c26]"
                onClick={() => setSelectedFile(null)}
              >
                <XMarkIcon className="h-5 text-white" />
              </div>
              <img src={selectedFile} alt="" className="max-h-80 rounded-2xl" />
            </div>
          )}
        </div>
        {!loading && (
          <div className="flex items-center justify-between pt-2.5">
            <div className="flex items-center">
              <div
                className="icon"
                onClick={() => filePickerRef.current?.click()}
              >
                <PhotoIcon className="h-[22px] text-[#1d9bf0]" />
                <input
                  type="file"
                  ref={filePickerRef}
                  hidden
                  onChange={addImageToPost}
                />
              </div>
              <div className="icon rotate-90">
                <ChartBarIcon className="h-[22px] text-[#1d9bf0]" />
              </div>

              <div className="icon" onClick={() => setShowEmojis(!showEmojis)}>
                <FaceSmileIcon className="h-[22px] text-[#1d9bf0]" />
              </div>

              <div className="icon">
                <CalendarIcon className="h-[22px] text-[#1d9bf0]" />
              </div>
              {/* {showEmojis && (
                <Picker
                  onSelect={addEmoji}
                  style={{
                    position: "absolute",
                    marginTop: "465px",
                    marginLeft: -40,
                    maxWidth: "320px",
                    borderRadius: "20px",
                  }}
                  theme="dark"
                />
              )} */}
            </div>
            <button
              className="rounded-full bg-[#1d9bf0] px-4 py-1.5 font-bold text-white shadow-md hover:bg-[#1a8cd8] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-[#1d9bf0]"
              disabled={!input && !selectedFile}
              onClick={sendPost}
            >
              Tweet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
