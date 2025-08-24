
import React, { useState } from 'react';
import { translateNaturalLanguageToQuery } from '../services/geminiService';
import { SearchIcon } from './icons';

interface SearchControlsProps {
    onSearch: (query: string) => void;
    initialQuery: string;
}

const SearchControls: React.FC<SearchControlsProps> = ({ onSearch, initialQuery }) => {
    const [inputValue, setInputValue] = useState(initialQuery);
    const [isAiTranslating, setIsAiTranslating] = useState(false);

    const isNaturalLanguage = (query: string): boolean => {
        // Simple heuristic: if it has spaces and doesn't seem to be a key-value pair, it's likely NL.
        return query.includes(' ') && !query.includes('=') && !query.includes('"');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalQuery = inputValue;

        if (isNaturalLanguage(inputValue)) {
            setIsAiTranslating(true);
            const translatedQuery = await translateNaturalLanguageToQuery(inputValue);
            setIsAiTranslating(false);

            if (!translatedQuery.startsWith('error:')) {
                finalQuery = translatedQuery;
                setInputValue(translatedQuery); // Update input to show the user the translated query
            } else {
                // Handle translation error if needed
                console.error("AI translation failed.");
            }
        }
        onSearch(finalQuery);
    };

    return (
        <div className="holographic-card p-4 rounded-xl">
            <form onSubmit={handleSubmit} className="flex gap-4 items-center">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder='e.g., severity="Critical" OR type "show me all DoS attacks"'
                        className="w-full bg-gray-900/50 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm border border-gray-600"
                    />
                     {isAiTranslating && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isAiTranslating}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out flex items-center gap-2 disabled:opacity-50"
                >
                    <SearchIcon className="h-5 w-5" />
                    Search
                </button>
            </form>
        </div>
    );
};

export default SearchControls;