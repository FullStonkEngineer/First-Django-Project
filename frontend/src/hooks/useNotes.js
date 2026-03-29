import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getTags,
} from "../lib/notes";

export const useNotes = () => {
  const queryClient = useQueryClient();

  // ── Search & filter state ─────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Debounce the search input so we don't fire a request on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedTags([]);
  };

  // ── Notes query (infinite / paginated) ───────────────────────────────────
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["notes", { search: debouncedSearch, tags: selectedTags }],
    queryFn: ({ pageParam = 1 }) =>
      getNotes({ pageParam, search: debouncedSearch, tags: selectedTags }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      return Number(new URL(lastPage.next).searchParams.get("page"));
    },
    initialPageParam: 1,
  });

  const notes = data?.pages.flatMap((p) => p.results) ?? [];
  const total = data?.pages[0]?.count ?? 0;

  // ── All user tags (for the filter UI) ────────────────────────────────────
  const { data: allTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: ({ title, content, tagNames }) =>
      createNote({ title, content, tagNames }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title, content, tagNames }) =>
      updateNote({ id, title, content, tagNames }),
    onMutate: async ({ id, title, content }) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData([
        "notes",
        { search: debouncedSearch, tags: selectedTags },
      ]);

      queryClient.setQueryData(
        ["notes", { search: debouncedSearch, tags: selectedTags }],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      title: title ?? n.title,
                      content: content ?? n.content,
                    }
                  : n,
              ),
            })),
          };
        },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["notes", { search: debouncedSearch, tags: selectedTags }],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId) => deleteNote(noteId),
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData([
        "notes",
        { search: debouncedSearch, tags: selectedTags },
      ]);

      queryClient.setQueryData(
        ["notes", { search: debouncedSearch, tags: selectedTags }],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.filter((n) => n.id !== noteId),
            })),
          };
        },
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["notes", { search: debouncedSearch, tags: selectedTags }],
          context.previous,
        );
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  return {
    // Data
    notes,
    total,
    allTags,
    // Loading states
    isLoading,
    error,
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // Filter state
    searchInput,
    setSearchInput,
    selectedTags,
    toggleTag,
    clearFilters,
    // Mutations
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
  };
};
