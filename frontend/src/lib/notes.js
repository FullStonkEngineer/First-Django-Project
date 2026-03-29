import api from "./api.js";

export const getNotes = async ({
  pageParam = 1,
  search = "",
  tags = [],
} = {}) => {
  const params = { page: pageParam };
  if (search) params.search = search;
  if (tags.length) params.tags = tags.join(",");
  const res = await api.get("/api/notes/", { params });
  return res.data;
};

export const createNote = async ({ title, content, tagNames = [] }) => {
  const res = await api.post("/api/notes/", {
    title,
    content,
    tag_names: tagNames,
  });
  return res.data;
};

export const updateNote = async ({ id, title, content, tagNames }) => {
  const body = {};
  if (title !== undefined) body.title = title;
  if (content !== undefined) body.content = content;
  if (tagNames !== undefined) body.tag_names = tagNames;
  const res = await api.patch(`/api/notes/${id}/update/`, body);
  return res.data;
};

export const deleteNote = async (id) => {
  await api.delete(`/api/notes/${id}/`);
};

export const getTags = async () => {
  const res = await api.get("/api/tags/");
  return res.data;
};
