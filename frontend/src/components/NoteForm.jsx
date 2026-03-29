import { useState, useRef } from "react";

const NoteForm = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef(null);

  const addTag = (raw) => {
    const name = raw.trim().toLowerCase();
    if (name && !tags.includes(name)) {
      setTags((prev) => [...prev, name]);
    }
    setTagInput("");
  };

  const removeTag = (name) => setTags((prev) => prev.filter((t) => t !== name));

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleTagBlur = () => {
    if (tagInput.trim()) addTag(tagInput);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit(title.trim(), content.trim(), tags);
    setTitle("");
    setContent("");
    setTags([]);
    setTagInput("");
  };

  return (
    <form className='note-form' onSubmit={handleSubmit} noValidate>
      <input
        className='note-form__input'
        type='text'
        placeholder='Title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={100}
      />
      <textarea
        className='note-form__textarea'
        placeholder='Write something…'
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
      />

      {/* Tag input */}
      <div className='tag-input' onClick={() => tagInputRef.current?.focus()}>
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
          placeholder={tags.length ? "" : "Add tags…"}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={handleTagBlur}
        />
      </div>

      <button
        className='btn btn--primary'
        type='submit'
        disabled={!title.trim() || !content.trim()}
      >
        Add note
      </button>
    </form>
  );
};

export default NoteForm;
