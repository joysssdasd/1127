import { AuthFlow } from './modules/auth/AuthFlow';
import { ListingForm } from './modules/listing/ListingForm';
import { ListingList } from './modules/listing/ListingList';
import { ContactPurchase } from './modules/deal/ContactPurchase';
import { SearchBar } from './components/search/SearchBar';
import { SearchHistoryList } from './components/search/SearchHistoryList';
import { useState } from 'react';

export function FrontendApp() {
  const [lastResults, setLastResults] = useState<string[]>([]);

  return (
    <main>
      <AuthFlow />
      <ListingForm />
      <SearchBar userId="buyer-h5" onResults={setLastResults} />
      <SearchHistoryList userId="buyer-h5" onKeywordSelect={() => {}} />
      <ListingList />
      <ContactPurchase />
      <section>
        <h4>最近搜索ID</h4>
        <pre>{JSON.stringify(lastResults)}</pre>
      </section>
    </main>
  );
}
