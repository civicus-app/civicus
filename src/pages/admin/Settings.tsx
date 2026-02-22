import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { MUNICIPALITY_NAME } from '../../lib/constants';

export default function Settings() {
  const [municipalityName, setMunicipalityName] = useState(MUNICIPALITY_NAME);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 text-sm">Configure platform settings</p>
      </div>

      <Tabs defaultValue="municipality">
        <TabsList>
          <TabsTrigger value="municipality">Municipality</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="municipality">
          <Card>
            <CardHeader><CardTitle>Municipality Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {saved && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">Settings saved!</div>}
              <div className="space-y-2">
                <Label>Municipality Name</Label>
                <Input value={municipalityName} onChange={(e) => setMunicipalityName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" placeholder="contact@tromso.kommune.no" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input type="tel" placeholder="+47 77 79 00 00" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input type="url" placeholder="https://tromso.kommune.no" />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader><CardTitle>Policy Categories</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Manage the categories available for policies.</p>
              <div className="space-y-2">
                {['Housing', 'Transportation', 'Environment', 'Education', 'Healthcare', 'Culture', 'Other'].map(cat => (
                  <div key={cat} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium text-gray-800">{cat}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4" variant="outline">+ Add Category</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle>AI Integration Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-medium">AI features are planned for Phase 2</p>
                <p className="text-xs text-yellow-700 mt-1">Current insights are simulated. Real AI integration coming soon.</p>
              </div>
              <div className="space-y-4 opacity-60 pointer-events-none">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Sentiment Analysis</p>
                    <p className="text-xs text-gray-500">Automatically analyze feedback sentiment</p>
                  </div>
                  <input type="checkbox" disabled className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Trend Detection</p>
                    <p className="text-xs text-gray-500">Identify emerging topics and trends</p>
                  </div>
                  <input type="checkbox" disabled className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Auto Summaries</p>
                    <p className="text-xs text-gray-500">Generate policy summaries from feedback</p>
                  </div>
                  <input type="checkbox" disabled className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
