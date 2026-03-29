import Note from "./Note.jsx";
import EmptyState from "./EmptyState.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

const NotesList = ({ notes, deleteNote, updateNote }) => {
  return (
    <ErrorBoundary fallbackMessage='Failed to render your notes. Try refreshing the page.'>
      {notes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className='notes-grid'>
          {notes.map((note) => (
            <Note
              key={note.id}
              note={note}
              deleteNote={deleteNote}
              updateNote={updateNote}
            />
          ))}
        </div>
      )}
    </ErrorBoundary>
  );
};

export default NotesList;
