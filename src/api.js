import axios from "axios";

const API_KEY = "2ff044456d4fa1c8534fc9e4378e227f"; 
const BASE_URL = "https://api.themoviedb.org/3";

export const fetchMovies = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
    return res.data.results;
  } catch (err) {
    console.error(err);
    return [];
  }
};
