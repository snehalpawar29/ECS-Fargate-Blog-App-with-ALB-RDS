import { useEffect, useState } from "react";
import axios from "axios";

const API = "/api";
export default function App() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  const loadPosts = async () => {
    const res = await axios.get(`${API}/posts`);
    setPosts(res.data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async () => {
    if (!text) return;

    await axios.post(`${API}/posts`, {
      content: text,
    });

    setText("");
    loadPosts();
  };

  const deletePost = async (id) => {
    await axios.delete(`${API}/posts/${id}`);
    loadPosts();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Blog App</h1>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write post..."
      />

      <button onClick={createPost}>Create</button>

      <hr />

      {posts.map((p) => (
        <div key={p.id}>
          <p>{p.content}</p>
          <button onClick={() => deletePost(p.id)}>delete</button>
        </div>
      ))}
    </div>
  );
}