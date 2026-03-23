import React from "react";
import api from "../lib/api.js";
import { useState, useEffect } from "react";
import Note from "../components/Note.jsx";

const Home = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    getNotes();
  }, []);

  const getNotes = async () => {
    api
      .get("/api/notes/")
      .then((res) => res.data)
      .then((data) => {
        setNotes(data);
        console.log(data);
      })
      .catch((err) => alert(err));
  };

  const deleteNote = (id) => {
    api
      .delete(`/api/notes/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert("Note deleted successfully");
        } else alert("Note not deleted");
        getNotes();
      })
      .catch((error) => alert(error));
  };

  const createNote = (e) => {
    e.preventDefault();
    api.post("/api/notes/", { content, title }).then((res) => {
      if (res.status === 201) {
        console.log("Note created successfully");
      } else {
        console.log("Note not created");
      }
      getNotes();
    });
  };

  return (
    <div>
      <div>
        <h2>Notes</h2>
        {notes.map((note) => (
          <Note note={note} deleteNote={deleteNote} key={note.id} />
        ))}
      </div>

      <h2> Create a Note</h2>
      <form onSubmit={createNote}>
        <label htmlFor='title'>Title</label>
        <br />
        <input
          type='text'
          id='title'
          name='title'
          required
          onChange={(e) => setTitle(e.target.value)}
          value={title}
        ></input>
        <label htmlFor='content'>Content</label>
        <br />
        <textarea
          id='content'
          name='content'
          required
          onChange={(e) => setContent(e.target.value)}
          value={content}
        ></textarea>
        <br />
        <input type='submit' value='Submit'></input>
      </form>
    </div>
  );
};

export default Home;
