import React, { useState, useEffect, useCallback } from 'react';
import { POSTER_SIZE, BACKDROP_SIZE, IMAGE_BASE_URL } from '../config';
import HeroImage from './HeroImage';
import Grid from './Grid';
import Thumb from './Thumb';
import Spinner from './Spinner';
import SearchBar from './SearchBar';
import Button from './Button';
import API from '../API';
import NoImage from '../images/no_image.jpg';
import { debounce } from 'lodash';

// Initial state for movies
const initialMoviesState = {
    page: 0,
    results: [],
    total_pages: 0,
    total_results: 0,
};

const Home = () => {
    // Flattened state for better management
    const [movies, setMovies] = useState(initialMoviesState);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const fetchMovies = useCallback(async (page, term = '', signal) => {
        try {
            setIsLoading(true);
            setError(null);
            const newMovies = await API.fetchMovies(term, page, { signal });
            setMovies(prev => ({
                ...newMovies,
                results: page > 1 ? [...prev.results, ...newMovies.results] : newMovies.results,
            }));
            setIsLoading(false);
        } catch (error) {
            if (error.name !== 'AbortError') {
                setError('Failed to fetch movies. Please try again.');
                setIsLoading(false);
            }
        }
    }, []);

    // Debounced search handler
    const handleSearch = useCallback(
        debounce((term) => {
            setSearchTerm(term);
            setMovies(initialMoviesState);
            const controller = new AbortController();
            fetchMovies(1, term, controller.signal);
            return () => controller.abort();
        }, 500),
        [fetchMovies]
    );

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && !isLoading) {
            setIsLoadingMore(true);
            const controller = new AbortController();
            fetchMovies(movies.page + 1, searchTerm, controller.signal).then(() => {
                setIsLoadingMore(false);
            });
            return () => controller.abort();
        }
    }, [fetchMovies, movies.page, searchTerm, isLoadingMore, isLoading]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchInitialMovies = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const newMovies = await API.fetchMovies('', 1, { signal: controller.signal });
                if (isMounted) {
                    setMovies({
                        ...newMovies,
                        results: newMovies.results,
                    });
                    setIsLoading(false);
                }
            } catch (error) {
                if (isMounted && error.name !== 'AbortError') {
                    setError('Failed to load initial movies. Please try again.');
                    setIsLoading(false);
                }
            }
        };

        fetchInitialMovies();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    if (error) {
        return (
            <div>
                {error}
                <Button
                    text="Retry"
                    callback={() => fetchMovies(1, searchTerm, new AbortController().signal)}
                    role="button"
                    aria-label="Retry fetching movies"
                />
            </div>
        );
    }

    return (
        <>
            {movies.results[0]?.backdrop_path && !searchTerm && (
                <HeroImage
                    image={`${IMAGE_BASE_URL}${BACKDROP_SIZE}${movies.results[0].backdrop_path}`}
                    title={movies.results[0].original_title}
                    text={movies.results[0].overview}
                />
            )}
            <SearchBar setSearchTerm={handleSearch} aria-label="Search movies" />
            <Grid header={searchTerm ? 'Search Results' : 'Popular Movies'}>
                {movies.results.map((movie, index) => (
                    <Thumb
                        key={`${movie.id}-${index}`}
                        clickable
                        image={movie.poster_path ? `${IMAGE_BASE_URL}${POSTER_SIZE}${movie.poster_path}` : NoImage}
                        movieId={movie.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${movie.original_title}`}
                    />
                ))}
            </Grid>
            {isLoading && <Spinner />}
            {movies.page < movies.total_pages && !isLoading && (
                <Button
                    text="Load More"
                    callback={handleLoadMore}
                    disabled={isLoadingMore || isLoading}
                    role="button"
                    aria-label="Load more movies"
                />
            )}
        </>
    );
};

export default Home;