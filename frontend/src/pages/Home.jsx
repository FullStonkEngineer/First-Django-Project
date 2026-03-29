import { useNotes } from "../hooks/useNotes";
import { useWebSocket } from "../hooks/useWebSocket";
import NotesList from "../components/NotesList";
import NoteForm from "../components/NoteForm";
import Loading from "../components/Loading";

const Home = () => {
  useWebSocket();

  const {
    notes,
    total,
    allTags,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchInput,
    setSearchInput,
    selectedTags,
    toggleTag,
    clearFilters,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  const hasActiveFilters = searchInput || selectedTags.length > 0;

  if (isLoading) {
    return (
      <div className='home-loading'>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className='home-error'>
        <p>Failed to load notes. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className='home'>
      <header className='home__header'>
        <div>
          <h1 className='home__title'>My Notes</h1>
          {total > 0 && (
            <span className='home__count'>
              {total} {total === 1 ? "note" : "notes"}
            </span>
          )}
        </div>
        <a className='btn btn--ghost btn--sm' href='/logout'>
          Sign out
        </a>
      </header>

      {/* Search bar */}
      <div className='home__search'>
        <input
          className='search-input'
          type='search'
          placeholder='Search notes…'
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label='Search notes'
        />
      </div>

      {/* Tag filter — only shown when the user has tags */}
      {allTags.length > 0 && (
        <div className='home__tag-filter'>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              className={`tag-pill tag-pill--filter ${selectedTags.includes(tag.name) ? "tag-pill--active" : ""}`}
              onClick={() => toggleTag(tag.name)}
            >
              {tag.name}
            </button>
          ))}
          {hasActiveFilters && (
            <button className='btn btn--ghost btn--sm' onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      )}

      <section className='home__form-section'>
        <NoteForm
          onSubmit={(title, content, tagNames) =>
            createNote({ title, content, tagNames })
          }
        />
      </section>

      <section className='home__notes-section'>
        <NotesList
          notes={notes}
          deleteNote={deleteNote}
          updateNote={updateNote}
        />

        {hasNextPage && (
          <div className='home__load-more'>
            <button
              className='btn btn--ghost'
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
