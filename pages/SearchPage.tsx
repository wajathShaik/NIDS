import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { logService } from '../services/logService';
import type { Alert } from '../types';
import SearchControls from '../components/SearchControls';
import FieldSummaryPanel from '../components/FieldSummaryPanel';
import SearchResultsTabs from '../components/SearchResultsTabs';

const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const executeSearch = useCallback(async (currentQuery: string) => {
        setLoading(true);
        setError(null);
        try {
            const searchResults = await logService.searchEvents(currentQuery);
            setResults(searchResults);
        } catch (err) {
            console.error("Search failed:", err);
            setError("Failed to execute search. Please check your query syntax.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        executeSearch(query);
    }, [executeSearch]);
    
    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);
        setSearchParams(newQuery ? { q: newQuery } : {});
        executeSearch(newQuery);
    };
    
    const handleFieldSelect = (field: keyof Alert, value: string) => {
        const newTerm = `${field}="${value}"`;
        const newQuery = query ? `${query} AND ${newTerm}` : newTerm;
        handleSearch(newQuery);
    };

    return (
        <div className="space-y-6">
             <SearchControls onSearch={handleSearch} initialQuery={query} />

            {error && (
                <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                    <FieldSummaryPanel results={results} onFieldSelect={handleFieldSelect} loading={loading} />
                </div>
                <div className="lg:w-3/4">
                    <SearchResultsTabs results={results} query={query} loading={loading} />
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
