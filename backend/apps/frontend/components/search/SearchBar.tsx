import { useEffect, useState } from 'react';
import { fetchSuggestions, searchListings } from './services/searchApi';

interface Props {
  userId: string;
  onResults: (ids: string[]) => void;
}

export function SearchBar({ userId, onResults }: Props) {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!keyword) {
      setSuggestions([]);
      return;
    }
    fetchSuggestions(keyword, userId).then((res) => setSuggestions(res.suggestions));
  }, [keyword, userId]);

  const submit = async () => {
    const results = await searchListings(keyword, userId);
    onResults(results.map((item) => item.id));
  };

  return (
    <div>
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索iPhone/Mac" />
      <button onClick={submit}>搜索</button>
      <div>
        {suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => setKeyword(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
