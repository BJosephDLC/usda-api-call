import axios from "axios";

// Uses the Vite proxy. In prod, swap to an env base like import.meta.env.VITE_API_BASE.
const api = axios.create({ baseURL: "/api" });

export async function searchFoods(
  query,
  pageSize = 10,
  pageNumber = 1,
  dataType
) {
  const res = await api.get("/usda/search", {
    params: { query, pageSize, pageNumber, dataType },
  });
  return res.data;
}

export async function getFood(fdcId) {
  const res = await api.get(`/usda/foods/${fdcId}`);
  return res.data;
}
