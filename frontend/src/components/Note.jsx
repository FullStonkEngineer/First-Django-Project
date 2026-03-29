import { useState, useRef } from "react";

const Note = ({ note, deleteNote, updateNote }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags?.map((t) => t.name) ?? []);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef(null);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const wasEdited =
    note.updated_at &&
    Math.abs(new Date(note.updated_at) - new Date(note.created_at)) > 1000;

  // ── Tag helpers ──────────────────────────────────────────────────────────
  const addTag = (raw) => {
    const name = raw.trim().toLowerCase();
    if (name && !tags.includes(name)) setTags((prev) => [...prev, name]);
    setTagInput("");
  };

  const removeTag = (name) => setTags((prev) => prev.filter((t) => t !== name));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length)
      removeTag(tags[tags.length - 1]);
  };

  // ── Edit handlers ────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    updateNote({ id: note.id, title, content, tagNames: tags });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags?.map((t) => t.name) ?? []);
    setTagInput("");
    setIsEditing(false);
  };

  return (
    <article className='note-card'>
      {isEditing ? (
        <div className='note-card__edit'>
          <input
            className='note-card__edit-title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className='note-card__edit-content'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          <div
            className='tag-input'
            onClick={() => tagInputRef.current?.focus()}
          >
            {tags.map((tag) => (
              <span key={tag} className='tag-pill tag-pill--removable'>
                {tag}
                <button
                  type='button'
                  className='tag-pill__remove'
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              className='tag-input__field'
              type='text'
              placeholder={tags.length ? "" : "Edit tags…"}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (tagInput.trim()) addTag(tagInput);
              }}
            />
          </div>

          <div className='note-card__actions'>
            <button className='btn btn--primary btn--sm' onClick={handleSave}>
              Save
            </button>
            <button className='btn btn--ghost btn--sm' onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className='note-card__body'>
            <h3 className='note-card__title'>{note.title}</h3>
            <p className='note-card__content'>{note.content}</p>
            {note.tags?.length > 0 && (
              <div className='note-card__tags'>
                {note.tags.map((tag) => (
                  <span key={tag.id} className='tag-pill'>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className='note-card__footer'>
            <div className='note-card__meta'>
              <time className='note-card__date' dateTime={note.created_at}>
                {formatDate(note.created_at)}
              </time>
              {wasEdited && (
                <span
                  className='note-card__edited'
                  title={`Edited ${formatDate(note.updated_at)}`}
                >
                  · edited
                </span>
              )}
            </div>
            <div className='note-card__actions'>
              <button
                className='btn btn--ghost btn--sm'
                onClick={() => setIsEditing(true)}
                aria-label='Edit note'
              >
                Edit
              </button>
              <button
                className='btn btn--danger btn--sm'
                onClick={() => deleteNote(note.id)}
                aria-label='Delete note'
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
};

export default Note;
