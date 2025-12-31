import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Film } from 'lucide-react';

const BASE_URL = '/api'; // Vercel API routes

export default function MovieActorOverlap() {
  const [movieInputs, setMovieInputs] = useState(['', '']);
  const [searchResults, setSearchResults] = useState([[], []]);
  const [selectedMovies, setSelectedMovies] = useState([null, null]);
  const [showDropdown, setShowDropdown] = useState([false, false]);
  const [overlappingActors, setOverlappingActors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRefs = useRef([]);

  // Search for movies based on input
  const searchMovies = async (query, index) => {
    if (query.length < 2) {
      const newResults = [...searchResults];
      newResults[index] = [];
      setSearchResults(newResults);
      return;
    }

    try {
      const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
      console.log('Searching for:', query);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('Search results:', data.results?.length || 0, 'movies found');
      const newResults = [...searchResults];
      newResults[index] = data.results?.slice(0, 8) || [];
      setSearchResults(newResults);
      
      // Force dropdown to show if we have results
      const newDropdown = [...showDropdown];
      newDropdown[index] = (data.results?.length || 0) > 0;
      setShowDropdown(newDropdown);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Network error. Unable to search movies.');
    }
  };

  // Get cast for a movie
  const getMovieCast = async (movieId) => {
    try {
      const response = await fetch(`${BASE_URL}/credits?id=${movieId}`);
      const data = await response.json();
      return data.cast || [];
    } catch (err) {
      console.error('Error fetching cast:', err);
      return [];
    }
  };

  // Handle input change
  const handleInputChange = (value, index) => {
    const newInputs = [...movieInputs];
    newInputs[index] = value;
    setMovieInputs(newInputs);

    const newDropdown = [...showDropdown];
    newDropdown[index] = true;
    setShowDropdown(newDropdown);

    searchMovies(value, index);
  };

  // Select a movie from dropdown
  const selectMovie = (movie, index) => {
    const newSelected = [...selectedMovies];
    newSelected[index] = movie;
    setSelectedMovies(newSelected);

    const newInputs = [...movieInputs];
    newInputs[index] = movie.title;
    setMovieInputs(newInputs);

    const newDropdown = [...showDropdown];
    newDropdown[index] = false;
    setShowDropdown(newDropdown);
  };

  // Add new movie input field
  const addMovieInput = () => {
    setMovieInputs([...movieInputs, '']);
    setSearchResults([...searchResults, []]);
    setSelectedMovies([...selectedMovies, null]);
    setShowDropdown([...showDropdown, false]);
  };

  // Remove movie input field
  const removeMovieInput = (index) => {
    if (movieInputs.length <= 2) return;
    
    setMovieInputs(movieInputs.filter((_, i) => i !== index));
    setSearchResults(searchResults.filter((_, i) => i !== index));
    setSelectedMovies(selectedMovies.filter((_, i) => i !== index));
    setShowDropdown(showDropdown.filter((_, i) => i !== index));
  };

  // Find overlapping actors
  const findOverlappingActors = async () => {
    const validMovies = selectedMovies.filter(m => m !== null);
    
    console.log('Selected movies:', validMovies);
    
    if (validMovies.length < 2) {
      setError('Please select at least 2 movies from the dropdown');
      return;
    }

    setLoading(true);
    setError('');
    setOverlappingActors([]);

    try {
      // Fetch cast for all selected movies
      const castPromises = validMovies.map(movie => getMovieCast(movie.id));
      const allCasts = await Promise.all(castPromises);

      // Create a map of actor_id -> { actor info, movies they're in }
      const actorMap = new Map();

      allCasts.forEach((cast, movieIndex) => {
        cast.forEach(actor => {
          if (!actorMap.has(actor.id)) {
            actorMap.set(actor.id, {
              id: actor.id,
              name: actor.name,
              profile_path: actor.profile_path,
              appearances: []
            });
          }
          
          actorMap.get(actor.id).appearances.push({
            movieIndex,
            movieTitle: validMovies[movieIndex].title,
            character: actor.character
          });
        });
      });

      // Filter to only actors appearing in at least 2 movies
      const overlapping = Array.from(actorMap.values())
        .filter(actor => actor.appearances.length >= 2)
        .sort((a, b) => b.appearances.length - a.appearances.length || a.name.localeCompare(b.name));

      setOverlappingActors(overlapping);
    } catch (err) {
      setError('Error finding overlapping actors. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      dropdownRefs.current.forEach((ref, index) => {
        if (ref && !ref.contains(event.target)) {
          const newDropdown = [...showDropdown];
          newDropdown[index] = false;
          setShowDropdown(newDropdown);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const validSelectedMovies = selectedMovies.filter(m => m !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Film className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Movie Actor Overlap Finder</h1>
          </div>
          <p className="text-purple-200">Discover which actors appear in multiple films</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-2xl mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Select Movies</h2>
          
          <div className="space-y-4">
            {movieInputs.map((input, index) => (
              <div key={index} className="relative" ref={el => dropdownRefs.current[index] = el}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value, index)}
                      placeholder={`Search for movie ${index + 1}...`}
                      className="w-full px-4 py-3 bg-white/20 border border-purple-300/30 rounded-lg text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <Search className="absolute right-3 top-3.5 w-5 h-5 text-purple-300" />
                    
                    {showDropdown[index] && searchResults[index].length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-purple-300/30 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {searchResults[index].map((movie) => (
                          <div
                            key={movie.id}
                            onClick={() => selectMovie(movie, index)}
                            className="px-4 py-3 hover:bg-purple-600/30 cursor-pointer border-b border-purple-300/10 last:border-b-0"
                          >
                            <div className="font-medium text-white">{movie.title}</div>
                            <div className="text-sm text-purple-200">
                              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {movieInputs.length > 2 && (
                    <button
                      onClick={() => removeMovieInput(index)}
                      className="px-3 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {selectedMovies[index] && (
                  <div className="mt-2 text-sm text-green-300 flex items-center gap-2">
                    ✓ Selected: {selectedMovies[index].title} ({selectedMovies[index].release_date ? new Date(selectedMovies[index].release_date).getFullYear() : 'N/A'})
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={addMovieInput}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/30 hover:bg-purple-500/40 text-purple-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Another Movie
            </button>

            <button
              onClick={findOverlappingActors}
              disabled={loading}
              className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : `Find Overlapping Actors${validSelectedMovies.length >= 2 ? '' : ` (${validSelectedMovies.length}/2 selected)`}`}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200">
              {error}
            </div>
          )}
        </div>

        {overlappingActors.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Overlapping Actors ({overlappingActors.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-300/30">
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Actor</th>
                    {validSelectedMovies.map((movie, idx) => (
                      <th key={idx} className="text-left py-3 px-4 text-purple-200 font-semibold">
                        {movie.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overlappingActors.map((actor) => (
                    <tr key={actor.id} className="border-b border-purple-300/10 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {actor.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                              alt={actor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-semibold">
                              {actor.name[0]}
                            </div>
                          )}
                          <span className="text-white font-medium">{actor.name}</span>
                        </div>
                      </td>
                      {validSelectedMovies.map((movie, movieIdx) => {
                        const appearance = actor.appearances.find(app => app.movieIndex === movieIdx);
                        return (
                          <td key={movieIdx} className="py-3 px-4 text-purple-100">
                            {appearance ? (
                              <span className="italic">{appearance.character || 'Unknown role'}</span>
                            ) : (
                              <span className="text-purple-300/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {overlappingActors.length === 0 && !loading && validSelectedMovies.length >= 2 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl text-center">
            <p className="text-purple-200 text-lg">No overlapping actors found in the selected movies.</p>
          </div>
        )}
      </div>
    </div>
  );