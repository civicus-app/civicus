import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MUNICIPALITY_NAME } from '../../lib/constants';
import { useLanguageStore } from '../../store/languageStore';

export default function Settings() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [municipalityName, setMunicipalityName] = useState(MUNICIPALITY_NAME);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tx('Systeminnstillinger', 'System settings')}</h1>
        <p className="text-gray-500 text-sm">{tx('Konfigurer plattforminnstillinger', 'Configure platform settings')}</p>
      </div>

      <Tabs defaultValue="municipality">
        <TabsList>
          <TabsTrigger value="municipality">{tx('Kommune', 'Municipality')}</TabsTrigger>
          <TabsTrigger value="categories">{tx('Kategorier', 'Categories')}</TabsTrigger>
          <TabsTrigger value="ai">{tx('AI-innstillinger', 'AI settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="municipality">
          <Card>
            <CardHeader><CardTitle>{tx('Kommuneinformasjon', 'Municipality information')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {saved && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">{tx('Innstillinger lagret!', 'Settings saved!')}</div>}
              <div className="space-y-2">
                <Label>{tx('Kommunenavn', 'Municipality name')}</Label>
                <Input value={municipalityName} onChange={(e) => setMunicipalityName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tx('Kontakt e-post', 'Contact email')}</Label>
                <Input type="email" placeholder="contact@tromso.kommune.no" />
              </div>
              <div className="space-y-2">
                <Label>{tx('Kontakttelefon', 'Contact phone')}</Label>
                <Input type="tel" placeholder="+47 77 79 00 00" />
              </div>
              <div className="space-y-2">
                <Label>{tx('Nettsted', 'Website')}</Label>
                <Input type="url" placeholder="https://tromso.kommune.no" />
              </div>
              <Button onClick={handleSave}>{tx('Lagre endringer', 'Save changes')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader><CardTitle>{tx('Sakskategorier', 'Policy categories')}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{tx('Administrer tilgjengelige kategorier.', 'Manage available categories.')}</p>
              <div className="space-y-2">
                {['Housing', 'Transportation', 'Environment', 'Education', 'Healthcare', 'Culture', 'Other'].map(cat => (
                  <div key={cat} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium text-gray-800">{cat}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">{tx('Rediger', 'Edit')}</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4" variant="outline">+ {tx('Legg til kategori', 'Add category')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle>{tx('AI-integrasjon', 'AI integration')}</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-medium">{tx('AI-funksjoner er tilgjengelige via adapter', 'AI features are available through the adapter')}</p>
                <p className="text-xs text-yellow-700 mt-1">{tx('Konfigurer ekstern API i miljovariabler for produksjon.', 'Configure external API in environment variables for production.')}</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{tx('Stemningsanalyse', 'Sentiment analysis')}</p>
                    <p className="text-xs text-gray-500">{tx('Analyserer innsendt tilbakemelding', 'Analyzes submitted feedback')}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{tx('Trenddeteksjon', 'Trend detection')}</p>
                    <p className="text-xs text-gray-500">{tx('Identifiserer tema og utvikling', 'Identifies topics and trends')}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{tx('Automatiske oppsummeringer', 'Automatic summaries')}</p>
                    <p className="text-xs text-gray-500">{tx('Oppsummerer funn for administrasjonen', 'Summarizes findings for administration')}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
