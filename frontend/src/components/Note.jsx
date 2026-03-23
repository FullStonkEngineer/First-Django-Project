import React from "react";

const Note = ({ note, deleteNote }) => {
  const formattedDate = new Date(note.created_at).toLocaleDateString("en-US");
  return (
    <div>
      <p className='note-title'>{note.title}</p>
      <p className='note-content'>{note.content}</p>
      <p className='note-date'>{formattedDate}</p>
      <button className='delete-button' onClick={() => deleteNote(note.id)}>
        Delete
      </button>
    </div>
  );
};

export default Note;
